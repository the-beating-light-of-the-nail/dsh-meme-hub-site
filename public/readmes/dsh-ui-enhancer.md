# DSH UI Enhancer

面向 DeepSeek Harness Web 的桌面体验增强插件。它保留官方 UI 的会话和槽位契约，在其上组合成熟社区能力，并补充统一的个性化和文件引用体验。

> [!IMPORTANT]
> 这是由社区独立维护的非官方插件，不隶属于 DeepSeek，也不代表其审核、认可或推荐。安装第三方插件前请核验代码来源、依赖和权限边界，并自行评估使用风险。

## 功能

- 左侧栏沿用官方会话栏，保留新会话、搜索、工作区分组、历史会话、收起和设置，并增加更接近桌面客户端的视觉处理。
- 右侧工作区使用 `@linxin666/dsh-client-ui-aionui-panel`，支持可缩放文件树、Git 变更，以及 Markdown、代码与 Diff、CSV、PDF、图片、HTML 和 URL 浏览器预览。
- 壁纸支持本地图片和 URL、填充方式、位置、模糊、遮罩、界面透明度，以及基于图片亮度的自适应文字和边框颜色。
- 桌面宠物由本插件渲染，可命名、拖动、隐藏/召唤、缩放、查看会话状态、互动和投喂；可在独立的“宠物”一级设置页上传 PNG、JPEG、WebP、GIF 或 AVIF 作为形象。上传的形象按名字保存在浏览器的形象库中（最多 12 个），可随时切换、重命名或删除，保存后即可删除磁盘上的原始照片；旧版本已上传的单张形象会自动迁移进形象库。上传的不透明图片会在浏览器本地自动提取主体（去背景），并以无圆框的透明形象显示。开始对话、完成任务和前台使用时长会获得星星，星星可兑换食物并提升亲密度。
- 点击宠物会触发它的主动搭话（如“你在干什么呢？”“好饿啊……”），以气泡形式短暂展示。宠物下方的活动详情面板展示各会话的标题、状态、最近工具调用与回复片段，与顶部状态气泡不同质化，并可一键隐藏（偏好随浏览器持久化）。
- 在输入框键入 `@` 可搜索当前会话工作区中的文件，并插入结构化文件引用。
- 运行时样式桥修复 `dsh-client-ui-aionui-panel` 文件栏中“最大化/还原”按钮与“折叠”按钮重叠、误触的问题。

右侧工作区和设置兼容桥由本包的 bundle patch 自动组合。宠物形象、状态、奖励和 Host 会话活动投影均由本插件独立实现，不会加载社区宠物的浏览器界面、旧设置或角色数据；用户仍可单独安装其他宠物插件。

## 安装

要求 DeepSeek Harness `0.1.0-rc.6` 和 Node.js 22.19+ 或 24+。

```bash
dsh plugin --profile web add dsh-ui-enhancer
dsh web
```

安装后需要让正在运行的 Web profile 重新加载。插件设置中的一级“个性化”页面用于调整壁纸，“宠物”页面用于设置桌面伙伴、上传形象和管理投喂。

### 升级

`add` 会把当时的最新版本固定到 profile 的依赖里；发布新版本后执行下面的命令更新（等价于在 profile 目录运行 `pnpm update`）：

```bash
dsh plugin --profile web update dsh-ui-enhancer
```

### 从源码开发

```bash
git clone https://github.com/AlexYin-Tongji/dsh-ui-enhancer.git
cd dsh-ui-enhancer
pnpm install
pnpm build
# file: installs this local package together with its runtime dependencies.
dsh plugin --profile web add file:$(pwd)
```

修改源码后运行 `pnpm build` 并刷新页面即可。

开发时不要使用 `link:$(pwd)` 安装本插件。pnpm 的 `link:` 只创建主包链接，不会把本包声明的社区运行时依赖写入 Web profile；`file:` 会按 `package.json` 解析并安装完整依赖树。

## 安全边界

- 文件 API 只接受 Harness 已注册的工作区根目录。
- 所有相对路径在读取前都会做 realpath 校验，拒绝目录穿越、逃逸符号链接和 `.git` 路径。
- JSON API 和原始文件预览仅接受 loopback 请求。
- 文件搜索有目录、深度、扫描量和结果数上限；文本读取有 200,000 字符上限。
- 本地壁纸和形象库中保存的宠物形象保存在浏览器 IndexedDB 中，不上传到外部服务；宠物形象的去背景处理同样完全在浏览器内完成。

## 开发检查

```bash
pnpm typecheck
pnpm test
pnpm build
```

Host 入口是 `src/index.ts`，浏览器入口是 `src/client/index.ts`，共享协议位于 `src/core/contracts.ts`。

## 社区与许可

问题和建议请提交到 [GitHub Issues](https://github.com/AlexYin-Tongji/dsh-ui-enhancer/issues)。参与开发前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

右侧工作区和设置兼容桥来自 [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) 社区项目，宠物活动交互也参考了社区实践。本插件自身以 [MIT](./LICENSE) 许可发布；组合依赖继续遵循各自的许可证。
