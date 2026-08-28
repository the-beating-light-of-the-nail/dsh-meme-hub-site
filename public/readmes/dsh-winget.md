# dsh-winget

**Windows Package Manager (winget) 的 DeepSeek Harness (dsh) 插件** —— 让 dsh 智能体通过原生工具
搜索、安装、升级、卸载、导入导出 Windows 软件包。所有命令走非交互模式，可在无头环境工作。

> 独立社区项目，非官方。基于微软 [winget-cli](https://github.com/microsoft/winget-cli)（MIT）。

## 特性

- 9 个原生 dsh 工具：`winget_search` / `winget_show` / `winget_install` / `winget_upgrade` /
  `winget_list` / `winget_uninstall` / `winget_export` / `winget_import` / `winget_pin`
- 附带 `SKILL.md` 技能文件，指导 agent 何时用、安全规则
- Schemastery 配置（wingetPath / alwaysAcceptAgreements / timeoutMs）
- bundle patch 层（`cordis.patch.yml`），一键加入任意 profile
- 默认非交互 + 自动接受协议（无头安装必需）
- 安全设计：install/uninstall/upgrade-all 工具描述明确标注需先确认

## 前置要求

- DeepSeek Harness（dsh）
- Windows 10 1809+ / Windows 11，winget 可用（`winget --version`）

## 安装

### 作为 bundle 加入 profile

```yaml
- insert:
    - id: winget
      name: './src/index.js'
      config:
        wingetPath: winget
        alwaysAcceptAgreements: true
```

### 本地 patch 临时加载

```bash
pnpm dsh web --patch ./dsh-winget/cordis.patch.yml
```

然后问 agent："用 winget_search 帮我找 VS Code 并查看详情"。

## 工具

| 工具 | 行为 |
|---|---|
| `winget_search` | 搜索软件（query/id/name/moniker/tag） |
| `winget_show` | 软件详情（版本/来源/安装器） |
| `winget_install` | 安装（会改变系统，先确认） |
| `winget_upgrade` | 升级指定或全部（`all=true`） |
| `winget_list` | 已安装列表/筛选/导出 |
| `winget_uninstall` | 卸载（必须确认） |
| `winget_export` / `winget_import` | 清单导出/导入 |
| `winget_pin` | 版本固定 add/list/remove |

## 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `wingetPath` | `winget` | winget.exe 路径 |
| `alwaysAcceptAgreements` | `true` | 自动接受包/源协议（无头必需） |
| `timeoutMs` | `600000` | 单次调用超时（安装可能很慢） |

## 已知限制

- 本版本 winget 无 JSON 输出，工具返回表格文本（模型可读）
- 需要管理员权限的安装可能失败（UAC 无法在非交互模式弹出）——如实返回错误
- msstore 来源的包部分需登录微软账号

## 目录结构

```
dsh-winget/
  src/index.js            # 插件入口：9 个工具 + 配置
  skills/winget/SKILL.md  # agent 技能
  docs/                   # 文档
  cordis.patch.yml        # bundle patch 层
```

## 许可

MIT。
