
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ArchElement, ElementType } from '../types';
import { Video, StopCircle, Play, Pause, Sun, Zap, Edit2, Move, RotateCw, Maximize2, BoxSelect } from 'lucide-react';

interface Viewport3DProps {
  elements: ArchElement[];
  onUpdate?: (id: string, updates: Partial<ArchElement>) => void;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  onDelete?: (id: string) => void;
}

const Viewport3D: React.FC<Viewport3DProps> = ({ elements, onUpdate, onSelect, selectedId, onDelete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlRef = useRef<TransformControls | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  // Interaction State
  const [hoverLabel, setHoverLabel] = useState<{ text: string; x: number; y: number } | null>(null);
  const [showLightingControls, setShowLightingControls] = useState(false);
  const [lightSettings, setLightSettings] = useState({
      ambientIntensity: 0.6,
      dirIntensity: 1.2,
      dirX: 200,
      dirY: 500,
      dirZ: 300,
      preset: 'day'
  });

  // Transform State
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  // Edit State
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editValues, setEditValues] = useState<{width: number, depth: number, height: number, color: string, bevelEnabled: boolean, bevelRadius: number} | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize Edit Values when selection changes
  useEffect(() => {
      if (selectedId && elements) {
          const el = elements.find(e => e.id === selectedId);
          if (el && el.type === ElementType.OBJECT) {
              setEditValues({
                  width: el.width || 0,
                  depth: el.height || 0,
                  height: el.properties.verticalHeight || 0,
                  color: el.properties.color || '#cccccc',
                  bevelEnabled: el.properties.bevelEnabled || false,
                  bevelRadius: el.properties.bevelRadius || 0
              });
              setShowEditPanel(true);
          } else {
              setShowEditPanel(false);
          }
      } else {
          setShowEditPanel(false);
      }
  }, [selectedId, elements]);

  const handleEditChange = (key: string, value: any) => {
      if (!editValues || !selectedId || !onUpdate) return;
      setEditValues({ ...editValues, [key]: value });
      
      const updates: any = {};
      const currentProps = elements.find(e => e.id === selectedId)?.properties || {};

      if (key === 'width') updates.width = Number(value);
      if (key === 'depth') updates.height = Number(value);
      if (key === 'height') updates.properties = { ...currentProps, verticalHeight: Number(value) };
      if (key === 'color') updates.properties = { ...currentProps, color: value };
      if (key === 'bevelEnabled') updates.properties = { ...currentProps, bevelEnabled: value };
      if (key === 'bevelRadius') updates.properties = { ...currentProps, bevelRadius: Number(value) };
      
      onUpdate(selectedId, updates);
  };

  // Setup Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#121212'); // Dark elegant background
    scene.fog = new THREE.FogExp2('#121212', 0.001);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 1, 5000);
    camera.position.set(600, 500, 600);
    cameraRef.current = camera;

    // Renderer (preserveDrawingBuffer required for screenshots/recording)
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 3000;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controlsRef.current = controls;

    // Transform Controls
    const transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    // Add logic to update React state on transform change
    transformControl.addEventListener('change', () => {
        // We will handle the actual object update in the mouseUp/change end to avoid spamming state
    });
    // However, to make it persist, we need to capture the final position/scale
    transformControl.addEventListener('mouseUp', function () {
         const object = transformControl.object;
         if (object && object.userData.id && onUpdate) {
             const updates: Partial<ArchElement> = {};
             
             // Position mapping
             updates.x = object.position.x;
             updates.y = object.position.z;
             
             // Rotation mapping (Y axis)
             updates.rotation = (object.rotation.y * 180) / Math.PI;

             // Scale mapping (approximate extrusion/resize)
             // Note: Scale in Three.js is a multiplier. Applying it to width/height requires reading current geom.
             if (transformControl.mode === 'scale') {
                 // For box geometry, we need to apply scale to dimensions and reset scale to 1
                 const currentScaleX = object.scale.x;
                 const currentScaleY = object.scale.y;
                 const currentScaleZ = object.scale.z;
                 
                 // If it's an object with stored dims
                 const el = elements.find(e => e.id === object.userData.id);
                 if (el) {
                     if (el.type === ElementType.OBJECT) {
                         const newWidth = (el.width || 100) * currentScaleX;
                         const newHeight = (el.properties.verticalHeight || 100) * currentScaleY;
                         const newDepth = (el.height || 100) * currentScaleZ;
                         
                         updates.width = newWidth;
                         updates.height = newDepth; // Depth is stored in height prop on root
                         updates.properties = { 
                             ...el.properties, 
                             verticalHeight: newHeight,
                             elevation: object.position.y - (newHeight/2) // Adjust elevation based on center shift if needed, simplified here
                         };
                     }
                 }
             } else if (transformControl.mode === 'translate') {
                 // Update elevation if moved in Y
                 // Box center is at Y + height/2. 
                 const el = elements.find(e => e.id === object.userData.id);
                 if (el) {
                     const h = el.properties.verticalHeight || 0;
                     const newElevation = object.position.y - (h / 2);
                     updates.properties = { ...el.properties, elevation: newElevation };
                 }
             }

             onUpdate(object.userData.id, updates);
         }
    });

    scene.add(transformControl);
    transformControlRef.current = transformControl;

    // Lights
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    ambientLight.name = 'ambient';
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.name = 'directional';
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 2000;
    dirLight.shadow.bias = -0.0005; // Fix shadow acne
    const d = 1000;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Mouse Move Listener for Raycasting
    const onMouseMove = (event: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        checkIntersection(event.clientX, event.clientY);
    };

    const onClick = (event: MouseEvent) => {
        if (!containerRef.current || !onSelect) return;
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
        
        const hit = intersects.find(i => i.object.userData && i.object.userData.id);
        
        if (hit) {
            onSelect(hit.object.userData.id);
        } else {
            if (!transformControl.dragging) {
                 onSelect(null);
            }
        }
    };
    
    // Intersection Logic
    const checkIntersection = (clientX: number, clientY: number) => {
        if (!sceneRef.current || !cameraRef.current) return;
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
        
        // Filter out non-element meshes like grid
        const hit = intersects.find(i => i.object.userData && i.object.userData.label);
        
        if (hit) {
            setHoverLabel({
                text: hit.object.userData.label,
                x: clientX,
                y: clientY
            });
            document.body.style.cursor = 'pointer';
        } else {
            setHoverLabel(null);
            document.body.style.cursor = 'default';
        }
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        if (isAutoRotating) {
            controlsRef.current.autoRotate = true;
            controlsRef.current.autoRotateSpeed = 2.0;
        } else {
            controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!containerRef.current || !camera || !renderer) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
          containerRef.current.removeEventListener('mousemove', onMouseMove);
          containerRef.current.removeEventListener('click', onClick);
      }
      if (transformControlRef.current) {
          transformControlRef.current.dispose();
      }
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  // Update Transform Mode
  useEffect(() => {
      if (transformControlRef.current) {
          transformControlRef.current.setMode(transformMode);
      }
  }, [transformMode]);

  // Sync Lights with State
  useEffect(() => {
      if (!sceneRef.current) return;
      
      const ambient = sceneRef.current.getObjectByName('ambient') as THREE.HemisphereLight;
      const directional = sceneRef.current.getObjectByName('directional') as THREE.DirectionalLight;
      
      if (ambient) ambient.intensity = lightSettings.ambientIntensity;
      if (directional) {
          directional.intensity = lightSettings.dirIntensity;
          directional.position.set(lightSettings.dirX, lightSettings.dirY, lightSettings.dirZ);
          
          if (lightSettings.preset === 'night') {
              directional.color.setHex(0xaaccff); // Moonish
              ambient.groundColor.setHex(0x000022);
              sceneRef.current.background = new THREE.Color('#050510');
              sceneRef.current.fog = new THREE.FogExp2('#050510', 0.002);
          } else {
              directional.color.setHex(0xffffff);
              ambient.groundColor.setHex(0x444444);
              sceneRef.current.background = new THREE.Color('#121212');
              sceneRef.current.fog = new THREE.FogExp2('#121212', 0.001);
          }
      }

  }, [lightSettings]);

  // Update Geometry
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const transformControl = transformControlRef.current;

    // Detach first to avoid error when removing object
    if (transformControl) transformControl.detach();

    // Clear meshes (except ground, lights, grid, transformcontrol)
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.name !== 'ground' && child.name !== 'grid' && child.parent?.type !== 'TransformControls') {
             if (!child.userData.preserve) objectsToRemove.push(child);
        }
        if (child.type === 'Group' && child.parent?.type !== 'TransformControls') objectsToRemove.push(child);
    });
    // Be careful not to remove the gizmo helper lines
    objectsToRemove.forEach(obj => {
         scene.remove(obj);
    });

    // Ground Grid
    const oldGrid = scene.getObjectByName('grid');
    if (oldGrid) scene.remove(oldGrid);
    const oldPlane = scene.getObjectByName('ground');
    if (oldPlane) scene.remove(oldPlane);

    const gridHelper = new THREE.GridHelper(5000, 250, 0x444444, 0x222222);
    gridHelper.name = 'grid';
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(5000, 5000);
    const planeMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.name = 'ground';
    scene.add(plane);

    // Materials
    const wallMat = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, roughness: 0.8, metalness: 0.1, clearcoat: 0.1 
    });
    const glassMat = new THREE.MeshPhysicalMaterial({ 
        color: 0xaaccff, roughness: 0, metalness: 0.1, transmission: 0.9, transparent: true, opacity: 0.6 
    });
    const frameMat = new THREE.MeshStandardMaterial({ 
        color: 0x3e2723, roughness: 0.8 
    });

    // Helper to generate texture map if UVs are used
    const getMaterialWithUV = (colorStr: string, uvScaleX = 1, uvScaleY = 1, flipX = false, flipY = false) => {
         const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorStr), roughness: 0.7 });
         if (uvScaleX !== 1 || uvScaleY !== 1 || flipX || flipY) {
             const canvas = document.createElement('canvas');
             canvas.width = 64; canvas.height = 64;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.fillStyle = colorStr;
                 ctx.fillRect(0,0,64,64);
                 ctx.strokeStyle = '#000000';
                 ctx.lineWidth = 2;
                 ctx.strokeRect(0,0,64,64);
                 // Visual indicator of orientation
                 ctx.fillStyle = "rgba(0,0,0,0.1)";
                 ctx.fillRect(0,0,32,32);
                 ctx.fillRect(32,32,32,32);
                 
                 const tex = new THREE.CanvasTexture(canvas);
                 tex.wrapS = THREE.RepeatWrapping;
                 tex.wrapT = THREE.RepeatWrapping;
                 // Flip is negative scale in ThreeJS typically or offset
                 const sX = flipX ? -uvScaleX : uvScaleX;
                 const sY = flipY ? -uvScaleY : uvScaleY;
                 tex.repeat.set(sX, sY);
                 mat.map = tex;
             }
         }
         return mat;
    }

    elements.forEach(el => {
        if (!el.width) return;
        
        const label = el.properties.label || el.properties.text || el.type;
        const isSelected = el.id === selectedId;

        // ... [Standard Wall/Door/Window logic remains same, mostly static] ... 
        if (el.type === ElementType.WALL) {
            const height = el.properties.verticalHeight || 300;
            const thickness = el.height || 10;
            const length = el.width;
            
            const color = new THREE.Color(el.properties.color || '#e5e5e5');
            const thisMat = wallMat.clone();
            thisMat.color = color;
            if (isSelected) thisMat.emissive = new THREE.Color(0x333333);

            const geometry = new THREE.BoxGeometry(length, height, thickness);
            geometry.translate(length / 2, height / 2, 0);
            
            const mesh = new THREE.Mesh(geometry, thisMat);
            mesh.position.set(el.x, 0, el.y);
            mesh.rotation.y = el.rotation * (Math.PI / 180);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { label, id: el.id };
            scene.add(mesh);
        }
        else if (el.type === ElementType.DOOR) {
             const height = el.properties.verticalHeight || 210;
             const width = el.width;
             const thickness = el.height || 10;
             const group = new THREE.Group();
             const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 4), new THREE.MeshStandardMaterial({color: 0xd4a373}));
             panel.position.set(width/2, height/2, 0);
             group.add(panel);
             group.position.set(el.x, 0, el.y);
             group.rotation.y = el.rotation * (Math.PI / 180);
             group.traverse(c => { c.userData = { label: 'Door', id: el.id }; });
             scene.add(group);
        }
        else if (el.type === ElementType.WINDOW) {
            const height = el.properties.verticalHeight || 120;
            const width = el.width;
            const sill = el.properties.sillHeight || 90;
            const group = new THREE.Group();
            const glass = new THREE.Mesh(new THREE.BoxGeometry(width, height, 2), glassMat);
            glass.position.set(width/2, sill + height/2, 0);
            group.add(glass);
            group.position.set(el.x, 0, el.y);
            group.rotation.y = el.rotation * (Math.PI / 180);
            group.traverse(c => { c.userData = { label: 'Window', id: el.id }; });
            scene.add(group);
        }
        else if (el.type === ElementType.OBJECT) {
            const height = el.properties.verticalHeight || 100;
            const width = el.width;
            const depth = el.height || width;
            const elevation = el.properties.elevation || 0;
            const bevelEnabled = el.properties.bevelEnabled || false;
            const bevelRadius = el.properties.bevelRadius || 0;
            
            const objMat = getMaterialWithUV(
                el.properties.color || '#cccccc', 
                el.properties.uvScaleX || 1, 
                el.properties.uvScaleY || 1,
                el.properties.uvFlipX || false,
                el.properties.uvFlipY || false
            );
            
            if (isSelected) objMat.emissive = new THREE.Color(0x333333);

            let mesh;
            if (el.properties.shape === 'circle' || el.properties.shape === 'cylinder') {
                 mesh = new THREE.Mesh(new THREE.CylinderGeometry(width/2, width/2, height, 32), objMat);
                 mesh.position.y = height/2;
            } else if (el.properties.shape === 'pyramid') {
                 mesh = new THREE.Mesh(new THREE.ConeGeometry(width/2, height, 4), objMat);
                 mesh.position.y = height/2;
                 mesh.rotation.y = Math.PI / 4;
            } else {
                // Box
                if (bevelEnabled && bevelRadius > 0) {
                     // Use RoundedBoxGeometry
                     mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, bevelRadius), objMat);
                } else {
                     mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), objMat);
                }
                mesh.position.y = height/2;
            }
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const wrapper = new THREE.Group();
            wrapper.add(mesh);
            wrapper.position.set(el.x, elevation, el.y);
            wrapper.rotation.y = el.rotation * (Math.PI / 180);
            wrapper.traverse(c => c.userData = { label, id: el.id });
            scene.add(wrapper);

            // If selected, attach transform controls
            if (isSelected && transformControl) {
                // We attach to the wrapper to move the whole group
                transformControl.attach(wrapper);
            }
        }
    });

  }, [elements, selectedId, lightSettings]); // Re-run when light settings change to update grid/background or elements change

  // ... [Recording functions] ...
  const startRecording = () => {
    if (!rendererRef.current) return;
    const canvas = rendererRef.current.domElement;
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `architech_recording.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    setIsAutoRotating(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        setIsAutoRotating(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    }
  };

  return (
    <div className="relative w-full h-full">
        <div ref={containerRef} className="w-full h-full bg-[#121212]" />
        
        {/* Tooltip Overlay */}
        {hoverLabel && (
            <div 
                className="fixed bg-black/80 text-white text-xs px-2 py-1 rounded z-50 pointer-events-none shadow-lg border border-white/20 transform -translate-x-1/2 -translate-y-full mt-[-10px]"
                style={{ top: hoverLabel.y, left: hoverLabel.x }}
            >
                {hoverLabel.text}
            </div>
        )}

        {/* 3D Transform Tools Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
             <div className="bg-black/60 backdrop-blur rounded-lg p-1 border border-white/10 flex flex-col space-y-1">
                 <button onClick={() => setTransformMode('translate')} className={`p-2 rounded ${transformMode === 'translate' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`} title="Move (T)">
                    <Move size={18} />
                 </button>
                 <button onClick={() => setTransformMode('rotate')} className={`p-2 rounded ${transformMode === 'rotate' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`} title="Rotate (R)">
                    <RotateCw size={18} />
                 </button>
                 <button onClick={() => setTransformMode('scale')} className={`p-2 rounded ${transformMode === 'scale' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`} title="Scale/Extrude (S)">
                    <Maximize2 size={18} />
                 </button>
             </div>
        </div>

        {/* 3D Object Quick Edit Panel */}
        {showEditPanel && editValues && (
            <div className="absolute top-4 left-16 bg-black/80 backdrop-blur rounded-lg p-4 border border-white/10 shadow-2xl z-20 w-64 animate-in fade-in slide-in-from-top-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white text-xs font-bold uppercase flex items-center"><Edit2 size={12} className="mr-2 text-accent"/> Object Properties</h3>
                 </div>
                 <div className="space-y-3">
                     <div>
                         <label className="text-[10px] text-gray-400 flex justify-between"><span>Width</span> <span>{Math.round(editValues.width)}px</span></label>
                         <input type="range" min="10" max="500" value={editValues.width} onChange={e => handleEditChange('width', e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div>
                         <label className="text-[10px] text-gray-400 flex justify-between"><span>Depth</span> <span>{Math.round(editValues.depth)}px</span></label>
                         <input type="range" min="10" max="500" value={editValues.depth} onChange={e => handleEditChange('depth', e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div>
                         <label className="text-[10px] text-gray-400 flex justify-between"><span>Height</span> <span>{Math.round(editValues.height)}cm</span></label>
                         <input type="range" min="10" max="600" value={editValues.height} onChange={e => handleEditChange('height', e.target.value)} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div className="h-px bg-white/10 my-2"></div>
                     <div className="flex items-center justify-between">
                         <label className="text-[10px] text-gray-400">Color</label>
                         <input type="color" value={editValues.color} onChange={e => handleEditChange('color', e.target.value)} className="w-6 h-6 rounded border-none cursor-pointer" />
                     </div>
                 </div>
            </div>
        )}

        {/* Lighting Controls Panel */}
        {showLightingControls && (
             <div className="absolute top-4 right-4 bg-black/80 backdrop-blur rounded-lg p-4 border border-white/10 shadow-2xl z-20 w-64">
                 <h3 className="text-white text-xs font-bold uppercase mb-4 flex items-center"><Sun size={14} className="mr-2"/> Lighting Settings</h3>
                 <div className="space-y-4">
                     <div className="flex bg-white/10 rounded p-1 mb-2">
                        <button onClick={() => setLightSettings(s => ({ ...s, preset: 'day' }))} className={`flex-1 py-1 text-xs rounded ${lightSettings.preset === 'day' ? 'bg-accent text-white' : 'text-gray-400'}`}>Day</button>
                        <button onClick={() => setLightSettings(s => ({ ...s, preset: 'night' }))} className={`flex-1 py-1 text-xs rounded ${lightSettings.preset === 'night' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Night</button>
                     </div>
                     <div>
                         <label className="text-[10px] text-gray-400">Ambient Intensity</label>
                         <input type="range" min="0" max="2" step="0.1" value={lightSettings.ambientIntensity} onChange={e => setLightSettings(s => ({...s, ambientIntensity: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div>
                         <label className="text-[10px] text-gray-400">Directional Intensity</label>
                         <input type="range" min="0" max="3" step="0.1" value={lightSettings.dirIntensity} onChange={e => setLightSettings(s => ({...s, dirIntensity: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                     <div>
                         <label className="text-[10px] text-gray-400">Light X Position</label>
                         <input type="range" min="-1000" max="1000" step="50" value={lightSettings.dirX} onChange={e => setLightSettings(s => ({...s, dirX: parseFloat(e.target.value)}))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                     </div>
                 </div>
             </div>
        )}

        {/* 3D Controls Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-black/60 backdrop-blur rounded-full px-6 py-3 border border-white/10 shadow-2xl z-10">
            <button onClick={() => setShowLightingControls(!showLightingControls)} className={`p-2 rounded-full transition-colors ${showLightingControls ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`} title="Lighting Controls">
                <Zap size={20} fill="currentColor" />
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <button onClick={() => setIsAutoRotating(!isAutoRotating)} className={`p-2 rounded-full transition-colors ${isAutoRotating ? 'bg-accent text-white' : 'text-gray-300 hover:bg-white/10'}`} title="Auto Rotate Camera">
                {isAutoRotating ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            {!isRecording ? (
                <button onClick={startRecording} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors font-medium text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div><span>Rec</span>
                </button>
            ) : (
                <div className="flex items-center space-x-2">
                     <button onClick={pauseRecording} className="p-1 rounded-full text-white hover:bg-white/10" title={isPaused ? "Resume" : "Pause"}>
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button onClick={stopRecording} className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-colors font-medium text-sm animate-pulse">
                        <StopCircle size={16} /><span>Stop</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default Viewport3D;
