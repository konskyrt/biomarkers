from flask import Flask, request, jsonify, send_from_directory
import os
import sys
from helpers.data_processor import process_excel_file

# Add the parent directory to sys.path to resolve module imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')

# Configure upload folder
UPLOAD_FOLDER = './data'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# Serve the React frontend
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


# Handle file uploads
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully!", "filePath": file_path}), 200


# Process uploaded Excel files
@app.route('/process', methods=['POST'])
def process_file():
    data = request.get_json()
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 400

    result = process_excel_file(file_path)
    return jsonify(result), 200


# Fallback route to serve React frontend for any undefined routes
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
