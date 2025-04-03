import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import componentInfo from './componentInfo.json';
import './style.css';


let mixer;
const actions = {};
const clock = new THREE.Clock();
let model; // to store loaded scene

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);


let targetPart; // We'll set this to the mesh we want to recolor

// Load GLB model
const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  model = gltf.scene;
  scene.add(model);

  mixer = new THREE.AnimationMixer(model);

  gltf.animations.forEach((clip) => {
    actions[clip.name] = mixer.clipAction(clip);
  });


  // Find the part you want to change color
  targetPart = model.getObjectByName('LeftWing') || model.children[0]; // change this name to match your part

  document.querySelectorAll('#color-controls button').forEach(button => {
    button.addEventListener('click', () => {
      const color = button.getAttribute('data-color');
      if (targetPart && targetPart.material) {
        targetPart.material.color.set(color);
      }
    });
});
}, undefined, console.error);



// Raycasting
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  if (!model) return;
  const intersects = raycaster.intersectObjects(model.children, true);

  if (intersects.length > 0) {
    const clickedPart = intersects[0].object.name;
    console.log('Clicked:', clickedPart);

    // Match part name to animation
    if (clickedPart.includes('DrawerLeft') && actions['LeftDrawerOpen']) {
        toggleAnimation('LeftDrawerOpen');
    }

    if (clickedPart.includes('MiddleWing') && actions['MiddleOpen']) {
        toggleAnimation('MiddleOpen');
    }
    
  }
});

const tooltip = document.getElementById('tooltip');
window.addEventListener('mousemove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(pointer, camera);
    if (!model) return;
    const intersects = raycaster.intersectObjects(model.children, true);
  
    if (intersects.length > 0) {
        const part = intersects[0].object.name;
        const info = componentInfo[part];
      
        if (info) {
          tooltip.innerHTML = `
            <strong>${info.label}</strong><br>
            Material: ${info.material}<br>
            ${info.description}
          `;
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
          tooltip.style.display = 'block';
        }
      }
});


const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

const animationStates = {
    LeftDrawerOpen: false, // false = closed
    MiddleOpen: false,
  };
  
function toggleAnimation(name) {
    const action = actions[name];
    if (!action) return;
  
    // Reverse direction if it's already open
    if (animationStates[name]) {
      // Play in reverse
      action.paused = false;
      action.timeScale = -1;
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
  
      // Start from end of animation
      action.time = action.getClip().duration;
      action.reset().play();
  
      animationStates[name] = false;
    } else {
      // Play forward
      action.reset();
      action.timeScale = 1;
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
  
      animationStates[name] = true;
    }
  }
  

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer?.update(delta);
  renderer.render(scene, camera);
}

animate();