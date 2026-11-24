# AI agent task contracts and safe relay

## Required task request fields
- `task.id`, baseline git SHA / approved recipe revision, owner and intended module, inputs/outputs, fixed test seeds and acceptance criteria.
- `allowedPaths[]`, `forbiddenPaths[]`, no cross-owner edits unless the owner approves a separate ABI/version change.
- Technical stack/renderer lock, no implicit new dependencies, no art-style change, required real screenshot targets.
- CI build/test command, fixture list, actual observed outputs, known blockers, and final status: `DRAFT` / `STRUCTURAL_PASS` / `VISUAL_PENDING` / `ACCEPTED`.

## Required workflow
1. Read `SKILL.md`, gamekit manifest, module-specific reference, exact task and baseline implementation.
2. Plan one small change. If an interface change is required, STOP and ask for a new contract version instead of editing every caller.
3. Implement in owned files; avoid replacing core or unrelated code with a generated monolith.
4. Run syntax, independent tests, `tools/gamekit.mjs check . --task ...`, browser shader/pose checks as available, compare visuals and performance.
5. Report exact tested commit/source hash and what was **not** tested; never claim the user has seen screenshots/CI if not run.
6. An integrator reviews dependency compatibility and visual result, then advances status only after gates pass.

## Task `json` example
```json
{
  "id": "character-001",
  "baseRevision": "FULL_ACTUAL_COMMIT_SHA",
  "allowedPaths": ["game/actor.mjs", "character/**", "lab/**"],
  "forbiddenPaths": ["game/runtime.mjs", "game/world.mjs"]
}
```

For a non-Git prototype, `--changed` explicitly supplies file names, but it is not a proof of actual changes; only a trusted CI diff from the base SHA is sufficient for full enforcement. The tool checks path scope and requires some changed-file evidence.

## Two-AI or multi-AI collaboration
One AI owns the renderer/core ABI; feature AIs own isolated files and tests. A relay agent validates source hashes and reads the latest contract before placing a branch/PR; do not overwrite another branch or delete original task payloads prematurely. A disabled/removed AI cannot remain a required reviewer. Store code, tests, manifest, version and limitations, not just “done”.

## v4.1 Strict Code-only AI Ownership
每个严格纯代码任务必须记录 generatorId、generatorVersion、输入配方/Seed 范围、参数的参考或设计来源、允许修改的文件、真实 GPU 机位、性能和动作回归证据。禁止自行下载或编译预制 GLB/贴图/音频、嵌入动画采样、静默修改模式、引擎、公共 ABI 和验收阈值。静态代码检查只能获得 STRUCTURAL_PASS；真实画面待验则标 VISUAL_PENDING。

## v4.2 人物任务的截图回路证据（新增）
人物任务按环境能力提供实际可得证据；目标画面/视频未验则标 VISUAL_PENDING，交接所需场景、参数、命令和缺口。最后验收采用项目角色配方及 references/verification-gates.md；无固定 5 轮要求。
