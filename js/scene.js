/* ============================================================
   scene.js — Three.js showroom
   One fixed canvas behind the page. The camera dollies along
   a row of four cars as you scroll (stops computed from the
   actual section positions, so it stays in sync with the DOM).
   Each slot tries to load /models/<id>.glb; if absent it keeps
   the procedural placeholder.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { CARS, carX, buildProceduralCar, buildPlatform } from './cars.js';

const canvas = document.getElementById('webgl');
const carSections = [...document.querySelectorAll('section.car')];

let W = innerWidth;
let H = innerHeight;
const isMobile = () => innerWidth < 760;

/* ---------- renderer ---------- */

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('no-webgl').classList.remove('hidden');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050507);
scene.fog = new THREE.FogExp2(0x050507, 0.02);

const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 260);

/* ---------- environment (reflections without an HDR file) ---------- */

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* ---------- floor ---------- */

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x08080c, metalness: 0.65, roughness: 0.42 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(240, 120, 0x1c1c26, 0x101018);
grid.position.y = 0.005;
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

/* ---------- lights ---------- */

scene.add(new THREE.AmbientLight(0x445566, 0.6));

const keyLight = new THREE.DirectionalLight(0xbfd0ff, 1.1);
keyLight.position.set(-14, 18, 10);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x5566ff, 0.5);
rimLight.position.set(0, 8, -22);
scene.add(rimLight);

/* ---------- cars ---------- */

const cars = CARS.map((car, i) => {
  const slot = new THREE.Group();
  slot.position.set(carX(i), 0, 0);
  scene.add(slot);

  slot.add(buildPlatform(car.accent));

  const pivot = new THREE.Group();
  slot.add(pivot);

  const { group, wheels } = buildProceduralCar(car);
  pivot.add(group);

  // per-car accent spotlight
  const spot = new THREE.SpotLight(car.accent, 260, 30, 0.55, 1, 1.6);
  spot.position.set(carX(i), 7.5, 6);
  spot.target.position.set(carX(i), 0.5, 0);
  scene.add(spot, spot.target);

  return {
    car,
    slot,
    pivot,
    wheels,
    spot,
    active: false,
    glowBoost: 1,
  };
});

/* ---------- try to load real GLB models (optional) ---------- */

const loader = new GLTFLoader();
cars.forEach((c) => {
  loader.load(
    `models/${c.car.id}.glb`,
    (gltf) => {
      const model = gltf.scene;

      // normalize: fit to ~4.6 units, align length to X, sit on the floor
      let box = new THREE.Box3().setFromObject(model);
      let size = box.getSize(new THREE.Vector3());
      const longest = Math.max(size.x, size.z);
      if (longest > 0) model.scale.setScalar(4.6 / longest);
      if (size.z > size.x) model.rotation.y = Math.PI / 2;

      box = new THREE.Box3().setFromObject(model);
      size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -box.min.y;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = false;
          if (o.material) o.material.envMapIntensity = 1.1;
        }
      });

      c.pivot.clear();
      c.pivot.add(model);
      c.wheels = [];
      c.model = true;

      const chip = document.querySelector(`.model-chip[data-model="${c.car.id}"]`);
      if (chip) {
        chip.textContent = `MODEL · ${c.car.id.toUpperCase()}.GLB LOADED`;
        chip.classList.add('loaded');
      }
    },
    undefined,
    () => {
      /* no GLB yet — placeholder stays (see models/README.md) */
    }
  );
});

/* ---------- particles (floating dust) ---------- */

const P_COUNT = 520;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(P_COUNT * 3);
for (let i = 0; i < P_COUNT; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 90;
  pPos[i * 3 + 1] = Math.random() * 12;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({
  color: 0x8899cc,
  size: 0.035,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

/* ---------- postprocessing ---------- */

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.75, 0.72);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- camera rig ----------
   Keyframe track: HERO wide → for each car: dolly-in → HOLD (read the
   name/lore/specs) → dolly-out → FINALE wide. The stops are computed
   from real section offsets so 3D stays in sync with the DOM at any
   viewport size. */

function heroKey() {
  const zoomOut = isMobile() ? 1.3 : 1;
  return { x: 0, y: 5 * (isMobile() ? 1.1 : 1), z: 26 * zoomOut, tx: 0, ty: 0.6, tz: 0 };
}
function finaleKey() {
  const zoomOut = isMobile() ? 1.3 : 1;
  return { x: 0, y: 6.5 * (isMobile() ? 1.1 : 1), z: 30 * zoomOut, tx: 0, ty: 1, tz: 0 };
}

function carKey(i) {
  const cx = carX(i);
  const zoomOut = isMobile() ? 1.35 : 1;
  return { x: cx, y: 1.65, z: 8.2 * zoomOut, tx: cx, ty: 0.75, tz: 0 };
}

const hk0 = heroKey();
camera.position.set(hk0.x, hk0.y, hk0.z);
const camState = { ...hk0 };
let keys = [];
let stops = [];

function computeTrack() {
  const vh = innerHeight;
  const tops = carSections.map((s) => s.getBoundingClientRect().top + scrollY);
  keys = [{ k: heroKey(), car: -1 }];
  stops = [vh * 0.55];
  tops.forEach((t, i) => {
    keys.push({ k: carKey(i), car: i }, { k: carKey(i), car: i }); // arrive + hold
    // arrive: name just entered screen center · hold: through the specs ·
    // then the dolly-out spans the gap to the next car
    stops.push(t + 0.05 * vh, t + 0.6 * vh);
  });
  keys.push({ k: finaleKey(), car: -1 });
  stops.push(Math.max(document.body.scrollHeight - vh * 0.4, stops[stops.length - 1] + 1));
}
computeTrack();
// recompute once fonts/layout settle (heights can shift)
addEventListener('load', () => {
  computeTrack();
  updateCameraFromScroll();
});
if (document.fonts?.ready) document.fonts.ready.then(computeTrack);

const mouse = { x: 0, y: 0 };
addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / W) * 2 - 1;
  mouse.y = (e.clientY / H) * 2 - 1;
});

const smooth = (t) => t * t * (3 - 2 * t);

function updateCameraFromScroll() {
  const y = scrollY;
  let i = 0;
  for (let k = 0; k < stops.length - 1; k++) {
    if (y >= stops[k]) i = k;
  }
  const a = stops[i];
  const b = Math.max(stops[i + 1] ?? a + 1, a + 1);
  const p = smooth(THREE.MathUtils.clamp((y - a) / (b - a), 0, 1));
  const A = keys[i].k;
  const B = keys[i + 1].k;
  camState.x = THREE.MathUtils.lerp(A.x, B.x, p);
  camState.y = THREE.MathUtils.lerp(A.y, B.y, p);
  camState.z = THREE.MathUtils.lerp(A.z, B.z, p);
  camState.tx = THREE.MathUtils.lerp(A.tx, B.tx, p);
  camState.ty = THREE.MathUtils.lerp(A.ty, B.ty, p);
  camState.tz = THREE.MathUtils.lerp(A.tz, B.tz, p);

  // "active" car: whichever key the segment is closest to
  const carIdx = p > 0.5 ? keys[i + 1].car : keys[i].car;
  cars.forEach((c, idx) => {
    c.active = idx === carIdx;
  });
}

addEventListener('scroll', updateCameraFromScroll, { passive: true });
updateCameraFromScroll();

/* ---------- resize ---------- */

addEventListener('resize', () => {
  W = innerWidth;
  H = innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  composer.setSize(W, H);
  computeTrack();
  updateCameraFromScroll();
});

/* ---------- render loop ---------- */

const clock = new THREE.Clock();
const lookTarget = new THREE.Vector3();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // cars
  cars.forEach((c, i) => {
    const speed = c.active ? 0.4 : 0.1;
    c.pivot.rotation.y += dt * speed;
    c.wheels.forEach((w) => (w.rotation.z -= dt * (c.active ? 2.4 : 0.9)));

    // spotlight eases in when active
    const targetBoost = c.active ? 1.9 : 1;
    c.glowBoost += (targetBoost - c.glowBoost) * (1 - Math.exp(-dt * 4));
    c.spot.intensity = 260 * c.glowBoost * (isMobile() ? 0.8 : 1);
  });

  // particles drift
  const arr = pGeo.attributes.position.array;
  for (let i = 0; i < P_COUNT; i++) {
    arr[i * 3 + 1] += dt * 0.12;
    if (arr[i * 3 + 1] > 12) arr[i * 3 + 1] = 0;
  }
  pGeo.attributes.position.needsUpdate = true;
  particles.rotation.y = t * 0.01;

  // camera: scroll state + mouse parallax, damped
  const k = 1 - Math.exp(-dt * 4.2);
  const px = camState.x + mouse.x * 0.55;
  const py = camState.y - mouse.y * 0.3;
  camera.position.x += (px - camera.position.x) * k;
  camera.position.y += (py - camera.position.y) * k;
  camera.position.z += (camState.z - camera.position.z) * k;

  lookTarget.set(camState.tx + mouse.x * 0.3, camState.ty, camState.tz);
  camera.lookAt(lookTarget);

  composer.render();
}

renderer.setAnimationLoop(tick);
