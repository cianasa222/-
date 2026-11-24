---
name: pure-code-3d-game
description: Develop original code-driven games across genres, dimensions, camera modes, engines, input methods and target platforms. Scope the player loop, build a playable slice, validate systems and content, preserve performance and player progress, and ship reproducible builds. Includes optional procedural Web 3D tools for characters, materials, light and shadows.
---

# 通用代码游戏开发 · GameKit 4.6

保留原技能标识供已有项目定位。通用开发契约支持 2D、2.5D、3D、文字与界面驱动玩法；视角和引擎由项目选定。Node ≥20 只用于开发期契约工具。正式游戏沿用项目语言、引擎、平台构建和测试入口。

## v4.4 · 通用纯代码研发最高约束

严格 code-only：所有运行时可见、可听、可交互内容由合法算法、参数、Seed、时间生成，禁止导入或伪装外部预制网格、贴图、音频、录制动画、密集模型数组。引擎库/源码可在许可审计后复用。生成缓存可删后复算。

先读 CURRENT.json 和 MODULES.json，加载本 SKILL.md、strict-procedural-world.md、environment-evidence.md；按触发条件只读对应模块和依赖。可运行 node tools/module-router.mjs character ui 等，KV 用 CURRENT 的 immutable_version_prefix 拼接路径；upstreamOptional 只在需要时读取，不必整包加载。Bundle 保留给离线 AI。

质量底线不是艺术风格：Cold Smoke 的 SDF 雪装、藏脸、成人比例和相机是可选配方，不是通用限制。依据 brief 自动选 SDF、CSG、loft、参数曲面、实体布尔等；人物由 RigRecipe、骨骼层级、IK、蒙皮、动作意图生成；允许面部、非人形和风格化，禁止粗糙占位冒充精细成品。详见 references/algorithm-routing.md、references/rig-motion-kit.md。

开工能力分级 L0–L4；无 GPU 不阻止开发，只标 VISUAL_PENDING/PERF_PENDING 并交接。只重测受影响模块，证据有效则复用；最终 ACCEPTED 仍须真实目标验收，不能用静态或合成证据冒充。

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

## 专项资料按需启用（MODULES.json 为机器索引）

| 项目需要 | 资料或工具 |
|---|---|
| Web 3D 示例、已有 v3 游戏契约 | [Web 3D 适配](references/web3d-adapter.md)。新建显式选 init --profile web3d；既有 schemaVersion 1 自动使用原专项检查 |
| 输入到模拟、独立模块和 AI 编辑边界 | [模块架构](references/module-architecture.md)、[AI 任务契约](references/ai-task-contract.md) |
| 人物轮廓、服装版型、可选 SDF 雕刻 | [SDF 人物方法](references/sdf-character-method.md)、[人体](references/character-and-shading.md)、[人物材质](references/character-surfaces.md)、Character/Material Lab |
| 碰撞、人物校准、特效读招和预算 | [校准](references/calibration.md)、[表现配方](references/rendering-and-fx-styles.md) |
| 程序光照、阴影稳定和缓存 | [光影](references/lighting-and-shadows.md)、Lighting Lab |
| 生成物追溯、参数和局部打磨 | [来源与授权](references/sources-and-licenses.md)、[微调](references/micro-polishing-loop.md) |

状态分清：草稿、结构通过、目标设备/体验待验、已验收。只有具备承诺范围内的真实证据和体验签收，才可报告对应项目阶段完成。测试中的合成示例只证明检查器行为。


## v4.3 强制研发工作流：性能、视觉、UI

涉及性能时先读取 [热点优化](references/performance-hotpaths.md)，以实际 profiling 决定是否引入 Rust/WASM/WGSL，必须保留等价验证、目标设备整机基准和回滚。涉及画面必须读取 [AI 渲染验收](references/renderer-visual-evidence.md)，有相应能力时使用项目实际目标渲染器捕获并检查画面；否则按 environment-evidence.md 交接；raea 只是可选原生适配器，不替换现有引擎。涉及游戏 UI 必须读取 [程序化 UI/UX](references/procedural-ui-ux.md)，用成熟案例提取设计参数并原创代码实现；不得复制截图。三个技能见 [集成入口](integrations/README.md)。严格 code-only 优先于第三方技能。工具不可用时记录缺口，不得伪造测试或验收。

技能维护见 references/skill-maintenance.md；上游官方资料见 integrations/raea-gamekit/UPSTREAM.md。


## v4.6 ComputeKit Agent 自主算力调度

用户指定不部署独立网关、Cloudflare 计算调度或看门狗。按需加载 compute 模块；Agent 直接用自身已授权的 Colab CLI/MCP 或本地工具，在预算内选择最低成本的可用后端。优先一次性任务，集中执行后立即释放并核验；不跨工具调用、模型思考或用户等待保留付费 Runtime。无实际连接则继续可用研发；清理不明则停止该 Agent 新付费申请并报告手动回收，硬断线风险不能保证消除。KV 仅作既有技能分发。详见 references/compute-kit.md。
