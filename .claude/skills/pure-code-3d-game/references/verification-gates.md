# 3.1 交付与迁移

新项目 init 生成 quality-contract.json。旧项目从 tools/quality-example.json 复制范本，按实际设备、镜头、主体和模块改写。check 对未迁移旧项目仍可做结构检查；verify 必须有契约。每种渲染后端至少有一个对应目标，按项目需要加横竖屏。全部示例阈值须按项目校准。停用的项目必须写具体原因。只有渲染运行时代码、干净构建、可信设备采集与画面签收均就绪才能发布。

运行 node tools/gamekit.mjs verify . --evidence evidence/release.json。见 tests/test_quality.mjs 的完整**合成**正例，它只用于测检查器。各字段如下：

- schemaVersion=1，project 匹配项目名。build 包含 exitCode=0、log 相对路径、revision 为实际 Git HEAD。render.errors=0 且 render.realGpu=true。运行于干净 CI 检出；工具读取 ID 和证据，不能自行证明设备或操作者身份。
- targets 以契约 target.id 作键。每个对象包含 device、backend、width、height、sampleFrames、frameP95Ms、errors、realGpu 和 screenshots。图像由可信运行器以 evidence/ 下完整非交错 8-bit RGB(A) PNG 写出，宽高与目标一致，每个约定镜头具备独立采集。检查解压长度、头信息和重复文件摘要；最终由人检查画面内容与动作。游戏必须隔离证据目录，发布物中意外图片仍会触发 code-only 检查。另由打包 CI 审计构建依赖（包含内联、跨域请求）。
- 启用碰撞时，collision 填写 thinWall、glancingSlide、slopeBoundary、restingContact、spawnOverlap、layerFilter 六种实测，各含 passed、ticks、maxPenetrationM。薄墙另含 relativeSpeedMps、barrierM、missedHits。使用正式控制器采样。
- 人物启用时，character 包含 heightM、maxPlantedFootErrorM、visibleMaterialRegions 和 geometryStats 路径，每台目标另含 gameHeightPx。motion.constraintFailures=0。实验室导出 geometryStats。自报骨骼数据须由生成器单测复核。
- 特效启用时，每个目标的 fx 填写 concurrentEmitters、peakParticles、onFrameP95Ms、offFrameP95Ms、warningsReadable、gameplayHashHigh、gameplayHashLow 与 observedEvents。哈希是去除装饰状态后的确定性玩法状态/事件序列 SHA-256。两个档位都要实跑。
- visualReview 含 status=approved、reviewer、notes。证据格式通过仅表示可供审查；设备缺测标 VISUAL_PENDING。

3.2 可选 lighting 把方向光阴影列入实际交付契约。启用时每个 target.shadowBudget 声明 map size、覆盖精度、边缘漂移、影隙与配对帧时间预算，每个 evidence.targets[id].lighting 提交对应观察值。查看 tools/quality-example.json 与 tests/test_quality.mjs 的字段名，按 references/lighting-and-shadows.md 采集。其他照明方案需在项目中用对应的探针/烘焙/接触证据验收。


3.3 角色项目按实际服饰在 character.surfaceChecks 中选择 garment-motion、fabric-turn、skin-backlight、glasses-gaze、hair-lod。可复用已约定的镜头与证据。每个目标的 release 记录在 targets[id].surfaces[case] 提供 passed、notes、views（至少两个不同的已登记截图键）。verify 同时校验目标截图。具体动作与转灯回放由项目保存，人工签收应读实际帧序列；布样不能给正式角色签收。没有该材质的项目不添加对应条目。

## v4.1 Strict Procedural Release Gate
code-only 项目额外需检查真正发行包和运行时 asset 网络请求，验证每个生成器依据相同版本、参数、Seed、时间可重复输出。采用独立角色/世界实验室提供游戏机位、侧视/近景、动作高应力姿势、动态接地与目标设备帧预算，要求人工或可信视觉验收。tools/procedural-gate.mjs 仅作启发式静态预检，不能独立证明没有隐藏资产、GPU 质量、版权或性能。

## v4.2 §3.4 “像人”验收门（人物交付必过，不通过不许交付）

人物启用时，`verify` 除 3.1–3.3 的字段外，必须在 evidence 中提交 `character.humanLikeness`，四项全过才算通过：

| # | 检查 | 通过标准 | 证据 |
|---|---|---|---|
| 1 | 剪影比例 | 灰模 + 平光下剪影：头身比 6.5–8（成人约 7.5）、肩比髋宽 15–30%、腕对齐腹股沟、肘约在腰线；与配方 `LEN` 常量一致 | 背面 + 侧面灰模截图 |
| 2 | 关节不掐管 | 膝/肘/髋/肩深弯（≥90°）时肢体不断细、不出折痕；有半程辅助骨与 3 骨骼蒙皮权重记录 | 深弯动作截图（蹲姿/压弯） |
| 3 | 服装边界无锯齿 | 夹克/裤子分界、袖口、头盔与衣领交界在特写下无锯齿毛边；边界由 shader 内 SDF 重算（不是顶点切分） | 边界特写截图 |
| 4 | 运动中像人 | 运动中截图（滑行/奔跑/撑杖瞬间）：姿态由 IK 求解器算出，手握杖、脚踩板，重心合理；无正面直立 T 形站姿截图充数 | 运动中截图 + 3–10 秒短视频 |

另：默认设计必须藏脸藏手——截图中出现可见眼球/鼻子/嘴唇/眉毛/睫毛即判失败，除非项目已过本门并经用户明确批准露脸。`visualReview` 签收时必须逐项记录以上四项的结果，不得只写“画面通过”。数值门禁仍由 `gamekit.mjs verify` 校验；本门是人工/可信视觉验收，不得用数值单测代替。
