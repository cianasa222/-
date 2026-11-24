---
name: pure-code-3d-game
description: Develop original code-driven games across genres, dimensions, camera modes, engines, input methods and target platforms. Scope the player loop, build a playable slice, validate systems and content, preserve performance and player progress, and ship reproducible builds. Includes optional procedural Web 3D tools for characters, materials, light and shadows.
---

# 通用代码游戏开发 · GameKit 4.3

保留原技能标识供已有项目定位。通用开发契约支持 2D、2.5D、3D、文字与界面驱动玩法；视角和引擎由项目选定。Node ≥20 只用于开发期契约工具。正式游戏沿用项目语言、引擎、平台构建和测试入口。

## v4.2 · 严格数学程序化世界 + 反橡皮人方法（纯代码项目最高优先级）

用户明确要求：世界中所有可见、可听、可交互对象必须能由算法源码、明确参数、Seed 和时间重新计算。从人物骨骼蒙皮/动作，到雪花、空气、地形、草木、建筑、材质、特效和声音。允许使用有许可的算法源码、数学原理和可追溯参数作为生成输入；**禁止未经用户授权自动改用预制模型、贴图、动作捕捉曲线、音频采样、资产包**。把它们转成 JS/JSON/Base64/SVG 图片同样不合规。

当前用户项目的 assetMode 必须锁定 code-only，不得因 AI 实现困难、进度、性能预算或艺术细节而偷换 hybrid。通用 GameKit 仍兼容由其他项目用户显式批准的 hybrid 玩法；这是独立模式，不能用来违背严格纯代码项目约束。单一 SDF、粗糙立方体、固定骨骼动作数组都不能成为终版画质交付。

### v4.2 修正 v4.1 的方向性错误

v4.1 要求人物做到“一根眉毛/睫毛”级别的面部细节——这个要求是错的，而且是“橡皮人”问题的根源之一。实测结论（Cold Smoke 1,772 行 `08_skier.js`，2026-11-24 核查）：好的人物不是靠更细的面部描写做出来的，而是靠一套雕刻方法 + 骨骼姿态工程 + shader 材质 + 几百轮“玩—反馈—改”迭代。**方法进 skill，描述不进提示词**：用户只说一句“做个滑雪者”就够了，skill 必须替他把方法扛住；绝不把“写更细的提示词”当作解法。

### 人物禁令（违反即返工，不许交付）

1. **禁止胶囊/球体拼装**：可见人物身体不得用 `CapsuleGeometry` / 等径胶囊 / 球体硬拼；`gamekit.mjs check` 对 character 模块静态拒绝 `CapsuleGeometry` 与 `BoxGeometry`。
2. **禁止 `min` 硬并集**：SDF 融合一律用 Quilez 二次多项式 smooth-min（见 references/sdf-character-method.md），k 取 0.012–0.08，分部位取不同值。
3. **禁止用 mesh 顶点切分做服装边界**：夹克/裤子分界、袖口、头盔与衣领交界必须在 fragment shader 里用同一套 SDF 逐像素重算；网格保不住直线，顶点切分只会出锯齿毛边。
4. **禁止静态正面 T 形站姿展示**：人物验收一律用运动中的姿态（蹲姿、压弯、撑杖/握把），禁止用直立正面站姿当作成果截图。
5. **禁止露脸**：默认英雄人物必须用头盔 + 雪镜 + 面罩藏住脸、用手套藏住手；不得建模眼球/鼻子/嘴唇/眉毛/睫毛。需要露脸的项目必须先过“像人”验收门并经用户明确批准。

### 人物方法（照做，不要发明替代路线）

按 references/sdf-character-method.md 执行：身体 = 椭球 / 变截面 tube / 圆角盒 + smin 熔合；比例写成硬常量（1.76 m 成人、头身比约 7.5、肩比髋宽 25%、`LEN` 常量）；约 28 根骨骼 + 膝/肘/髋/肩半程辅助骨 + 每顶点最多 3 根骨骼指数衰减蒙皮；姿态由双骨骼 IK 求解器算出（手握杖、脚踩板由求解器保证，不许手写坐标）；加载时以约 13.5 mm 网格把 SDF 烘焙成 mesh；衣服褶皱/缝线/拉链/口袋/卡扣放进 fragment shader（`skFold` 沿肢体成环噪声，弯曲越深褶皱越深）+ sheen / rim 光 / AO。

### 人物设计：先选“能赢”的设计

厚衣服、无裸露皮肤、运动中、chase 镜头从后方拍、人物在画面中偏小。先做到“从背后看像滑雪者”，再做正面；正面、特写、脸部是最后才碰的东西。

### 强制截图反馈回路（人物任务必走）

每次人物生成后必须渲染多角度截图（正面 / 侧面 / 背面、特写、运动中）+ 一段短视频，把图喂回模型自查“哪里像橡皮人”并改代码；每轮只改一处；上限 5 轮。body / cloth / hand 各留 a/b 两档做 A/B 对照。没有截图回路证据的人物任务不得标 ACCEPTED，只能是 VISUAL_PENDING。详见 references/micro-polishing-loop.md。

### “像人”验收门（不通过不许交付）

剪影比例检查（头身比、肩髋比）、关节弯曲不掐管、服装边界无锯齿、运动中截图检查。四项全过才算人物通过；数值门见 references/verification-gates.md §3.4。

优先阅读 references/strict-procedural-world.md、references/algorithm-component-library.md、references/procedural-anatomy-motion.md、**references/sdf-character-method.md**。执行 Node 无依赖算法演示 tools/procedural-core.mjs（生成几何/姿态/雪花/合成声音；其中 `createFaceVolume` / `createEyebrows` 仅为算法演示，默认人物设计不露脸、不使用它们）及静态门禁 tools/procedural-gate.mjs。运行 node --test tests/test_procedural_core.mjs tests/test_procedural_gate.mjs 和 node tools/procedural-gate.mjs <project-path>，再做实际打包资产审计、浏览器 network trace、生成器/Seed 重现、真实 GPU 截图、不同体型的动作接地与性能验收。本轮新增工具单测 19/19 PASS，但不代表已经创建真实美术级人物或完成设备测试；应标 ALGORITHM_TESTED / VISUAL_PENDING。

高画质、高流畅与数学化可以兼得：静态几何按配方初始化生成并缓存，动态细节使用 GPU Shader/Instancing 和有依据的 LOD；不是要求 CPU 每一帧重新构造全部三角形。缓存必须可以删除并从公式与 Seed 重新构建，不得以缓存掩饰预制资产。模型复杂度和代码量不构成降低质量的理由。

## 开工读取顺序

1. 读取用户需求、当前源码与交接、可运行的入口和已有测试。写明核心玩家动作、选择、反馈、一次循环如何结束或继续。先找最有可能让玩法失败的假设。
2. 声明平台/设备、输入、时间模型、引擎、资产策略、呈现方式和预算。每个常用机位/界面单独写呈现优先级。第一人称持物、第三人称衣摆、俯视群体和棋盘文字可以属于同一项目的不同场景。无人物或无 3D 镜头的项目直接声明实际主体，如卡牌、线路或文本。
3. 固定世界/界面单位、时钟、随机性、输入语义和事件归属。若选纯代码，记录哪些内容由何种生成器/种子重建；引擎及库版本另行固定。发布流水线核对实际打包资源、内联数据和运行时请求。采用授权外部美术的项目显式选 hybrid。
4. 根据项目阶段读取 [制作流程](references/production-flow.md)。需要自动生成验收清单或存档、联机、经济、程序关卡时，参阅 [通用契约与证据](references/general-contract.md)。

## 每轮工作

- **原型**：在正式输入的最短路径上让人玩起来。让一个新玩家在没有开发者教学的情况下做出第一次有意义的选择。记录犹豫、误触及重试原因，明确继续、改动或删除该机制的依据。
- **可玩切片**：完成一段从进入到结算/继续的代表性体验。接通规则、操作、反馈、声音、UI、恢复路径和一个能代表量产质量的场景。触觉、镜头、场景细节按玩法和实际设备配置。
- **内容生产**：模板化已验证的数据结构和生成器，先验证第二份内容能复用，再扩大数量。数据校验、平衡回归、种子/输入回放与存档迁移进入 CI。无法严格确定性复算时用容差、事件序列和状态不变量。
- **发布与维护**：冻结候选构建，测首次启动、设置、异常返回、最低目标设备、长时重负载、安装/升级与恢复。在线服务、持久化或商业模块仅在声明后进入对应检查。附构建标识、证据、已知缺口和恢复步骤。
- 一次实验写明假设、允许修改的文件、成功/放弃条件。固定镜头和输入比较差异，追踪脏依赖，复用已核验的产物。禁止以换引擎、抬预算、删承诺平台或改验收场景掩盖回退。只把尚未解决的重大取舍交回项目负责人。

## 通用入口

从本包执行，或使用初始化时拷入项目的同一套工具：

```sh
node tools/gamekit.mjs init ./my-game
# 按实际项目填写 my-game/gamekit.json。初始化只创建契约与检查工具。
node tools/gamekit.mjs plan ./my-game --stage prototype
node tools/gamekit.mjs check ./my-game
node tools/gamekit.mjs verify ./my-game --stage release --evidence evidence/release.json
```

现成示例：examples/general-puzzle.json（2D 回合制、棋盘、键鼠）和 examples/general-exploration.json（原生 3D、跟随/近距检查、键鼠/手柄）。预算为示意值。已有项目首次接入先保留当前工作；冲突文件由集成者读后合并。通用 check 负责契约，verify 校验证据完整性和预算。原生编译、玩法实测和真实玩家签收在项目自己的环境里执行，保留原始输出。

## 专项资料按需启用

| 项目需要 | 资料或工具 |
|---|---|
| Web 3D 示例、已有 v3 游戏契约 | [Web 3D 适配](references/web3d-adapter.md)。新建显式选 init --profile web3d；既有 schemaVersion 1 自动使用原专项检查 |
| 输入到模拟、独立模块和 AI 编辑边界 | [模块架构](references/module-architecture.md)、[AI 任务契约](references/ai-task-contract.md) |
| 人物轮廓、服装版型、SDF 雕刻与藏脸设计 | [SDF 人物方法](references/sdf-character-method.md)、[人体](references/character-and-shading.md)、[人物材质](references/character-surfaces.md)、Character/Material Lab |
| 碰撞、人物校准、特效读招和预算 | [校准](references/calibration.md)、[表现配方](references/rendering-and-fx-styles.md) |
| 程序光照、阴影稳定和缓存 | [光影](references/lighting-and-shadows.md)、Lighting Lab |
| 生成物追溯、参数和局部打磨 | [来源与授权](references/sources-and-licenses.md)、[微调](references/micro-polishing-loop.md) |

状态分清：草稿、结构通过、目标设备/体验待验、已验收。只有具备承诺范围内的真实证据和体验签收，才可报告对应项目阶段完成。测试中的合成示例只证明检查器行为。


## v4.3 强制研发工作流：性能、视觉、UI

涉及性能时先读取 [热点优化](references/performance-hotpaths.md)，以实际 profiling 决定是否引入 Rust/WASM/WGSL，必须保留等价验证、目标设备整机基准和回滚。涉及画面必须读取 [AI 渲染验收](references/renderer-visual-evidence.md)，先使用项目实际目标渲染器捕获并检查画面；raea 只是可选原生适配器，不替换现有引擎。涉及游戏 UI 必须读取 [程序化 UI/UX](references/procedural-ui-ux.md)，用成熟案例提取设计参数并原创代码实现；不得复制截图。三个技能见 [集成入口](integrations/README.md)。严格 code-only 优先于第三方技能。工具不可用时记录缺口，不得伪造测试或验收。
