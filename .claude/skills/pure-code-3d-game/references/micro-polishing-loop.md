# Micro-polishing loop — change one defect, keep the rest fixed

1. **Identify one visible defect** with a screenshot/pose/lighting preset (e.g. helmet cheek plate floats at 45° view).
2. **Scope exactly one subcomponent**, with a task allowlist; freeze correct silhouettes, rig and shader contracts.
3. **Measure a baseline**: screenshot, fixed seed, camera, browser/backend, build commit, draw call/frame stats and numerical checks.
4. **Make the smallest alteration**, rendering the same view, seed and pose afterward. Check adjacent parts, material boundary, intersections, fps and shader compile on both intended backends.
5. **Accept or revert immediately**. Do not bundle unrelated “visual improvements” into one pass. Record the delta and next remaining defect.

Polish coarse→fine: overall proportions; face silhouette; organic-vs-hard shapes; boots/hands/joints; distinct materials/IBL; secondary motion; post-processing. Cinema lighting must never hide a deformed silhouette that looks wrong under flat light.

## v4.2 · 强制截图反馈回路（人物任务必走）

没有这条回路，模型是蒙眼编码——Cold Smoke 的全部质量都来自这条回路。本回路是强制流程，不是可选项：

1. 能渲染时按受影响部位捕获多角度与动作；不能渲染则交接可复现场景、镜头、参数、检查项。
2. **把图喂回模型自查**：模型逐张指出“哪里像橡皮人”（剪影比例、关节掐管、服装边界锯齿、面部恐怖谷、塑料感），按严重程度排序。
3. **每轮只改一处**，改完用同一视角、同一姿态、同一光照重新截图对照；A/B 对照保留 body / cloth / hand 各 a/b 两档，随时可切换比较。
4. 依据项目预算和收敛情况停止；多轮无可测改进时记录根因并换方法或交接，避免死循环。
5. 无目标视觉证据仍可交付已实现代码，状态 VISUAL_PENDING，不得标 ACCEPTED。

人物实验室（tools/character-lab.html）提供 front / side / back / three-quarter 四个固定视角，先在实验室里把姿态调好，再进游戏内截图。

**Stop conditions:** if a localized defect persists after 3 targeted attempts without measurable improvement, stop, log evidence, and change method or escalate to the architecture/character owner. A smaller AI is not guaranteed to converge merely by spending more turns. If GPU inspection is unavailable, label `VISUAL_PENDING` and do not assert that polish succeeded.

**Example micro-ticket**
```yaml
id: helmet-visor-014
baselineCommit: 1a2b3c4d
owner: character-kit
allowedPaths: [character/visor.mjs, lab/tests/visor.test.mjs]
view: front-three-quarter
pose: idle
lighting: flat
seed: 4221
defect: "visor clips jaw at camera yaw -35 degrees"
pass: "no visible self-intersection in front, side, action screenshots"
rollback: "revert exact visor patch on regression"
```
