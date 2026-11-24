# Capability-aware evidence / 开发与验收解耦
开工检测实际能力，不假设工具存在。L0 文本/静态；L1 CPU/终端/构建；L2 浏览器或软件渲染；L3 GPU；L4 目标设备。等级不是质量等级，且独立记录浏览器、GPU、视觉输入、文件权限、网络、运行时、设备、测试工具。禁止声称实际未做的探测、渲染、测试。
开发可在任何等级进行。可完成的先完成；无环境时继续写算法、测试、可复现构建/回放和交接，不必等待 GPU、反复重试或降低设计目标。软件渲染可做布局/粗略画面验证，不冒充硬件或目标设备。视觉 AI 或人工均可审查；不要求每个 AI 自主截图。最终交付 ACCEPTED 必须由具备能力的执行方取得适用的真实证据，保留旧版最终 verify 门，不用合成证据替代。
独立状态：IMPLEMENTED, STATIC_PASSED, ALGORITHM_PASSED, BUILD_PASSED, VISUAL_PENDING/PASSED/FAILED, PERF_PENDING/PASSED/FAILED, ACCEPTED；未测是 PENDING，不是 FAILED。交接至少含 taskId, commit/build hash, affectedModules, capabilities, evidence/status, seed, camera, viewport, scriptedInputs, target backend/device, expected checks, run commands, artifact paths, known blockers, next owner role。GitHub/KV 同步，不重复开发。
只重测受改动影响的模块和依赖；逻辑优先单测和回放，画面/UI/动画才安排视觉，性能热路径才基准；证据按 revision、依赖哈希、平台与配置复用。批量捕获高价值视图，按根因分组修复；用预算和停滞条件控制轮次，不强制固定 5 轮；无改进则记录并交接。不得以修饰遮掩缺陷。
