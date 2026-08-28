# DSH Auto Maintenance System 自动维护系统

> 🔧 为 DeepSeek Harness (DSH) 打造的**一体化自动维护插件**：启动自检、诊断、自动修复、配置备份、智能启动检测，让 DSH 升级无忧、开机即稳。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-blue.svg)](https://github.com/topics/dsh-plugin)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/dong3434/dsh-auto-maintenance/pulls)

---

## 📌 目录

- [😣 解决的痛点](#-解决的痛点)
- [✨ 核心功能](#-核心功能)
- [🚀 安装](#-安装)
- [📖 使用方法](#-使用方法)
- [⚙️ 配置说明](#️-配置说明)
- [📁 文件结构](#-文件结构)
- [📊 日志与报告](#-日志与报告)
- [🔧 故障排查](#-故障排查)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

---

## 😣 解决的痛点

### 痛点 1：升级后 DSH 启动失败
**每次升级或更新插件后，第二天回来 DSH 就启动失败**，配置文件可能被新版本改动、目录结构变化、依赖不兼容…… 只能手动排查，甚至要找外部工具来修复。

**本插件解决方案**：插件随 DSH 启动时自动执行一次诊断，配置异常第一时间记录并提示；再配合 `fix` 命令自动补齐缺失目录，升级后也能快速恢复正常。**v1.2.0 起，装/卸插件后自动自检，检测到坏插件自动回滚到上一次成功状态，DSH 启动失败也有救援脚本兜底，彻底告别"起不来就找人来修"。**

### 痛点 2：配置损坏无感知
配置文件（settings.yaml、.credentials.yaml 等）可能因意外写入、磁盘问题、半截更新而损坏，**等你发现时已经晚了**。

**本插件解决方案**：`backup` 命令一键备份全部关键配置与数据，保留最近 N 份并自动轮转；任何损坏都能从备份恢复。

### 痛点 3：启动冲突与端口占用
多个自启动方式同时存在，或 DSH 已运行又重复启动，导致端口冲突（如 3080 被占用）、资源浪费。

**本插件解决方案**：智能启动检测 —— 启动前探测端口是否已被占用，已运行则直接复用，避免重复拉起进程。

### 痛点 4：没有备份意识
用户往往不记得手动备份，一旦配置丢失或误删，很难恢复原样。

**本插件解决方案**：提供 CLI 一键备份 + 插件内可配置周期自动备份，无需每次手动操作，保留多个历史版本。

---

## ✨ 核心功能

### 1️⃣ 启动自检 🔍
插件随 DSH 启动时自动执行一次环境诊断（Cordis 插件入口）：
- DSH 关键目录完整性检查（plugins / skills / sessions / logs / backups）
- 配置文件存在性与内容校验（settings.yaml / .credentials.yaml）
- API 密钥键名核对（只检查键是否存在，不读取密钥内容）
- 插件目录非空检查
- 结果通过插件日志输出，健康 / 异常一目了然

### 2️⃣ 诊断命令 ⚙️
`diagnosis` 命令输出结构化 JSON 报告，适合脚本化处理与二次集成。

### 3️⃣ 自动修复 🛠️
`fix` 命令自动补齐缺失的关键目录，`--dry-run` 先预览再执行，避免误操作。

### 4️⃣ 一键备份 💾
`backup` 命令将关键数据（配置文件、技能、插件、cordis.patch.yml）打包到 `~/.dsh/backups/`，自动轮转保留最近 N 份（默认 10）。

### 5️⃣ 智能启动检测 🚀
`isPortOpen` 能力探测 DSH Web 端口（默认 3080）是否已监听，供智能启动 / 冲突检测使用。

### 6️⃣ 状态汇总 📊
`status` 命令一键输出：DSH 版本、Web 是否运行、诊断结果、备份数量与最新备份，运维体检只需一条命令。


### 7️⃣ 插件变更自动自检 🛡️ (v1.2.0)
**装/卸插件后自动体检，坏插件秒级回滚：**
- 常驻 watcher（`scripts/dsh-plugin-watch.cjs`）监听 `profiles/web/package.json`
- 装/卸插件 → 自动创建状态快照 → 自检所有插件入口与配置
- 通过 → Windows 通知 "插件自检通过"
- 失败 → **自动回滚到最近一次成功快照** → 通知 "已自动回滚"
- 从此装插件再也不用担心 DSH 起不来

### 8️⃣ 启动失败自动救援 🚨 (v1.2.0)
**DSH 启动失败也死不了：**
- 开机自启守护（autostart）检测到**连续 3 次启动失败**时自动触发救援
- 救援脚本（`scripts/dsh-rescue.cjs`）诊断原因（端口冲突/插件异常）→ 自动回滚 → 重启
- 全程 Windows 通知告知结果，无需手动排查

---

## 🚀 安装

### 方法 1：通过 DSH 插件系统（推荐）
```bash
dsh plugin add github:dong3434/dsh-auto-maintenance
```

### 方法 2：手动克隆
```bash
cd ~/.dsh/plugins
git clone https://github.com/dong3434/dsh-auto-maintenance.git
cd dsh-auto-maintenance
```

### 方法 3：本地开发安装
```bash
dsh plugin add local:~/.dsh/plugins/dsh-auto-maintenance
```

### 系统要求
- Windows / macOS / Linux
- Node.js ≥ 18
- DSH ≥ 0.1.0

---

## 📖 使用方法

### 命令一览
| 命令 | 说明 |
|------|------|
| `dsh-auto-maintenance diagnosis` | 运行完整诊断 |
| `dsh-auto-maintenance fix [--dry-run]` | 自动修复常见问题 |
| `dsh-auto-maintenance backup [--keep N]` | 备份关键数据 |
| `dsh-auto-maintenance list-backups` | 列出可用备份 |
| `dsh-auto-maintenance status` | 汇总状态 |
| `dsh-auto-maintenance help` | 显示帮助 |

### 1. 运行完整诊断
```bash
dsh-auto-maintenance diagnosis
```

### 2. 自动修复（先预览）
```bash
dsh-auto-maintenance fix --dry-run
# 确认无误后执行
dsh-auto-maintenance fix
```

### 3. 备份配置
```bash
dsh-auto-maintenance backup
# 自定义保留份数
dsh-auto-maintenance backup --keep 20
```

### 4. 查看可用备份
```bash
dsh-auto-maintenance list-backups
```

### 5. 一键状态体检
```bash
dsh-auto-maintenance status
```

---

## ⚙️ 配置说明

插件通过 DSH 的 cordis.patch.yml 挂载，配置项写在插件条目下（安装后可在 DSH 配置中调整）：

```yaml
- id: auto-maintenance
  name: 'dsh-auto-maintenance'
  config:
    home: ~/.dsh          # 可选：DSH 目录覆盖
    backupIntervalHours: 6   # 可选：周期自动备份间隔（小时），>0 才启用
```

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `home` | `$DSH_HOME` 或 `~/.dsh` | DSH 主目录 |
| `backupIntervalHours` | 关闭 | 周期自动备份间隔（小时），配置后插件自动定时备份 |

---

## 📁 文件结构

```
dsh-auto-maintenance/
├── package.json           # 插件配置（含 dsh.bundle manifest）
├── cordis.patch.yml       # DSH Cordis 挂载声明
├── README.md              # 说明文档（本文件）
├── LICENSE                # MIT 许可证
├── bin/
│   └── dsh-auto-maintenance.js  # CLI 入口
├── lib/
│   ├── index.js           # Cordis 插件入口（启动自检 + 服务注册）
│   ├── core.js            # 核心引擎（诊断/修复/备份/智能启动检测）
│   └── monitor.js         # 配置文件监控
└── scripts/               # v1.2.0 外部救援工具（独立运行，不依赖 DSH）
    ├── dsh-plugin-watch.cjs    # 插件变更自动自检守护
    ├── dsh-plugin-snapshot.cjs # 快照/回滚工具
    ├── dsh-rescue.cjs          # 启动失败救援脚本
    └── dsh-toast.ps1          # Windows 通知
```

---

## 📊 日志与报告

| 位置 | 说明 |
|------|------|
| DSH 插件日志 | 启动自检与周期备份结果（ctx.logger） |
| `~/.dsh/backups/dsh-backup-<时间戳>/` | 备份文件 + manifest.json 清单 |

---

## 🔧 故障排查

### Q1: 诊断发现问题怎么办
运行 `dsh-auto-maintenance fix` 自动补齐缺失目录；配置文件异常请从备份恢复。

### Q2: 如何从备份恢复
```bash
dsh-auto-maintenance list-backups   # 查看可用备份
# 手动将对应备份目录内容复制回 ~/.dsh 对应位置
```

### Q3: 想开启周期自动备份
在插件配置中加入 `backupIntervalHours: 6` 后重启 DSH。

### Q4: 如何反馈问题
在 GitHub 仓库提交 [Issue](https://github.com/dong3434/dsh-auto-maintenance/issues)。

---

## 🤝 贡献指南

欢迎任何形式的贡献！包括但不限于：
- 🐛 提交 Bug 报告
- 💡 提出新功能建议
- 📝 完善文档
- 🔧 提交代码（PR）

贡献步骤：
1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/xxx`
3. 提交修改：`git commit -m "feat: xxx"`
4. 推送分支：`git push origin feature/xxx`
5. 提交 Pull Request

---

## 📄 许可证

[MIT License](LICENSE) © 2026 dong3434

---

**让 DSH 始终保持最佳状态，升级无忧！** 🚀

> 💡 觉得好用就点个 ⭐ Star 吧！
