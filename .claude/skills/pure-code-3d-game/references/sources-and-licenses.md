# Sources and licensing boundaries

This v3 Skill is original scaffolding, contract guidance and small Node tooling informed by accessible open-source designs, not a copied rendering engine or the finished source of third-party games.

References inspected 2026-11-24:
- `https://github.com/huiskylabs/cold-smoke` — MIT-licensed Cold Smoke (`docs/ARCHITECTURE.md`, `human/README.md`, `human/src/05_measure.js`, `tools/motion/README.md`, `tools/perf/README.md`). Notable: independent 59-bone human model, girth calibration, fixed-step simulation hooks, motion-regression baseline, performance accounting, source-only single HTML.
- `https://github.com/jeffierw/crazybike` — repository LICENSE contains MIT license and third-party attribution to Cold Smoke. Notable: SDF rider generation, 23-bone skinned character, dual WebGPU/WebGL2 shader abstraction, composable game loop, quality tiers and automated headless checks.
- V2 `skills/pure-code-3d-game/` bundle in Cloudflare KV — preserved verbatim under the `versions/v2.0.0/` prefix before replacing the root v3.

Names `tidewater`, `papercraft`, `sprite-stack-engine`, `pixelfx`, `prompt2rig` appeared in v2's citations; their current licenses and implementations have **not** been independently verified in this migration. They remain optional design leads, not imported code, approved dependencies, or source-quality guarantees.

If code is copied from other repos into a downstream project, review their license/version and include required copyright/NOTICE text. A code-only generated output does not automatically guarantee IP or performance compliance.

## v4.1 Reference Algorithm vs Asset
《雪迹》及其他开源工程是经过许可证核查的算法来源参考，不是角色/音效/动作资源库。可借数学定义、表面生成、IK、BRDF、步态方法、SVG Bézier 路径原理，但不能原样打包原网格、动作关键帧、预制贴图或音频。参数标明设计假设、许可合规的测量数据或可推导方程；任何第三方算法代码仍需保留许可/NOTICE。


## v4.3 external references
fast-anything MIT (official skill + license mirrored); raea engine FSL-1.1-ALv2, raea-skills Apache-2.0 (adapter only); Game UI Database reference only, no copied assets. See integrations/README.md.
