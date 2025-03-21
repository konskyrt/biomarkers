from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import ifcopenshell
import ifcopenshell.geom
import pandas as pd
from ifcopenshell.util.shape import get_volume, get_area, get_top_elevation, get_bottom_elevation
import logging

# Ensure the current directory is in sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Determine the current directory of app.py and set static folder
current_dir = os.path.dirname(os.path.abspath(__file__))
static_folder = os.path.join(current_dir, 'static')
app = Flask(__name__, static_folder=static_folder, static_url_path='')

# Configure the upload folder
UPLOAD_FOLDER = os.path.join(current_dir, 'data')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure logging to stdout
app.logger.handlers = []  # Remove default handlers
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s')
stream_handler.setFormatter(formatter)
app.logger.addHandler(stream_handler)
app.logger.setLevel(logging.DEBUG)

# Serve the React frontend from the static folder
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# File upload endpoint (works for both Excel and IFC files)
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    app.logger.debug("File uploaded successfully: %s", file_path)
    return jsonify({"message": "File uploaded successfully!", "filePath": file_path}), 200

def get_floor_and_building(element):
    """
    Traverses spatial relationships to retrieve the floor (Geschoss)
    and building (Gebäude) names.
    """
    floor_name = None
    building_name = None
    if hasattr(element, "ContainedInStructure"):
        for rel in element.ContainedInStructure:
            if rel.is_a("IfcRelContainedInSpatialStructure"):
                spatial = rel.RelatingStructure
                if spatial.is_a("IfcBuildingStorey"):
                    floor_name = spatial.Name
                    if hasattr(spatial, "Decomposes"):
                        for rel2 in spatial.Decomposes:
                            if rel2.is_a("IfcRelAggregates"):
                                building = rel2.RelatingObject
                                if building.is_a("IfcBuilding"):
                                    building_name = building.Name
    return floor_name, building_name

def flatten_element(element):
    """
    Extracts attributes from an IFC element.
    Returns a dictionary with keys such as:
      - "Object Name"
      - "IFC-Typ"
      - "Geschoss" (Floor)
      - "Gebäude" (Building)
      - "Task Name"
      - "3D-Modell"
      - "Volumen (m³)", "Surface Area (m²)", "Top Elevation (m)", "Bottom Elevation (m)"
      - And properties from property sets.
    """
    data = {}
    info = element.get_info()
    for key, value in info.items():
        data[key] = str(value)
    # Extract property sets
    if hasattr(element, "IsDefinedBy"):
        for rel in element.IsDefinedBy:
            if rel.is_a("IfcRelDefinesByProperties"):
                prop_def = rel.RelatingPropertyDefinition
                if prop_def.is_a("IfcPropertySet"):
                    pset_name = prop_def.Name
                    for prop in prop_def.HasProperties:
                        if prop.is_a("IfcPropertySingleValue"):
                            prop_name = prop.Name
                            value = prop.NominalValue.wrappedValue if prop.NominalValue else None
                            key_name = f"Pset: {pset_name} - {prop_name}"
                            data[key_name] = str(value)
    # Extract spatial structure attributes.
    floor_name, building_name = get_floor_and_building(element)
    data["Geschoss"] = floor_name if floor_name else ""
    data["Gebäude"] = building_name if building_name else ""
    data["Object Name"] = str(info.get("Name", ""))
    data["IFC-Typ"] = element.is_a()
    data["Task Name"] = ""  # Left blank for now
    # Compute geometry values.
    try:
        settings = ifcopenshell.geom.settings()
        settings.set(settings.USE_WORLD_COORDS, True)
        shape = ifcopenshell.geom.create_shape(settings, element)
        volume = get_volume(shape.geometry)
        area = get_area(shape.geometry)
        top_elev = get_top_elevation(shape.geometry)
        bottom_elev = get_bottom_elevation(shape.geometry)
        data["Volumen (m³)"] = f"{volume:.2f}"
        data["Surface Area (m²)"] = f"{area:.2f}"
        data["Top Elevation (m)"] = f"{top_elev:.2f}"
        data["Bottom Elevation (m)"] = f"{bottom_elev:.2f}"
    except Exception as e:
        data["Volumen (m³)"] = "Error"
        data["Surface Area (m²)"] = "Error"
        data["Top Elevation (m)"] = "Error"
        data["Bottom Elevation (m)"] = "Error"
    return data

@app.route('/process-ifc', methods=['POST'])
def process_ifc_file():
    data = request.get_json()
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 400

    ifc_file = ifcopenshell.open(file_path)
    model_name = "Unknown"
    if hasattr(ifc_file.header, "file_name"):
        fn = ifc_file.header.file_name
        if isinstance(fn, (list, tuple)) and len(fn) > 0:
            model_name = fn[0]

    elements = ifc_file.by_type("IfcProduct")
    data_list = []
    for element in elements:
        flat = flatten_element(element)
        flat["3D-Modell"] = model_name
        data_list.append(flat)

    return jsonify(data_list), 200

@app.route('/convert-ifc', methods=['POST'])
def convert_ifc():
    data = request.get_json()
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 400
    converted_model_url = "https://your.cdn.com/path/to/converted_model.xkt"
    return jsonify({"convertedModelUrl": converted_model_url}), 200

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
