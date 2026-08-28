# dsh-xiaoyuzhou · 小宇宙播客插件

[DSH (DeepSeek Harness)](https://www.npmjs.com/package/@deepseek-ai/dsh) Web 端的小宇宙播客播放器：在会话输入框下方注入播放条，弹出的播放面板支持订阅管理、粘贴分享链接打开节目、shownotes 阅读、断点续播和倍速播放；同时注册 `podcast_play` 模型工具，让 AI 直接帮你"播放某期播客"。

| 播放条 | 我的订阅 | 节目与单集 |
|:---:|:---:|:---:|
| ![正在播放条](https://raw.githubusercontent.com/jerryqx/dsh-xiaoyuzhou/ac6a2defc85d4379a38f6b0406b2d4d171cc3627/assets/screenshot-bar.png) | ![我的订阅](https://raw.githubusercontent.com/jerryqx/dsh-xiaoyuzhou/ac6a2defc85d4379a38f6b0406b2d4d171cc3627/assets/screenshot-mysubs.png) | ![节目详情与单集列表](https://raw.githubusercontent.com/jerryqx/dsh-xiaoyuzhou/ac6a2defc85d4379a38f6b0406b2d4d171cc3627/assets/screenshot-podcast.png) |

## 功能

- **免登录收听**：粘贴小宇宙分享链接（`https://www.xiaoyuzhoufm.com/podcast/...` / `/episode/...`，或 `xyzfm.link` 短链）即可打开节目并播放，音频经 host 代理流式传输（支持 Range / 拖动进度条）
- **订阅**：把常听的节目订阅到本地（`~/.dsh/xiaoyuzhou/state.json`），跨重启保留
- **断点续播**：每集播放进度自动记忆，重播时从上次位置继续（>30s 才记忆）
- **shownotes**：单集详情安全渲染（白名单标签 + 图片代理）
- **倍速**：0.75x / 1x / 1.25x / 1.5x / 2x 循环切换
- **音量**：播放条上滑动条调节（0–100%，可拖动/点击），喇叭图标一键静音/恢复；音量本地持久化，下次播放沿用
- **可选登录（解锁搜索/订阅同步）**：**扫码登录**——面板展示二维码，用手机小宇宙 App 扫一扫即可（登录后同步「我的订阅」、关键词搜索节目/单集、加载节目全部单集（免登录只展示最近约 15 集）、播放已购付费单集）；也保留短信验证码登录作为兜底（小宇宙对第三方发码接口加了滑块验证码，被拦截时可在手机 App 登录页触发验证码短信，回来输入手机号+验证码）
- **AI 工具 `podcast_play`**：模型可直接播放链接 / pid / eid（传节目播最新一集），登录后支持关键词搜索播放；支持 `action` 暂停/继续/停止/上一集/下一集

## 安装

```bash
dsh plugin --profile web add dsh-xiaoyuzhou
# 然后重启 dsh web 并刷新页面
```

本地开发安装（tarball）：

```bash
cd dsh-xiaoyuzhou
npm pack
dsh plugin --profile web add ./dsh-xiaoyuzhou-<version>.tgz
```

验证安装：

```bash
dsh web --dump-config | grep -i "xiaoyuzhou\|xyzfm"
```

## 使用

1. 打开 DSH Web（`dsh web` 启动后访问对应地址），会话输入框下方会出现「🎙 小宇宙播客」播放条
2. 点击播放条右侧面板按钮打开面板，在「打开」页粘贴小宇宙分享链接
3. 想搜索：在面板底部登录框用手机号 + 短信验证码登录后即可关键词搜索
4. 对 AI 说：「播放 https://www.xiaoyuzhoufm.com/episode/xxx」或（登录后）「播放最新一期科技早知道」

## 架构

```
lib/index.js    host 半边：webServer 路由（/xyzfm/*）、音频/图片代理、
                podcast_play 工具、systemPrompt、状态持久化
lib/xyzfm.js    小宇宙 API 客户端：匿名 SSR 抓取（__NEXT_DATA__）、
                短信登录、搜索/分页/付费单集接口、shownotes 白名单消毒
lib/client.js   browser 半边：slots 注入播放条（conversation.input.dock）
                与面板（shell.overlay），React UI，intent 轮询
```

- 数据链路：匿名抓取 `www.xiaoyuzhoufm.com/podcast|episode/<id>` 页面内嵌 `__NEXT_DATA__`（含 `media.xyzcdn.net` 公开音频直链）；host 以移动端 UA 绕过站点 WAF（桌面 UA 会 403）
- 浏览器音频统一走 `/xyzfm/audio?eid=...`：host 解析音频地址并流式转发 Range 请求；付费单集在已登录时经 `private-media/get` 换取临时直链
- 状态（订阅/进度/音量/倍速）与登录 token 存放在 `~/.dsh/xiaoyuzhou/`，不使用浏览器存储
- 工具意图：`podcast_play` 在 host 写入 pendingIntent，client 每 2s 轮询 `/xyzfm/intent` 执行

## 已知限制

- 免登录只能拿到节目最近约 15 集（小宇宙 web 端限制）；登录后可完整分页
- 付费单集需已在小宇宙 App 内购买，且需登录后才可能播放
- 小宇宙 Web 端 WAF 对非浏览器 UA 返回 403，本插件使用移动端 Safari UA 抓取；若站点策略变化，解析可能失效
- 第三方登录存在被小宇宙风控/封号的可能（与 [ultrazg/xyz](https://github.com/ultrazg/xyz) 等项目的警告一致），token 只存本机，请自行斟酌

## 开发与测试

```bash
npm install
npm test        # vitest：输入归一化 / NEXT_DATA 解析 / 消毒 / 路由与工具（mock）
npm pack --dry-run
```

## License

MIT
