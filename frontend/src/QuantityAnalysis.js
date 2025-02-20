// QuantityAnalysis.js

import React, { useEffect, useRef, useState } from 'react';
import { Viewer, XKTLoaderPlugin } from "@xeokit/xeokit-sdk";

const QuantityAnalysis = () => {
  const viewerRef = useRef(null);   // reference for 3D canvas
  const overlayRef = useRef(null);  // reference for the floorplan overlay
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // 1. Initialize viewer (3D displays immediately)
    const viewer = new Viewer({
      canvasId: "my3dCanvas",
      transparent: true
    });
    viewerRef.current = viewer;

    // 2. Create plugin to load your model
    const xktLoader = new XKTLoaderPlugin(viewer);

    // 3. Load your 3D model (update src with your actual model path)
    const model = xktLoader.load({
      id: "myModel",
      src: "/models/building.xkt",
      edges: true,
      saoEnabled: true
    });

    // 4. Optionally, you can generate a 2D floorplan here or let the user draw zones manually.
    model.on("loaded", () => {
      // Optionally add a section plane or generate a floorplan
      // For example, if you want a section plane at a certain level:
      // viewer.scene.sectionPlanes.create({
      //   pos: [0, 0, yourCutHeight],
      //   dir: [0, 0, 1]
      // });
      // And if you have a function to generate the SVG floorplan:
      // const svgData = viewer.generateFloorPlan({ level: yourCutHeight, projection: "xy" });
      // if (overlayRef.current && svgData) {
      //   overlayRef.current.innerHTML = svgData;
      // }
    });

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // Replace this dummy function with your actual logic.
  // This function will be called when the user manually creates a zone on the 2D floorplan.
  const handleCreateZone = (evt) => {
    // 1. Compute the zone bounding box from the user’s selection.
    // Replace this with your actual selection logic.
    const zoneBBox = computeZoneBoundingBoxFromUserSelection(evt);
    
    // 2. Query the 3D viewer for elements within the zone.
    // This function depends on your viewer's API; adjust as needed.
    const elementsInZone = viewerRef.current.scene.queryElementsInAABB(zoneBBox);

    // 3. Dynamically compute quantities for each discipline.
    const computedStats = elementsInZone.reduce((acc, elem) => {
      // Assume each element has metadata in elem.userData (e.g., system, volume, area)
      const system = elem.userData.system; // e.g., "sanitary", "electro", "hvac"
      if (!acc[system]) {
        acc[system] = { count: 0, volume: 0, area: 0 };
      }
      acc[system].count += 1;
      acc[system].volume += elem.userData.volume || 0;
      acc[system].area += elem.userData.area || 0;
      return acc;
    }, {});

    // 4. Update state with computed stats.
    setStats(computedStats);
  };

  // Placeholder for a function that converts the user's selection event
  // into a 3D bounding box. You need to implement this based on how you
  // let the user draw or select areas in your overlay.
  const computeZoneBoundingBoxFromUserSelection = (evt) => {
    // Your implementation goes here.
    // For now, return a dummy bounding box [xmin, ymin, zmin, xmax, ymax, zmax].
    return [0, 0, 0, 10, 10, 3];
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left side: 3D canvas */}
      <div style={{ width: '70%', height: '100%' }}>
        <canvas id="my3dCanvas" style={{ width: '100%', height: '100%' }}></canvas>
      </div>

      {/* Right side: Floorplan overlay and discipline stats */}
      <div style={{ width: '30%', height: '100%', borderLeft: '1px solid #ccc' }}>
        <div 
          ref={overlayRef} 
          style={{ width: '100%', height: '60%', cursor: 'crosshair' }}
          onClick={handleCreateZone}  // User manually creates a zone here
        >
          {/* Floorplan SVG or drawing surface will be here */}
        </div>

        {/* Display computed discipline stats */}
        <div style={{ width: '100%', height: '40%', overflow: 'auto' }}>
          <h3>Discipline Quantities</h3>
          {stats ? (
            <ul>
              {Object.keys(stats).map((system) => (
                <li key={system}>
                  {system}: {stats[system].count} objects, {stats[system].volume} m³ volume, {stats[system].area} m² area
                </li>
              ))}
            </ul>
          ) : (
            <p>Draw or select a zone in the floorplan to see metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantityAnalysis;
