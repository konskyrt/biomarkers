import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HomeIcon, CameraIcon, FunnelIcon, MapIcon } from '@heroicons/react/24/outline';
import FloorplanNavigator from './FloorplanNavigator';
import HighlighterSetup from './HighlighterSetup';
import { IFCLoader } from 'three/examples/jsm/loaders/IFCLoader';
import 'web-ifc'; // IFC parser must load before fragments
import { FragmentsModels, IfcImporter } from '@thatopen/fragments';

const serializer = new IfcImporter();
serializer.wasm = { absolute: true, path: "https://unpkg.com/web-ifc@0.0.68/" };

const IfcViewer = ({ ifcFile }) => {
  const containerRef = useRef();
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const [error, setError] = useState(null);
  const [isIfcLoaded, setIsIfcLoaded] = useState(false);
  const [showFloorplanNav, setShowFloorplanNav] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const ifcModelRef = useRef(null);
  const fragmentsRef = useRef(null);
  const rawBufferRef = useRef(null);
  const loaderRef = useRef(null);
  const listenerRef = useRef(null);

  useEffect(() => {
    // Initialize the 3D scene
    const container = containerRef.current;
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Save camera reference for raycasting
    scene.userData.camera = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    // Add lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add grid and axes
    scene.add(new THREE.GridHelper(20, 20));
    scene.add(new THREE.AxesHelper(10));

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Provide console access for debugging
    if (process.env.NODE_ENV === 'development') {
      window.THREE = THREE;
      window.scene = scene;
      window.camera = camera;
      window.renderer = renderer;
      window.controls = controls;
      console.log('Three.js debug objects available in console');
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (loaderRef.current && listenerRef.current) {
        // Check if onItemSet is a Map (has delete method) or another type of event system
        if (loaderRef.current.models.list.onItemSet && 
            typeof loaderRef.current.models.list.onItemSet.delete === 'function') {
          loaderRef.current.models.list.onItemSet.delete(listenerRef.current);
        } else if (loaderRef.current.models.list.onItemSet && 
                  typeof loaderRef.current.models.list.onItemSet.remove === 'function') {
          // Some event systems use 'remove' instead of 'delete'
          loaderRef.current.models.list.onItemSet.remove(listenerRef.current);
        }
      }
      renderer.dispose();
      
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Add new useEffect to handle ifcFile changes
  useEffect(() => {
    if (ifcFile && sceneRef.current) {
      // Clear any existing model
      clearExistingModel();
      
      // Handle IFC file loading
      loadIFC(ifcFile);
    }
  }, [ifcFile]);

  // Initialize fragments library
  useEffect(() => {
    (async () => {
      try {
        // Create a worker file for fragments
        const workerUrl = "./worker.mjs";
        const fetchedWorker = await fetch(workerUrl);
        const workerText = await fetchedWorker.text();
        const workerFile = new File([new Blob([workerText])], "worker.mjs", {
          type: "text/javascript",
        });
        const url = URL.createObjectURL(workerFile);
        
        // Initialize fragments models
        const fragments = new FragmentsModels(url);
        fragmentsRef.current = fragments;
        
        // Set up model loading listener
        const onModel = ({ value: model }) => {
          if (model && cameraRef.current && sceneRef.current) {
            model.useCamera(cameraRef.current);
            sceneRef.current.add(model.object);
            fragments.update(true);
          }
        };
        
        // Check if onItemSet.add is a function before using it
        if (fragments.models.list.onItemSet && typeof fragments.models.list.onItemSet.add === 'function') {
          fragments.models.list.onItemSet.add(onModel);
          listenerRef.current = onModel;
        } else if (fragments.models.list.onItemSet && typeof fragments.models.list.onItemSet.on === 'function') {
          // Some event systems use 'on' instead of 'add'
          fragments.models.list.onItemSet.on(onModel);
          listenerRef.current = onModel;
        } else {
          console.warn("Could not attach model loading listener: onItemSet.add is not a function");
        }
        loaderRef.current = fragments;
        
        console.log("Fragments library initialized successfully");
      } catch (error) {
        console.error("Error initializing fragments library:", error);
      }
    })();
  }, []);

  const clearExistingModel = () => {
    if (sceneRef.current) {
      // Remove all models from the scene
      const toRemove = [];
      sceneRef.current.traverse((object) => {
        if (object.userData && object.userData.isFragmentMesh) {
          toRemove.push(object);
        } else if (object instanceof THREE.Mesh && 
                  !(object instanceof THREE.GridHelper) && 
                  !(object instanceof THREE.AxesHelper)) {
          toRemove.push(object);
        }
      });
      
      toRemove.forEach(obj => {
        sceneRef.current.remove(obj);
      });
      
      // Clear any caches
      if (fragmentsRef.current && fragmentsRef.current.models && fragmentsRef.current.models.list) {
        fragmentsRef.current.models.list.clear();
      }
      
      // Clear reference to previous model
      ifcModelRef.current = null;
    }
  };

  const loadIFC = async (file) => {
    try {
      setError(null);
      setIsIfcLoaded(false);
      setIsLoading(true);
      setLoadingProgress(0);
      
      console.log(`Loading IFC file: ${file.name}`);
      
      // Get file buffer
      let buffer;
      try {
        buffer = await file.arrayBuffer();
        rawBufferRef.current = buffer;
      } catch (err) {
        console.error('Read error:', err);
        setError('Error reading file');
        setIsLoading(false);
        return;
      }
      
      // Process IFC buffer to fragments format using the serializer
      const ifcBytes = new Uint8Array(buffer);
      console.log("Converting IFC to fragments format...");
      
      try {
        // Show progress
        const updateProgress = (progress) => {
          const percentage = Math.round(progress * 100);
          setLoadingProgress(percentage);
          console.log(`Loading progress: ${percentage}%`);
        };
        
        // Process with progress updates
        const fragmentsData = await serializer.process({ 
          bytes: ifcBytes,
          onProgress: updateProgress
        });
        
        if (!fragmentsData) {
          console.error("Failed to convert IFC to fragments format");
          setError("Failed to convert IFC model");
          setIsLoading(false);
          return;
        }
        
        console.log("IFC converted successfully, loading model...");
        
        // Load the model with fragments
        if (fragmentsRef.current) {
          try {
            // Clear any existing models
            if (sceneRef.current) {
              // Remove all models from the scene
              const toRemove = [];
              sceneRef.current.traverse((object) => {
                if (object.userData && object.userData.isFragmentMesh) {
                  toRemove.push(object);
                }
              });
              toRemove.forEach((object) => {
                sceneRef.current.remove(object);
              });

              // Clear any caches
              if (fragmentsRef.current.models && fragmentsRef.current.models.list) {
                fragmentsRef.current.models.list.clear();
              }
            }
            
            // Use a unique ID based on timestamp to avoid conflicts
            const modelId = `imported-model-${Date.now()}`;
            
            // Load model directly from buffer data
            const model = await fragmentsRef.current.load(fragmentsData, { modelId });
            
            if (model && cameraRef.current && sceneRef.current) {
              model.useCamera(cameraRef.current);
              sceneRef.current.add(model.object);
              
              // Center and zoom to fit the model
              if (model.boundingBox && cameraRef.current) {
                const box = model.boundingBox;
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = cameraRef.current.fov * (Math.PI / 180);
                const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
                
                cameraRef.current.position.copy(center);
                cameraRef.current.position.z += distance * 1.5;
                cameraRef.current.lookAt(center);
              }
              
              await fragmentsRef.current.update(true);
              setIsLoading(false);
              setIsIfcLoaded(true);
              console.log("Model loaded successfully");
            }
          } catch (error) {
            console.error("Error loading fragments model:", error);
            
            // Fallback method if the new approach fails
            try {
              console.log("Attempting fallback loading method...");
              const model = await fragmentsRef.current.load(fragmentsData);
              
              if (model) {
                console.log("Fallback loading successful");
                if (cameraRef.current) model.useCamera(cameraRef.current);
                if (sceneRef.current) sceneRef.current.add(model.object);
                await fragmentsRef.current.update(true);
                setIsLoading(false);
                setIsIfcLoaded(true);
              }
            } catch (fallbackError) {
              console.error("Fallback loading also failed:", fallbackError);
              setError("Failed to load model: " + fallbackError.message);
              setIsLoading(false);
            }
          }
        } else {
          console.error("Fragments loader not initialized");
          setError("Fragments loader not initialized");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading IFC:", error);
        setError("Error loading IFC: " + error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Unexpected error: " + error.message);
      setIsLoading(false);
    }
  };

  // Extract model details (similar to MaterialAuszug approach)
  const extractModelDetails = (ifcModel) => {
    try {
      // This would be where we'd extract data from the model
      // Similar to how MaterialAuszug processes model data
      console.log('Model details extraction would happen here');
      
      // For demonstration, let's just log the model's geometry info
      if (ifcModel && ifcModel.geometry) {
        console.log(`Model has ${ifcModel.geometry.index.count} indices`);
      }
    } catch (error) {
      console.error('Error extracting model details:', error);
    }
  };

  const handleHome = () => {
    if (cameraRef.current && controlsRef.current) {
      if (ifcModelRef.current) {
        // If we have a model, center camera on it
        const box = new THREE.Box3().setFromObject(ifcModelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
        
        const direction = new THREE.Vector3(1, 1, 1).normalize();
        cameraRef.current.position.copy(center.clone().add(direction.multiplyScalar(cameraDistance)));
        cameraRef.current.lookAt(center);
        
        controlsRef.current.target.copy(center);
      } else {
        // Default position if no model
      cameraRef.current.position.set(15, 10, 15);
      cameraRef.current.lookAt(0, 4, 0);
        controlsRef.current.target.set(0, 4, 0);
      }
      
      controlsRef.current.update();
    }
  };
  
  const handleScreenshot = () => {
    if (rendererRef.current) {
      const dataURL = rendererRef.current.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'bim-model.png';
      link.href = dataURL;
      link.click();
    }
  };
  
  const handleFilter = () => {
    // Placeholder for future filtering functionality
  };
  
  const toggleFloorplanNav = () => {
    setShowFloorplanNav(!showFloorplanNav);
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">
            {isIfcLoaded ? 'IFC Model Viewer' : 'IFC Viewer'}
            {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
          </h3>
          <div className="flex space-x-2">
            <button onClick={handleHome} className="p-1.5 rounded hover:bg-gray-100" title="Reset camera">
              <HomeIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleScreenshot} className="p-1.5 rounded hover:bg-gray-100" title="Take screenshot">
              <CameraIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={toggleFloorplanNav} className="p-1.5 rounded hover:bg-gray-100" title="Floor plans">
              <MapIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleFilter} className="p-1.5 rounded hover:bg-gray-100" title="Filter objects">
              <FunnelIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative" ref={containerRef} data-viewer-container>
          {/* Show empty state message when no file is loaded */}
          {!ifcFile && !isIfcLoaded && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-center">No IFC file loaded. Use the import panel on the left to upload a file.</p>
            </div>
          )}
          
          {/* Show loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
              <div className="bg-white p-5 rounded-lg shadow-lg text-center max-w-md">
                <div className="mb-3">
                  <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="text-lg font-medium mb-2">Loading IFC Model</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-500 mt-2">{loadingProgress}% complete</div>
              </div>
            </div>
          )}
          
          {/* Floor plan navigator */}
          {showFloorplanNav && <FloorplanNavigator />}
          
          {/* This is a component that sets up object highlighting */}
          {isIfcLoaded && ifcModelRef.current && (
            <HighlighterSetup 
              scene={sceneRef.current} 
              ifcModel={ifcModelRef.current}
              viewer={rendererRef.current}
            />
          )}
          
          {/* Help link if there are errors */}
          {error && (
            <div className="absolute bottom-4 right-4">
              <a 
                href="/wasm-test.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-2 bg-primary text-white rounded text-sm flex items-center hover:bg-blue-700"
              >
                Troubleshoot WASM loading
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IfcViewer; 