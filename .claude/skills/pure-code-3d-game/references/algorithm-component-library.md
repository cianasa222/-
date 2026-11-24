# 算法组件库 · AlgorithmKit 组成与接口边界

目标是**每个模块保留方法而非结果**；《雪迹》、CrazyBike、MakeHuman、Ossos 等只是可审查的算法参考或明确许可的源码参考，不是必须引入的项目依赖，也不是素材仓库。正式运行时仅由本项目选定的渲染后端负责把程序化网格和 Shader 上屏。

## 稳定的分层组合

| 组件 / 负责人 | 输入 | 输出 | 不得知道/擅自改变 |
| --- | --- | --- | --- |
| `MathKit`（通用） | 整数 Seed、坐标、公式参数 | RNG、价值噪声/fBM、曲线、矩阵、数值求解 | 不读取 DOM、资产 CDN、游戏玩法 |
| `GeometryKit` | 参数化体积/曲线、采样分辨率、Seed | 顶点/索引、局部材质区、切线/法线、LOD 描述 | 不加载 GLB 或改变引擎 |
| `AnatomyKit` | 高度、骨架语义、体型/五官设计参数 | 可生成骨中心/尺寸/面部/器官及校准数据 | 不直接创建 GPU Device |
| `GroomKit` | 曲线、毛流/分岔规则、Seed、屏幕大小 | 发束/眉睫 3D 网格或 shader 输入 | 不调用贴图 API 加载外部毛发 |
| `RigKit` | 语义骨架、局部绑定变换、体块/骨段距离规则 | 生成层级、蒙皮权重、rest pose、IK 约束 | 不内联 FBX/BVH/VRM 的帧数据 |
| `MotionKit` | 动作意图、时间、速度、足底接触、骨长 | 当前关节 pose、事件及自然过渡 | 不依赖预录曲线，不直接修改 physics tick |
| `WorldKit` | 坐标、Seed、天气/地形语法 | 查询高度/障碍与程序几何、实例散布 | 不把物理与渲染建立成不同地形 |
| `ShaderKit` | 法线、材质物理参数、时间、灯光/空气 | 光照与采样函数、颜色、后期计算 | 不替换 renderer owner |
| `FXKit` | 事件、Seed、世界力场、LOD | 粒子/雪花/火焰/碎屑位置与生命 | 不改变玩法碰撞或伤害 |
| `AudioKit` | 事件、频率/包络/噪声/节拍参数 | 实时合成音频 sample/voice | 不加载音频文件或越过音量限制器 |
| `SceneAssembler` | 配方与模块 manifest | 固定更新顺序与 pose/scene snapshot | 不让各 AI 改公共入口 |
| `VerificationKit` | Generator 版本/Seed、证据和冻结机位 | 结构、回放、审计、帧预算/视觉待验报告 | 不自行把 mock GPU 当真机 |

### 唯一共享契约

```ts
export interface GeneratorRecipe {
  generatorId: string; generatorVersion: string;
  inputSchemaVersion: number; seed: number;
  params: Record<string, number|string|boolean>;
  provenance: Array<{parameter:string;kind:'design'|'measured'|'derived';reference?:string;units?:string}>;
}
export interface ProceduralOutput<T> {
  recipeHash: string; generatorHash: string;
  units: 'meters'|'seconds'|'radians'|'unitless';
  result: T;  // derived, never an imported third-party model or dense keyframe cache
}
```

后续仍须冻结固定的代码 ABI、坐标、版本和 Seed 语义；生成器代码改变应变更 `generatorVersion` 并强制重算受影响的输出。每个实体 RNG 采用 `worldSeed + entityId + generationStage` 派生，**不能依赖迭代顺序**：AI 插一棵树后不应导致全地图雪花都变化。

## 先做真实小切片，再推广

1. 用 `tools/procedural-core.mjs` 对同一 Seed 生成头部体积、两根独立 3D 眉毛和步态。几何和姿态输出给显式 `MeshAdapter`，不要把原始算法绑在 Three/Babylon 对象上。
2. 一个 BodyRecipe 导出两种体型，角色骨架来自自身比例参数，不复制 v1 T-pose 人体文件；动作由 phase/IK 求解，并用足接触轨迹审计。
3. 复用同一 Seed+时间生成数百片雪花和不同的六折对称晶形，以 Instancing/Shader 做真实设备测试。不得在 JS 每帧分配大量粒子对象。
4. 给游戏调试页面提供 `__game.profile()` 与 `/lab` 场景，输出正/侧/背、运动高应力姿势、灰模与完整材质镜头。未达到视觉质量，标 `VISUAL_PENDING` 并继续修局部算法。
5. 再引入 ShaderKit（BRDF/毛发各向异性/程序虹膜/皮肤散射）、程序衣物、动态头发/布料、音频；每件都遵守同一 ABI，不因新模块需要就推翻整体渲染器。

## 关于纯代码与 SVG

贝塞尔、SVG path 可以作为数学曲线的描述和离线 Debug 显示，但最终 3D 眉毛、鼻翼和眼皮要有局部体积、法线、材质与变形。`CanvasTexture` 可用代码按材质方程填充，但不使用预存图像/图集；纹理/像素缓存只是函数结果。高端与移动端使用同一视觉配方，按屏幕投影选择可校准 LOD。

## 来源参考，不是导入资产

- 冰雪、地形与游戏运行方式：《雪迹》 `https://github.com/huiskylabs/cold-smoke`（MIT 程序源码，具体 file 按许可核查）
- 程序化 3D 骑手与轻量图形抽象：`https://github.com/jeffierw/crazybike`（MIT/第三方归属记录核查）
- IK/骨架与引擎解耦：`https://github.com/sketchpunklabs/ossos`（MIT）；仅引入核验的独立数学模块，不依赖其提供动作素材
- 法线、表面、BRDF 与环境：Filament / Khronos glTF 公开文档，按公式独立实现，保留引用与许可审查

任何使用第三方代码（即使数学库）仍须核对 LICENSE/NOTICE。任何第三方资产、mocap 曲线、网格或纹理数据，都不能因为通过 JavaScript/JSON 搬运而被声明为 code-only。