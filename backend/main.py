# main.py (in the backend folder)

from flask import Flask, send_from_directory
from flask_cors import CORS
# Notice the leading dot (.) for a relative import:
from .apps.bim2log.routes import bim2log_bp
import os

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Register the bim2log blueprint
app.register_blueprint(bim2log_bp, url_prefix='/api/bim2log')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
