// === Setup Scene and Camera ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // White background

const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(0, 4, 170); // Static camera

// === Setup Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 💡 Tone Mapping and Output Encoding
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;

// === Lighting ===
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// === Loaders ===
const loader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/libs/draco/');
loader.setDRACOLoader(dracoLoader);

// === Model Setup ===
const modelURLs = [
  'https://file.garden/aDkw2WzQiQyHQO4K/Four_mockup/m1n.glb',
  'https://file.garden/aDkw2WzQiQyHQO4K/Four_mockup/m2.glb',
  'https://file.garden/aDkw2WzQiQyHQO4K/Four_mockup/m3n2.glb',
  'https://file.garden/aDkw2WzQiQyHQO4K/Four_mockup/m4n.glb'
];

const spacing = 10;
const models = [];
const mouse = new THREE.Vector2();

// === Load and Center Models ===
modelURLs.forEach((url, index) => {
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;


    // 💡 Improve texture sharpness


model.traverse((child) => {
  if (child.isMesh && child.material.map) {
    const map = child.material.map;
    map.generateMipmaps = true;
    map.encoding = THREE.sRGBEncoding;
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipMapLinearFilter;
    map.needsUpdate = true;
  }
});

      
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center); // Shift so center is (0,0,0)

      const group = new THREE.Group();
      group.add(model);

      let offsetIndex = index;
      if (index >= 1) offsetIndex += 1; // Gap after first
      group.position.x = offsetIndex * spacing - ((modelURLs.length + 1 - 1) * spacing) / 2;
      group.position.y = 0;

      scene.add(group);
      models.push(group);
    },
    undefined,
    (error) => {
      console.error(`Error loading ${url}:`, error);
    }
  );
});

// === Mouse Tracking ===
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// === Resize Handler ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === 🔁 Animate ===
function animate() {
  requestAnimationFrame(animate);

  models.forEach((model, index) => {
    const modelScreenPos = model.position.clone().project(camera);
    const modelX = (modelScreenPos.x + 1) * window.innerWidth / 2;
    const modelY = (-modelScreenPos.y + 1) * window.innerHeight / 2;

    const cursorX = (mouse.x + 1) * window.innerWidth / 2;
    const cursorY = (-mouse.y + 1) * window.innerHeight / 2;

    const dx = modelX - cursorX;
    const dy = modelY - cursorY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    const proximity = 1 - Math.min(distance / maxDistance, 1);
    const intensity = 1 - proximity;

    const targetRotX = -mouse.y * 0.5 * intensity;
    const targetRotY = mouse.x * 1.4 * intensity;
    const delay = 0.04 + index * 0.02;

    model.rotation.x += (targetRotX - model.rotation.x) * delay;
    model.rotation.y += (targetRotY - model.rotation.y) * delay;
  });

  renderer.render(scene, camera);
}

animate();
