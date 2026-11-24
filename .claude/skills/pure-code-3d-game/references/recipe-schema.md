# Project recipe and game assembly schema (v3)

## Required project fields
`gamekit.json` schemaVersion `1`, kitVersion, `name`, `assetMode`, `axes`, `units`, `fixedHz`, `renderer`, `modules[]`, `quality`.

- `assetMode`: `code-only` means no imported model, bitmap, audio, or font binaries in the game project. Programmatic CanvasTexture, meshes, generated audio and post are allowed. `hybrid` permits separately inventoried/approved assets with hash and licensing metadata. The checker's binary scan is an extension-based guard, **not** a copyright audit.
- World axes: right-handed Y-up and meters by default; change only with an approved contract and corresponding physics/Shader changes.
- `renderer.primary`: `webgpu`, `webgl2`, `three`, `babylon`; `fallback`: `webgl2` or `none`; `owner` is singular. The scaffold uses WebGPU/WebGL2, but the checker must not coerce a consciously selected engine into a different one.
- `fixedHz`: approved 30, 60, 90 or 120; gameplay must use one selected timestep. The 60 Hz scaffold is illustrative.
- `modules[]`: `{id, kind, owner, file, deps[]}`. IDs unique; dependencies acyclic; explicit ES modules; module paths cannot escape the project.
- `quality`: `characterPlaceholderFinal: false`; project-selected thresholds for minimum geometry detail/material separation, max frame P95. These numbers are *project-specific heuristics*, not proof of beauty.

## Recommended second layer: game recipe (data only)
```json
{
  "gameId": "test-arena",
  "seed": 20261124,
  "systems": ["world", "actor", "gameplay", "render", "hud"],
  "scenario": {"arena": "flat-procedural", "enemyCount": 1},
  "mechanics": {"move": true, "attack": true, "jump": true},
  "winCondition": "defeat-all-enemies"
}
```

A recipe describes *which verified modules to compose*. It does not grant an AI permission to edit shared engine files. Bundle size comes after runtime modularity and validation; a single HTML output need not imply global variables or filename-ordered module dependencies.

## Reference vs implementation
The bundled starter intentionally has no GUI, mesh or GPU device. Passing `node --test` proves deterministic module composition only. Release demands a real renderer module and externally inspected visual evidence. For a game without a humanoid character, adjust the quality/evidence schema **by an explicit project-level contract change**; do not silently invent fake 3D human stats.

## v4.1 Procedural World Recipe
用户选择严格数学世界时 assetMode 必须为 code-only；每个实例声明 generatorId、generatorVersion、seedDomain、参数及其来源、单位和校准状态。允许运行时缓存由算法生成的结果，不得把外部模型/动作曲线/图片换成代码字节数组伪装结果。已选择 code-only 不允许任何 AI 自动降为 hybrid；新规范见 references/strict-procedural-world.md。
