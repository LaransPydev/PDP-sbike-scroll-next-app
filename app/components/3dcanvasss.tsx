"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/* ==================== CONFIG ==================== */
const CONFIG = {
    TOTAL_FRAMES: 550,
    MODEL: {
        PATH: "/Sbike 35.glb",
        POSITION_Y_OFFSET: -1,
        SCALE: {
            mobile: 0.05,
            tablet: 0.10,
            desktop: 1.0,
        },
        MOBILE_POSITION: {
            y: -1.5,
            x: 0,
            z: 0,
        },
        TABLET_POSITION: {
            y: -1.8,
            x: 0,
            z: 0,
        },
        DESKTOP_POSITION: {
            y: 1,
            x: 0,
            z: 0,
        },
    },
    HDR: {
        PATH: "https://360-product-view.s3.eu-north-1.amazonaws.com/Product-360-View/models/hdr/lightroom-4.hdr",
    },
    VIDEOS: [
        {
            id: 1,
            name: "Workout",
            path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Trainer.mp4",
            description: "First Display",
        },
        {
            id: 2,
            name: "Landscape video",
            path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Landscape.mp4",
            description: "Second Display",
        },
        {
            id: 3,
            name: "Gaming",
            path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Gaming.mp4",
            description: "Third Display",
        },
    ],
    SCREEN: {
        MESH_NAME: "Screen",
        MATERIAL_NAME: "screen",
    },
    RENDERER: {
        MAX_PIXEL_RATIO: 2,
        TONE_MAPPING_EXPOSURE: 0.8,
    },
    BACKGROUND: {
        MODE: "image",
        COLOR: 0x000000,
        IMAGE: {
            PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/bg.png",
            FIT: "cover",
        },
    },
    CAMERA: {
        mobile: {
            fov: 50,
            position: { x: 0, y: 0, z: 8 },
        },
        tablet: {
            fov: 50,
            position: { x: 0, y: 0, z: 7 },
        },
        desktop: {
            fov: 1000,
            position: { x: 1, y: 0, z: 5 },
        },
    },
    ANIMATION_COMPLETE_THRESHOLD: 100,
    ANIMATION: {
        LERP_FACTOR: 0.02,
        SCRUB: 2.5,
        SCROLL_MULTIPLIER: 12,
        USE_EASING: true,
    },
    SHADOW: {
        ENABLED: true,
        MAP_SIZE: 2048,
        BIAS: -0.0001,
        NORMAL_BIAS: 0.02,
        RADIUS: 4,
        mobile: {
            OPACITY: 0.3,
            PLANE_SIZE: 5,
            LIGHT_HEIGHT: 3,
            CAMERA_BOUNDS: 2,
        },
        tablet: {
            OPACITY: 0.25,
            PLANE_SIZE: 10,
            LIGHT_HEIGHT: 10,
            CAMERA_BOUNDS: 5,
        },
        desktop: {
            OPACITY: 0.2,
            PLANE_SIZE: 50,
            LIGHT_HEIGHT: 35,
            CAMERA_BOUNDS: 10,
        },
    },
    LIGHT: {
        DIRECTIONAL: {
            COLOR: 0xffffff,
            INTENSITY: 1.5,
        },
        AMBIENT: {
            COLOR: 0xffffff,
            INTENSITY: 0.3,
        },
    },
    OPTIMIZATION: {
        MAX_TEXTURE_SIZE: {
            mobile: 512,
            tablet: 1024,
            desktop: 2048,
        },
        SHADOW_MAP_SIZE: {
            mobile: 2048,
            tablet: 1024,
            desktop: 2048,
        },
        PIXEL_RATIO: {
            mobile: 1.5,
            tablet: 1.5,
            desktop: 2,
        },
    },
};

/* ==================== TYPES ==================== */
type DeviceType = "mobile" | "tablet" | "desktop";

interface TextureImage {
    width?: number;
    height?: number;
    videoWidth?: number;
    videoHeight?: number;
}

/* ==================== DEVICE DETECTION ==================== */
const getDeviceType = (): DeviceType => {
    if (typeof window === "undefined") return "desktop";
    if (window.innerWidth <= 767) return "mobile";
    if (window.innerWidth <= 1023) return "tablet";
    return "desktop";
};

const getDeviceInfo = () => {
    if (typeof window === "undefined") {
        return { deviceType: "desktop" as DeviceType, isIOS: false, isMobile: false };
    }
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return { deviceType: getDeviceType(), isIOS, isMobile };
};

const getShadowConfig = (deviceType: DeviceType) => {
    return CONFIG.SHADOW[deviceType];
};

const spotlight = new THREE.SpotLight(0x000000,1);


/* ==================== HELPERS ==================== */
const lerp = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
};

const centerModel = (model: THREE.Group, deviceType: DeviceType) => {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const devicePosition = deviceType === "mobile"
        ? CONFIG.MODEL.MOBILE_POSITION
        : deviceType === "tablet"
            ? CONFIG.MODEL.TABLET_POSITION
            : CONFIG.MODEL.DESKTOP_POSITION;

    model.position.x = devicePosition.x - center.x;
    model.position.z = devicePosition.z - center.z;
    model.position.y = devicePosition.y - size.y / 1.45;

    return { size, box };
};

/* ==================== TEXTURE OPTIMIZATION ==================== */
const optimizeTexture = (texture: THREE.Texture, maxSize: number): THREE.Texture => {
    if (!texture.image) return texture;

    const image = texture.image as TextureImage;
    const width = image.width || image.videoWidth || 0;
    const height = image.height || image.videoHeight || 0;

    if (width <= maxSize && height <= maxSize) return texture;
    if (width === 0 || height === 0) return texture;

    // Calculate new dimensions
    const aspect = width / height;
    let newWidth = maxSize;
    let newHeight = maxSize;

    if (aspect > 1) {
        newHeight = Math.round(maxSize / aspect);
    } else {
        newWidth = Math.round(maxSize * aspect);
    }

    // Create canvas to resize
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx && texture.image instanceof HTMLImageElement) {
        ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
        texture.image = canvas;
        texture.needsUpdate = true;
        console.log(`Texture resized: ${width}x${height} → ${newWidth}x${newHeight}`);
    }

    return texture;
};

/* ==================== MODEL OPTIMIZATION ==================== */
const optimizeModel = (model: THREE.Group, deviceType: DeviceType) => {
    const maxTextureSize = CONFIG.OPTIMIZATION.MAX_TEXTURE_SIZE[deviceType];
    let textureCount = 0;
    let meshCount = 0;
    let vertexCount = 0;

    model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            meshCount++;

            // Count vertices
            if (mesh.geometry) {
                const position = mesh.geometry.getAttribute('position');
                if (position) vertexCount += position.count;
            }

            // Optimize materials and textures
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            materials.forEach((material) => {
                if (material instanceof THREE.MeshStandardMaterial || 
                    material instanceof THREE.MeshPhysicalMaterial) {
                    
                    // Optimize textures
                    const textureProps: (keyof THREE.MeshStandardMaterial)[] = [
                        'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'
                    ];
                    
                    textureProps.forEach((prop) => {
                        const texture = material[prop] as THREE.Texture | null;
                        if (texture) {
                            optimizeTexture(texture, maxTextureSize);
                            textureCount++;
                            
                            // Set optimal texture settings
                            texture.generateMipmaps = deviceType !== 'mobile';
                            texture.minFilter = deviceType === 'mobile' ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            
                            // Anisotropic filtering
                            if (deviceType === 'mobile') {
                                texture.anisotropy = 1;
                            } else if (deviceType === 'tablet') {
                                texture.anisotropy = 4;
                            } else {
                                texture.anisotropy = 8;
                            }
                        }
                    });

                    // Simplify material for mobile
                    if (deviceType === 'mobile') {
                        material.envMapIntensity = 0.5;
                    }
                }
            });

            // Optimize geometry
            if (mesh.geometry) {
                mesh.geometry.computeBoundingSphere();
                mesh.geometry.computeBoundingBox();
                
                // Remove unnecessary attributes on mobile
                if (deviceType === 'mobile') {
                    const geo = mesh.geometry;
                    if (geo.getAttribute('uv2')) {
                        geo.deleteAttribute('uv2');
                    }
                }
            }

            // Enable frustum culling
            mesh.frustumCulled = true;
        }
    });

    console.log(`✅ Model optimized for ${deviceType}:`);
    console.log(`   - Meshes: ${meshCount}`);
    console.log(`   - Vertices: ${vertexCount.toLocaleString()}`);
    console.log(`   - Textures: ${textureCount} (max: ${maxTextureSize}px)`);
};

/* ==================== DISPOSE HELPERS ==================== */
const disposeTexture = (texture: THREE.Texture | null) => {
    if (texture) {
        texture.dispose();
    }
};

const disposeMaterial = (material: THREE.Material) => {
    if (material instanceof THREE.MeshStandardMaterial || 
        material instanceof THREE.MeshPhysicalMaterial) {
        disposeTexture(material.map);
        disposeTexture(material.normalMap);
        disposeTexture(material.roughnessMap);
        disposeTexture(material.metalnessMap);
        disposeTexture(material.aoMap);
        disposeTexture(material.emissiveMap);
    }
    material.dispose();
};

const disposeModel = (model: THREE.Group) => {
    model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(disposeMaterial);
            } else if (mesh.material) {
                disposeMaterial(mesh.material);
            }
        }
    });
};

/* ==================== CREATE IMAGE BACKGROUND ==================== */
const createImageBackground = (scene: THREE.Scene, imagePath: string, fitMode: string = "cover") => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    textureLoader.load(
        imagePath,
        (texture) => {
            const imageAspect = texture.image.width / texture.image.height;
            const windowAspect = window.innerWidth / window.innerHeight;

            if (fitMode === "cover") {
                if (windowAspect > imageAspect) {
                    texture.repeat.set(1, imageAspect / windowAspect);
                    texture.offset.set(0, (1 - imageAspect / windowAspect) / 2);
                } else {
                    texture.repeat.set(windowAspect / imageAspect, 1);
                    texture.offset.set((1 - windowAspect / imageAspect) / 2, 0);
                }
            }

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            scene.background = texture;
        },
        undefined,
        (error) => {
            console.error("Failed to load background image:", error);
            scene.background = new THREE.Color(0x1a1a2e);
        }
    );
};

/* ==================== CREATE VIDEO TEXTURE ==================== */
const createVideoTexture = (videoPath: string): { video: HTMLVideoElement; texture: THREE.VideoTexture } | null => {
    try {
        const video = document.createElement("video");
        video.src = videoPath;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = false;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        texture.flipY = false;
        texture.needsUpdate = true;
        return { video, texture };
    } catch (err) {
        console.error("Failed to create video texture:", err);
        return null;
    }
};

/* ==================== SHADOW FUNCTIONS ==================== */
const createShadowPlane = (
    scene: THREE.Scene,
    yPosition: number,
    deviceType: DeviceType
): THREE.Mesh => {
    const shadowConfig = getShadowConfig(deviceType);
    const geometry = new THREE.PlaneGeometry(shadowConfig.PLANE_SIZE, shadowConfig.PLANE_SIZE);
    
    const material = new THREE.ShadowMaterial({
        opacity: shadowConfig.OPACITY,
        transparent: true,
        depthWrite: false,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = yPosition;
    plane.receiveShadow = true;
    plane.name = 'shadowPlane';
    plane.renderOrder = -1;

    scene.add(plane);
    return plane;
};

const updateShadowPlane = (
    shadowPlane: THREE.Mesh | null,
    model: THREE.Group | null,
    deviceType: DeviceType
) => {
    if (!shadowPlane || !model) return;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const shadowConfig = getShadowConfig(deviceType);

    shadowPlane.position.x = center.x;
    shadowPlane.position.z = center.z;
    shadowPlane.position.y = box.min.y - 0.001;

    const geometry = new THREE.PlaneGeometry(shadowConfig.PLANE_SIZE, shadowConfig.PLANE_SIZE);
    shadowPlane.geometry.dispose();
    shadowPlane.geometry = geometry;
    (shadowPlane.material as THREE.ShadowMaterial).opacity = shadowConfig.OPACITY;
};

const createShadowLights = (scene: THREE.Scene, deviceType: DeviceType): THREE.DirectionalLight => {
    const shadowConfig = getShadowConfig(deviceType);
    const shadowMapSize = CONFIG.OPTIMIZATION.SHADOW_MAP_SIZE[deviceType];
    
    const directionalLight = new THREE.DirectionalLight(
        CONFIG.LIGHT.DIRECTIONAL.COLOR,
        CONFIG.LIGHT.DIRECTIONAL.INTENSITY
    );
    
    directionalLight.position.set(
        shadowConfig.CAMERA_BOUNDS * 0.5,
        shadowConfig.LIGHT_HEIGHT,
        shadowConfig.CAMERA_BOUNDS * 0.5
    );
    
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = shadowMapSize;
    directionalLight.shadow.mapSize.height = shadowMapSize;
    directionalLight.shadow.camera.left = -shadowConfig.CAMERA_BOUNDS;
    directionalLight.shadow.camera.right = shadowConfig.CAMERA_BOUNDS;
    directionalLight.shadow.camera.top = shadowConfig.CAMERA_BOUNDS;
    directionalLight.shadow.camera.bottom = -shadowConfig.CAMERA_BOUNDS;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = shadowConfig.LIGHT_HEIGHT * 2;
    directionalLight.shadow.bias = CONFIG.SHADOW.BIAS;
    directionalLight.shadow.normalBias = CONFIG.SHADOW.NORMAL_BIAS;
    directionalLight.shadow.radius = CONFIG.SHADOW.RADIUS;

    scene.add(directionalLight);
    scene.add(directionalLight.target);
    
    const ambientLight = new THREE.AmbientLight(
        CONFIG.LIGHT.AMBIENT.COLOR,
        CONFIG.LIGHT.AMBIENT.INTENSITY
    );
    scene.add(ambientLight);
    
    return directionalLight;
};

const updateLightForDevice = (
    light: THREE.DirectionalLight | null,
    model: THREE.Group | null,
    deviceType: DeviceType
) => {
    if (!light || !model) return;
         
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const shadowConfig = getShadowConfig(deviceType);
    const shadowMapSize = CONFIG.OPTIMIZATION.SHADOW_MAP_SIZE[deviceType];

    light.position.set(
        center.x + shadowConfig.CAMERA_BOUNDS * 0.5,
        center.y + shadowConfig.LIGHT_HEIGHT,
        center.z + shadowConfig.CAMERA_BOUNDS * 0.5
    );

    light.target.position.set(center.x, center.y, center.z);
    light.target.updateMatrixWorld();

    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    light.shadow.camera.left = -shadowConfig.CAMERA_BOUNDS;
    light.shadow.camera.right = shadowConfig.CAMERA_BOUNDS;
    light.shadow.camera.top = shadowConfig.CAMERA_BOUNDS;
    light.shadow.camera.bottom = -shadowConfig.CAMERA_BOUNDS;
    light.shadow.camera.far = shadowConfig.LIGHT_HEIGHT * 2;
    light.shadow.camera.updateProjectionMatrix();
};

/* ==================== COMPONENT ==================== */
export default function Scroll3DCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionRef = useRef<THREE.AnimationAction | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const currentDeviceTypeRef = useRef<DeviceType>("desktop");
    const originalCameraPositionRef = useRef<THREE.Vector3 | null>(null);
    const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
    const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
    const videosRef = useRef<{ video: HTMLVideoElement; texture: THREE.VideoTexture }[]>([]);
    const screenMeshRef = useRef<THREE.Mesh | null>(null);
    const targetFrame = useRef(0);
    const currentFrame = useRef(0);
    const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
    const isInitializedRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showButtons, setShowButtons] = useState(false);
    const [activeVideo, setActiveVideo] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const initScene = useCallback(() => {
        const scene = new THREE.Scene();

        if (CONFIG.BACKGROUND.MODE === "image") {
            createImageBackground(scene, CONFIG.BACKGROUND.IMAGE.PATH, CONFIG.BACKGROUND.IMAGE.FIT);
        } else {
            scene.background = new THREE.Color(CONFIG.BACKGROUND.COLOR);
        }

        if (CONFIG.SHADOW.ENABLED) {
            const deviceType = getDeviceType();
            const directionalLight = createShadowLights(scene, deviceType);
            directionalLightRef.current = directionalLight;
        }

        sceneRef.current = scene;
    }, []);

    const initRenderer = useCallback(() => {
        if (!canvasRef.current) return false;

        const { isIOS, deviceType } = getDeviceInfo();
        const pixelRatio = Math.min(
            window.devicePixelRatio, 
            CONFIG.OPTIMIZATION.PIXEL_RATIO[deviceType]
        );

        try {
            const renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: deviceType === 'desktop',
                alpha: false,
                powerPreference: isIOS ? "low-power" : "high-performance",
                preserveDrawingBuffer: isIOS,
                failIfMajorPerformanceCaveat: false,
            });

            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
            
            if (CONFIG.SHADOW.ENABLED) {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }

            rendererRef.current = renderer;
            console.log(`✅ Renderer initialized (${deviceType}, pixelRatio: ${pixelRatio})`);
            return true;
        } catch (err) {
            console.error("Failed to initialize renderer:", err);
            setError("Failed to initialize 3D renderer");
            return false;
        }
    }, []);

    const loadEnvironment = useCallback(() => {
        if (!sceneRef.current || !rendererRef.current) return;

        const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
        pmremGenerator.compileEquirectangularShader();

        const rgbeLoader = new RGBELoader();
        rgbeLoader.setCrossOrigin("anonymous");

        rgbeLoader.load(
            CONFIG.HDR.PATH,
            (hdr) => {
                const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
                sceneRef.current!.environment = envMap;
                if (CONFIG.BACKGROUND.MODE === "hdr") {
                    sceneRef.current!.background = envMap;
                }
                hdr.dispose();
                pmremGenerator.dispose();
            },
            undefined,
            (error) => {
                console.warn("HDR loading failed (non-critical):", error);
            }
        );
    }, []);

    const setupVideos = useCallback((model: THREE.Group) => {
        const videoTextures: { video: HTMLVideoElement; texture: THREE.VideoTexture }[] = [];
        
        CONFIG.VIDEOS.forEach((videoConfig) => {
            const videoData = createVideoTexture(videoConfig.path);
            if (videoData) videoTextures.push(videoData);
        });
        videosRef.current = videoTextures;

        let screenFound = false;
        model.traverse((child) => {
            if (!screenFound && (child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
                ((child as THREE.Mesh).material as THREE.Material & { name?: string })?.name?.toLowerCase().includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase()))) {
                if ((child as THREE.Mesh).isMesh) {
                    screenMeshRef.current = child as THREE.Mesh;
                    screenFound = true;
                }
            }
        });

        if (screenFound && videoTextures.length > 0) {
            applyVideoToScreen(1);
        }
    }, []);

    const applyVideoToScreen = useCallback((videoIndex: number) => {
        const videoData = videosRef.current[videoIndex - 1];
        const screenMesh = screenMeshRef.current;
        if (!videoData || !screenMesh) return;

        videosRef.current.forEach((v, idx) => {
            if (idx !== videoIndex - 1) {
                v.video.pause();
                v.video.currentTime = 0;
            }
        });

        const videoMaterial = new THREE.MeshStandardMaterial({
            map: videoData.texture,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: videoData.texture,
            emissiveIntensity: 1.0,
            roughness: 0.5,
            metalness: 0.0,
        });

        screenMesh.material = videoMaterial;
        screenMesh.castShadow = false;
        screenMesh.receiveShadow = false;
        
        videoData.video.play().catch(() => {});
    }, []);

    const switchVideo = (videoIndex: number) => {
        setActiveVideo(videoIndex);
        applyVideoToScreen(videoIndex);
    };

    const createFallbackCamera = useCallback(() => {
        const deviceType = getDeviceType();
        const cameraConfig = CONFIG.CAMERA[deviceType];
        const cam = new THREE.PerspectiveCamera(
            cameraConfig.fov, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        cam.position.set(cameraConfig.position.x, cameraConfig.position.y, cameraConfig.position.z);
        cam.lookAt(0, 0, 0);
        return cam;
    }, []);

    const loadModel = useCallback(() => {
        if (!sceneRef.current || !rendererRef.current) {
            setError("Scene not initialized");
            return;
        }

        const deviceType = getDeviceType();
        console.log(`📦 Loading model for ${deviceType}...`);

        const loader = new GLTFLoader();
        
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            CONFIG.MODEL.PATH,
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                optimizeModel(model, deviceType);

                if (gltf.cameras && gltf.cameras.length > 0) {
                    const glbCamera = gltf.cameras[0];
                    if (glbCamera instanceof THREE.PerspectiveCamera) {
                        currentDeviceTypeRef.current = deviceType;
                        originalCameraPositionRef.current = glbCamera.position.clone();

                        let targetFOV = glbCamera.fov;
                        if (deviceType === "mobile") targetFOV = 70;
                        else if (deviceType === "tablet") targetFOV = 50;
                        else targetFOV = Math.min(glbCamera.fov, 75);

                        glbCamera.fov = targetFOV;
                        glbCamera.aspect = window.innerWidth / window.innerHeight;
                        glbCamera.near = 0.1;
                        glbCamera.far = 1000;

                        let zoomMultiplier = 1.0;
                        if (deviceType === "mobile") zoomMultiplier = 2.0;
                        else if (deviceType === "tablet") zoomMultiplier = 1.5;
                        glbCamera.position.z = originalCameraPositionRef.current.z * zoomMultiplier;
                        glbCamera.updateProjectionMatrix();
                        cameraRef.current = glbCamera;
                    } else {
                        cameraRef.current = createFallbackCamera();
                    }
                } else {
                    cameraRef.current = createFallbackCamera();
                }

                currentDeviceTypeRef.current = deviceType;

                model.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        const isVideoScreen = child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
                            ((mesh.material as THREE.Material & { name?: string })?.name?.toLowerCase().includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase()));

                        if (isVideoScreen) {
                            screenMeshRef.current = mesh;
                            mesh.castShadow = false;
                            mesh.receiveShadow = false;
                        } else {
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                        }
                    }
                });

                const targetScale = CONFIG.MODEL.SCALE[deviceType];
                model.scale.set(targetScale, targetScale, targetScale);

                const { box } = centerModel(model, deviceType);

                if (CONFIG.SHADOW.ENABLED && sceneRef.current) {
                    const shadowPlane = createShadowPlane(sceneRef.current, box.min.y - 0.001, deviceType);
                    shadowPlaneRef.current = shadowPlane;
                    updateShadowPlane(shadowPlane, model, deviceType);
                    updateLightForDevice(directionalLightRef.current, model, deviceType);
                }

                sceneRef.current!.add(model);
                setupVideos(model);

                if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                    action.paused = true;
                    mixerRef.current = mixer;
                    actionRef.current = action;
                }

                dracoLoader.dispose();

                setLoading(false);
                console.log(`✅ Model loaded and optimized for ${deviceType}`);
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    setLoadingProgress(percent);
                }
            },
            (error) => {
                console.error("Error loading model:", error);
                setError("Failed to load 3D model");
                setLoading(false);
            }
        );
    }, [setupVideos, createFallbackCamera]);

    const updateModelScaleAndPosition = useCallback(() => {
        if (!modelRef.current) return;

        const deviceType = getDeviceType();
        currentDeviceTypeRef.current = deviceType;

        const targetScale = CONFIG.MODEL.SCALE[deviceType];
        modelRef.current.scale.set(targetScale, targetScale, targetScale);

        centerModel(modelRef.current, deviceType);
        updateShadowPlane(shadowPlaneRef.current, modelRef.current, deviceType);
        updateLightForDevice(directionalLightRef.current, modelRef.current, deviceType);

        if (cameraRef.current && originalCameraPositionRef.current) {
            let zoomMultiplier = 1.0;
            if (deviceType === "mobile") zoomMultiplier = 5.0;
            else if (deviceType === "tablet") zoomMultiplier = 3.0;
            cameraRef.current.position.z = originalCameraPositionRef.current.z * zoomMultiplier;
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
        }
    }, []);

    useEffect(() => {
        if (loading) return;

        if (scrollTriggerRef.current) scrollTriggerRef.current.kill();

        scrollTriggerRef.current = ScrollTrigger.create({
            trigger: document.body,
            start: "top top",
            end: `+=${window.innerHeight * CONFIG.ANIMATION.SCROLL_MULTIPLIER}`,
            scrub: CONFIG.ANIMATION.SCRUB,
            onUpdate: (self) => {
                targetFrame.current = self.progress * CONFIG.TOTAL_FRAMES;
                const scrollPercent = self.progress * 100;
                if (scrollPercent >= CONFIG.ANIMATION_COMPLETE_THRESHOLD && !showButtons) {
                    setShowButtons(true);
                } else if (scrollPercent < CONFIG.ANIMATION_COMPLETE_THRESHOLD && showButtons) {
                    setShowButtons(false);
                }
            },
        });

        return () => {
            if (scrollTriggerRef.current) scrollTriggerRef.current.kill();
        };
    }, [loading, showButtons]);

    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

            currentFrame.current = lerp(currentFrame.current, targetFrame.current, CONFIG.ANIMATION.LERP_FACTOR);

            if (mixerRef.current && actionRef.current) {
                const clip = actionRef.current.getClip();
                actionRef.current.time = (currentFrame.current / CONFIG.TOTAL_FRAMES) * clip.duration;
                mixerRef.current.update(0);
            }

            const activeVideoData = videosRef.current[activeVideo - 1];
            if (activeVideoData) {
                activeVideoData.texture.needsUpdate = true;
            }

            if (modelRef.current && shadowPlaneRef.current && directionalLightRef.current) {
                const box = new THREE.Box3().setFromObject(modelRef.current);
                const center = box.getCenter(new THREE.Vector3());
                const deviceType = currentDeviceTypeRef.current;
                const shadowConfig = getShadowConfig(deviceType);
                
                shadowPlaneRef.current.position.x = lerp(shadowPlaneRef.current.position.x, center.x, 0.1);
                shadowPlaneRef.current.position.z = lerp(shadowPlaneRef.current.position.z, center.z, 0.1);
                shadowPlaneRef.current.position.y = box.min.y - 0.001;
                
                directionalLightRef.current.position.x = lerp(
                    directionalLightRef.current.position.x,
                    center.x + shadowConfig.CAMERA_BOUNDS * 0.5,
                    0.1
                );
                directionalLightRef.current.position.z = lerp(
                    directionalLightRef.current.position.z,
                    center.z + shadowConfig.CAMERA_BOUNDS * 0.5,
                    0.1
                );
                
                directionalLightRef.current.target.position.set(center.x, center.y, center.z);
                directionalLightRef.current.target.updateMatrixWorld();
            }

            rendererRef.current.render(sceneRef.current, cameraRef.current);
        };

        animate();
        
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [activeVideo]);

    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        initScene();
        if (!initRenderer()) return;
        loadEnvironment();
        loadModel();

        const onResize = () => {
            if (!rendererRef.current || !cameraRef.current) return;

            const newDeviceType = getDeviceType();
            const deviceChanged = currentDeviceTypeRef.current !== newDeviceType;

            if (deviceChanged) {
                currentDeviceTypeRef.current = newDeviceType;
                if (cameraRef.current instanceof THREE.PerspectiveCamera) {
                    let targetFOV = 75;
                    if (newDeviceType === "mobile") targetFOV = 20;
                    else if (newDeviceType === "tablet") targetFOV = 30;
                    cameraRef.current.fov = targetFOV;
                }
                
                if (modelRef.current) {
                    updateShadowPlane(shadowPlaneRef.current, modelRef.current, newDeviceType);
                    updateLightForDevice(directionalLightRef.current, modelRef.current, newDeviceType);
                }
            }

            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);

            const pixelRatio = Math.min(
                window.devicePixelRatio, 
                CONFIG.OPTIMIZATION.PIXEL_RATIO[newDeviceType]
            );
            rendererRef.current.setPixelRatio(pixelRatio);

            if (deviceChanged) {
                updateModelScaleAndPosition();
                ScrollTrigger.refresh();
            }

            if (CONFIG.BACKGROUND.MODE === "image" && sceneRef.current) {
                createImageBackground(sceneRef.current, CONFIG.BACKGROUND.IMAGE.PATH, CONFIG.BACKGROUND.IMAGE.FIT);
            }
        };

        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            videosRef.current.forEach((v) => {
                v.video.pause();
                v.video.src = "";
            });
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            
            if (modelRef.current) {
                disposeModel(modelRef.current);
            }
            
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [initScene, initRenderer, loadEnvironment, loadModel, updateModelScaleAndPosition]);

    return (
        <div className="relative h-[1150vh]">
            <div className="fixed inset-0 w-full h-full">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {loading && !error && (
                <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/90">
                    <div className="text-white text-xl mb-4">Loading 3D Model...</div>
                    <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                    <div className="text-gray-400 text-sm mt-2">{loadingProgress}%</div>
                </div>
            )}

            {error && (
                <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/90 p-4">
                    <div className="text-red-500 text-xl max-w-md text-center mb-4">❌ {error}</div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {showButtons && !loading && !error && (
                <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
                    <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
                        <div className="bg-black/90 backdrop-blur-lg rounded-xl md:rounded-2xl p-2 md:p-3 shadow-2xl border border-purple-500/30 w-full md:w-auto">
                            <div className="flex justify-center items-stretch md:items-center gap-2 md:gap-3">
                                {CONFIG.VIDEOS.map((video) => (
                                    <button
                                        key={video.id}
                                        onClick={() => switchVideo(video.id)}
                                        className={`px-2 py-1 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-300 transform active:scale-95 ${
                                            activeVideo === video.id
                                                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/50 scale-105'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <span className="whitespace-nowrap">{video.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}