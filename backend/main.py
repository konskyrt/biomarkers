# main.py (in the backend folder)

from flask import Flask, send_from_directory
from flask_cors import CORS
from apps.bim2log.routes import bim2log_bp
from apps.materialauszug.routes import materialauszug_bp
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='')

# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Register blueprints
try:
    app.register_blueprint(bim2log_bp, url_prefix='/api/bim2log')
    logger.info("BIM2LOG blueprint registered successfully")
except Exception as e:
    logger.error(f"Failed to register BIM2LOG blueprint: {str(e)}")

try:
    app.register_blueprint(materialauszug_bp, url_prefix='/api/materialauszug')
    logger.info("MaterialAuszug blueprint registered successfully")
except Exception as e:
    logger.error(f"Failed to register MaterialAuszug blueprint: {str(e)}")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
