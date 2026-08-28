# 🦅 鹰眼扫描工作台（Hawkeye Scan Workbench）

DeepSeek Harness (DSH) 的源码安全扫描插件：对任意源码目录发起 AI 驱动的安全扫描，逐条落盘漏洞（Markdown + YAML frontmatter），并生成 JSON / Markdown / HTML 漏洞报告，附网页工作台可视化。

基于 [鹰眼（Hawkeye）AI 代码安全诊断平台](https://github.com/) 的流水线思路（Recon → Hunter → Dedup → Validator → Report），漏洞产物格式与平台后端 `artifacts.py` 完全一致，可直接喂给平台入库。

---

## 功能

| 能力 | 说明 |
|---|---|
| `hawkeye_scan_start` | 初始化扫描任务（校验目标目录、建 `scan_runs/<task>/` 工作区） |
| `hawkeye_scan_finding` | 逐条写入漏洞 → `findings/F-XXX.md`（frontmatter 顺序与签名公式与平台一致） |
| `hawkeye_scan_status` | 记录/查询流水线阶段（recon / hunt / dedup / review / calibrate / report） |
| `hawkeye_scan_report` | 汇总生成 `report.json` / `report.md` / `report.html` |
| `hawkeye_scan_list` | 列出所有扫描任务 |
| 网页工作台 | `http://<dsh-host>:<port>/hawkeye` — 任务列表、漏洞表格、报告页 |

- 纯 JS 实现（内置 SHA-256、手写 YAML frontmatter），**零外部依赖**，无 Node 包版本耦合。
- 签名公式：`sha256(norm_title | cwe | primary_file)[:16]`（与 Anthropic defending-code-reference-harness 一致的指纹方案）。

---

## 安装

### 方式 A：Agent Preset（推荐，即拷即用）

1. 将本目录（含 `agent.cordis.yml`、`hawkeye-scan-plugin.cjs`、`preset.yml`、`skills/`）整体复制到 `${DSH_HOME:-$HOME/.dsh}/.agent-presets/hawkeye-scan-workbench/`。
2. 在 DSH Web UI 新建会话，模式选择 **「鹰眼扫描工作台」**。
3. 会话内即出现 5 个 `hawkeye_scan_*` 工具，浏览器打开 `http://127.0.0.1:13336/hawkeye` 查看工作台。

> 说明：`agent.cordis.yml` 基于官方 `cordis`（创造模式）preset 复制而来，追加了一行 `hawkeye-scan → ./hawkeye-scan-plugin.cjs`。

### 方式 B：npm 包（工程化分发）

```bash
npm install hawkeye-scan-workbench
```

在 host composition 或 agent preset 的 `cordis.yml` 中追加一行：

```yaml
- id: hawkeye-scan
  name: 'hawkeye-scan-workbench'
```

（bare 包名按 installed-host base 解析；不发布任何服务，无需 isolate realm。）

---

## 使用

```text
1. hawkeye_scan_start(target_dir="/path/to/src", name="my-project")
   → task_id: scan-20260820-181053

2. （由 AI agent 调用 recon / hunter / review 等技能完成扫描推理）

3. hawkeye_scan_finding(task_id, title, severity, cwe, file, description, attack_chain, recommendation, ...)
   → finding_id: F-001（自动计算 signature）

4. hawkeye_scan_status(task_id, stage="hunt", note="...")

5. hawkeye_scan_report(task_id)
   → report.json / report.md / report.html

6. 浏览器打开 /hawkeye 可视化查看
```

扫描任务目录结构：

```
scan_runs/<task_id>/
├── task.json          # 任务元数据 + 阶段记录 + findings 索引
├── findings/
│   └── F-001.md       # Markdown + YAML frontmatter（机器可读 + 人可读）
├── report.json        # 机器可读报告
├── report.md          # 中文 Markdown 报告
└── report.html        # 自包含网页报告
```

---

## 配置（环境变量）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `HAWKEYE_SCAN_WORKSPACE` | `/workspace/hawkeye/scan_runs` | 扫描产物根目录 |
| `HAWKEYE_SCAN_SANDBOX_MODE` | `danger-full-access` | shell/fs 沙箱模式；宿主有沙箱后端时建议 `workspace-write` |

---

## 安全与合规

- 插件是 **Host 侧只读观测 + 任务管理**：AI 扫描推理由 agent 技能链完成；插件负责确定性的落盘与报告渲染。
- 网页路由 `/hawkeye/api/*` 为只读，task id 白名单校验（`scan-[0-9-]+`），无目录穿越。
- 仅在你已获授权的代码库上使用。

## License

MIT
