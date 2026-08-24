<p align="center">
  <a href="https://dshfind.com/zh/plugins/huanlinoto/dsh-plugin-d399"><img src="https://dshfind.com/api/card/huanlinoto/dsh-plugin-d399?lang=zh" alt="dsh-plugin-d399 card"></a>
</p>

# dsh-d399 · 贪玩蓝鲸

[![npm version](https://img.shields.io/npm/v/@huanlin/dsh-plugin-d399)](https://www.npmjs.com/package/@huanlin/dsh-plugin-d399)

> ❤深❤夜❤寂❤寞❤，❤来❤玩❤ D399❤

当模型正在生成响应时，右下角弹出一个蓝鲸游戏弹窗。点击「来♂」展开游戏菜单，内置 Wordle + 消消乐 + **192 款参数化小游戏**（覆盖反应/解谜/策略/街机/问答/卡牌等品类，同族变体折叠成组），并支持自定义网页书签。等待不再寂寞。

## 功能

- **生成检测**：订阅 `ctx.sessions.list` 的 `running` 标志。`false→true` 边沿触发右下角 teaser 弹窗；`true→false` 自动收起（除非用户已打开游戏菜单或正在游戏中——此时保留到用户手动关闭）。
- **内置游戏**：
  - **Wordle** — 6 次猜 5 字母英文词，绿/黄/灰三色反馈，内置常用词表，支持物理键盘 + 屏幕键盘。
  - **消消乐** — 8×8 六色网格，点选相邻方块交换，三同色消除 + 重力下落 + 连锁。
  - **190 款参数化小游戏 + 2 款代码库问答** — 见下方 [游戏目录](#游戏目录)。
- **同族变体折叠**：菜单里同类型的变体（如 5 款贪吃蛇）折叠为一个可展开的组，组头显示名称与变体数量，默认收起，支持「全部展开/全部收起」。
- **可拓展**：暴露 `ctx.d399Games` 客户端服务，第三方插件可通过 `inject: ['d399Games']` 注册更多游戏；游戏条目带可选 `group` 字段即可参与折叠。

## 游戏目录

190 款小游戏由约 30 个参数化引擎 + 一份静态 catalog 组合而成，按品类分组：

| 品类 | 引擎 | 数量 | 示例 |
|------|------|------|------|
| 反应/瞄准 | Clicker / Reaction / Aim | 8 | 连点 100、反应 5 轮、瞄准 30 靶 |
| 节奏/治愈 | WhackAMole / BubbleWrap / Etch / PixelArt | 11 | 打地鼠 60s、泡泡 8×8、画板 32、像素 16×16 |
| 数字/数学 | NumberGuess / MathQuiz | 9 | 猜数字 1-1000、加减乘除各 10/20 题 |
| 问答 | Trivia（7 类） | 7 | 历史/科学/地理/体育/电影/文学/代码库 |
| 文字 | Hangman / WordScramble / Typing | 20 | 猜词（动物/国家/食物/电影/科技，含 hard 变体）、字母重组、打字测试（短/长/全字母句） |
| 记忆/认知 | Stroop / Riddle / Simon / ColorSeq | 8 | 斯特鲁普读字/说色、脑筋急转弯、西蒙 5/10/15 回合、色序 3/5/8 |
| 博弈/概率 | Coin / Dice / Spinner / ColorPick / Slots | 13 | 硬币 3/5/7 连、骰子 2-5 颗、轮盘 4-12 格、辨色、水果/数字/表情机 |
| 卡牌 | Blackjack / HighLow / War | 4 | 21 点、大小猜牌、战争 5/10 轮 |
| 放置 | CatClicker（6 种宠物） | 6 | 摸猫/狗/熊猫/狐狸/青蛙/熊计数 |
| 策略 | TicTacToe / Memory / Connect4 | 22 | 井字棋 3×3—6×6 + AI 变体、记忆翻牌（动物/食物/符号/水果 × 6/8/12 对）、四连棋 5×5—7×6 + AI |
| 解谜 | LightsOut / SlidePuzzle / Peg / Mastermind / TwentyFour / Water / Hanoi / Sudoku / Nonogram / 2048 / NQueens / Pathfind | 49 | 熄灯 3×3—5×5、华容道 3×3—5×5、独立钻石 5/7、大师码 3-5 位、算 24 点 3/5/10 题、倒水（4 种配置）、汉诺塔 3-6 盘、数独 4×4/6×6、数织 5/7/8、2048 目标 128-2048、N 皇后 4-8、寻路 4×4—7×7 |
| 街机 | Snake / Breakout / Pong / Flappy / Dodge / Dino / Asteroids / Maze / Catch | 34 | 贪吃蛇 10-20、打砖块易/中/难、弹球慢/快、飞翔易/中/难、闪避 5/7/9、恐龙慢/中/快、陨石 3/5/8 颗、迷宫 5-12、接物品 5/7/9 |
| 代码库 | Trivia(codebase) / Riddle(codebase) | 2 | 代码库选择题、代码库填空题（关于 dsh-d399 自身） |

完整列表见 `src/client/games/mini/catalog.ts`，每个游戏条目形如 `{ id, name, icon, Component: bind(Engine, props) }`，id 在注册表中用作 React key 与去重身份。

### 菜单折叠

`GROUP_RULES`（catalog.ts 末尾）把同族变体映射到折叠组：菜单中每个组显示为一行「图标 + 组名 + 变体数」，默认收起，点击展开/收起，顶部有「全部展开/全部收起」开关。规则按 id 前缀/后缀匹配、首条命中生效（`colorseq-` 须在 `color-` 前）。单成员组自动降级为普通卡片。第三方插件可在 `register` 时带 `group: { id, name, icon }` 参与折叠。

## 架构

纯客户端 UI 插件（host half 为空 `apply`），仿 `dsh-spur` 的双 bundle 结构：

```
src/
├── index.ts                     # host half: 空 apply
├── invariant.ts                 # 包不变量伴生（空 installer）
└── client/
    ├── index.tsx                # apply: provide d399Games 服务 + 注册内置游戏 + 挂载 overlay
    ├── registry.ts              # D399GamesService 实现 + Game 类型
    ├── useSessionRunning.ts     # useSyncExternalStore 订阅 current session 的 running
    ├── D399Overlay.tsx          # 主组件: teaser / menu / game modal（portal 到 document.body）
    ├── D399.module.css
    ├── games/
    │   ├── types.ts             # GameProps 共享类型
    │   ├── index.ts             # registerBuiltinGames: wordle + match3 + mini catalog
    │   ├── wordle/{logic.ts, words.ts, Wordle.tsx, Wordle.module.css}
    │   ├── match3/{logic.ts, Match3.tsx, Match3.module.css}
    │   ├── webframe/{WebFrame.tsx, BookmarkPanel.tsx, bookmarks.ts, *.module.css}
    │   └── mini/                # 192 款参数化小游戏
    │       ├── shared.ts        # 纯函数助手 + 词表/题库/谜语
    │       ├── mini.module.css  # 跨引擎共享样式（wrap/header/btn/cell/grid/banner/...）
    │       ├── engines-simple.tsx   # 约 24 引擎: clicker/reaction/aim/whack/bubble/etch/pixel
    │       │                       # /number/math/trivia/hangman/scramble/typing/stroop/riddle
    │       │                       # /coin/dice/spinner/color/slots/blackjack/highlow/war/cat-clicker
    │       ├── engines-strategy.tsx # 约 18 引擎: ttt/memory/simon/lights/slide/peg/mastermind
    │       │                       # /24game/water/hanoi/connect4/knight/mines/sudoku/nonogram
    │       │                       # /2048/nqueens/pathfind
    │       ├── engines-arcade.tsx   # 约 10 引擎: snake/breakout/pong/flappy/dodge/dino
    │       │                       # /asteroids/maze/colorseq/catch
    │       ├── catalog.ts       # MINI_CATALOG: 192 条 {id,name,icon,Component} + GROUP_RULES 折叠规则
    │       └── index.ts         # registerMiniGames(registry): O(N) 注册 catalog 全部条目
    └── ...
tests/                           # vitest 单元测试（wordle / match3 / 注册表 / mini catalog）
```

### Mini-game 引擎参数化模式

每个引擎是一个标准的 React 组件，接收 `GameProps & EngineProps`。`bind(Engine, props)` 返回一个仅接收 `GameProps` 的包装组件，把 `EngineProps` 闭包进去，这样就能作为 `Game.Component` 塞进注册表。同一引擎绑定不同参数即生成不同游戏条目（如 `Snake` × `{size, speedMs}` 组合 → 5 款贪吃蛇）。

```ts
// catalog.ts
{ id: 'snake-15-fast', name: '贪吃蛇 15·快', icon: '🐍',
  Component: bind(Snake, { size: 15, speedMs: 100 }) }
```

### 游戏注册表服务（可拓展性）

插件在 client `apply` 里通过 `ctx.provide('d399Games', registry)` 暴露服务。第三方插件注册游戏：

```ts
// 另一个 DSH 插件
export const inject = ['d399Games']
export function apply(ctx) {
  ctx.effect(() => ctx.d399Games.register({
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    Component: SnakeGame,
  }), 'my-plugin: snake game')
}
```

注册的游戏会自动出现在贪玩蓝鲸的游戏菜单中。

### 生成状态检测

overlay 是 `position: fixed` 的 DOM 贡献（portal 到 `document.body`），不经过 slot 系统，因此直接通过 `useSyncExternalStore` 订阅 `ctx.sessions.list` 快照，读取 `byId[current].running`。快照做了引用稳定性缓存：`running` 未实际翻转时返回同一引用，避免无限重渲染。

## 开发

```sh
pnpm install          # 安装开发依赖
pnpm run typecheck    # tsc --noEmit（通过 ../dsh 解析 DSH 源码类型）
pnpm test             # vitest run（wordle / match3 / 注册表 / mini catalog 单元测试）
pnpm run build        # tsc + tsdown → lib/index.js, lib/invariant.js, lib/client.js
pnpm run bundle:client  # 只跑 tsdown，跳过 tsc（用于绕开 ../dsh vendor 的预存在类型错误）
```

### 基于 DSH checkout 类型检查

`tsconfig.json` 继承 `../dsh/tsconfig.base.client.json`，复用其 `paths` 映射到同级 DSH checkout 的 `packages/*/*/src`。需在 `../dsh` 是 DSH checkout 根目录的同级布局下运行 typecheck。**注意**：`tsc` 会顺着 `paths` 把 `../dsh/vendor/cordis|cosmokit|schemastery` 也拉进来类型检查，这些 vendored 包有约 60 个预存在错误（与本项目无关）。本项目自身源码 0 错误；用 `pnpm run bundle:client` 直接跑 tsdown 可绕过 tsc 阶段生成产物。

### 预构建 lib/

`lib/` 随仓库提交（与 `dsh-web-ui-notify` / `dsh-activity-plugin` / `dsh-spur` 相同模式），git 安装时无需 `prepare` 脚本。开发时改动源码后跑 `pnpm run bundle:client`（或完整 `pnpm run build`）重建 `lib/`，再提交。

## 安装

```sh
# 从 npm 安装（推荐）：
dsh plugin --profile web add @huanlin/dsh-plugin-d399
```

预构建策略（无 `prepare`）：开箱即用。

## 配置

通过 `cordis.patch.yml` 的 `config` 块覆盖默认值：

```yaml
- insert:
    - id: dsh-d399
      name: '@huanlin/dsh-plugin-d399'
      config:
        message: '❤深❤夜❤寂❤寞❤，❤来❤玩❤ D399❤'  # teaser 文案
        buttonText: '来♂'                            # teaser 按钮文字
        enabled: true                                 # 总开关
```

## 检查

```sh
pnpm run typecheck   # 类型门禁（自身源码 0 错误；vendor 预存在错误忽略）
pnpm test            # 单元测试四件套
pnpm run bundle:client  # 重建 lib/client.js 产物
```

## 已知限制

- **teaser 每次生成只弹一次**。同一生成周期内用户关闭 teaser 后不会重复弹出，直到下一次 `running` 边沿。
- **match3 无动画**。消除/下落是瞬时的，不做补间动画（保持实现简洁）。
- **wordle 词表较小**。内置约 200 个猜测词 + 48 个答案词，不含全部 5 字母词；遇到不在词表的有效词会被拒。
- **游戏状态不持久化**。关闭游戏 modal 后进度丢失（刷新或切换会话也不保留）。
- **mini 游戏难易度通过参数预绑定**。catalog 里每款游戏的难度是固定的（如"贪吃蛇 15·快"），运行时不能调节；想加新难度就再绑一个新 id。
- **canvas 引擎在低端机上可能掉帧**。Breakout/Pong/Flappy/Dino/Asteroids 用 `requestAnimationFrame`，无帧率限制。
- **AI 对手很弱**。井字棋/四连棋的 AI 是随机走子，仅用于休闲，不是真正挑战。

## 设计参考

- 插件开发规范：`plugin-development-guide.md`
- 范本插件：`dsh-spur`（client-only UI 插件 + 预构建 lib/）
- DSH 客户端架构：`dsh/packages/client/AGENTS.md`
