# dsh-maestro

DSH 模型路由插件：高阶模型（Planner）定方向、低阶模型（Executor）干具体活。术语见 `CONTEXT.md`，架构决策见 `docs/adr/`。

## 交付形态

**Profile 本地插件包**（本仓库即包）：`dsh plugin --profile web add link:/data/dsh-maestro` 装入 web profile 的 `dsh.profile.bundles`，`cordis.patch.yml` 插入 host 行，`dsh.client` 声明携带手写 client bundle。host+client 双面常驻，刷新/重启存活。

安装三步：**add → 重启 DSH 进程 → 开新会话自检**。host 半无 HMR，不重启的话芯片、设置页与四个工具都不会出现（这不是装失败了）；自检 = 新会话工具列表含四个 maestro 工具、设置面板含「Maestro」页。改动插件代码后同样需重启 DSH 进程生效。

其它安装来源（`dsh plugin add` 原样转发 pnpm）：**tarball**——`npm pack` 后 `dsh plugin --profile web add /path/to/dsh-maestro-<版本>.tgz`（拷贝式安装，升级需重新 pack + add）；**git URL** 同理支持。开发态用 `link:`（改动即源码，只需重启）。

> 历史形态（已退役）：会话级动态插件（刷新后 client 半需手动重激活）、agent preset（无法携带客户端 UI）。决策见 ADR-0002。

## 工具

- **`maestro_execute`** — 发起一次委派（Delegation）：自包含任务书 → 一次性 Executor 子 Agent。参数：`task`（必填）、`context`、`label`、`role`（按任务指定执行角色，缺省用默认角色）、`provider`/`model`（单次路由覆盖）、`denyTools`/`allowTools`（收窄执行者工具面，maestro 工具恒被移除以防递归）。
- **`maestro_routes`** — 列出可调度的 provider/model 路由。
- **`maestro_setup`** — 查看/修改执行角色与全局思考等级（对话式读写 `maestro.config.json`；`role` 指定目标角色，缺省为默认角色；支持 provider/model/prompt/reasoningEffort）。
- **`maestro_stats`** — 委派统计（聚合工作区委派账本，含最近 10 条记录；无账本回退进程内计数）与配置解析诊断。

## 界面

- **对话框芯片**（输入框左下，分叉图标 + 当前角色名）：悬停显示默认角色与思考等级，点击弹出「角色 + 思考等级」双下拉（选完立即写入，无保存按钮；等级经 `llm.resolveModelInfo` 按当前角色路由实时获取）。日常切换在这里。
- **设置页**（侧栏设置 →「Maestro」）：高级项——执行角色管理（新建/编辑/设默认/删除/改名）、**从模板新建角色**、**最近委派**（委派账本只读展示）、配置诊断警示（配置文件损坏/缺字段时亮出，不再静默回退）。

两处经同源 `/maestro/*` HTTP 接口与 host 半通信；工作区由当前会话的 sessionId 解析。

## 角色模板（Role Template）

`templates/roles/*.json` 随包内置四个角色模板——代码执行 / 代码审查 / 调研检索 / 批量杂务。设置页「从模板新建」一键**实例化**为普通执行角色（内容拷入 `executor.roles`，此后与模板脱钩可自由修改；撞名自动加序号）。模板携带建议路由，当前环境不可用时降级为内置默认并在创建前提示。模板提示词只写领域人格与产出要求，执行者元约束由框架统一前置；作者规范见 `templates/README.md`。决策见 ADR-0005。

## 默认路由（Route）解析顺序

1. `maestro_execute` 的 `provider`/`model` 参数（单次覆盖）
2. `maestro_execute` 的 `role` 参数选中的角色（单次指定）
3. 会话工作区根目录 `maestro.config.json` 的默认角色：`{ "executor": { "roles": { "<名>": { "provider": "…", "model": "…", "prompt": "…" } }, "activeRole": "<名>", "reasoningEffort": "…" } }`（旧形态读取时自动迁移）
4. 内置默认：`kimi-coding/kimi-for-coding`

`reasoningEffort`（思考等级）是**全局设置，对所有执行角色生效**；经 `agent/request` waterfall 注入到 Executor 子 Agent 的请求（按 `origin: subagent` + 路由匹配识别，**只对角色表内的路由注入**——单次覆盖到表外路由时委派结果会带「思考等级未生效」提示）；`prompt` 替换委派任务书中的角色提示语。

委派前做路由预检：provider 未注册或 model 不存在时直接报错并列出可用路由，不会炸在底层。

## 委派账本（Delegation Ledger）

每次委派（含失败）向工作区 `.maestro/delegations.jsonl` 追加一行 JSON：`{ ts, label, role, route, routeSource, stopReason, ok, durationMs, error?, outputTail?, usage? }`（`usage` 为 token 计量，尽力而为；超 512KB 原子轮换；目录自带 `.gitignore` 不污染你的 git status）。`maestro_stats` 聚合该文件（完成率、耗时、token 合计、最近 10 条），设置页「最近委派」展示尾部 20 条与摘要——委派失败后先在这里复盘，而不是问规划者转述。注意「完成率」指停止原因为 completed 的占比，不代表任务答对。

## 验证

- `npm test`：49 用例——`lib/core.js` 纯函数核心（三形态迁移矩阵、角色 patch 语义、撞名、模板校验、账本聚合）+ host 集成套件（mock 宿主 ctx：委派入账、fail-fast、并行委派、waterfall 注入、HTTP 端点、账本轮换、契约探针）。
- `npm run verify`：bundle 语法、导出形状、模板全量校验、打包清单、术语表，以及对 DSH 宿主内部 API 足迹的探测（`--strict` 把足迹缺失升级为失败）。**升级 DSH 后先跑这个**，记录见 `COMPATIBILITY.md`。
- 最终验收：重启 DSH 后开新会话，确认工具列表含四个 maestro 工具、设置面板含「Maestro」页。
