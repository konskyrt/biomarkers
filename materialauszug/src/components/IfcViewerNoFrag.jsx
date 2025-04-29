import React, { useEffect, useRef, useState } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HomeIcon, CameraIcon, FunnelIcon, MapIcon } from '@heroicons/react/24/outline';
import FloorplanNavigator from './FloorplanNavigator';
import HighlighterSetup from './HighlighterSetup';
import 'web-ifc'; // IFC parser must load before fragments
import { FragmentsModels, IfcImporter } from '@thatopen/fragments';
import { serializer } from '../IFC';

import * as WEBIFC from "web-ifc";
const webIfc = new WEBIFC.IfcAPI();
webIfc.SetWasmPath("https://unpkg.com/web-ifc@0.0.68/", true);

import * as THREE from 'three';
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import Stats from "stats.js";

// BUI.Manager.init();

const IfcViewerNoFrag = ({ ifcFile }) => {
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
  const componentsRef = useRef(null);
  const worldRef = useRef(null);

  const [fragments, setFragments] = useState(false);

  useEffect(() => {
    // Initialize fragments library
    (async () => {
      // to export properties
      await webIfc.Init();

      try {
        if (!fragmentsRef.current) {
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

          console.log("Fragments library initialized successfully");
          setFragments(true);
        }
      } catch (error) {
        console.error("Error initializing fragments library:", error);
      }
    })();
    return () => {
    }
  }, []);

  const disposeWorld = () => {
    try {
      // dispose fragments
      const ids = getModelsIds();
      for (const id of ids) fragmentsRef.current?.disposeModel(id);
      console.log(sceneRef.current?.dispose, rendererRef.current?.dispose, ids)
      sceneRef.current?.dispose();
      rendererRef.current?.dispose();
      // dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement?.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.renderer.domElement);
        }
        rendererRef.current = null;
      }
      // dispose scene
      if (worldRef.current.scene) {
        // Dispose materials and geometries
        sceneRef.current?.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
          if (object.texture) object.texture.dispose?.();
        });
        sceneRef.current = null;
      }

      worldRef.current.dispose();
      worldRef.current = null;
    } catch (e){console.log(e)}
  }
  // Initialize the 3D scene
  useEffect(() => {
    try {
      console.log(!containerRef.current, !fragmentsRef.current, !fragments);
      if (!containerRef.current || !fragmentsRef.current || !fragments) return;

      const container = containerRef.current;

      // Setting up a simple scene
      // const viewport = document.createElement("bim-viewport");

      const components = new OBC.Components();
      componentsRef.current = components;
      const worlds = components.get(OBC.Worlds);

      if (worldRef.current) {
        disposeWorld()
      }
      const world = worlds.create();
      worldRef.current = world;
      world.scene = sceneRef.current = new OBC.SimpleScene(components);
      world.renderer = rendererRef.current = new OBCF.PostproductionRenderer(components, container);
      world.camera = cameraRef.current = new OBC.OrthoPerspectiveCamera(components);

      world.renderer.postproduction.enabled = true;
      world.renderer.postproduction.customEffects.outlineEnabled = true;

      components.init();

      // world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

      world.scene.setup();

      const grids = components.get(OBC.Grids);
      const grid = grids.create(world);
      grid.three.position.y -= 1;
      grid.config.color.setHex(0x666666);
      world.renderer.postproduction.customEffects.excludedMeshes.push(grid.three);
      // world.scene.three.background = null;

      // add simle cube
      // const cube = new THREE.Mesh(
      //   new THREE.BoxGeometry(),
      //   new THREE.MeshBasicMaterial({ color: "red" }),
      // );
      // world.scene.three.add(cube);
      loadExampleIfc();

    } catch (e) {
      console.error("Initializing the 3D scene", e);
    }

    // ⏱️ Measuring the performance (optional)
    // const stats = new Stats();
    // stats.showPanel(2);
    // document.body.append(stats.dom);
    // stats.dom.style.left = "0px";
    // stats.dom.style.zIndex = "unset";
    // world.renderer.onBeforeUpdate.add(() => stats.begin());
    // world.renderer.onAfterUpdate.add(() => stats.end());

    // Handle resize
    const handleResize = () => {
      const width = container.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [containerRef.current, fragmentsRef.current, fragments]);

  const getModelsIds = () => {
    const models = fragments.models?.list?.values();

    const ids = [...(models ?? [])].map((model) => model.modelId);
    return ids;
  };

  // Add new useEffect to handle ifcFile changes
  useEffect(() => {
    if (ifcFile && sceneRef.current) {
      loadIFC(ifcFile);
    }
  }, [ifcFile]);


  const clearExistingModel = () => {
    if (sceneRef.current) {
      // Remove all models from the scene
      try {
        const toRemove = [];
        console.log(sceneRef.current);
        sceneRef.current?.traverse && sceneRef.current?.traverse((object) => {
          if (object.userData && object.userData.isFragmentMesh) {
            toRemove.push(object);
          } else if (object instanceof THREE.Mesh &&
            !(object instanceof THREE.GridHelper) &&
            !(object instanceof THREE.AxesHelper)) {
            toRemove.push(object);
          }
        });
        toRemove.forEach((object) => {
          sceneRef.current.three.remove(object);
        });

        // Clear any caches
        if (fragmentsRef.current && fragmentsRef.current.models && fragmentsRef.current.models.list) {
          fragmentsRef.current.models.list.clear();
        }

        // Clear reference to previous model
        ifcModelRef.current = null;
      } catch (e) {
        console.log(e);
      }
    }
  };

  const loadIFC = async (file) => {
    try {
      setError(null);
      setIsIfcLoaded(false);
      setIsLoading(true);
      setLoadingProgress(0);

      const ifcLoader = componentsRef.current.get(OBC.IfcLoader);
      await ifcLoader.setup();
      const file = await fetch(
        "https://thatopen.github.io/engine_components/resources/small.ifc",
      );
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      const model = await ifcLoader.load(buffer);
      worldRef.current.scene.three.add(model);
      
      const plans = componentsRef.current.get(OBCF.Plans);
      console.log("plans", plans)
      plans.world = worldRef.current;
      await plans.generate(model);
      console.log(plans);

      // const highlighter = componentsRef.current.get(OBCF.Highlighter);
      // highlighter.setup({ world: worldRef.current });


      setIsIfcLoaded(true);
      setIsLoading(false);
    } catch (e) {
      console.log(e);
    }
  };

  const loadExampleIfc = () => {
    (async () => {
      try {

      } catch (e) {

      }
      setIsIfcLoaded(true)
    })();
  }


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

export default IfcViewerNoFrag; 