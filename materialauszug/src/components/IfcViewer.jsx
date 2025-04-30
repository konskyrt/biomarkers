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

    // dispose fragments
    const ids = getModelsIds();
    for (const id of ids) fragmentsRef.current?.disposeModel(id);
    console.log(sceneRef.current?.dispose, rendererRef.current?.dispose, ids)
    sceneRef.current?.dispose();
    rendererRef.current?.dispose();
    // dispose renderer
    if (worldRef.current.renderer) {
      world.renderer.renderer.dispose();
      if (world.renderer.renderer.domElement?.parentNode) {
        world.renderer.renderer.domElement.parentNode.removeChild(world.renderer.renderer.domElement);
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
      // loadExampleIfc();

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
    // window.addEventListener('resize', handleResize);
    if (false) { // threejs scene
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;
      // world.scene = scene;

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
    }
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

        // Process with progress updates
        const fragmentsData = await serializer.process({
          bytes: ifcBytes
        });
        console.log("imported frag",buffer, ifcBytes, fragmentsData);
        console.log("##########################", ifcBytes, fragmentsData);
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
              // clearExistingModel();
            }

            // Use a unique ID based on timestamp to avoid conflicts
            const modelId = `${file.name}-${Date.now()}`;

            // Load model directly from buffer data
            const isIfcModel = true;
            if (isIfcModel) {
              const model = await fragmentsRef.current?.load(fragmentsData, { modelId });
              exportFragment(modelId, fragmentsData);
              sceneRef.current.three.add(model.object);
              const fragmentBbox = componentsRef.current.get(OBC.BoundingBoxer);
              // console.log("#############", model, model._bbox, fragmentBbox);
              console.log("fragmentsData", fragmentsData, model);
              model.useCamera(cameraRef.current.three);

              // Camera Fit
              {
                const center = model._bbox.getCenter(new THREE.Vector3());  // Center of the bounding box
                const size = model._bbox.getSize(new THREE.Vector3()); // Size of the bounding box
                const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
                const boxMesh = new THREE.Mesh(geometry, material);
                boxMesh.position.copy(center);
                cameraRef.current.controls.fitToBox(boxMesh, true);
                // cameraRef.current.controls.zoomTo(1);
              }

              
              // highlight
              // const highlighter = componentsRef.current.get(OBCF.Highlighter);
              // highlighter.setup({ world: worldRef.current });

              await fragmentsRef.current?.update(true);
            } else {
              // frag model
              // await exportFragment(modelId, fragmentsData);

              // 
              const fragments = componentsRef.current.get(OBC.FragmentsManager);
              const model = fragments.load(fragmentsData);
              sceneRef.current.three.add(model);
              console.log(model, fragments)

              // await fragmentsRef.current?.update(false);

              // 🖼️ Getting the plans
              // const plans = componentsRef.current.get(OBCF.Plans);
              // plans.world = worldRef.current;
              // await plans.generate(model);
            }


            setIsLoading(false);
            setIsIfcLoaded(true);
            console.log("Model loaded successfully");
          } catch (error) {
            console.error("Error loading fragments model:", error);
            setError(error);
            setIsLoading(false);
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

  const loadExampleIfc = () => {
    (async () => {
      try {
        if (true)
        {
          const file = await fetch("./_small.frag");//https://thatopen.github.io/engine_components/resources/small.frag");
          const data = await file.arrayBuffer();
          const buffer = new Uint8Array(data);
          const fragmentsManager = componentsRef.current.get(OBC.FragmentsManager);
          const model = fragmentsManager.load(buffer, { modelId: '123123' });
          worldRef.current.scene.three.add(model);
          console.log("1", model)
          worldRef.current.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
          
          // const propsFile = await fetch("https://thatopen.github.io/engine_components/resources/small.json");
          // const propsData = await propsFile.json();
          // model.setLocalProperties(propsData);

          // // 🖼️ Getting the plans
          // const plans = componentsRef.current.get(OBCF.Plans);
          // plans.world = worldRef.current;
          // await plans.generate(model);
        }
        {
          const file = await fetch('./small.ifc-1745809253952.frag');
          const data = await file.arrayBuffer();
          const buffer = new Uint8Array(data);
          console.log("###########", data, buffer)
          const model = await fragmentsRef.current?.load(buffer, { modelId: 'small.ifc-1745809253952' });
          worldRef.current.scene.three.add(model.object);
          model.useCamera(cameraRef.current.three);
          console.log("2", model)
        }


        // highlight
        const highlighter = componentsRef.current.get(OBCF.Highlighter);
        highlighter.setup({ world: worldRef.current });

        // culling
        // const cullers = componentsRef.current.get(OBC.Cullers);
        // const culler = cullers.create(worldRef.current);
        // for (const fragment of model.items) {
        //   culler.add(fragment.mesh);
        // }

        // culler.needsUpdate = true;
      } catch (e) {

      }
      setIsIfcLoaded(true)
    })();
  }

  const exportFragment = async (modelId, fragmentBytes) => {
    if (!fragmentBytes) return;
    const file = new File([fragmentBytes], modelId + ".frag");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);

    // export properties
    if (false)
    {
      const exporter = components.get(OBC.IfcJsonExporter);
      const exported = await exporter.export(webIfc, modelID);
      const serialized = JSON.stringify(exported);
      const file = new File([new Blob([serialized])], "properties.json");
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.download = "properties.json";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
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