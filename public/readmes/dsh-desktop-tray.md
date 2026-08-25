# dsh-desktop-tray

为 [DSH Desktop](https://github.com/dataelement/dsh-desktop) 提供**系统托盘**支持：常驻托盘图标 + 设置里开关"最小化到托盘 / 关闭时隐藏到托盘"，并能在应用自动更新后**自愈恢复**。

System tray support for DSH Desktop: a tray icon plus settings to hide the main window to the tray on minimize or close, with self-healing after application updates.

> ## ⚠️ 重要警示 / WARNING
>
> **本插件会修改 DSH Desktop 的主程序文件，属于破坏性修改（不是纯只读插件）。**
>
> 安装后，插件会把托盘代码**注入**到以下文件（注入前会各备份一份 `*.dsh-tray.bak`）：
>
> - `resources/app/out/main/index.js`
> - `resources/app/out/preload/index.cjs`
> - `resources/app/package.json`（`main` 改为指向注入启动器）
> - 并在 `resources/app/out/main/` 新增 `tray-boot.js`
>
> **如果 DSH Desktop 无法启动（例如重装/更新过程中出现异常）**，按以下顺序处理：
>
> 1. **还原备份**：用 `out/main/index.js.dsh-tray.bak` / `out/preload/index.cjs.dsh-tray.bak` 覆盖还原对应文件；
> 2. **恢复入口**：把 `resources/app/package.json` 的 `"main"` 改回 `"./out/main/index.js"`；
> 3. **删除启动器**：删除 `resources/app/out/main/tray-boot.js`；
> 4. **移除触发条目**：编辑 `%APPDATA%\dsh-desktop\harness\profiles\web\cordis.patch.yml`，删除其中 `dsh-desktop-tray` 的 `- insert:` 条目（若 Harness 报 `duplicate loader entry id: dsh-desktop-tray`，同时检查 `resources/dsh-desktop.patch.yml` 是否残留同名条目，一并删除）；
> 5. **仍然无法启动**：重新安装 DSH Desktop（卸载后重装，或覆盖安装最新版）。
>
> 如果重装后只想保留插件而 Harness 启动失败，第 4 步通常就能解决——插件本体在 AppData，重装不会清除，只需保证加载条目**只有一份**。

## 功能 / Features

- **最小化到托盘 / Minimize to tray** — 点击最小化按钮时隐藏到托盘，而不是任务栏。
- **关闭时隐藏到托盘 / Hide on close** — 关闭窗口时保持后台运行（默认开启）。
- **立即隐藏到托盘 / Hide to tray now** — 一键隐藏主窗口。
- 托盘图标左键单击/双击 → 显示主窗口；右键菜单 → 显示主窗口 / 退出。
- 设置界面：**设置 → 系统托盘**（Settings → System tray），中英文双语。
- **代码注入管理 / Code injection panel**（`0.2.0` 起）— 同一设置页内可直接查看
  **代码注入情况**、**开始注入**、**取消注入**、**确认编译效果**（用应用自带的 Node 对两个
  入口文件做 `node --check` 语法检查 + 检查每段注入代码只出现一次），无需手动改文件。

## 安装 / Install

通过 DSH Desktop 的插件市场（dsh-market）安装，或在 web profile 中直接添加：

```sh
dsh plugin --profile web add github:wodongx123/dsh-desktop-tray
```

安装后**重启 DSH Desktop**（不是只重启 Harness）。首次启动时插件会：

1. 把启动器 `out/main/tray-boot.js` 安装进应用，并把 `package.json` 的 `main` 指向它；
2. 把托盘代码按锚点**注入**到 `out/main/index.js` 与 `out/preload/index.cjs`（原文件先备份为 `*.dsh-tray.bak`）；
3. 在设置界面注册"系统托盘"页。

## 工作原理 / How it works

DSH Desktop 是 Electron 应用，托盘只能在**主进程**里创建，而 Harness 插件运行在独立的 Node 进程里，无法直接调用 Electron API。因此本插件采用"**启动时自愈注入**"：

```
应用启动
  └─ main → out/main/tray-boot.js（启动器）
       ├─ 读取插件内的补丁定义（main-patch.js）
       ├─ 检查 out/main/index.js / out/preload/index.cjs 是否已注入
       │    ├─ 未注入 → 按锚点注入 + 备份 + 写标记 // dsh-desktop-tray:patched
       │    └─ 已注入 → 跳过（幂等，绝不重复注入）
       └─ 加载真正的入口 ./index.js
```

**更新自愈**：应用自动更新会整体覆盖 `resources/app`，把注入和启动器全部清掉。本插件的本体安装在 AppData 的 web profile 中（应用更新不会删除），Harness 每次启动时插件会：

- 通过 `$DSH_HOME/desktop-app-path.json`（启动器写入的"应用位置记忆"）定位应用目录；
- 重新注入主进程代码、重建启动器、恢复 `main` 指向；
- **清理 app 内补丁的残留条目**（`resources/dsh-desktop.patch.yml`），确保加载条目唯一，避免重装/更新过渡期出现 `duplicate loader entry id` 导致 Harness 无法启动。

因此**更新/重装后第一次启动是无托盘的原始版本，重启一次即自动恢复**。如果新版应用的主进程代码结构变化导致锚点失配，插件会跳过注入并记录日志（绝不破坏文件），等插件版本跟进适配。

## 安全设计 / Safety

- **防重复注入（五重防护）**：
  1. 幂等标记：已带 `// dsh-desktop-tray:patched` 的文件不再改动；
  2. 锚点消费：注入 = 锚点替换，锚点被消费后无法二次叠加；
  3. 内容检测：无标记但内容已存在 → 只补标记，不重复注入；
  4. 整体原子性：任一锚点失配 → 整文件不写，不产生半修补文件；
  5. 备份 + 原子写：注入前备份 `*.dsh-tray.bak`，临时文件 + rename。
- 回滚：保留备份，可手工还原（见上方警示步骤）。

## 卸载 / Uninstall

1. 移除 profile 中的插件：`dsh plugin --profile web remove dsh-desktop-tray`，并删除 `profiles/web/cordis.patch.yml` 中的 `dsh-desktop-tray` 条目；
2. 手动恢复应用文件（如果不再需要托盘）：
   - `resources/app/package.json`：`main` 改回 `./out/main/index.js`；
   - 删除 `resources/app/out/main/tray-boot.js`；
   - 用 `index.js.dsh-tray.bak` / `index.cjs.dsh-tray.bak` 覆盖还原对应文件。

## 包结构 / Layout

```
dsh-desktop-tray/
├── package.json      # 插件清单（dsh.client 声明）
├── index.js          # 服务端守护插件（状态路由 + 补丁守护 + 去重自愈）
├── client.js         # 客户端设置界面（设置 → 系统托盘）
├── main-patch.js     # 主进程补丁定义与注入引擎（纯 Node，五重防重复）
├── boot/
│   └── tray-boot.js  # 启动器模板（写入 out/main/）
└── README.md
```

## License

MIT
