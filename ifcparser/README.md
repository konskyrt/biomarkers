# BIMData IFC Parser

This project provides tools for working with BIMData's API to create clouds, projects, and analyze IFC models.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with your credentials:
   ```
   BIMDATA_CLIENT_ID=your_client_id_here
   BIMDATA_CLIENT_SECRET=your_client_secret_here
   ```

## Getting Credentials

1. Go to https://iam.bimdata.io/auth/realms/bimdata/protocol/openid-connect/auth
2. Create an account or log in
3. Create a new application to get:
   - Client ID
   - Client Secret

## Usage

### 1. Interactive Testing via Swagger UI

1. Visit [api.bimdata.io/doc](https://api.bimdata.io/doc)
2. Click "Authorize" and choose one of:
   - BIMData_Connect (OAuth2, implicit)
   - BIMData_Connect (OAuth2, clientCredentials)
3. Enter your client credentials
4. Use the UI to:
   - Create a cloud
   - Create a demo project
   - Get IFC models
   - Get element properties

### 2. Manual Testing with Postman

1. Import the Postman collection from `postman/bimdata-ifc-parser.json`
2. Set up environment variables:
   - `client_id`: Your BIMData client ID
   - `client_secret`: Your BIMData client secret
3. Run the requests in sequence:
   - Get Access Token
   - Create Cloud
   - Create Demo Project
   - Get IFC Models
   - Get Element Properties

### 3. Automated Testing with Python

```python
from ifc_parser import IFCParser

# Initialize parser
parser = IFCParser()

# Setup demo environment
setup = parser.setup_demo_environment()
print(f"Cloud ID: {setup['cloud_id']}")
print(f"Project ID: {setup['project_id']}")
print(f"Number of IFC models: {len(setup['models'])}")

# Get properties of doors in the first model
if setup['models']:
    first_model = setup['models'][0]
    doors = parser.get_element_properties(
        setup['cloud_id'],
        setup['project_id'],
        first_model['id'],
        'IfcDoor'
    )
    print(f"Found {len(doors)} doors in the model")
```

## Features

- OAuth2 authentication
- Cloud and project management
- IFC model retrieval
- Element property analysis
- Error handling and logging
- Multiple testing approaches

## Requirements

- Python 3.7+
- BIMData OAuth2 credentials
- Required Python packages (see requirements.txt)

## License

MIT License 