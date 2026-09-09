# DEMON SUPER CARS ⚡

The four archdemons of **Tempest** — **Diablo**, **Testarossa**, **Ultima** and
**Carrera** from *That Time I Got Reincarnated as a Slime* — reborn as the
supercars they're named after (Lamborghini Diablo, Ferrari Testarossa,
Ultima GTR, Porsche Carrera GT), on one scroll-driven 3D showroom floor.

![three](https://img.shields.io/badge/Three.js-r160-black) ![gsap](https://img.shields.io/badge/GSAP-3.12-black)

## Run it

Any static server works:

```bash
# option A
python3 -m http.server 8000

# option B
npx serve .
```

Then open http://localhost:8000

> Three.js and GSAP load from CDN, so you need internet in the browser.

## What's inside

```
index.html          page shell (hero, 4 car sections, the forge, footer)
css/style.css       dark showroom theme, big-type layout, grain, cursor
js/cars.js          demon/car data + procedural low-poly placeholder cars
js/scene.js         Three.js scene: showroom, lights, bloom, scroll camera
js/main.js          GSAP: preloader, text reveals, counters, cursor, dots
images/             AI renders of the 4 demon cars (input for GLB conversion)
models/             ← drop your .glb files here (see models/README.md)
```

## How the 3D works

- One fixed canvas behind the page. The camera **dollies along a row of four
  cars** as you scroll — scroll "stops" are computed from the real section
  positions, so 3D and DOM stay in sync at any viewport size.
- Each slot tries `models/<id>.glb`; missing files fall back to a stylized
  low-poly car built from primitives (accent underglow, emissive tail bar,
  spinning wheels).
- Post: `UnrealBloomPass` on emissive parts, `RoomEnvironment` for metal
  reflections, ACES tone mapping, floating dust particles, mouse parallax.
- The **active** car (nearest to camera) spins faster and its accent
  spotlight flares — the page and the scene light up in sync.

## Free image → GLB tools

| Tool | URL | Notes |
| --- | --- | --- |
| Meshy | https://www.meshy.ai | image→3D + PBR textures, free monthly credits |
| Tripo AI | https://www.tripo3d.ai | high fidelity, auto-retopology |
| Luma Genie | https://lumalabs.ai/genie | free, direct GLB download |
| Sloyd | https://sloyd.ai | clean, game-ready output |
| CSM | https://www.csm.ai/ai-3d | one-image 3D, easy trial |
| Blender | https://www.blender.org | free — decimate/fix/export the final .glb |

## UI/UX inspiration

- **Virtual Car Showroom** — Awwwards (Three.js car showcase, HDR transitions, paint interaction)
- **Mercedes EQS reveal by Lusion** — scroll-driven 3D car reveal with bloom / chromatic aberration
- **Car Configurator — Camp Suha 3D Van Builder** — Awwwards element
- **brunosimon.io** — the reference for playful, physics-flavoured 3D on the web
- Trends baked in: scroll-driven camera, per-letter type reveals,
  marquee strip, film grain, custom cursor + magnetic buttons,
  spec counters, neon-on-black per-car accent system.

---

Fan concept — not affiliated with *Tensei Shitara Slime Datta Ken*,
its studios, or any automaker. Specs are real-world figures for the
named cars (Diablo SV, Testarossa, Ultima GTR 720, Carrera GT).
