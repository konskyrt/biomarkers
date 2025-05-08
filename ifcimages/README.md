# IFC Image Generator

A Node.js application that generates images from IFC files using Three.js and IFC.js.

## Features

- Generate images for individual IFC elements
- Generate images for all elements in an IFC file
- Web-based API endpoints for easy integration
- Uses Three.js and IFC.js for high-quality rendering

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create required directories:
```bash
mkdir uploads temp output
```

## Usage

1. Start the server:
```bash
npm start
```

2. The server will run on port 3000 by default.

### API Endpoints

#### Generate Single Element Image
```http
POST /generate-element-image
Content-Type: multipart/form-data

ifcFile: [IFC file]
elementId: [Element ID]
```

#### Generate All Element Images
```http
POST /generate-all-images
Content-Type: multipart/form-data

ifcFile: [IFC file]
```

### Example Usage with curl

Generate image for a specific element:
```bash
curl -X POST -F "ifcFile=@path/to/your/model.ifc" -F "elementId=2O2Fr$t4X7Zf8NOew3FNrH" http://localhost:3000/generate-element-image
```

Generate images for all elements:
```bash
curl -X POST -F "ifcFile=@path/to/your/model.ifc" http://localhost:3000/generate-all-images
```

## Output

- Generated images are saved in the `output` directory
- Each image is named with its element ID
- Images are in PNG format with a resolution of 800x600 pixels

## Development

For development with auto-reload:
```bash
npm run dev
```

## License

MIT 