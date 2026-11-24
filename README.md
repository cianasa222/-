# 技能

个人技能收藏：Claude Code 技能，放在 `.claude/skills/` 下，按用途分类。

## 用法

把需要的技能文件夹复制到你的 `.claude/skills/` 下就能用。技能按名字平铺在 `.claude/skills/` 里，不要再套一层分类文件夹——Claude Code 只认一层目录，套了就找不到了。分类只体现在下面的索引里。

## 🎬 视频

| 技能 | 说明 |
| --- | --- |
| [xilo-opus-video](.claude/skills/xilo-opus-video) | 代码做视频：Canvas / WebGL / Three.js / Remotion，Playwright + FFmpeg 逐帧渲染，先出三个方案确认再做成片 |
| [blender-video-editing](.claude/skills/blender-video-editing) | Blender 剪辑：Video Sequencer、运动跟踪、调色、H.264 输出 |

## 🎮 做游戏资产

| 技能 | 说明 |
| --- | --- |
| [blender-game-optimization](.claude/skills/blender-game-optimization) | 游戏资产优化：按平台（手机 / Roblox / 网页 / VR / 主机 / PC）控三角面、材质、骨骼预算，LOD、减面、合批 |
| [blender-character-rigging](.claude/skills/blender-character-rigging) | 角色绑定：Rigify、IK/FK、蒙皮权重，导出 Unity / Unreal / Roblox R15 游戏骨架 |
| [blender-clothing](.claude/skills/blender-clothing) | 游戏服装：按身体部位做衣服、布料模拟、换装、穿帮检查 |
| [blender-environment-kits](.claude/skills/blender-environment-kits) | 游戏场景：地形、生物群系散布、模块化套件（关卡 / 森林 / 地牢） |
| [blender-export-pipelines](.claude/skills/blender-export-pipelines) | 导出到游戏引擎：Roblox / Unity / Unreal / Godot / 网页，FBX、glTF、USD 预设 |
| [blender-animation](.claude/skills/blender-animation) | 游戏动画：游戏循环、NLA、动捕重定向、根运动、按片段导出骨架 |
| [blender-facial-shapekeys](.claude/skills/blender-facial-shapekeys) | 面部表情：ARKit 52 个表情、口型同步，导出到 Unity / Unreal / Roblox |
| [blender-retopology-uv](.claude/skills/blender-retopology-uv) | 拓扑 + UV：把雕刻 / AI 网格转成游戏网格，展 UV、控像素密度 |
| [blender-texture-baking](.claude/skills/blender-texture-baking) | 烘焙贴图：高模转低模法线、AO、曲率，烘成游戏贴图 |
| [blender-workflow-recipes](.claude/skills/blender-workflow-recipes) | 全流程 playbook：游戏道具、游戏角色、Roblox 资产，串起多个技能 + 质检 |

## 🧊 通用技术

| 技能 | 说明 |
| --- | --- |
| [blender-core](.claude/skills/blender-core) | 入口：所有 Blender 任务先走这个，再分流到各专项技能 |
| [blender-addon-development](.claude/skills/blender-addon-development) | 写 Blender 插件：扩展清单、操作面板、打包、测试、上架 |
| [blender-asset-qa](.claude/skills/blender-asset-qa) | 资产质检：破面、法线、非流形、UV、权重，交付前的必查项 |
| [blender-geometry-nodes](.claude/skills/blender-geometry-nodes) | 几何节点：程序化散布、参数化建模、节点树 |
| [blender-hair-grooming](.claude/skills/blender-hair-grooming) | 毛发：头发曲线、造型、游戏发片、导出 |
| [blender-hardsurface-modeling](.claude/skills/blender-hardsurface-modeling) | 硬表面建模：武器、载具、道具、机械 |
| [blender-lighting-lookdev](.claude/skills/blender-lighting-lookdev) | 灯光 + 镜头：布光、HDRI、构图、转盘展示 |
| [blender-pbr-materials](.claude/skills/blender-pbr-materials) | PBR 材质：金属 / 粗糙度、贴图通道、引擎可用规则 |
| [blender-pipeline-automation](.claude/skills/blender-pipeline-automation) | 批量自动化：批量转换、批量跑技能、渲染农场 |
| [blender-rendering](.claude/skills/blender-rendering) | 渲染：Cycles / EEVEE，静帧、动画、转盘，PNG / EXR / MP4 |
| [blender-scene-setup](.claude/skills/blender-scene-setup) | 场景搭建：单位、命名、资产库、交接前清理 |
| [blender-sculpting](.claude/skills/blender-sculpting) | 雕刻：体素、动态拓扑、多级精度，雕刻转游戏流程 |
| [blender-simulation](.claude/skills/blender-simulation) | 物理模拟：刚体、布料、流体、毛发动力学、烘焙 |
| [blender-stylized-npr](.claude/skills/blender-stylized-npr) | 风格化 / 卡通渲染：赛璐璐、描边、动漫脸 |
| [blender-texturing](.claude/skills/blender-texturing) | 贴图绘制：磨损、污渍、贴花、修边条、手绘 |
| [blender-time-of-day](.claude/skills/blender-time-of-day) | 时间氛围：日出、正午、黄昏、夜晚、雾、体积光 |
| [blender-weather-fx](.claude/skills/blender-weather-fx) | 天气特效：雨、雪、尘、灰烬、积水、闪电 |

## 来源

- Blender 系列（28 个）：[EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills)（MIT，协议见 `.claude/skills/blender-skills.LICENSE`）
- xilo-opus-video：[Kianzzz/xilo-opus-video](https://github.com/Kianzzz/xilo-opus-video)（MIT，协议在技能文件夹内的 `LICENSE`）

## 🎮 纯代码游戏开发

- [GameKit v4.3.0](.claude/skills/pure-code-3d-game)：数学程序化世界、性能、视觉验收与原创 UI/UX；KV 同步发行。
- [fast-anything](.claude/skills/fast-anything)：官方 MIT 热点优化技能。
- [raea-gamekit](.claude/skills/raea-gamekit)：可选原生渲染与视觉验收适配。
- [game-ui-research](.claude/skills/game-ui-research)：游戏 UI 参考与程序化设计。
