<p align="center">
  <a href="https://dshfind.com/zh/plugins/huanlinoto/dsh-plugin-spur"><img src="https://dshfind.com/api/card/huanlinoto/dsh-plugin-spur?lang=zh" alt="dsh-plugin-spur card"></a>
</p>

# dsh-spur

[![npm version](https://img.shields.io/npm/v/@huanlin/dsh-plugin-spur)](https://www.npmjs.com/package/@huanlin/dsh-plugin-spur)

> 小鲸鱼不听话？抽就完了。

一根悬挂在 DSH 聊天流中的辫子（皮鞭）。抓住辫梢甩动——速度足够快时，向 agent 发送一条 `go work!` 消息，鞭策它去干活。

## 功能

- Verlet 物理引擎渲染的辫子，作为 `position: fixed` 的 SVG 叠层，锚定在视口右上角，垂入聊天区域。
- 辫梢圆点是唯一可抓取的元素（在整体 `pointer-events: none` 的叠层上设为 `pointer-events: auto`）。
- 鼠标按下 → 辫梢锁定到光标；鼠标移动 → 跟踪速度（指数移动平均）；鼠标释放 → 带末速度释放。
- 释放速度超过阈值（2.0 px/ms）时：
  1. 保存当前输入草稿。
  2. `inputActions.setDraft('go work!')`
  3. `inputActions.submit()`
  4. 提交事务完成后（phase 回到 `plain`）恢复原草稿。
- 释放后辫子继续摆动，阻尼振荡直至静止。

## 架构

单 bundle 双入口（host `.` + 浏览器 `./client` + invariant `./invariant`），仿照 `yet-another-subagent`。

- **宿主半边**（`src/index.ts`）：空 `apply`——纯客户端插件。
- **浏览器半边**（`src/client/index.ts`）：注册 `conversation.composer.dock` list slot（id `dsh-spur`，order 50）。dock 是编辑器卡片下方的条带；辫子本身是 `position: fixed` 的 SVG 叠层，通过 `createPortal` 挂载到 `document.body`。
- **物理引擎**（`src/client/physics.ts`）：Verlet 积分绳索 + 距离约束。与 React 组件分离，便于单元测试。

### Slot 选择

`conversation.composer.dock`（list，session 作用域）——编辑器卡片下方的条带，由 `ui-conversation` 拥有。session 作用域意味着辫子仅在 session 活跃时渲染（hero 模式自然隐藏）。dock 条目从框架接收 `InputZone`（owner）+ `SessionStandardProps`（`useInput`、`inputActions`）。

### 消息发送

插件使用 session 的输入机来发送消息——与 InputBar 相同的路径：

```ts
inputActions.setDraft('go work!')
inputActions.submit()
```

覆盖前先保存当前草稿，提交事务完成后恢复，确保用户的在途文本不被破坏。

## 开发

```sh
pnpm install          # 安装开发依赖
pnpm run typecheck    # tsc --noEmit（通过 ../dsh 解析 DSH 源码）
pnpm test             # vitest run（物理引擎单元测试）
pnpm run build        # tsc + tsdown → lib/index.js, lib/invariant.js, lib/client.js
```

### 基于 DSH checkout 类型检查

`tsconfig.json` 继承 `../dsh/tsconfig.base.client.json`，继承其 `paths` 映射到同级 DSH checkout 的 `packages/*/*/src`。需在 `../dsh` 是 DSH checkout 根目录的同级布局下运行 typecheck。

### 预构建 lib/

`lib/` 随仓库提交（与 `dsh-web-ui-notify` / `dsh-activity-plugin` 相同模式），git 安装时无需 `prepare` 脚本。开发时改动源码后跑 `pnpm run build`（或 `pnpm run bundle:client`）重建 `lib/`，再提交。

## 安装

```sh
# 从 npm 安装（推荐）：
dsh plugin --profile web add @huanlin/dsh-plugin-spur
```

## 配置

无配置。session 活跃时辫子始终存在。

## 已知限制

- **无空闲摆动动画。** 未交互时辫子垂直悬挂。可通过在锚点上施加周期性正弦力来添加空闲摆动。
- **锚点位置固定在屏幕（右上角）。** 未来可将辫子附着到编辑器右边缘，随滚动/resize 跟踪位置。
- **甩动阈值硬编码。** 速度阈值（2.0 px/ms）不可配置。改为 `Config` 字段可按部署调优。

## 设计参考

- 插件开发规范：`plugin-development-guide.md`
- DSH Native UI slot 速查：`DSH-Native-UI.md`
- Verlet 绳索物理：标准游戏物理技术（参见 Thomas Jakobsen《Advanced Character Physics》）
