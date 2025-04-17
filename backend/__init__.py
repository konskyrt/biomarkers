import os
import logging
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from pathlib import Path

from .converter import convert_ifc_to_fragments

logger = logging.getLogger(__name__)

bp = Blueprint('fragments', __name__, url_prefix='/api/fragments')

# Uploads directory
UPLOAD_FOLDER = Path(__file__).parent.parent / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True, parents=True)

@bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'No selected file'}), 400
    dest = UPLOAD_FOLDER / f.filename
    f.save(dest)
    return jsonify({'fileId': f.filename}), 200

@bp.route('/convert/<path:model_name>', methods=['POST'])
def convert_file(model_name):
    input_path = UPLOAD_FOLDER / model_name
    output_name = Path(model_name).stem + '.frag'
    output_path = UPLOAD_FOLDER / output_name

    if not input_path.exists():
        return jsonify({'error': 'File not found'}), 404

    try:
        convert_ifc_to_fragments(str(input_path), str(output_path))
        return jsonify({'fragmentsFile': output_name}), 200
    except Exception as e:
        logger.error(f"Conversion failed: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/files', methods=['GET'])
def list_files():
    files = []
    for f in UPLOAD_FOLDER.iterdir():
        if f.is_file():
            files.append({
                'name': f.name,
                'size': f.stat().st_size,
                'modified': f.stat().st_mtime
            })
    return jsonify(files), 200

@bp.route('/<path:filename>', methods=['GET'])
def serve_fragment(filename):
    return send_from_directory(str(UPLOAD_FOLDER), filename,
                               mimetype='application/octet-stream')
