---
slug: user-guide/desktop
title_zh: dsh Desktop 桌面端完全指南
title_en: dsh Desktop Guide
group: 使用指南
group_en: User Guide
subgroup: null
source: ""
---

# dsh Desktop 桌面端完全指南

不想每次都开终端敲命令？把 DSH 变成「桌面应用」有三条路：一是装图形启动器，双击图标启动、点按钮管插件；二是配一只桌宠伴侣，让 Agent 状态常驻桌面陪你干活；三是零安装跑官方 Web UI，再在浏览器里创建桌面快捷方式。三条路互不冲突，可以按需叠加。

## 方式一：图形启动器

社区把 dsh 封装成了各种开箱即用的桌面客户端，完整目录见 [dsh 启动器专区](/launcher)。几个代表项目：

- **DeepSeek Harness Desktop（Tauri 轻量版）**：安装包仅约 5MB，不用预装 Node.js/pnpm/Docker，下载即用，覆盖 Windows/macOS/Linux。
- **DSH Desktop**：local-first 跨平台桌面壳，除官方 DeepSeek 模型外还支持主流第三方模型提供商；另有 Windows 便携版，内置 Node.js + dsh，可放 U 盘随身带走。
- **DeepSeek Harness EAC「揽尽万象」**：Windows 10/11 加 Linux 全覆盖，Linux 侧提供 pacman/deb/rpm/AppImage 多种发行格式。
- **Oh-DSH**：一套 DSH runtime 提供 Desktop、Web 与 TUI 三种体验。

安装方式与传统软件一致：Windows 下是 .exe 安装包或免安装便携版，macOS 下是 .dmg 镜像拖进应用程序目录，Linux 常见 .deb/.rpm 包与 AppImage。下载后像普通软件一样装即可，多数项目不需要手动配置环境。平台支持与更新方式以各项目发布页为准。

## 方式二：桌宠伴侣

如果想要的不是「另一个工作窗口」，而是「桌面上活着的伙伴」，桌宠插件是 dsh 生态最有辨识度的一支——它们读取真实会话状态，把 Agent 正在思考还是摸鱼演给你看。[赛博宠物分类页](/plugins/pets)收录了全部此类插件，三个代表：

- [Petdex](/plugins/petdex)：桌宠界的应用商店，社区提交、浏览，npx petdex install 一条命令安装动画宠物。
- [大肥鱼](/plugins/dsh-dafeiyu)：住在 Windows 桌面的透明置顶原生窗口，实时显示真实 Agent 状态，跟随 dsh 本体启停。
- [whale-girl](/plugins/whale-girl)：QQ 宠物形态的鲸鱼娘，可拖拽、投喂、玩耍，完成任务攒资历、升称号、存回忆。

## 方式三：Web UI + 浏览器快捷方式

最省事的官方路线：不装任何额外软件，直接启动 Web UI：

```
npx @deepseek-ai/dsh web
```

浏览器会自动打开 http://127.0.0.1:3080（默认只监听本机，不暴露局域网）。需要 Node.js ^22.19.0 或 >=24.0.0。之后在浏览器菜单里对这个地址「创建快捷方式 / 添加到 Dock」，它就成了一个伪桌面应用：双击图标直达工作台。端口被占可用 dsh web --port 8080 换端口，更多参数见[命令行文档](/docs/user-guide/cli)。

## FAQ

### dsh desktop 和命令行版有什么区别？

入口不同，内核相同。桌面项目大多是对 dsh 本体或其 Web UI 的封装：加上窗口、系统托盘、图形化安装向导和开机自启；命令行版面向终端与脚本场景（如 --profile headless 跑一次性任务）。会话、插件与配置通常仍共用 ~/.dsh 下的同一套数据（个别便携版自带独立运行时，以各项目 README 为准），两种形态可以混用。

### 桌面版怎么更新？

分三种情况：启动器/桌面客户端看各自的更新机制——应用内检查更新，或到发布页重新下载安装包覆盖安装；Web UI 方式没有独立的程序版本，用 npx 时带上 @latest（如 npx @deepseek-ai/dsh@latest web）即可运行最新发布版；插件的安装与更新在任何形态下都走统一的插件管理流程，见[插件文档](/docs/user-guide/plugins)。

### Windows/macOS/Linux 分别支持哪些？

以每个项目的标注为准（[启动器页](/launcher)有平台筛选器）：多数启动器同时覆盖 Windows 与 macOS，部分提供 Linux 包（.deb/.rpm/AppImage），也有专注 Windows 的轻量启动器；桌宠插件差异更大，有的只做单一平台的原生窗口，有的跑在 Web GUI 里天然全平台；方式三的 Web UI 只要求 Node.js，三大平台都能跑。

## 相关链接

- [DSH 安装指南](/install)
- [快速上手](/docs/getting-started/quickstart)
