import os
import time
import logging
import requests
import csv
from dotenv import load_dotenv
from requests.exceptions import HTTPError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class IFCParser:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('BIMDATA_API_KEY')
        if not self.api_key:
            raise ValueError("API Key must be provided via BIMDATA_API_KEY")
        self.headers = {
            'Authorization': f'ApiKey {self.api_key}'
        }

    def create_cloud(self, name):
        resp = requests.post(
            'https://api.bimdata.io/cloud',
            headers=self.headers,
            json={'name': name}
        )
        resp.raise_for_status()
        cloud = resp.json()
        logger.info(f"Created Cloud ID: {cloud['id']}")
        return cloud

    def create_project(self, cloud_id, name):
        resp = requests.post(
            f'https://api.bimdata.io/cloud/{cloud_id}/project',
            headers=self.headers,
            json={'name': name}
        )
        resp.raise_for_status()
        project = resp.json()
        logger.info(f"Created Project ID: {project['id']} (root_folder_id={project['root_folder_id']})")
        return project

    def upload_ifc(self, cloud_id, project_id, root_folder_id, ifc_path):
        """
        Uploads IFC as a document (multipart/form-data) including parent_id to avoid 400 errors.
        """
        url = f'https://api.bimdata.io/cloud/{cloud_id}/project/{project_id}/document'
        with open(ifc_path, 'rb') as f:
            files = {'file': f}
            data = {'parent_id': root_folder_id}  # ensure upload into valid folder :contentReference[oaicite:9]{index=9}
            resp = requests.post(url, headers=self.headers, files=files, data=data)
        try:
            resp.raise_for_status()
        except HTTPError:
            logger.error(f"Upload failed ({resp.status_code}): {resp.text}")
            raise
        doc = resp.json()
        logger.info(f"Uploaded Document ID: {doc['id']}, IFC_ID: {doc.get('ifc_id')}")
        return doc.get('ifc_id')

    def wait_for_processing(self, document_id, timeout=600):
        start = time.time()
        while True:
            resp = requests.get(f'https://api.bimdata.io/document/{document_id}', headers=self.headers)
            resp.raise_for_status()
            status = resp.json().get('status')
            if status == 'C':
                logger.info("IFC processing completed")
                return
            if status == 'E':
                raise RuntimeError("IFC parsing failed on server")
            if time.time() - start > timeout:
                raise TimeoutError("Waiting for IFC parsing timed out")
            time.sleep(5)

    def get_raw_elements(self, cloud_id, project_id, ifc_id):
        """Retrieve deep Psets via the raw-elements endpoint :contentReference[oaicite:10]{index=10}."""
        url = (
            f'https://api.bimdata.io/cloud/{cloud_id}/project/{project_id}'
            f'/ifc/{ifc_id}/element/raw'
        )
        resp = requests.get(url, headers=self.headers)
        resp.raise_for_status()
        elements = resp.json()
        logger.info(f"Retrieved {len(elements)} raw elements")
        return elements

    # ... flattening and CSV export methods unchanged ...

def main():
    parser = IFCParser()
    cloud = parser.create_cloud("My IFC Cloud")
    project = parser.create_project(cloud['id'], "My IFC Project")

    # Use the project's root_folder_id for uploads
    root_folder_id = project['root_folder_id']

    ifc_path = input("Path to IFC file: ")
    ifc_id = parser.upload_ifc(cloud['id'], project['id'], root_folder_id, ifc_path)

    # Optionally wait on the document.status update:
    # parser.wait_for_processing(document_id)

    raw = parser.get_raw_elements(cloud['id'], project['id'], ifc_id)
    parser.export_to_csv(raw, "ifc_full_psets.csv")
    print("Done! CSV written to ifc_full_psets.csv")

if __name__ == "__main__":
    main()
