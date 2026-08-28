# dsh-ssh-pro

**DeepSeek Harness 的 SSH 增强运维插件** —— 补齐 base dsh-ssh 插件容易忽略的操作：
连接测试、远程目录浏览、`~/.ssh/config` 导入、known_hosts 指纹检查、多主机批量执行。

> 独立社区项目。复用 [@linxin666/dsh-ssh](https://github.com/zhu1090093659/dsh-web-ui)
> 的主机配置存储（Apache-2.0），但**无运行时依赖**——只依赖 `ssh2` 库，可与任何 SSH 插件共存。

## 为什么做这个

原版 dsh-ssh 提供了 `ssh_list/exec/upload/download/tunnel/cluster` 和完整 GUI，但
**5 个引擎已有能力没暴露给 agent**，正是"存在但容易被忽略"的缺口：

| 缺失的能力 | 原版状态 | 本插件 |
|---|---|---|
| 连接测试 | 引擎有 `test()`，无工具 | ✅ `ssh_test` |
| 远程目录浏览 | 引擎有 `ls()`，无工具 | ✅ `ssh_ls` |
| ssh-config 导入 | store 有 `importFromSshConfig`，无工具 | ✅ `ssh_import` |
| 指纹确认 | 无 | ✅ `ssh_keyscan` |
| 多主机批量 | cluster 依赖 GUI 面板 | ✅ `ssh_multi_exec`（独立实现） |

## 特性

- 5 个原生工具：`ssh_test` / `ssh_ls` / `ssh_import` / `ssh_keyscan` / `ssh_multi_exec`
- 直接读 `~/.dsh/dsh-ssh.json`（与 dsh-ssh GUI 配置互通）
- `ssh_multi_exec` 支持别名/环境/标签过滤 + 并发控制
- 附带 `SKILL.md` 技能文件
- Schemastery 配置 + bundle patch 层
- 安全模型与 dsh-ssh 一致：0600 主机库、输出原样返回、无密钥泄露

## 前置要求

- DeepSeek Harness（dsh）
- `ssh2` npm 包（插件依赖）
- 主机配置：dsh-ssh GUI 配置，或 `~/.dsh/dsh-ssh.json`（可用 `ssh_import` 从 `~/.ssh/config` 导入）

## 安装

```yaml
# profile 的 cordis.patch.yml
- insert:
    - id: ssh-pro
      name: './src/index.js'
      config:
        storePath: ~/.dsh/dsh-ssh.json
        sshConfigPath: ~/.ssh/config
        timeoutMs: 30000
```

```bash
# 或本地开发
pnpm dsh web --patch ./dsh-ssh-pro/cordis.patch.yml
```

## 工具

| 工具 | 行为 |
|---|---|
| `ssh_test` | 连接并跑 `true`，报延迟/错误 |
| `ssh_ls` | SFTP 列目录（名字/类型/大小/mtime） |
| `ssh_import` | 解析 `~/.ssh/config` 导入主机库（跳过已存在/通配符） |
| `ssh_keyscan` | 检查 known_hosts 是否已有该主机指纹 |
| `ssh_multi_exec` | 并发多主机执行（别名/环境/标签过滤） |

## 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `storePath` | `~/.dsh/dsh-ssh.json` | 主机库路径 |
| `sshConfigPath` | `~/.ssh/config` | 导入源 |
| `knownHostsPath` | `~/.ssh/known_hosts` | 指纹检查 |
| `timeoutMs` | `30000` | 默认超时 |

## 安全说明

- 密码/passphrase 存 0600 主机库；工具从不输出密钥
- `ssh_multi_exec` 输出原样返回（`env` 等命令可能带回远端环境变量）
- `ssh_keyscan` 只读；新主机提示需用户确认指纹

## 目录结构

```
dsh-ssh-pro/
  src/index.js            # 插件入口：5 个工具 + ssh2 引擎 + 配置
  skills/ssh-pro/SKILL.md # agent 技能
  docs/                   # 文档
  cordis.patch.yml        # bundle patch 层
```

## 许可

Apache-2.0。
