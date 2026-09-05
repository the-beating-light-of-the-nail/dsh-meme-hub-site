# dsh-galgame-generator

**版本：0.4.0**

DeepSeek Harness (DSH) 的 **Galgame 生成器**：提供一份剧本文档 + 立绘/背景/音乐素材，即可生成一个可玩的视觉小说（Galgame）网页。
新增一个GalGame生成模式，在这个模式的工作区下提供一份剧本文档 + 立绘/CG/背景/音乐素材等，即可生成Galgame网页。

剧本可根据格式md文件由ai直接生成。

生成物：

- **`<标题>.galgame.html`** —— 自包含独立网页：双击即可在浏览器游玩，立绘/背景/音乐全部内嵌，**9 槽位存档读档**（localStorage），可发给别人玩；
- **🎮 Galgame 侧边栏按钮** —— 在 DSH Web GUI 界面内直接游玩（刷新页面后出现）。

## 功能

- **剧本解析**：角色/背景/台词/旁白/选项分支/跳转/结局/**变量与 if 条件线**（`[if 变量 >= 1] … [else] … [endif]`）
- **立绘自动跟随说话人**：谁说话显示谁、旁白全隐藏、切换 0.35s 淡入淡出不闪；`[show 名字]` / `[hide 名字]` 可显式锁定
- **角色多张立绘**：`名字·表情: 文件.png` 定义变体，剧本里 `[表情 名字 表情名]` 切换（表情随存档保存）
- **背景音乐**：`[bgm 音乐.mp3]` 播放（循环）、`[bgm off]` / `[bgm stop]` 停止、`[bgm 音乐.mp3 0.5]` 可调音量
- **动画与 CG**：`[op]` 开局动画、`[ed]` 结束动画、`[cg]` CG 插图动画（`img_cg/`，支持 gif / svg / mp4 / webm / avi）
- **可配置存档数**：`[存档 N]` 设置槽位数（1–20，默认 9）；进度、立绘、表情、背景、BGM、变量全保存；标题页可直接进入读档
- **可自定义开始界面（标题页）**：剧本里的 `## 开始界面` 区可设置标题背景/标题音乐、是否展示人物、布局（立绘大图站位 / 头像排）、出场人物与站位；不写则保持默认样式
- **播放器**：打字机、自动/快进、历史记录、结局画面
- **两个模型工具**：`galgame_scan`（扫描素材）、`galgame_build`（解析生成）

## 素材约定（工作区根目录）

| 放什么 | 位置 |
| --- | --- |
| 剧本文档 | 工作区根目录任意 `.md` / `.txt`（如 `夏日回忆.md`） |
| 人物立绘 | `img_human/`（如 `img_human/mei.png`） |
| 背景图片 | `img_bg/`（如 `img_bg/classroom.png`） |
| 背景音乐 | `audio/`（如 `audio/bgm.mp3`） |
| 开局/结束动画、CG 插图 | `img_cg/`（如 `img_cg/opening.gif`、`img_cg/cg1.gif`、`img_cg/ending.mp4`） |
| 开始界面素材（标题背景/标题音乐） | `img_ui/`（可选，如 `img_ui/title.png`） |

剧本示例：

```md
# 夏日回忆

## 角色
小美: img_human/mei.png @ right
小明: img_human/ming.png @ left

## 背景
教室: img_bg/classroom.png
天台: img_bg/rooftop.png

## 开始界面          ← 可选：自定义标题页（不写则用默认样式）
背景: img_ui/title.png
音乐: audio/title.mp3
布局: 立绘
人物: 小美 @ 右, 小明 @ 左

## 剧本
[bg 教室]
[bgm audio/bgm.mp3]
小美: 今天天气真好。
（旁白：立绘自动隐藏）
[选项]
- 一起去天台 → 天台线

### 天台线
[bg 天台]
[bgm audio/bgm2.mp3 0.5]
[变量 好感度 + 1]
[if 好感度 >= 1]
小美: 你果然愿意来。
[endif]
[结束 结局·天台上的诗]
```

支持图片 png/jpg/jpeg/webp/gif/svg，音乐 mp3/ogg/wav/m4a/mp4/flac。完整语法见 [docs/剧本格式.md](docs/剧本格式.md)，可直接套用的示例剧本见 [examples/夏日回忆.md](examples/夏日回忆.md)（把 `img_human/`、`img_bg/`、`audio/` 换成你的素材即可）。

## 自检

```bash
node scripts/check.mjs   # 语法 + manifest + bundle 契约自检
```

## 安装

打包 tarball 后安装到你的 DSH web profile（与其他 `dsh-*` 插件一致）：

```bash
pnpm pack
# 把 dsh-galgame-generator-*.tgz 复制到 web profile 并添加依赖：
#   例如在 ~/.dsh/profiles/web 下：pnpm add ../path/to/dsh-galgame-generator-0.4.0.tgz
# 然后重启 `dsh web`。
```

安装后刷新页面，侧边栏底部出现 **🎮 Galgame** 按钮。在对话中让助手调用 `galgame_build` 生成游戏（剧本与素材按上述约定放好即可），然后打开播放器游玩。

## 🎬 Galgame 生成模式

插件安装并刷新后，会自动向 DSH 写入一个名为 **「Galgame 生成模式」** 的 agent preset。

**如何进入模式**：新建会话时，在新建会话界面（工作区选择器旁）的 preset chip 中选择 **Galgame 生成模式**；或在 **设置 → Agent Presets** 把它设为默认。进入该模式的会话会自动注入生成引导提示词（persona），因此你只需要把素材放好，然后对助手直接说「**生成**」——

助手会**自动**完成两步，无需你再喂剧本文档路径：

1. `galgame_scan` 扫描工作区，定位剧本文档（`.md`/`.txt`）与立绘/背景/音乐/CG 素材；
2. `galgame_build` 依据剧本自动构建游戏，产物写回工作区，并同步到内存供 🎮 Galgame 播放器加载。

生成完成后助手会汇报用了哪份剧本、识别到哪些角色，以及产物路径（`.galgame.html`，双击即玩）。

如果你只装插件、不选模式，工具 `galgame_scan` / `galgame_build` 仍可在任意会话里手动调用（传剧本文档绝对路径）。

> 该 preset 基于随附 `standard` 的全量副本，仅追加了生成引导 persona；你可按需编辑 `~/.dsh/.agent-presets/galgame/` 下的文件来定制你自己的版本。

## 剧本语法速查

| 写法 | 含义 |
| --- | --- |
| `名字: 台词` | 角色台词（自动显示该角色立绘） |
| `（旁白）` 或纯文本行 | 旁白（立绘全部淡出） |
| `[bg 背景名]` | 切换背景 |
| `## 开始界面`（可选区） | 自定义标题页：`背景: img_ui/title.png`、`音乐: …`、`布局: 立绘|头像`、`显示人物: 是|否`、`人物: 小美 @ 右`（不写=默认样式） |
| `[show 名字 @ left/center/right]` / `[hide 名字]` | 显式显示/隐藏并锁定立绘 |
| `[bgm 文件.mp3]` / `[bgm off]` / `[bgm 文件.mp3 0.5]` | 音乐播放/停止/音量 |
| `[变量 名字 = 值]` / `[变量 名字 + 1]` | 变量赋值/增减 |
| `[if 变量 >= 2]` … `[else]` … `[endif]` | 条件分支（支持 = == != > >= < <= 及中文） |
| `[选项]` + `- 文本 → 标签` | 分支选项 |
| `### 标签名` / `[跳转 标签]` | 跳转点与跳转 |
| `[结束 结局名]` | 结束游戏 |

## License

MIT
