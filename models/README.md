# `/models` — drop your GLB files here

The showroom automatically looks for a GLB for each demon car.
If the file exists it replaces the low-poly placeholder; if not,
the placeholder stays (and the chip in each section keeps the
`MODEL · PLACEHOLDER` label).

| File                  | Replaces   |
| --------------------- | ---------- |
| `models/diablo.glb`       | Diablo (slot 01) |
| `models/testarossa.glb`   | Testarossa (slot 02) |
| `models/ultima.glb`       | Ultima (slot 03) |
| `models/carrera.glb`      | Carrera (slot 04) |

## Pipeline: image → GLB (all free)

1. **Pick an image** — the renders in `../images/` are ready-made inputs
   (front three-quarter view, clean background = best results).
2. **Generate a mesh** with any of these (all have free tiers):
   - **Meshy** — https://www.meshy.ai (image → 3D + PBR textures)
   - **Tripo AI** — https://www.tripo3d.ai (high fidelity, auto-retopo)
   - **Luma Genie** — https://lumalabs.ai/genie (fast, direct GLB download)
   - **Sloyd** — https://sloyd.ai (clean game-ready assets)
   - **Common Sense Machines** — https://www.csm.ai/ai-3d
3. **Download `.glb`** and save it under the exact name in the table above.
4. **Optional polish in Blender** (https://www.blender.org, free):
   - *Decimate* modifier to bring the triangle count down,
   - check UVs / textures aren't broken,
   - *File → Export → glTF 2.0 (.glb)* with **Compression → Draco** off
     (plain GLB is simplest for the web).

## Tips

- **Keep it under ~5 MB** per model (the whole page should feel snappy).
- The scene auto-fits any model: it scales the longest axis to 4.6 units,
  rotates it if its length runs along Z, and drops it onto the platform —
  you don't need to model at a specific scale.
- A single material with PBR (metalness/roughness) looks great under the
  showroom lights; emissive strips will pick up the bloom pass.
- Want the car facing a specific way? It can't be rotated via the file —
  tweak the `model.rotation.y` line near the top of the GLB loader in
  `../js/scene.js` if needed.
