# ComputeKit v4.6 — Agent 直接调度（用户指定）
本版取代 v4.5 的中央资源租约和独立 watchdog 方案。**不部署 Compute Gateway、Cloudflare Worker/DO/Workflow/Cron、看门狗或常驻计算代理。** Cloudflare KV 仅可用于既有技能版本分发，与算力调用无关。Agent 自己选择并使用已经合法授权、真实可用的本地/沙盒/CI/Colab 工具；无权限时继续可用研发并记录 PENDING，不假设所有 AI 都能执行。
## 1. 权限和任务准备
每个 Agent 在自身支持的客户端一次性接入官方 Colab CLI 或 MCP（具体依客户端能力和官方授权流程）；只用自己已授权的身份。禁止共享 Google 密码、OAuth token、Cookie 或把凭证写进 GitHub/KV/聊天；不能用技能文件给客户端添加实际工具权限。认证有效性、CLI help/版本、会话列表可用非分配调用检查。读取官方 integrations/colab-operator/SKILL.md，优先本地 CLI 官方 colab run 单次任务；浏览器桥接需对应本地客户端，不能假设任意云 Agent 可用。
提交前定义 revision、输入哈希、seed、能力、正确性 oracle、输出、依赖、时限、费用估计和用户已授权预算；所有代码/测试和上传文件预先准备好。外传数据须获授权，禁止附带密钥。先用本地 CPU 或免费已验证环境，只有需要外部并行/图形能力或真实期限时考虑远程。CUDA 与 WebGPU/图形能力分别检查，云端不代替目标手机验收。已知硬件型号和费率才可自动消耗已授权 CU，不自动购买；未知预算或费率时仅用可确认免费的环境或请用户授权。每个 Agent 单独记录预算，不存在中央原子总账：多 Agent 同账号不能保证全局并发/总费用限制；建议人为给各 Agent 分配独立额度并避免并行启动，不能把本地限制宣传为全局强制。
## 2. 按需启动，执行完即关
默认使用已核验的 colab run -s UNIQUE_NAME [--gpu T4] SCRIPT.py（不加 --keep）；使用已准备好的脚本，集中跑数值验证、回归、图形测试，结果按需回传，正常退出后核实 provider 会话列表。显卡必须用该版本官方 allowlist，未知型号不能默默升级 A100。对 MCP/API：先确认实际工具支持创建、执行、取回结果、真正删除 Runtime 和查询状态；仅停止代码、断开连接或删除 Jupyter session 不等于 VM 释放。若缺少生命周期控制，不自动申请付费算力。
同一不中断的工具调用中可批量执行已准备的多个任务；若自行 new/exec/stop，用 try/finally 清理并校验，记录唯一名称、账户范围、运行时 ID 和所属任务。decideIdle() 只在同一执行批次内部、下一批已准备、保留成本严格小于重启、时限和预算仍足够且 finally 可用时允许短暂 KEEP_IN_BATCH；默认300秒只是同批次的可调保护上限，不是固定等待，也不是实际后台定时器。**一旦要返回模型思考、修改源码、等待用户、跨工具调用或结束任务，立即释放；不跨 Agent 回合保留付费 VM。** 如一次性官方 run 能完成所有任务，不另行手动保留会话。
## 3. 正常清理及风险
执行结束/报错/可处理的取消都在当前工具生命周期中尝试 stop/delete exact owned runtime，再确认 provider 状态。禁止误删用户或其他 Agent 的会话。创建超时先按唯一名称查询，避免重复创建。失败记 CLEANUP_PENDING，停止该 Agent 后续付费申请，能操作时限次重试；恢复会话时先核对自己的历史未关闭任务。无法确认则报告真实运行时 ID/名称及手动终止路径。未确认释放不可宣称不再扣费。
不设 watchdog、定时轮询服务、后台租约清理或 Cloudflare 调度。硬断线、进程被杀、权限失效、provider 故障仍可能留下计费 VM；这是用户选择简化架构后的剩余风险。一次性 colab run 的正常清理不保证 SIGKILL 后必定释放；需用户在 Colab 管理会话中手动回收。不要靠保活规避限制。
## 4. 自主纠错与证据
自动执行最小可复现测试→读取报错/误差/截图→按根因修复→仅复测受影响部分→保留 revision、环境、日志、指标和释放状态。缓存匹配的测试证据，避免重复花费。无需算力时不启动。没有 Colab 工具也不阻塞项目。
tools/compute-policy.mjs 提供 chooseBackend、decideIdle、decideCleanup 三个纯策略函数；不能代替真实 CLI/MCP 操作。模块入口 node tools/module-router.mjs compute；测试 node --test tests/test_compute_policy.mjs。本次没有连接或启动 Colab，无实时账单验证；实际调用权来自客户端的用户授权，不来自技能同步。
