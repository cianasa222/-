# RenderKit styles and procedural FX — selectable capabilities, not mandatory baggage

**Renderer choice is locked by the project owner.** The `01_gfx` dual backend of CrazyBike and Cold Smoke is a valid reference for very small single-HTML games; WebGPU/WGSL and WebGL2/GLSL ES 3.00 must be separately compiled on real browser drivers. Three/Babylon may be deliberately chosen for animation/material/asset pipelines; do not replace an engine just to save source code bytes.

## Environment presets
- Outdoors: deterministic heightfield, near-far LOD mesh and atmospheric horizon color matched to sky; avoid distant clipped scene edges. Optional snow/dust/water systems only if the game needs them.
- Interiors: instancing, baked/procedural material detail, localized lights and occlusion; do not ship whole-mountain code.
- Papercraft or voxel worlds: preserve iconic silhouette, art-directed roughness, consistent directional light; specialized pipelines only when approved by project brief.

## Procedural surface quality
Use material IDs and analytic noise to define albedo, roughness, bump and distinct hard/soft boundaries. ACES-style tonemapping and bounded bloom can help with perceived quality, but cannot repair bad geometry. WebGPU and fallback should use the same exposed parameters and regression fixtures.

## Budgeted VFX
Event-driven emitters: `windup → contact hitstop → recovery`; one pooled particle ring, additive and opaque/dithered passes as needed, cap active instances, preserve telegraphs under low-quality settings. Configure variants with seed, palette, scale and LOD instead of duplicating an emitter per attack. UI reads the event stream, never replays simulation.

## Post and performance
Quality policy: adapt pixel ratio before reducing geometric detail; maintain protected readability layers. Measure GPU and CPU separately and compare same-device baselines, not a test mock. Cache expensive SDF meshes by generator+recipe version, not just seed, and report boot generation time.
