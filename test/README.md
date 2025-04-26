# Construction Management App Dashboard

This React + Tailwind CSS project includes a multi-page dashboard:

- **Progress Overview**: Shows construction progress by level and tasks.
- **BIM Dashboard**: Visualizes IFC model with charts, a 3D viewer, floorplan navigation, and hover highlights.

## Features

### BIM Dashboard
- Upload your own IFC files
- View 3D models with an interactive viewer
- Navigate between floors using the floorplan navigator
- Automatic object highlighting on hover
- Take screenshots of the current view
- Reset camera view to default position

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   
   This will automatically set up the required WASM files in the public directory.

2. If the WASM files are not set up automatically, you can run:
   ```bash
   npm run setup-wasm
   ```

3. Run in development mode:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

Open http://localhost:3000 to view the dashboard.

## Troubleshooting

If you encounter issues with IFC file loading:

1. Make sure your IFC file is valid
2. Check that the WASM files are properly set up in the public/wasm directory
3. Look for errors in the browser console

## Usage

1. Navigate to the BIM Dashboard page
2. Use the file upload box to import your IFC file (drag and drop or click to browse)
3. Once loaded, interact with the 3D model:
   - Click and drag to rotate
   - Scroll to zoom
   - Right-click and drag to pan
4. Click the floor plan icon to show/hide the floor navigation panel
5. Hover over model elements to see information about them
6. Use the home button to reset the camera
7. Use the camera button to take a screenshot

## Technologies Used

- React
- Three.js with IFCLoader
- Web-IFC
- ThatOpen Components
- Chart.js
- Tailwind CSS 