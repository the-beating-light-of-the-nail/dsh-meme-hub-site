# dsh-plugin-matrix

> 我的天哪是黑客大人！意义不明的插件，闲得无聊整的，可以让你的web对话框变成黑客帝国风格的插件，按F11变得全屏让全公司不懂代码的人看到你都不明觉厉吧！本来看得懂的英文字符变成竖起来后完全看不懂了呢，虽然vibe coding本来谁看thinking过程啊。使用的时候建议把房间灯关了，众所周知黑客是开不起灯的。

![矩阵思维 CLI 演示](https://raw.githubusercontent.com/Gastronomicluna/Matrix-code/990576ab3116f6bb85534f28fc0d815a75055850/assets/demo.png)

## 插件介绍

DeepSeek Harness 的「矩阵思维」插件：侧边栏一键进入一个**黑底 CLI 风格页面**（交互参考 dsh CLI 对话界面），在其中与当前会话的 Agent 正常对话——思考过程以《黑客帝国》代码雨呈现，回复在终端里正常流式输出。

## 功能

- **DeepSeek 像素图标**：CLI 页面顶部居中显示官方鲸鱼标的**像素版**——把 `FishLogo` 渲染后经 canvas 降采样到 ~24 行网格再 10× 放大（关闭平滑），像素感 + 蓝色辉光。
- **CLI 页面**：点击侧边栏底部「矩阵思维」进入全屏黑底终端页：`❯` 提示符输入消息，回车发送；运行中回车 = 打断转向（steer）；`Ctrl+C` 停止生成；`Esc` 关闭页面。消息历史、工具调用（`▸`）、错误（`✗`）都按终端风格投影。
- **思考即代码雨**：Agent 思考期间（turn 运行中、尚未输出回复正文），页面上叠加代码雨——思考内容按「思考段」（句子/长片段）**竖屏排布**，随机散布到各列下落（黑底 + 辉光，经典 Matrix 感）；空闲时也有极淡的片假名氛围雨。
- **回复正常显示**：回复正文一开始输出，思考雨退为氛围雨，正文在终端里流式打印（光标跟随），定稿后进入日志。
- **顶部控制条**：红黄绿窗口点、会话名、「◉ 思考中」指示灯、雨速 −/＋（0.25×–4×，0.25 一档）、氛围雨疏/密、✕ 关闭。
- 页面内的对话就是当前会话的对话：与主页共享同一会话，消息双向同步。

## 安装

```bash
# 在插件目录执行（web profile）：
dsh plugin --profile web add "."

# 或安装发布包后：
dsh plugin --profile web add dsh-plugin-matrix
```

然后重启 web 服务生效：

```bash
dsh web
```

## 行为状态机

| 会话状态 | CLI 页面表现 |
| --- | --- |
| 空闲 | 氛围雨（极淡片假名） |
| turn 运行中，reasoning 流式输出（思考） | 思考段竖排成雨随机散布下落（最新段亮白辉光） |
| 回复正文开始输出 | 雨退为氛围雨，正文在终端流式打印 |
| turn 结束 | 回复定稿进日志 |
| 页面关闭 | 一切照旧，仅主页普通聊天 |

## 架构

本插件是一个**纯客户端 bundle 插件**：

- `package.json` 的 `dsh.client`（`platform: "web"`）声明浏览器端 bundle，`dsh.bundle.patch` 把插件插入 profile 层栈。
- 宿主侧 `lib/index.js` 是空壳（`apply()` 为空），只为让插件出现在 cordis Loader 条目里；客户端模块系统据此把 `client/client.js` 编入 `window.__DSH_BOOT__` 启动图。
- `client/client.js` 是手写的经典脚本（无构建步骤）：注册到 `window.__ModuleLoader__`，返回 cordis 插件 `{ name, inject: ["slots", "sessions"], apply }`。
  - `sidebar.footer.action` → 进入/退出 CLI 页面的按钮；
  - `shell.overlay` → 黑底 CLI 页面（canvas 代码雨 + 终端日志 + 输入行）；
  - `ctx.sessions.list` + `ctx.sessions.binding(id).session`（`SessionFace`）订阅当前会话的 `ConversationSnapshot`：
    - `partial.reasoning` 增量切段 → 竖排雨流；
    - `partial.text` → 终端流式正文；`nodes` → 终端日志投影（user/assistant/tool/error…）；
    - `session.prompt()`（queue/steer）与 `session.cancel()` → 终端输入交互。

## 开发

- 改动 `client/client.js` 后无需构建（本来就没有构建产物）；插件以 `link:` 方式安装时，运行中的页面会通过 HMR 接收器（`/plugins/events`）自动热更新。
- 冒烟测试（模拟装载器 / React / ctx，验证思考状态机与日志投影）：`node scripts/smoke.js`

## 许可

MIT
