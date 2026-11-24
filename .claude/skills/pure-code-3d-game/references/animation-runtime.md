# AnimationRuntime · 轻量程序化动画运行时

## 默认策略
JS/TS 或现有引擎原生动画接口优先；Ozz 是可选本地 C++/WASM 计算库，不需要服务器、GPU 或替换引擎。只有动画热点 profiling 和端到端收益通过项目预算，才切换后端。单 HTML、少角色默认不加依赖。严格纯代码：RigRecipe + ActionRecipe + seed/time 生成骨架和动作；生成关键帧仅可删后重建的派生缓存，不导入外部动作、模型或示例媒体。缓存键含生成器版本、种子、骨架拓扑、动作参数、采样误差阈值与后端版本。

## JS 参考组件
tools/animation-runtime.mjs: local TRS {t:[x,y,z],r:[x,y,z,w],s:[x,y,z]}，正尺度，米/Y-up/项目手性，主动四元数。makeProceduralClip({duration,segments,joints,poseAt,loop}) 从纯函数生成均匀采样姿态；循环验证首尾接缝（不含根位移累积）。sampleClip(clip,time) 线性位置/尺度、最短半球 nlerp、clamp/wrap；仅接收已生成且保持不可变的 clip。blendLocalPoses(rest,layers,threshold) 归一化非负权重、0..1 骨骼掩码、低权重 rest 补足、半球校正。localToModelMatrices(parents,pose) column-major T*R*S 和父子矩阵乘积，父索引先于子索引，-1 根，保留非均匀缩放 shear。校准 bind pose、轴与拓扑。标量参考非 Ozz 移植、压缩器、GPU 蒙皮或无分配性能版；多层四元数混合顺序可能影响结果。

## 运行流程
动作意图/固定步 → 程序化步态、手势、呼吸/攻击配方 → 采样或直接解析姿态 → 普通层混合/骨骼 mask → 可选 additive（相对明确 reference pose 的 delta，固定顺序；本模块未实现）→ 根运动提取（游戏与动画位移只计一次，跨循环解缠）→ local-to-model → IK/脚锁/瞄准 → 更新受影响子树 → 二级物理 → skin matrices = model * inverseBind（网格坐标转换另计）→ 渲染。游戏权威模拟持有物理根；IK 校准坐标系；禁止每帧逐骨骼跨 JS/WASM 边界。

## Ozz 适配
固定上游 744eb9d99f606eda849acb0b1204f7a3dc20bca1；MIT。读取 integrations/ozz-animation/UPSTREAM.md。RawSkeleton/RawAnimation 从程序生成，offline builder 可置于开发期，不把导入工具打进游戏。按角色/活跃 clip 管理 SamplingJob::Context，缓存回收/clip 替换显式 Invalidate，独立线程不共享可变 context；SoA 四骨骼分组/填充；BlendingJob 层/骨骼权重、rest threshold，LocalToModelJob 矩阵和子树，IK/SkinningJob 可选。ratio=time/duration，循环与事件由应用管理。Ozz 不自动生成人体、原创动作、通用重定向、布料或双四元数蒙皮。Native/WASM 绑定未实现，不自动下载或打包。

## 验收
同骨架/配方/种子/输入/镜头比较 JS、引擎、Ozz；1/10/50/100 角色、23/59/120 骨骼只是起始样本，按项目调整。测首次加载、压缩包、WASM compile/instantiate、边界开销、采样/混合/FK/IK/蒙皮各段 p50/p95、堆峰值、帧时间与实际 iOS/低端设备。预分配、批量调用、减少复制；SIMD/非 SIMD 分测、能力检测、JS 回退。验证符号无关角误差、根运动偏差、矩阵容差、脚滑、接触、过渡、循环、长时稳定；误差预算按项目确定。目标设备端到端收益且体积/启动/内存预算通过才启用，否则回退。无实测标 PERF_PENDING，不报倍速或 WASM 体积。
