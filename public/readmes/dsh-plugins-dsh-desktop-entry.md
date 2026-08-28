# dsh-desktop-entry

DeepSeek Harness **Cordis 插件**：在 Windows 桌面生成一个入口（快捷方式 + 启动器），
一键用 Chrome 应用模式窗口打开 DeepSeek Harness 的 Web 界面。
**不打包任何后端代码**——入口只是连接正在运行的 `dsh web`。

## 安装

```bash
dsh plugin --profile web add dsh-desktop-entry
```

包声明了 `dsh.bundle`，`dsh plugin add` 会自动把它加入 profile 的 bundle 层；
下次启动 `dsh --profile web` 时插件自动挂载并生成桌面入口。

生成内容：

| 文件 | 说明 |
|---|---|
| `%LOCALAPPDATA%\DeepSeek Harness\launcher.ps1` | 启动器：探测后端 → 未运行则用 `dsh` 拉起 → Chrome 应用模式打开 UI |
| `%LOCALAPPDATA%\DeepSeek Harness\icon.ico` | 官方 favicon（16/32/48/256 多尺寸） |
| 桌面 `DeepSeek Harness.lnk` | 官方图标的快捷方式（双击运行启动器，隐藏控制台） |

## 配置

默认行为即可用；如需覆盖，在 profile 的 `cordis.patch.yml` 里追加：

```yaml
- id: desktop-entry
  config:
    backendUrl: http://127.0.0.1:3080   # 后端地址
    dshCommand: dsh                      # 启动后端的命令
    startupTimeoutSeconds: 90             # 启动后等待后端就绪的秒数（1–300）
```

`backendUrl` 必须是未包含账号密码的 `http` 或 `https` 地址；`dshCommand` 必须是可执行命令或
`dsh` 的已构建 JavaScript 入口。配置不合法时插件会记录失败原因，且不会创建不完整的桌面入口。

## 排错

- 双击快捷方式后提示找不到 `dsh`：在配置中将 `dshCommand` 设为可执行文件的完整路径，或从已安装
  `dsh` 的终端启动 harness 一次以确认命令可用。
- 后端启动较慢：将 `startupTimeoutSeconds` 增加到所需值，最大为 300 秒。
- 快捷方式未出现：检查 `%LOCALAPPDATA%\DeepSeek Harness\launcher.log`；插件启动时也会在 harness
  日志中记录 PowerShell 无法启动或创建快捷方式失败的具体原因。

## 说明

- 仅 Windows。其他平台挂载时记录一条警告并跳过。
- 后端未运行时，启动器用 `dsh --profile web --port <port>` 拉起（隐藏窗口，最多等 90 秒）；
  找不到 `dsh` 命令时提示手动启动。
- 运行日志：`%LOCALAPPDATA%\DeepSeek Harness\launcher.log`。
- 浏览器优先 Chrome，缺失时退回 Edge，都没有则用系统默认浏览器。

## 发布

```bash
cd dsh-desktop-entry
npm login            # 需要您的 npm 账号
npm publish
```

发布后任何用户都能 `dsh plugin --profile web add dsh-desktop-entry` 安装。
（当前包名未在 npm 占用；如被占用可改用您自己的 scope，如 `@<your-name>/dsh-desktop-entry`，
并把 `cordis.patch.yml` 中行的 `name` 与包名保持一致。）
