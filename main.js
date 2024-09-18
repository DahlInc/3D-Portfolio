// Import Three.js core
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// Import loaders and controls
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Import post-processing passes
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/UnrealBloomPass.js';

// Import audio and animation libraries
import { AudioListener, AudioLoader, Audio } from 'https://cdn.skypack.dev/three@0.132.2';
import { gsap } from 'https://cdn.skypack.dev/gsap';

// Create the scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(10, 10, 10); // Move the camera up and farther back
camera.rotation.x = -Math.PI / 6; // Rotate downwards (30 degrees)

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Tone mapping and gamma correction
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = true;
controls.mouseButtons = { LEFT: THREE.MOUSE.LEFT };
controls.minDistance = 0.5;
controls.maxDistance = 4.5;

// Enforce spherical bounds
function enforceSphericalBounds() {
    const cameraDistance = camera.position.length();
    if (cameraDistance < controls.minDistance) {
        camera.position.setLength(controls.minDistance);
    } else if (cameraDistance > controls.maxDistance) {
        camera.position.setLength(controls.maxDistance);
    }
}

// Bloom effect parameters
const params = {
    exposure: 0.0,
    bloomStrength: 0.9,
    bloomThreshold: 0,
    bloomRadius: 0.5
};

// Set up the bloom composer
const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.bloomStrength,
    params.bloomRadius,
    params.bloomThreshold
);
composer.addPass(bloomPass);

// Ambient lighting and point light
const ambientLight = new THREE.AmbientLight(0xffcc99, 0.20);
scene.add(ambientLight);
const lampLight = new THREE.PointLight(0xffffff, 0.3, 50);
lampLight.position.set(0, 5, 0);
lampLight.castShadow = true;
scene.add(lampLight);

// Add a directional light for better material shading
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

let rotatingObject = null; // For Akata object
let rotatingObject2 = null; // For akatas object
let rotatingObject3 = null; // For akatas1 object

// Create a Loading Manager
const loadingManager = new THREE.LoadingManager();

// Track progress
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    document.getElementById('loading-percentage').innerText = `${progress}%`;
};

// When all assets are loaded
loadingManager.onLoad = function () {
    document.getElementById('loading-text').style.display = 'none';
    document.getElementById('start-button').style.display = 'block';
};

// Set up GLTFLoader with LoadingManager
const loader = new GLTFLoader(loadingManager);
loader.load(
    './assets/ramenx.glb',
    function (gltf) {
        scene.add(gltf.scene);
        
        // Akata fan
        rotatingObject = gltf.scene.getObjectByName('Akata'); 
        if (rotatingObject) {
            rotatingObject.layers.enable(1); // Assign to bloom layer (layer 1)
            rotatingObject.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: child.material.color });
                }
            });
        }
        
        // Additional fans
        rotatingObject2 = gltf.scene.getObjectByName('akatas');
        rotatingObject3 = gltf.scene.getObjectByName('akatas1');

        // Ensure the new fans are also processed similarly
        [rotatingObject2, rotatingObject3].forEach(obj => {
            if (obj) {
                obj.layers.enable(1);
                obj.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({ color: child.material.color });
                    }
                });
            }
        });
    },
    undefined,
    function (error) {
        console.error('Error loading the GLB model:', error);
    }
);

// Event listener to start the experience when the start button is clicked
document.getElementById('start-button').addEventListener('click', function () {
    document.getElementById('loading-screen').style.display = 'none'; // Hide loading screen
    animate(); // Start the 3D scene
});

// Floating screen with PNG frames (Vending Machine)
const frames = [
    './assets/frame1.png',
    './assets/frame2.png',
    './assets/frame3.png',
    './assets/frame4.png',
    './assets/frame5.png'
];
let frame = 0;
const textureLoaderFrames = new THREE.TextureLoader();
const floatingScreenMaterial = new THREE.MeshBasicMaterial({ 
    map: textureLoaderFrames.load(frames[frame], undefined, undefined, (error) => {
        console.error('Error loading texture:', error);
    })
});
const floatingGeometry = new THREE.PlaneGeometry(2, 2);
const floatingScreen = new THREE.Mesh(floatingGeometry, floatingScreenMaterial);
floatingScreen.position.set(-1.15, 0.9, 1.64);
floatingScreen.scale.set(0.23, 0.3, 0.4);
scene.add(floatingScreen);

// Function to start frame cycling
let intervalId = null;
function startFrameCycle() {
    intervalId = setInterval(() => {
        frame = (frame + 1) % frames.length;
        textureLoaderFrames.load(
            frames[frame],
            function (newTexture) {
                floatingScreenMaterial.map = newTexture;
                floatingScreenMaterial.map.needsUpdate = true;
            },
            undefined,
            function (error) {
                console.error('Error loading texture:', error);
            }
        );
    }, 1000);
}

// Function to stop frame cycling
function stopFrameCycle() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// Start initial frame cycling
startFrameCycle();

// Project PNG placeholders as 3D thin slate squares (Project Buttons)
const projectFiles = [
    './assets/project1.png',
    './assets/project2.png',
    './assets/project3.png',
    './assets/project4.png'
];

// Function to create a thin 3D box with a texture on the front face
function createProjectPlaceholder(
    texturePath,
    x,
    y,
    z,
    width = 0.4,  // Reduced width for smaller size
    height = 0.4, // Reduced height for smaller size
    depth = 0.05
) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath, undefined, undefined, (error) => {
        console.error('Error loading texture:', error);
    });

    // Create materials for each face of the box
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x000000 }), // Right side
        new THREE.MeshStandardMaterial({ color: 0x000000 }), // Left side
        new THREE.MeshStandardMaterial({ color: 0x000000 }), // Top side
        new THREE.MeshStandardMaterial({ color: 0x000000 }), // Bottom side
        new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true
        }), // Front side (with texture)
        new THREE.MeshStandardMaterial({ color: 0x000000 })  // Back side
    ];

    // Create a box geometry with specified width, height, and depth
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const box = new THREE.Mesh(boxGeometry, materials);

    box.position.set(x, y, z);
    box.visible = false; // Initially hidden
    scene.add(box);

    return box;
}

// Define the size of the PNGs (already adjusted to 0.4)
const pngWidth = 0.4;  // Reduced width
const pngHeight = 0.4; // Reduced height
const pngDepth = 0.05; // Thin depth for the slate

// Calculate offsets for positioning the projects in a 2x2 grid
const offsetX = 0.2; // Reduced horizontal offset for closer placement
const offsetY = 0.2; // Reduced vertical offset for closer placement

// Floating screen position
const floatingScreenPosition = floatingScreen.position.clone(); // (-1.15, 0.9, 1.64)

// Create project placeholders as 3D boxes with adjusted positions and sizes
const project1 = createProjectPlaceholder(
    projectFiles[0],
    floatingScreenPosition.x - offsetX, // Left
    floatingScreenPosition.y + offsetY, // Top
    floatingScreenPosition.z + 0.01,     // Near
    pngWidth,                           // Adjusted width
    pngHeight,                          // Adjusted height
    pngDepth
);
const project2 = createProjectPlaceholder(
    projectFiles[1],
    floatingScreenPosition.x + offsetX, // Right
    floatingScreenPosition.y + offsetY, // Top
    floatingScreenPosition.z + 0.01,     // Near
    pngWidth,
    pngHeight,
    pngDepth
);
const project3 = createProjectPlaceholder(
    projectFiles[2],
    floatingScreenPosition.x - offsetX, // Left
    floatingScreenPosition.y - offsetY, // Bottom
    floatingScreenPosition.z + 0.01,     // Near
    pngWidth,
    pngHeight,
    pngDepth
);

const project4 = createProjectPlaceholder(
    projectFiles[3],
    floatingScreenPosition.x + offsetX, // Right
    floatingScreenPosition.y - offsetY, // Bottom
    floatingScreenPosition.z + 0.01,     // Near
    pngWidth,
    pngHeight,
    pngDepth
);

// Collect all project boxes into an array for easy management
const projects = [project1, project2, project3, project4];

// Get the Learn More and Back button elements
const learnMoreButton = document.getElementById('learnMoreButton');
const backButton = document.getElementById('backButton');

// Initially hide the Learn More and Back buttons
learnMoreButton.style.display = 'none';
backButton.style.display = 'none';

// Add functionality to the Learn More button
learnMoreButton.onclick = function () {
    window.open('https://dahlinc.github.io/my-portfolio/', '_blank'); // Opens Google in a new tab
};

// Raycaster and mouse vector for interactions
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
let INTERSECTED;

// Add event listeners for click and mousemove
window.addEventListener('click', onClick, false);
window.addEventListener('mousemove', onMouseMove, false);

// Handle click events
function onClick(event) {
    // Update mouse coordinates
    mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouseVector, camera);

    // Calculate objects intersecting the picking ray
    const intersectsFloatingScreen = raycaster.intersectObject(floatingScreen);
    if (intersectsFloatingScreen.length > 0) {
        // User clicked the vending machine (floatingScreen)
        handleVendingMachineClick();
        return; // Exit early to prevent other interactions
    }

    const intersectsProjects = raycaster.intersectObjects(projects);
    if (intersectsProjects.length > 0) {
        const intersectedObject = intersectsProjects[0].object;
        handleProjectButtonClick(intersectedObject);
    }
}

// Handle mouse move events for hover effects
function onMouseMove(event) {
    // Update mouse coordinates
    mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouseVector, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(projects);

    if (intersects.length > 0) {
        if (INTERSECTED !== intersects[0].object) {
            // Reset previous intersected object
            if (INTERSECTED) {
                gsap.to(INTERSECTED.scale, {
                    duration: 0.3,
                    x: 1,
                    y: 1,
                    z: 1
                });
            }
            // Set new intersected object
            INTERSECTED = intersects[0].object;
            // Scale up the new intersected object
            gsap.to(INTERSECTED.scale, {
                duration: 0.3,
                x: 1.1,
                y: 1.1,
                z: 1.1
            });
        }
    } else {
        // Reset previous intersected object
        if (INTERSECTED) {
            gsap.to(INTERSECTED.scale, {
                duration: 0.3,
                x: 1,
                y: 1,
                z: 1
            });
        }
        INTERSECTED = null;
    }
}

// Handle clicking the vending machine (floatingScreen)
function handleVendingMachineClick() {
    // Hide the floatingScreen (frames)
    floatingScreen.visible = false;

    // Stop frame cycling
    stopFrameCycle();

    // Show the project buttons
    projects.forEach((project) => {
        project.visible = true;
    });

    // Show the Learn More and Back buttons
    learnMoreButton.style.display = 'block';
    backButton.style.display = 'block';
}

// Handle clicking on project buttons
function handleProjectButtonClick(target) {
    // Disable certain controls if needed
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = true;

    // Animate camera to focus on the target project
    gsap.to(camera.position, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: target.position.x + Math.sin(target.rotation.y) * 0.8,
        y: target.position.y + 0.3,
        z: target.position.z + Math.cos(target.rotation.y) * 0.8
    });

    gsap.to(controls.target, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: target.position.x,
        y: target.position.y,
        z: target.position.z
    });

    // Show the Learn More and Back buttons when a project is clicked
    learnMoreButton.style.display = 'block';
    backButton.style.display = 'block';
}

// Unlock camera controls, and hide the Learn More and Back buttons
function unlockCameraControls() {
    // Re-enable controls
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false; // As per initial settings

    // Animate camera back to initial position and target
    gsap.to(camera.position, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: 10,
        y: 10,
        z: 10
    });

    gsap.to(controls.target, {
        duration: 1.5,
        ease: 'power1.inOut',
        x: 0,
        y: 0,
        z: 0
    });

    // Hide the Learn More and Back buttons
    learnMoreButton.style.display = 'none';
    backButton.style.display = 'none';

    // Hide project buttons
    projects.forEach(project => {
        project.visible = false;
    });

    // Show the floatingScreen again
    floatingScreen.visible = true;

    // Restart frame cycling
    startFrameCycle();
}

// Back button event listener
backButton.onclick = function () {
    unlockCameraControls();
};

// Background audio setup
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load(
    './assets/background-music.mp3',
    function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.2);
    },
    undefined,
    function (error) {
        console.error('Error loading audio:', error);
    }
);
// Start playing audio on first user interaction
window.addEventListener('click', function () {
    if (!sound.isPlaying) {
        sound.play();
    }
}, { once: true }); // Ensure it only tries to play once

// Animate function
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate all three objects
    if (rotatingObject) {
        rotatingObject.rotation.x += -0.02;
    }
    if (rotatingObject2) {
        rotatingObject2.rotation.y += -0.02;
    }
    if (rotatingObject3) {
        rotatingObject3.rotation.y += -0.02;
    }

    controls.update();
    composer.render();
    enforceSphericalBounds();
}
animate();


// Window resize handler
window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
});
