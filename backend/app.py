from flask import Flask, request, jsonify, send_from_directory
import os
import sys
from backend.helpers.data_processor import process_excel_file

# Ensure the current directory is in sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Determine the current directory of app.py
current_dir = os.path.dirname(os.path.abspath(__file__))

# Set the static folder to "static" within the backend directory
static_folder = os.path.join(current_dir, 'static')

# Initialize Flask with the proper static folder configuration
app = Flask(__name__, static_folder=static_folder, static_url_path='')

# Configure the upload folder (placed within the backend folder)
UPLOAD_FOLDER = os.path.join(current_dir, 'data')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Serve the React frontend from the static folder
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

# Fallback route: serve React frontend for any undefined route
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render sets PORT automatically
    app.run(host='0.0.0.0', port=port)
