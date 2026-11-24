# ProceduralCore / Strict Gate · v4.1 可执行组件

以下 Node ≥20、无需 npm 依赖；不导入任何 GLB、SVG、美术、动画或声音采样文件。

```bash
node --test tests/test_procedural_core.mjs tests/test_procedural_gate.mjs
node tools/procedural-gate.mjs ./my-game
```

`tools/procedural-core.mjs` 提供 `createRng`、`hash3i/noise3/fbm3`、`bezier3/sweepCurve`、`createFaceVolume`、`createEyebrows`、`makeRig`、`solveLegIK/sampleWalk`、`sampleSnowflake/snowCrystalRadius`、`impactSample`。其中 `createFaceVolume` / `createEyebrows` 返回 `{ positions, indices, normals/uv }`，由单独的 GPU Adapter 上传到 WebGPU/WebGL2 或用户固定的图形后端。它们是**算法参考实现**，**不声称**生成高精度完整人脸/衣服，也不带生产级绑定蒙皮或 GPU 场景。

> **v4.2 注意**：`createFaceVolume` / `createEyebrows` 仅为算法演示。默认英雄人物设计藏脸藏手（头盔 + 雪镜 + 面罩 + 手套），不使用这两个函数；人物做法以 references/sdf-character-method.md 为准。

`tools/procedural-gate.mjs` 要求目标目录存在 `gamekit.json`，且其 `assetMode` 为 `code-only`，并扫描默认 `src/`、`game/`、`public/`、`dist/` 运行目录。它会拒绝常见模型、贴图、录音、预烘焙动作/网格数组和运行代码中的 `Math.random()`；还会报告未识别文件。**安全边界**：仅启发式静态检查，不能对模糊数据、混淆字符串、动态下载、CSS/JS 变体或版权归属给出完整保证。生产构建需要另外检查完整输出、network trace、依赖打包、模块输出哈希和真实 GPU 截图。

为了证明检测规则真实生效，`tests/test_procedural_gate.mjs` 包含故意违反素材策略的反例；所有反例应被拒绝。更多项目级验证仍执行 `gamekit check/verify` 和项目自己的真实图形/玩法测试。

纯代码目标强调的是**视觉成果可由代码重建**，不是每帧遍历重建整个世界；静态网格在启动时生成并缓存，动态小细节用 GPU 实例与 Shader 批处理，能达到同一种艺术算法的低中高 LOD 质量。