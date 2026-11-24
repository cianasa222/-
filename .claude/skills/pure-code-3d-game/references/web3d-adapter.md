# Web 3D 适配与专项资料

适用于已选择浏览器实时 3D 的项目。沿用项目承诺的后端、视角和目标设备。以下 init 示例使用显式的 web3d 配置。

## Visible garments, skin and eyewear (3.3)
For dressed characters read references/character-surfaces.md. Use a garment recipe tied to body sections, seams and stable cloth coordinates; separate medium-scale folds from filtered fiber detail. Compare cotton/satin under moving light, inspect oil and thin regions on skin, and verify lens glints and gaze across viewing angles. Reuse tools/wardrobe.mjs or the engine equivalent. tools/material-lab.html is a material swatch viewer. Select the applicable character.surfaceChecks in the project contract; sign off the posed, clothed character in the actual camera and on the target device.

## Light and shadow (3.2)
Read references/lighting-and-shadows.md for lighting or material tasks. Derive world-space shadow texel size from the actual shot, compare key light and sky fill separately, and profile on the declared device. Use tools/lighting-lab.html with tools/light-rig.mjs as an original runnable WebGL2 example. Preserve the chosen engine. The lab illustrates principles; port the math or use the engine's equivalent. Use a dedicated target contract for alternative shadow techniques.

## Mandatory parameter and evidence contract (3.1)
Read references/calibration.md before designing collision, a visible character or FX. Derive parameters from physical dimensions, on-screen size, or a playback measurement. Freeze project-specific quality-contract.json and targets before tuning. Run the probes against the real game and record observations separately. Budget changes require explicit justification. Read references/verification-gates.md for release evidence; the example target values are starting hypotheses. For expensive generated stages use gamekit keys with declared transitive inputs, verify output hashes and reuse only matching artifacts. Skip humanoid labs for projects with no humanoid. Only declared backends, devices and shots form the project's release matrix.

## Source-of-truth files and runnable commands
- `gamekit.json` in each game: locked machine-readable project contract. Read `references/recipe-schema.md`.
- `tasks/<id>.json`: baseline revision, allowed paths, forbidden paths, definition of done. Read `references/ai-task-contract.md`.
- `tools/character-lab.html`: standalone WebGL2 inspection harness; load exported `positions`/`indices` mesh JSON, inspect multiple views, lighting and poses, export structural statistics. It does **not** generate a finished character or certify aesthetics.
- `tools/gamekit.mjs`: zero-dependency Node ≥20 check/scaffold. Keep gamekit.mjs, production.mjs, quality-contract.mjs and quality-example.json together:

```bash
node tools/gamekit.mjs init ./new-game --profile web3d
cd new-game
node --test
node tools/gamekit.mjs check .
# A task can be audited against a real Git base, or explicit changed paths:
node tools/gamekit.mjs check . --task tasks/character-001.json --changed game/actor.mjs
# Strict evidence gate must FAIL until a real render module, screenshots, metrics and visual sign-off exist:
node tools/gamekit.mjs verify . --evidence evidence/release.json
```

The `init` output is a **headless game assembly reference**, not a graphics demo. It creates `game/runtime.mjs` and `game/world.mjs`, `actor.mjs`, `gameplay.mjs`; change these through independent modules, **not by patching the runtime for every feature**. `check` verifies config, module ownership, dependencies and cycles, path safety, Node syntax, the code-only asset rule and simple anti-cube anatomy patterns. This is *static and structural*, not a proof of visual quality. Integrators must also run actual tests and render. `verify` checks evidence structure; screenshots and counters are not self-authenticating and still need human inspection.

## Staged **vertical slices**, not a giant six-stage waterfall
1. **Contract:** game recipe, single-owner module interfaces, acceptance reference, task scope, CI. Gate: `check` + owner review.
2. **Smallest honest render:** backend initialization, minimal real pipeline, fixed-step world state and a visible test scene. Gate: browser WebGPU/WebGL2 tests or explicit unsupported-device report; no fake completed scene.
3. **Isolated Character Lab (when the project includes a character):** separate character builder, front/side/back/3⁄4, studio and flat lighting, wireframe, animation stress poses, geometry metadata. Gate: screenshots + structure + human silhouette evaluation.
4. **First playable vertical slice:** input → simulation → discrete events → VFX/audio → UI; assemble components without editing unrelated modules. Gate: deterministic headless test **and** real browser play-through.
5. **One-defect micro-polishing:** freeze passed surfaces; modify exactly one local defect, before/after shots and stats, accept or roll back. Gate: visual improvement plus non-regression.
6. **Repeat slices and release:** performance/accounting, the declared viewports and orientations, asset/attribution review, actual supported device when requested, explicit final sign-off. Gate: *all* mandatory release evidence.

Each slice must reach the true render/inspection loop early; later modules cannot be declared complete solely because test mocks pass.

## Model quality is not solved by saying “don't use boxes”
- Distinguish **cube people** (wrong geometry) from **rubber people** (over-smoothed SDF and undifferentiated materials).
- Form before polish: measured proportion and anatomy → clean organic SDF/loft → distinct hard-surface plates and garment seams → rig/IK → fabric, skin and visor BRDF/IBL → multi-angle screenshots. Read `references/character-and-shading.md`.
- Basic boxes remain legitimate for collision proxies, crates, machinery, and hidden driver rigs, **not exposed hero anatomy**. Static heuristics are a gate aid, not semantic classification.
- Source reference: `https://github.com/huiskylabs/cold-smoke/tree/main/human` provides a much deeper 59-bone human example, measurement and stress tests, not code bundled into this Skill.

## v4.1 Math-Only GPU Adapter
已选定的渲染器只接收 ProcedureCore 返回的几何、法线、关节姿态和 Seed 控制的 Shader 参数。CPU 可初始化一次生成复杂网格，GPU 大规模并行计算天气/毛发视觉；缓存非预制模型。首先阅读 references/strict-procedural-world.md、references/algorithm-component-library.md、references/procedural-anatomy-motion.md。不要因为样例算法导出 Mesh 数据，就宣称有了真实 GPU 画面或高品质完整人物。
