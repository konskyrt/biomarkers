from flask import Flask
from .routes import bim2log_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Register the blueprint under the URL prefix /api/bim2log
app.register_blueprint(bim2log_bp, url_prefix='/api/bim2log')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
