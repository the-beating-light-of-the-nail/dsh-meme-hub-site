# Aura Vision

免费视觉识别插件（DeepSeek Harness `web` profile 永久插件）。设计语言 **Aura**：宛如天生如此，若有似无。

## 特性

- **免费通道**：智谱 GLM-4V-Flash（免费档）优先；可配置任意 OpenAI 兼容多模态接口；Pollinations 匿名兜底。
- **长文档识别**：glm-4v-flash 输出上限 1024 tokens（API 实测）——自适应网格切块（单块目标 1100px、最多 3×3、8% 重叠）逐块识别突破上限，切块模式用逐块纯转录提示词；>3200px 温和归一。
- **Aura UI**：高透毛玻璃（55% 底色 + 28px 模糊）、三星机身式小圆角、深浅主题自洽配对（CSS `light-dark()`）、若有似无的次级信息。
- **历史**：缩略图 + 原图分离存储；收藏、过滤、删除、清空；导出 Markdown（原图内嵌 base64，单文件自包含）。
- **结果导出**：MD / Word(.doc) / PNG 长图 / Excel（含表格时）；双击预览图与详情图全屏放大；清除图片联动清除结果。

## 安装（永久）

```sh
# 推荐：npm 安装
dsh plugin --profile web add aura-vision

# 或从 GitHub：
dsh plugin --profile web add "github:Ck-epsilon/aura-vision"

# 或本地路径：
dsh plugin --profile web add "file:<绝对路径>"
```

其他机器使用前提：本机已 `npm login`（仅发布者需要）；使用者只需装好 dsh 并执行第一条命令。重启 dsh 后生效：任意会话输入框右侧出现「识图」按钮。数据存 `<workspaceRoot>/.aura-vision/`（随工作区可迁移），key 存本机凭证库。

## 开发经验

完整开发经验教训见配套文档 [`LESSONS.md`](../vision-entry-plugin/LESSONS.md)（运行时契约、深浅主题、模型实证法、大图策略、迭代纪律、陷阱速查表）。

## 兼容性

已在 DeepSeek Harness `0.1.0-rc.7` 与 `0.1.0-rc.8`（web profile）验证。

## 常见问题

- **安装/升级后按钮没反应、key 保存不上？** dsh 在启动时装载插件，安装或升级后需**重启 dsh** 一次（1.0.0 的 RPC 端点发现 bug 已在 1.0.1/1.0.2 修复）。重启后输入框右侧出现「识图」按钮即为生效。
- **识别长文档很慢？** 大图会切块逐块顺序调用（免费档防限流），块数越多耗时越长，属预期。
- **结果被截断？** glm-4v-flash 输出上限 1024 tokens（免费模型硬限制）；插件已用自适应切块 + 转录优先提示词缓解，更完整结果请配置更长输出的模型并设为当前。
- **换机器后历史还在吗？** 历史随工作区 `<workspaceRoot>/.aura-vision/` 迁移；key 存各机凭证库，需在新机器重新填写一次。
- **图片会发给谁？** 仅发给当前所选后端（智谱或你配置的接口），本机不向任何第三方上传。
- **如何卸载？** `dsh plugin --profile web remove aura-vision`。

## 架构

- `lib/host.js`：宿主半边——`AuraVisionService extends TypertRemoteService`（命名空间 `aura-vision`），方法经 `@Remote` 标记由网关 SRC 模式直连（无需构建期描述符）。
- `lib/client.bundle.js`：浏览器半边——`window.__ModuleLoader__.load` 工厂产物，`ctx.connection.rpc.call('/api', 'aura-vision/<method>', { args })` 调用宿主。
- `cordis.patch.yml`：bundle 补丁层，一行注册双半边。

## License

MIT
