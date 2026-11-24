# ComputeKit — 动态算力调度 / v4.5.0
目标：利用 Agent 本地/沙盒/CI/Colab/专用 GPU 的客观执行结果自主纠错，不让 GPU 在写代码或等待用户时空耗。不是 LLM 推理加速器，绝不把 CPU 代码假装成 GPU 加速。先测算瓶颈及实际能力，再选择计算工具。按需加载本模块，非每次对话必读。
## 1. 探测与路由
无付费分配的探测：终端、CPU/RAM、Node/Python/Rust、可用浏览器、软件/硬件 GPU、CUDA/TPU 与真实图形 API 分开登记；Colab CLI/MCP 只读会话列表及认证状态（不输出 token）。不要为了探测启动付费 GPU，未探测的能力标 UNKNOWN；需在预算授权下执行小型能力探针并记录，随后才可承接同类任务。优先复用有效 CI/本地证据。
定义 job: taskId, revision, input hash, seed, requires[], externalDataAllowed, expected evidence, deadlineSeconds, max units, source provenance, command/entrypoint, tests. Provider: id, available/probed/authorized, capabilities[], costKnownZero or paid+unitsPerMinute, startup/transfer/execution/cleanup seconds (保守估计), lifecycleVerified, cleanupAvailable, leaseAvailable. GPU 可用不等于 WebGPU/Vulkan 可用；先选择兼容性，不自动用 CUDA 替代图形验证。Node 编译/单测优先 CPU；批量矩阵、SDF、流体、粒子在有并行实现且性能收益明确时考虑 CUDA；真实浏览器画面需对应渲染环境。目标手机实测不可用云 GPU 替代。
tools/compute-policy.mjs chooseBackend(): 筛除不兼容、无授权、未知费用、未验证生命周期、未知时长、缺少清理或租约、超预算/截止时间的后端；按预计计算单元后按耗时排序（先用可行免费资源）。时间按启动+传输+执行+清理乘保守系数（默认 1.25）；付费估计以用户账户实际可确认的费率为准，未知不自动付费。不同硬件速率/配额可变，不能默认 A100 或宣传固定价格。预算用已确认剩余额度扣除未结算/并行任务预留后的实际可用授权额度；无授权默认 0，禁止自动购买/续费。允许设置 deadline，免费后端在不能满足真实时限时才考虑付费。先按实际工作负载校准，不为短小任务迁移 GPU。
## 2. 一次性优先，持续会话必须证明更省
首次批处理前准备并检查脚本/输入/依赖及输出路径；合并同一 revision 的测试、数值扫描、截图，按优先级先小规模快速失败，再大批测试。通过证据键 revision+testHash+seed+backend+environment+config 缓存；只重跑受影响项，严禁跨设备/版本冒用。网络传输仅限授权任务文件，无 secret、私有仓库凭证、个人数据的非必要外发。优先 colab run（默认无 --keep），运行完成即释放；不要在写代码期间常驻 GPU。
持续会话只在可验证 ownership、外部独立 watchdog、有效共享租约、下一批任务明确、费率/预算/时长已知时允许。每批结束重新判断：保守预计空闲秒数 * 当前单位时间费率，与重新启动+依赖恢复+传输的预计计费成本比较（同一费率下可直接比时间；不同硬件用成本，重新选后端）。decideIdle() 同费率计算：仅在预计空闲严格小于恢复成本且在剩余租约/预算扣除下一批及清理预留后、并低于 idle cap 时 KEEP；否则 RELEASE。默认 idleCapSeconds=300 是可配置兜底，不是强制等待，也不是 Colab 默认；如果没下一批、失败、用户等待、任务完成、取消、超预算、费率未知或 watchdog 不可用，立即释放。不能靠空跑/心跳延长不必要的会话或绕过提供商限制。KEEP 仅授权到返回的 keepSeconds，实际 supervisor 必须执行到期清理而非只写提示词。
## 3. 资源状态与外部清理契约
状态: PLANNED→RESERVED→PROVISIONING→RUNNING→COLLECTING→KEEP/RELEASING→CLOSED；异常 CLEANUP_PENDING / RECONCILE_REQUIRED。预分配前以原子协调存储写 lease/taskId/owner/accountScope/unique session name/预算预留/expiry/幂等键；默认每账户 1 个本系统租约，按实际用户授权调整，不能把用户自己打开的 VM 当本系统资产。Cloudflare KV 仅作只读技能分发和最终证据镜像，非原子锁；多 AI 并发用 Durable Object/事务 DB/同等可靠协调器，未部署则不得宣称跨 AI 并发安全。不要盲目重复 create，超时先按独立会话名及 provider 状态核对；只在创建失败且确认无残留后重试。实时更新 remoteId 与账单预留。保存输出到受控位置，记录日志、错误、指标、可视证据、revision、实际硬件/驱动、费率来源及释放状态；收集有上限，异常清理优先于无限等待。
释放必须调用 provider 真正释放 VM/runtime 的操作（停止代码或 kernel/session websocket 不等于停费）；只针对明确归属的 exact runtime ID/session 名，拒绝删除其他 Agent 或用户的实例。finally 尝试清理；主进程崩溃/SIGKILL/连接丢失时由独立 watchdog 重查并回收过期授权租约。decideCleanup() 校验 owner/accountScope/ID 和 watchdog 过期权限；provider 确认不存在后才记 CLOSED；失败记 CLEANUP_PENDING，保存状态、告知用户、限次重试并阻止新付费分配；不宣称停费直到确认。无人值守持久运行必须部署并测试真正的 watchdog；本版本仅提供纯策略与接口契约，不含运行中的后台调度服务。任何 provider 在本地/Agent 运行环境不可调用时，继续其他可用测试或标 PENDING，不能假造调用结果。
## 4. 自动纠错
执行前定义正确性 oracle、输入边界、超时、预期误差和成功条件；首次结果不通过→区分代码/工具/配额/环境错误→修复根因→重跑相关回归→比对基线。测试样本与预期结果不准为过关而改；云端运行结果作为开发证据，不冒充最终目标设备。按预算与收敛决定重试；模型分析时若下一批尚未明确默认释放。若环境或经费不足，输出可复现命令、已验证部分、未验证部分与后续交接。
## 5. 调用方式
node tools/module-router.mjs compute
node --test tests/test_compute_policy.mjs
阅读 integrations/colab-operator/SKILL.md（官方镜像）及 integrations/colab-gamekit/SKILL.md（适配规则）。CLI/MCP 必须由实际执行 Agent 可用并认证，已镜像技能不意味着连接成功。当前发布未启动 Colab、未运行云 GPU、未部署 watchdog/lease service；策略函数是可执行本地代码，接入具体 Agent/工具时需实现 provider adapter、持久租约、预算账本、真实清理和端到端测试。