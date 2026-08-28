# dsh-agent-project-sync

把 Codex、Claude Code 等本地智能体使用过的**项目目录**汇总到一个 DSH home，并注册为 DeepSeek Harness 原生 Workspace。不同智能体继续操作同一份源码；插件不复制项目、不迁移聊天记录，也不建立第二份项目文件。

## 它解决什么

一个项目可能先在 Codex 中打开，又在 Claude Code 中继续，最后希望从 DSH 接管。各工具保存会话的方式不同，但都记录了工作目录 `cwd`。本插件只读取 JSONL 开头的这项元数据，按真实目录路径去重，然后：

1. 生成当前机器的共享项目清单：`$DSH_HOME/agent-project-sync/projects.json`。
2. 通过公开的 `ctx.workspaceRegistry` API，把存在的目录注册为 DSH Workspace。
3. 提供本地 CLI，让其他智能体读取或手动补充同一清单。

当前内置 Codex 与 Claude Code 适配器；结构允许以后添加 Cursor、Kimi、OpenCode 等来源。

## 安全边界

- 只读取每个 JSONL 文件开头最多 128 KiB，并只提取 `cwd`；不保存或返回聊天正文。
- 默认全部写操作都是 dry-run；DSH 工具真实写入必须 `confirm=true` 且 `dryRun=false`。
- 同步只新增或复用 Workspace，绝不删除 Workspace、会话、项目目录或源智能体数据。
- 清单使用原子写入、进程锁和用户私有文件权限；它包含本机绝对路径，属于机器本地数据，不应提交到公开仓库。
- 指定另一个 DSH home 时，通过 `DSH_HOME` 或插件的 `dshHome` 配置选择；插件不会直接改写其他 home 的内部 Workspace 数据。要同步哪个 home，就在那个 home 的 profile 中加载插件。

## 安装

从 GitHub Release 安装：

```bash
dsh plugin --profile web add https://github.com/Harzva/dsh-agent-project-sync/releases/latest/download/dsh-agent-project-sync-0.1.0.tgz
```

开发目录链接安装：

```bash
npm install
npm run check
dsh plugin --profile web add -w link:/absolute/path/to/dsh-agent-project-sync
```

安装后重新启动对应 profile。若使用单独的 DSH home：

```bash
DSH_HOME=/path/to/selected-home dsh plugin --profile web add -w link:/absolute/path/to/dsh-agent-project-sync
DSH_HOME=/path/to/selected-home dsh web
```

也可以把 bundle 行直接加入 profile：

```yaml
- insert:
    - id: agent-project-sync
      name: dsh-agent-project-sync
      config:
        sources: [codex, claude]
        maxFilesPerSource: 20000
        maxHeaderBytes: 131072
        excludePaths: []
```

## DSH 工具

| 工具 | 默认行为 | 用途 |
| --- | --- | --- |
| `agent_projects_scan` | 只读 | 发现 Codex/Claude 项目并显示哪些已是 Workspace |
| `agent_projects_list` | 只读 | 读取当前 DSH home 的共享项目清单 |
| `agent_projects_sync` | dry-run | 合并发现结果并注册缺失 Workspace |
| `agent_projects_add` | dry-run | 手动加入一个现有目录 |

真实同步示例参数：

```json
{
  "dryRun": false,
  "confirm": true
}
```

可以先用 `agent_projects_scan` 得到稳定项目 id，再把 `ids` 传给 `agent_projects_sync` 只处理选中的目录。

## 给 Codex、Claude 等使用的 CLI

```bash
# 只读扫描
dsh-agent-project-sync scan

# 扫描并写入共享清单
dsh-agent-project-sync scan --save --confirm

# 读取同一清单
dsh-agent-project-sync list --json

# 手动登记一个项目；不加 --confirm 时只预览
dsh-agent-project-sync add /path/to/project --confirm
```

CLI 只管理共享清单。原生 DSH Workspace 写入必须在加载插件的 DSH Host 内完成，以免绕过 DSH 的存储与生命周期约束。

## 配置

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `sources` | `codex, claude` | 启用的发现适配器 |
| `codexHome` | `CODEX_HOME` 或 `~/.codex` | Codex 数据根 |
| `claudeHome` | `CLAUDE_CONFIG_DIR` 或 `~/.claude` | Claude Code 数据根 |
| `dshHome` | `DSH_HOME` 或 `~/.dsh` | 共享清单所属 DSH home |
| `registryPath` | DSH home 下的默认清单 | 仅覆盖共享清单文件位置 |
| `excludePaths` | 空 | 不导入的目录根；其子目录也跳过 |
| `maxFilesPerSource` | `20000` | 每个来源最多检查的 JSONL 文件数 |
| `maxHeaderBytes` | `131072` | 每个 JSONL 最多读取的开头字节数 |

## 开发与验证

```bash
npm run check
pnpm run pack:dsh
npm run preflight
npm run verify:dsh-offline
npm pack --dry-run
```

`verify:dsh-offline` 创建临时隔离的 `DSH_HOME`，安装刚打包的 tarball 并检查配置组合；不会触碰日常 profile。

兼容基线：DeepSeek Harness / `dsh` `0.1.0-rc.8`、Cordis `^4.0.1`、Node.js `^22.19 || >=24`。

## 卸载

从目标 profile 移除包并重启：

```bash
dsh plugin --profile web remove dsh-agent-project-sync
```

卸载不会删除已有 Workspace、项目目录或共享清单。若要清理清单，请由用户单独确认并删除该机器本地文件。

## License

MIT
