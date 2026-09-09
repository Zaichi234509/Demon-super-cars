/* ============================================================
   cars.js — demon car data + procedural placeholder car builder
   The placeholder keeps the showroom alive until a real .glb
   is dropped into /models (see models/README.md).
   ============================================================ */

import * as THREE from 'three';

export const CARS = [
  {
    id: 'diablo',
    index: '01',
    demon: 'NOIR',
    title: 'THE BLACK PROGENITOR',
    name: 'DIABLO',
    car: 'Lamborghini Diablo',
    body: 0x0b0b0e,
    accent: 0xff2222,
    shape: { height: 0.42, nose: 1.06, cabin: 0.5, spoiler: 1.0, strakes: false },
  },
  {
    id: 'testarossa',
    index: '02',
    demon: 'BLANC',
    title: 'THE WHITE PROGENITOR',
    name: 'TESTAROSSA',
    car: 'Ferrari Testarossa',
    body: 0xe9e6df,
    accent: 0xff4a1c,
    shape: { height: 0.52, nose: 0.92, cabin: 0.56, spoiler: 0.4, strakes: true },
  },
  {
    id: 'ultima',
    index: '03',
    demon: 'VIOLET',
    title: 'THE PURPLE PROGENITOR',
    name: 'ULTIMA',
    car: 'Ultima GTR',
    body: 0x170a26,
    accent: 0xa55bff,
    shape: { height: 0.46, nose: 1.0, cabin: 0.52, spoiler: 0.8, strakes: false },
  },
  {
    id: 'carrera',
    index: '04',
    demon: 'JAUNE',
    title: 'THE YELLOW PROGENITOR',
    name: 'CARRERA',
    car: 'Porsche Carrera GT',
    body: 0xf2c40f,
    accent: 0xffd90b,
    shape: { height: 0.5, nose: 0.88, cabin: 0.62, spoiler: 0.3, strakes: false },
  },
];

/** X position of car slot i on the showroom floor. */
export const SPACING = 12;
export function carX(i) {
  return (i - (CARS.length - 1) / 2) * SPACING; // -18, -6, 6, 18
}

/* ---------- helpers ---------- */

function glowTexture(hex) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(hex);
  const css = `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},`;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, css + '0.85)');
  g.addColorStop(0.35, css + '0.32)');
  g.addColorStop(1, css + '0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- procedural car ----------
   Stylized low-poly supercar, ~4.6 long (X), ~2 wide (Z).
   Returns { group, wheels } so the scene can spin the wheels. */

export function buildProceduralCar(car) {
  const s = car.shape;
  const group = new THREE.Group();
  group.name = `car-${car.id}`;

  const wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: car.body,
    metalness: 0.85,
    roughness: 0.28,
    envMapIntensity: 1.1,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c,
    metalness: 0.55,
    roughness: 0.5,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f16,
    metalness: 0.9,
    roughness: 0.12,
    envMapIntensity: 1.4,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: car.accent,
    emissive: car.accent,
    emissiveIntensity: 2.4,
    metalness: 0.2,
    roughness: 0.4,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf4f6ff,
    emissiveIntensity: 3.2,
  });

  const L = 4.6;
  const W = 2.05;
  const H = s.height;
  const baseY = 0.34;

  // main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), bodyMat);
  body.position.y = baseY + H / 2;
  group.add(body);

  // nose (front, +Z)
  const noseLen = 1.1 * s.nose;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, H * 0.62, noseLen), bodyMat);
  nose.position.set(0, baseY + H * 0.42, L / 2 + noseLen / 2 - 0.06);
  group.add(nose);

  // cabin
  const cabinLen = L * s.cabin * 0.52;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.74, H * 0.95, cabinLen), glassMat);
  cabin.position.set(0, baseY + H + H * 0.42, -L * 0.04);
  group.add(cabin);

  // rear deck
  const rear = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, H * 0.8, L * 0.22), bodyMat);
  rear.position.set(0, baseY + H * 0.72, -L / 2 + L * 0.1);
  group.add(rear);

  // skirt / lower diffuser
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.14, L * 0.96), darkMat);
  skirt.position.y = baseY - 0.1;
  group.add(skirt);

  // side strakes (Testarossa)
  if (s.strakes) {
    for (let i = 0; i < 4; i++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.1, H * 0.5, 0.42), darkMat);
      const z = L * 0.05 + i * 0.52;
      for (const side of [1, -1]) {
        const m = strake.clone();
        m.position.set(side * (W / 2 + 0.045), baseY + H * 0.5, z);
        group.add(m);
      }
    }
  }

  // rear spoiler
  if (s.spoiler > 0.5) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.06, 0.62), bodyMat);
    wing.position.set(0, baseY + H + 0.3, -L / 2 + 0.12);
    group.add(wing);
    for (const side of [1, -1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.4), darkMat);
      post.position.set(side * W * 0.32, baseY + H + 0.14, -L / 2 + 0.12);
      group.add(post);
    }
  } else {
    // low rear lip
    const lip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, 0.08, 0.24), darkMat);
    lip.position.set(0, baseY + H * 1.15, -L / 2 - 0.02);
    group.add(lip);
  }

  // headlights
  for (const side of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.06), headMat);
    hl.position.set(side * W * 0.3, baseY + H * 0.55, L / 2 + noseLen - 0.02);
    group.add(hl);
  }

  // tail light bar
  const tail = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.07, 0.05), accentMat);
  tail.position.set(0, baseY + H * 0.85, -L / 2 - 0.025);
  group.add(tail);

  // accent stripe under the doors
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, 0.035, L * 0.5), accentMat);
  stripe.position.set(0, baseY - 0.02, 0.2);
  group.add(stripe);

  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 20);
  wheelGeo.rotateX(Math.PI / 2); // axle along Z
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12);
  rimGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.2, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa0ab, metalness: 1, roughness: 0.25 });

  for (const [x, z] of [
    [1.42, 1.45],
    [-1.42, 1.45],
    [1.42, -1.45],
    [-1.42, -1.45],
  ]) {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheel.add(tire, rim);
    wheel.position.set(x, 0.36, z);
    group.add(wheel);
    wheels.push(wheel);
  }

  // underglow
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 6.2),
    new THREE.MeshBasicMaterial({
      map: glowTexture(car.accent),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  group.add(glow);

  group.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });

  return { group, wheels };
}

/* ---------- showroom platform under each car ---------- */

export function buildPlatform(accentHex) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.75, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0x0c0c11, metalness: 0.7, roughness: 0.4 })
  );
  base.position.y = 0.04;
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.025, 8, 72),
    new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 1.8,
      metalness: 0.3,
      roughness: 0.5,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.09;
  g.add(ring);

  return g;
}
