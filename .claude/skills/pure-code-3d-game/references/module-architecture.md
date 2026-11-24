# GameKit v3 modular assembly contract

## 1. Dependency ownership
A game is a **vertical composition of independently replaceable systems**, not a sequence of agent-generated files all editing `main.js`.

- `core`: fixed-timestep scheduler, game state machine, event queue, deterministic seeded streams; owns the single authoritative simulation clock.
- `render`: GPU device/context, buffers, shader binding, materials, frame graph, quality presets; single exclusive rendering owner. Implement WebGPU→WebGL2 or a *pre-agreed* 3D engine adapter. `core` never imports GPU APIs.
- `world`: geometry/height query, generation seed, environment rules. Physics and rendering query the **same** world coordinates and deterministic terrain equation.
- `character`: geometry recipe, material separation, driver rig and animation; exposes stable actor pose/mesh contract. Character Lab shares this export.
- `gameplay`: player and AI inputs, physics, combat, progression; operates on entity IDs and events, never DOM/Shader directly.
- `presentation`: camera, VFX, synthesized audio, HUD; consumes snapshots/events; does not mutate authoritative physics state.
- `verification`: simulation fixtures, screenshot and metrics capture, release evidence. Not coupled to game features.

Allowed dependency flow: `gameplay → core/world/character contracts`, `presentation → snapshots/events/render`, `render → geometry+scene descriptors`. Core may define types but must never import the concrete gameplay module. Cycles and direct cross-AI modifications fail.

## 2. Module factory interface
The starter enforces a simple shape:

```js
export const id = 'world';
export const deps = [];
export function create({ get }) {
  return {
    init() {},
    fixedUpdate(dt) {},  // 1 / project.fixedHz, never use variable wall-clock dt here
    render(alpha, renderer) {}, // interpolated presentation, never alter world physics
    snapshot() { return {}; }, // JSON serializable, stable for replay tests
    dispose() {},
  };
}
```

**Stable module IDs, dependencies and ownership are part of the ABI.** If a module requires a new dependency, request a contract change. Rendering must not instantiate or mutate a second game state; audio events fire only once per sim step.

## 3. Main-loop order
1. Poll physical input once, normalize into a per-step command stream.
2. Advance simulation in a bounded fixed step (`30/60/90/120 Hz` as chosen by project, with max catch-up limit).
3. Publish one immutable snapshot and a time-stamped discrete-event batch.
4. Update camera and presentation with interpolation alpha.
5. Run a constrained frame graph: shadow/depth, opaque world, animated entities, transparent VFX, post, UI.
6. Record frame time, draw calls, triangles, active particles, draw scale and current backend.

If the sim is paused, draw the last snapshot while physics remains frozen. A fixed seed must produce the same snapshots and events across two fresh runs.

## 4. Game definition separate from rendering
`gamekit.json` locks architectural settings and module ownership; a per-game data recipe defines gameplay (objectives, win/lose state, scenario, actor templates, spawn rules). Do not use JSON for arbitrary executable code or to smuggle an engine replacement. Hard-coded genre assumptions are forbidden inside shared core.

## 5. A deliberately small reference implementation
`tools/gamekit.mjs init <path>` creates a headless 3-module project (`world`, `actor`, `gameplay`) plus `game/runtime.mjs` and a deterministic test. It is a **contract and assembly demonstration, not a finished 3D game**. In particular, the actor carries no final geometry; missing `render` subsystem prevents release. Build a real GPU adapter as a separately owned module and validate its shader and screenshots independently.

## 6. Debug surface
Expose a single opt-in `window.__game` to test builds: `state()`, `sim(seconds,input,{draw})`, `teleport()`, `view()`, `setPose()`, `setLight()`, `profile()`. Do not expose arbitrary scripting commands or debug interfaces to public production unless explicitly approved. Debug hooks must report when GPU is mocked or unavailable.
