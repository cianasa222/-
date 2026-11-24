# 通用项目契约与阶段验证

命令均以项目根目录为目标。init 默认只创建草稿和 Node 工具。填写 gamekit.json 后执行 plan，清单中的 key 是证据记录的键。check 验证项目声明，verify 验证对应阶段的证据。schemaVersion:1 的项目继续从原 Web 3D 入口运行。通用与专项可以在各自目录中针对同一构建运行，不必转换引擎或旧记录。

## 如何填写

- name、genre、assetMode，coreLoop 的 action、decision、feedback、continueOrFinish；runtime 记录实际引擎、构建入口和时间模型。模板留空，开发 AI 从用户需求和仓库填入；无运行时动作的回合制仍有行动顺序与动画时钟。
- targets 逐一写 id、platform、device、inputs、views、budgets。视图用独立 ID，并写 framing（构图/交互界面）与 priority（此处必须读清什么）。budgets 声明指标、单位和上限。延迟、内存、加载时间或帧时间均可。固定目标最小配置与样本方法后再测量。
- features 按实际需要选 saves、settings、audio、network、economy、procgen、streaming、narrative、wardrobe、localization、onlineService。默认应用到各目标；targets[i].features 可显式选子集（如展会设备不保留进度）。extraChecks 加项目独有的 ID、阶段、目标和预期结果，如“切换机位后恢复控制权”。图形 API、世界单位、联网、存档和人物材质均无通用默认要求。
- 原型只验玩家能实际完成一次核心循环。切片再验首次体验、反馈、重试/继续、输入中断、每类操作与视图。发布加首装、可访问提示、长时游戏、交付恢复和素材来源，再叠加已声明功能。省略与项目无关的系统；多输入/多镜头的高风险组合以 extraChecks 单独加入，避免盲跑笛卡尔积。

## 证据协议

执行 node tools/gamekit.mjs plan . --stage slice。由项目 CI、测试员和试玩者记录真实观察，再执行 node tools/gamekit.mjs verify . --stage slice --evidence evidence/slice.json。每项 proof.path 为 evidence/ 下的非空文件，sha256 对应真实字节。一份网格样片或测试摘要不能代替玩家体验；视频、回放、可访问性观察、平台原生日志可按需要使用。多个检查可引用同一份记录，用 observed 写清各自的动作、时间点与结果。

下列仅示范一个原型证据条目；填入实际项目、提交、游戏输出与真实摘要。

```json
{"project":"纸径","revision":"<git HEAD>","stage":"prototype","cases":{"desktop/play-loop":{"status":"pass","observed":"第 2 次旋转闭合路线，结算后撤销，步数与棋盘恢复。","proof":{"path":"evidence/first-play.log","sha256":"<文件 SHA-256>"}}}}
```

release 还需要 build.exitCode、build.artifactId、build.proof，以及 measurements[targetId] 的 device、platform、proof、metrics。各指标按声明的 ID 记录 {unit,value}。用可追溯的流水线生成产物 ID；检查器核对提交与证据文件，不会代为编译任意项目命令，也不能证明自报数据来自真机。实机环境缺失就标待验证。发布验证应在干净构建上进行。原生项目可将平台日志导出给 Node 开发工具，无需把 Node 或 Web renderer 打进游戏。

镜头专项用 targets[i].views[j].checks 登记本视图的项目自定义检查 ID，plan 会生成单独的 slice 项并沿用至 release。例如 inspect 的 glasses-gaze 与 skin-backlight 需要近景转头/逆光，follow 的 garment-motion 需要走跑与抬臂。棋盘无需运行上述材质检查。有具体定量要求时用专项验证器或引擎测试输出证据，另在 extraChecks.expected 注明明确阈值。
