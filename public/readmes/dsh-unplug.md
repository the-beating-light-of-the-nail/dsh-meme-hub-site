# dsh-unplug

[![npm](https://img.shields.io/npm/v/dsh-unplug)](https://www.npmjs.com/package/dsh-unplug)

让 DeepSeek Harness（dsh）的插件**装得容易、拔得干净**——所有插件都能插拔自如。
Plug/unplug any DeepSeek Harness plugin cleanly. 简体中文 · [English](#english)

## 中文说明

**为什么需要它？** 官方 `dsh plugin remove` 只处理 profile 里 `dsh.profile.bundles` 列表中的 bundle：

- 不会清理 profile/home 的 `cordis.patch.yml` 里残留的插件行
- 没有"禁用但保留配置"的能力（插拔自如）
- 没有审计接口，拔完也不知道有没有残留

`dsh-unplug` 补上这三个缺口。

### 快速开始

```sh
dsh plugin add dsh-unplug
```

### 命令行

```sh
dsh-unplug                            # 什么都不输：直接给你中文菜单
dsh-unplug list                         # 列出所有已挂载插件（bundles + 补丁行）
dsh-unplug remove <插件> --yes          # 完整卸载（bundle + 补丁行 + 依赖）
dsh-unplug remove --yes                 # 忘写插件名？自动列出已装插件
dsh-unplug disable <插件>               # 禁用但不删除（保留依赖，可随时启用）
dsh-unplug enable <插件>                # 重新启用
dsh-unplug audit                        # 检测孤立行 / 悬空 bundle
dsh-unplug fix --yes                    # 一键修复（reconcile 的傻瓜版）
dsh-unplug list --all                   # 一次看所有 profile
```

选项：`--profile <名>`（找不到会自动找）、`--home <路径>`、`--json`、`--yes`、`--dry-run`。

### Agent 可调用工具

安装后 agent 获得 `unplug` 工具：

- `list` / `audit` — 只读，任何时候可用
- `remove` / `reconcile` — 需要 `force: true` 显式确认
- `disable` / `enable` — 可逆操作，无需确认

返回 `dsh-unplug/v1` 报告。

### 工作原理

- bundle 列表（`dsh.profile.bundles`）— 移出列表 + pnpm remove
- 禁用列表（`dsh.profile.disabledBundles`）— 在 bundles/disabled 之间移动
- profile 的 `cordis.patch.yml` — 删除插件行或切换 `disabled: true`
- home 的 `cordis.patch.yml` — 同上
- 孤立/悬空状态 — audit 发现，reconcile 修复

### 安全

默认只读；`remove` / `reconcile` 需要显式 `--yes`（CLI）或 `force: true`（工具）。

---

## English

**Why?** The official `dsh plugin remove` only handles bundles in the profile's
`dsh.profile.bundles` list. It does not:

- Remove patch rows from `cordis.patch.yml` (profile or home level)
- Disable/enable without deleting
- Audit for orphaned rows or dangling bundle references

`dsh-unplug` fills all three gaps.

### Quick start

```sh
dsh plugin add dsh-unplug
```

### CLI

```sh
dsh-unplug list                         # show every mounted plugin row
dsh-unplug                             # no args → friendly menu
dsh-unplug remove <plugin> --yes        # fully unplug (bundle + patch + deps)
dsh-unplug remove --yes                 # forgot the name? we list installed ones
dsh-unplug disable <plugin>             # disable without deleting
dsh-unplug enable <plugin>              # re-enable
dsh-unplug audit                        # detect orphaned/dangling state
dsh-unplug fix --yes                    # one-command fix (alias for reconcile)
dsh-unplug list --all                   # scan every profile
```

Options: `--profile <name>` (auto-falls back), `--home <path>`, `--json`, `--yes`, `--dry-run`.

### Agent-callable tool

Once installed, the agent gains the `unplug` tool:

- `list` / `audit` — always allowed (read-only)
- `remove` / `reconcile` — require `force: true`
- `disable` / `enable` — reversible, no confirmation needed

Returns a `dsh-unplug/v1` report.

### How it works

- Bundle list (`dsh.profile.bundles`) — remove entry + pnpm remove
- Disabled list (`dsh.profile.disabledBundles`) — move between bundles/disabled lists
- Profile `cordis.patch.yml` — delete entry or toggle `disabled: true`
- Home `cordis.patch.yml` — same as above
- Orphaned rows — detect via audit, fix via reconcile

### Security

Read-only by default; `remove` / `reconcile` require explicit `--yes` (CLI) or `force: true` (tool).

## License

MIT
