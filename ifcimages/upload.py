import requests
import sys

def upload_ifc(file_path, ifc_type):
    url = "http://localhost:3000/generate-images-by-type"
    
    with open(file_path, 'rb') as f:
        files = {
            'ifcFile': (file_path, f, 'application/octet-stream')
        }
        data = {
            'ifcType': ifc_type
        }
        
        response = requests.post(url, files=files, data=data)
        print(response.json())

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python upload.py <ifc_file_path> <ifc_type>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    ifc_type = sys.argv[2]
    upload_ifc(file_path, ifc_type) 