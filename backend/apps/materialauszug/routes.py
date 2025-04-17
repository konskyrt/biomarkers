from flask import Blueprint, request, jsonify, Response, send_file
from flask_cors import CORS
import os
import logging
import tempfile
import json
import uuid

materialauszug_bp = Blueprint('materialauszug', __name__)

# Directory to store uploaded IFC files
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'materialauszug_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@materialauszug_bp.route('/upload', methods=['POST'])
def upload_ifc():
    if 'ifc_file' not in request.files:
        return jsonify({'error': 'No IFC file provided'}), 400
    
    ifc_file = request.files['ifc_file']
    if ifc_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Generate a unique filename
    filename = str(uuid.uuid4()) + '.ifc'
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    # Save the uploaded file
    ifc_file.save(file_path)
    
    # Return the file ID for later retrieval
    return jsonify({
        'success': True,
        'file_id': filename,
        'message': 'IFC file uploaded successfully'
    })

@materialauszug_bp.route('/files', methods=['GET'])
def list_files():
    files = []
    for file in os.listdir(UPLOAD_FOLDER):
        if file.endswith('.ifc'):
            file_path = os.path.join(UPLOAD_FOLDER, file)
            files.append({
                'id': file,
                'name': file,
                'size': os.path.getsize(file_path),
                'uploaded_at': os.path.getctime(file_path)
            })
    
    return jsonify(files)

@materialauszug_bp.route('/file/<file_id>', methods=['GET'])
def get_file(file_id):
    file_path = os.path.join(UPLOAD_FOLDER, file_id)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(file_path, as_attachment=True, download_name=file_id) 