# dsh-custom-subagents

[![npm version](https://img.shields.io/npm/v/dsh-custom-subagents?color=4a6cf7)](https://www.npmjs.com/package/dsh-custom-subagents)
[![GitHub stars](https://img.shields.io/github/stars/ktdhhc/dsh-custom-subagents?color=4a6cf7)](https://github.com/ktdhhc/dsh-custom-subagents)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)(dsh) 提供可复用的专业子 Agent:把「代码审查员」「文档撰写」「网络调研」这类常用角色保存成一份定义,主 Agent 用一个 `delegate_agent` 工具随时把它们叫出来干活。

不需要写代码,也不需要了解 DSH 内部机制——所有操作都在 **设置 → 子 Agent** 页面完成,就像填一张简短的表单。

```bash
# 一行安装
dsh plugin --profile web add dsh-custom-subagents
```

## 安装

两种方式任选,都要求先装好 [DSH](https://github.com/deepseek-ai/deepseek-harness)。

### 方式一:从 npm registry(推荐)

```bash
dsh plugin --profile web add dsh-custom-subagents
```

### 方式二:从本地安装包(tarball)

```bash
dsh plugin --profile web add ./dsh-custom-subagents-<版本>.tgz
```

> **profile 名** 通常是 `web`(`dsh web` 就是 `dsh --profile web` 的别名)。其他可用名字可在 `~/.dsh/profiles/`(Windows 为 `%USERPROFILE%\.dsh\profiles\`)目录下查看。

安装后开箱即用:根 Agent 立刻获得 `delegate_agent` 工具,不需要手工配置、软链或复制 Preset,默认 Agent Preset 也不会被改动。重启 `dsh web` 后生效。

### 平台说明

**Windows** 和 **Linux/macOS** 的命令相同。仅有的平台差异:

- Windows 上建议用 `npm i -g @deepseek-ai/dsh` 全局安装 DSH,再执行上面的命令(避免 `npx` 临时缓存与全局版本不一致)。
- 若 Windows 启动报 `EADDRINUSE: address already in use 127.0.0.1:3080`,是默认端口被占用,换个端口即可:`dsh web --port 4000`。
- 插件把 `shell` 工具令牌按宿主平台解析:Windows 上映射为 `pwsh`,Linux/macOS 上为 `bash`。

### 版本兼容

已在 DSH `0.1.1-rc.2`(当前 npm `latest`)上验证。peer 依赖声明为 `>=0.1.1-rc.2 <0.2.0-0 || >=0.1.2-0 <0.2.0-0`,后续 RC 一般可直接使用;DSH 处于快速迭代期,若遇到版本相关错误,确认宿主与插件版本一致后重试。

## 快速上手

首次安装自带一个内置 **Explorer**(只读探索代码库),可以直接吩咐主 Agent 委派:

> 让 Explorer 看一下 `src/` 里的模块是怎么组织的。

也可以自己定义角色:

1. 打开 **设置 → 子 Agent**,点击 **新建**。
2. 填写表单:名称、描述和系统 Prompt 是必填项;模型、上下文、工具都有安全的默认值,可以先不改。
3. 点击 **保存**,然后在对话里直接吩咐主 Agent,例如:

   > 用「代码审查员」检查一下 `src/` 最近改动的代码。

主 Agent 会通过 `delegate_agent` 工具找到你保存的定义,创建一个对应的子 Agent 来执行任务。

## 它能做什么

- **一次定义,反复使用**。为每个角色设置名称、描述、系统 Prompt、模型、上下文和工具,保存后主 Agent 可以反复委派。
- **直接勾选工具,所见即所得**。勾选 `read`、`glob`/`grep`、`write`/`edit`、`Shell (bash / pwsh)`、`web_search`、`skill` 等原始工具名,勾什么给什么;或选择「继承父 Agent 工具」直接用父会话的工具。
- **和原生子 Agent 一样**。委派的实例出现在现有子 Agent 树里,照常查看转录、继续执行、中断。
- **防子 Agent 套娃,省 token 省时间**。原生 DSH 的子 Agent 可以无限再创建子 Agent(官方没有默认深度上限),一次任务可能层层嵌套、token 和时间开销失控。本插件提供两层防护:「**禁止嵌套委派**」一键开关(子 Agent 不能再创建子 Agent,根 Agent 不受影响)+ **3 层硬深度上限**(无论开关如何,委派链最深 3 层,超出即明确拒绝)。
- **安全边界清晰**。子 Agent 能用的工具永远不会超出父 Agent 已有的工具;DSH 的安全、沙箱、审批保护不受自定义 Prompt 影响。
- **改配置不影响运行中的任务**。编辑或删除定义只影响未来的委派,已运行的实例不受影响。

## 表单字段说明

| 字段 | 含义 |
| --- | --- |
| **名称** | 角色的名字,主 Agent 靠它来认人。必须唯一。 |
| **描述** | 写给主 Agent 看的「什么时候该用我」。例如:「在需要检查代码正确性、安全性和可维护性时使用」。 |
| **系统 Prompt** | 角色的身份与工作方式,例如「你是一名细心的代码审查员」。DSH 的安全指令不受影响。 |
| **模型** | 默认 **父模型**:和主 Agent 用同一个模型;也可以指定 DSH 里其他已配置的模型。 |
| **上下文来源** | **全新上下文**:子 Agent 从空白开始;**继承对话**:子 Agent 能看到父对话中已完成的内容。 |
| **可用模式** | 标准模式始终可用;高级用户可额外勾选 PTC 模式、创造模式。 |
| **工具** | 二选一:**继承父 Agent 工具**(默认),或**自定义可用工具**。 |

### 工具能力一览

| 勾选项 | 含义 |
| --- | --- |
| `read` | 读取文件 |
| `glob` / `grep` | 查找文件、搜索文件内容 |
| `write` / `edit` | 创建和修改文件 |
| `Shell (bash / pwsh)` | 运行命令 |
| `web_search` | 联网搜索 |
| `skill` | 使用技能 |

小提示:子 Agent 能用的工具永远不会超过父 Agent 拥有的;若父会话缺少定义勾选的某个工具,委派会明确失败,而不是偷偷少给。

## 列表页操作

- **禁止嵌套委派**(页面顶部的全局开关,默认关闭):原生 DSH 允许子 Agent 无限套娃(创建路径没有默认深度上限),一次任务可能多层嵌套、白白消耗 token 和时间。开启后,子 Agent 无法再创建任何子 Agent(`subagent`、`subagent_fork`、`delegate_agent` 都会被拦截),只有根 Agent 可以。即时生效,重启后保持。
- 每行开关可单独**启用/禁用**某个定义:禁用后保留在列表,但主 Agent 不再用它委派。
- **预置子 Agent**(如内置 Explorer)不能删除,只能停用;复制出的副本是普通定义,可以正常删除。
- 每行 **复制** 可基于已有定义快速创建变体,自动给出不冲突的新名称。

## 升级与卸载

```bash
# 升级(已保存的定义和「禁止嵌套委派」设置都会保留)
dsh plugin --profile web add dsh-custom-subagents@<新版本>

# 卸载(清理插件产生的全部内容,不影响其他插件)
dsh plugin --profile web remove dsh-custom-subagents
```

## 常见问题

- **保存时提示「重新加载后重试」?** 页面数据已过期(例如另一个标签页改过配置),点击列表页的刷新入口重试即可,无需重启。
- **委派失败,提示某个工具不可用?** 自定义工具是「全有或全无」:父会话缺少定义勾选的某个工具时,委派明确失败。
- **后台执行不可用?** 后台运行只支持标准模式,其他模式下请使用前台委派。
- **删除定义会破坏历史吗?** 不会。已创建的实例继续运行,删除只影响未来的委派,且删除前会确认。
- **改名会丢引用吗?** 不会。每个定义有稳定的隐藏身份,改名只影响显示。
- **子 Agent 会无限套娃、浪费 token 吗?** 原生 DSH 的子 Agent 创建路径没有默认深度上限,确实可能层层嵌套、开销失控。本插件给两层防线:列表页的「禁止嵌套委派」开关(一键禁止所有嵌套创建)+ 硬深度上限(委派链最深 3 层,超出时明确拒绝,而不是继续往里钻)。
- **Windows 启动报 `EADDRINUSE`?** 默认端口 3080 被占用,换端口:`dsh web --port 4000`。

## 面向开发者

架构、设计决策与测试说明见 [`docs/specs/`](docs/specs/) 与 [`CONTEXT.md`](CONTEXT.md)。
