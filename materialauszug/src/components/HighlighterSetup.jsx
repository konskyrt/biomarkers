import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * HighlighterSetup component - handles highlighting of IFC elements when clicked
 * @param {Object} scene - THREE.js scene
 * @param {Object} ifcModel - IFC model object
 * @param {Object} viewer - THREE.WebGLRenderer for rendering
 */
const HighlighterSetup = ({ 
  scene, 
  ifcModel, 
  viewer
}) => {
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const highlightMaterialRef = useRef(
    new THREE.MeshBasicMaterial({
      color: 0xff88ff,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
    })
  );
  
  const [highlightedMesh, setHighlightedMesh] = useState(null);

  useEffect(() => {
    if (!scene || !viewer || !ifcModel) return;

    // Set up an event listener for clicks
    const onMouseClick = (event) => {
      if (!viewer || !viewer.domElement) return;
      
      // Calculate mouse position in normalized device coordinates
      const canvasBounds = viewer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycasterRef.current.setFromCamera(mouseRef.current, scene.camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      // Remove any current highlight
      removeHighlight();

      // Check if we hit something
      if (intersects.length > 0) {
        const intersect = intersects[0];
        // Check if the object is a fragment mesh with userData
        if (intersect.object && intersect.object.userData && intersect.object.userData.isFragmentMesh) {
          highlightObject(intersect.object, intersect.faceIndex);
          console.log('Highlighted object:', intersect.object.name);
          
          // If you have fragment IDs or IFC properties available, you could log them here
          if (intersect.object.userData.fragmentId) {
            console.log('Fragment ID:', intersect.object.userData.fragmentId);
          }
        }
      }
    };

    // Apply highlight to an object
    const highlightObject = (object, faceIndex) => {
      if (!object) return;
      
      // Create a cloned mesh with highlight material
      const clonedGeometry = object.geometry.clone();
      const highlightMesh = new THREE.Mesh(clonedGeometry, highlightMaterialRef.current);
      
      // Copy the transformation of the original object
      highlightMesh.position.copy(object.position);
      highlightMesh.rotation.copy(object.rotation);
      highlightMesh.scale.copy(object.scale);
      
      // Add to scene and store reference
      scene.add(highlightMesh);
      setHighlightedMesh(highlightMesh);
    };

    // Remove any current highlight
    const removeHighlight = () => {
      if (highlightedMesh) {
        scene.remove(highlightedMesh);
        setHighlightedMesh(null);
      }
    };

    // Add event listener
    viewer.domElement.addEventListener('click', onMouseClick);

    // Cleanup function
    return () => {
      if (viewer && viewer.domElement) {
        viewer.domElement.removeEventListener('click', onMouseClick);
      }
      removeHighlight();
    };
  }, [scene, viewer, ifcModel]);

  return null; // This component doesn't render anything
};

export default HighlighterSetup; 