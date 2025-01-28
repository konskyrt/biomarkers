from flask import Flask, request, jsonify
import os
from helpers.data_processor import process_excel_file
import sys
print(sys.path)

import os
import sys

# Add the parent directory to sys.path to resolve module imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from helpers.data_processor import process_excel_file

app = Flask(__name__)
UPLOAD_FOLDER = './data'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure upload folder exists
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/')
def index():
    return "Backend is running!"


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handles file uploads."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully!", "filePath": file_path}), 200


@app.route('/process', methods=['POST'])
def process_file():
    """Processes uploaded Excel file and returns aggregated data."""
    data = request.get_json()
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 400

    result = process_excel_file(file_path)
    return jsonify(result), 200


if __name__ == '__main__':
    app.run(debug=True)
