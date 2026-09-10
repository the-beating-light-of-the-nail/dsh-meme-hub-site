# dsh-alive · 零 token 在线状态指示器

[![npm version](https://img.shields.io/npm/v/dsh-alive.svg)](https://www.npmjs.com/package/dsh-alive)
[![npm downloads](https://img.shields.io/npm/dm/dsh-alive.svg)](https://www.npmjs.com/package/dsh-alive)
[![license](https://img.shields.io/npm/l/dsh-alive.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/AikenFra/dsh-alive.svg)](https://github.com/AikenFra/dsh-alive)

> A zero-token online status indicator for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) web UI.
> 为 DeepSeek Harness (dsh) Web 界面提供零 token 消耗的在线状态指示器。

在会话窗口右上角常驻显示 **● 在线 / ● 离线** 状态点，每 15 秒自动检测一次。**完全不调用 LLM，零 token 消耗**——只是浏览器对本地服务做一次进程内的 HTTP 心跳。

An always-visible **● Online / ● Offline** indicator in the conversation header, auto-refreshed every 15 seconds. It costs **zero tokens** — the browser simply polls a process-local HTTP endpoint.

## 功能 / Features

- ✅ 会话头部右上角常驻状态点（绿色 = 在线，红色 = 离线，黄色 = 检测中）
- ✅ 每 15 秒自动检测，无需手动刷新
- ✅ **零 token 消耗**：纯进程内 ping，不调用任何 LLM
- ✅ 开箱即用，无需任何配置
- ✅ 服务挂了立刻变红点，恢复后自动变回绿点

## 截图 / Screenshots

**● 在线（绿色）| ● 离线（红色）** — 会话窗口右上角常驻显示：

| 在线 / Online | 离线 / Offline |
| --- | --- |
| ![在线](https://raw.githubusercontent.com/AikenFra/dsh-alive/d17acfa8689666d799c94e196020a3efed11ad0a/docs/screenshots/online.png) | ![离线](https://raw.githubusercontent.com/AikenFra/dsh-alive/d17acfa8689666d799c94e196020a3efed11ad0a/docs/screenshots/offline.png) |

## 工作原理 / How it works

```
浏览器页面 --(每 15s fetch)--> GET /dsh-alive/ping --> dsh 服务进程（直接应答）
                              | 零 LLM 调用，零 token
```

- **后端**：注册一个进程内 HTTP 端点 `GET /dsh-alive/ping`，立即返回 `{"ok":true}`，不经过任何模型。
- **前端**：通过 dsh 的 slot 系统注入一个小组件到 `conversation.session.header.utilities`，用 `setInterval` 每 15 秒轮询一次 ping 端点，根据响应更新状态点。

## 安装 / Install

> 需要已安装 DeepSeek Harness（`dsh`）。适用于 `web` profile。

```bash
# 装进 web profile（npm 发布后）
dsh plugin --profile web add dsh-alive

# 重启服务
dsh web
```

重启后打开页面，**按 Ctrl+F5 强制刷新**，右上角即可看到状态点。

### 本地/手动安装（未发布时）

把本仓库放到 `~/.dsh/profiles/web/dsh-alive`，然后：

1. 在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 加 `"dsh-alive": "file:./dsh-alive"`
2. 在 `dsh.profile.bundles` 列表追加 `"dsh-alive"`
3. 重启 `dsh web` 并硬刷新页面

## 卸载 / Uninstall

```bash
dsh plugin --profile web remove dsh-alive
dsh web
```

## 兼容性 / Compatibility

- 测试于 `dsh 0.1.0-rc.6`（`web` profile）
- 依赖 dsh 的 slot 系统（`conversation.session.header.utilities`）与 `webServer` 服务注入，要求 dsh web 客户端框架版本匹配

## 开发 / Development

```
dsh-alive/
├── package.json        # 插件清单（dsh.bundle / dsh.client）
├── cordis.patch.yml    # bundle 挂载声明
├── dsh/
│   └── index.js        # 后端：/dsh-alive/ping 进程内端点
└── client/
    └── client.js       # 前端：状态点组件 + 15s 轮询
```

## License

[MIT](LICENSE)
