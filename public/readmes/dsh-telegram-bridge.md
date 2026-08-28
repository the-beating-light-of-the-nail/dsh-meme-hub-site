# dsh-telegram-bridge

通过 Telegram 遥控你的 DeepSeek Harness（dsh）Agent：在手机上直接和你的 Agent 对话、调用技能、浏览/切换工作目录、收发文件。

## ✨ 功能

- 💬 **Telegram ↔ dsh Agent 对话**：私聊或群里 @ 机器人即可对话
- 🛡️ **访问控制**：默认仅白名单可用（用户名 / 聊天 ID），避免被陌生人滥用
- 📂 **工作目录浏览器**：`/cwd` 用按钮逐级浏览目录、新建文件夹、一键切换（完全在 Telegram 内操作）
- 🧠 **技能调用**：`/skills` 查看、`/skill <名称>` 调用
- 🖼️ **图片收发**：图片走多模态管线，Agent 生成的图片直接发回 Telegram
- 📄 **文件收发**：上传文件到工作区、把工作区文件发回手机
- 🎛️ **可视化配置**：dsh 设置页 → 插件配置，图形化配置 token / 白名单 / 代理等

## 📦 安装

把本插件加入你的 dsh profile（以 web profile 为例）：

1. 将 `dsh-telegram-bridge` 安装到 profile 的 node_modules：
   ```bash
   cd ~/.dsh/profiles/web
   pnpm add dsh-telegram-bridge   # 或手动复制 dist/ + package.json + cordis.patch.yml
   ```
2. 在 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 数组中加入 `"dsh-telegram-bridge"`。
3. 重启 dsh。

## 🚀 首次配置（用户全流程）

### 第 1 步：获取 Bot Token
在 Telegram 里找 **@BotFather** → `/newbot` 创建机器人 → 获得 token（格式 `123456789:AA...`）。

### 第 2 步：配置 Token（二选一）
- **方式 A（推荐，可视化）**：dsh 设置页 → 插件配置 → Telegram Bot 桥接 → 在 **Bot Token** 输入框粘贴 token → 点 **测试连接** 立即验证是否有效 → 点 **保存**。
- **方式 B（credentials）**：在 `~/.dsh/.credentials.yaml` 添加：
  ```yaml
  refs:
    DSH_TELEGRAM_BOT_TOKEN: "你的token"
  ```

### 第 3 步：配置访问白名单（安全必需）
设置页 → 插件配置 → Telegram Bot 桥接：
- **允许所有人访问**：选 **否（false）**（默认）
- **允许的用户名**：填你的 Telegram 用户名（不带 @），如 `your_username`；多用户用逗号分隔
- （可选）**允许的聊天 ID**：私聊数字 ID 或群组 ID，多 ID 用逗号分隔

### 第 4 步：配置代理（如需）
国内访问 Telegram 需要代理，**代理地址** 填：
```
http://127.0.0.1:7897                          # 本地代理（clash 等）
http://user:pass@host:port                      # 需要认证的代理
```
> 仅支持 http/https 代理（socks 暂不支持）。留空 = 直连。

### 第 5 步：重启并验证
重启 dsh 后，在 Telegram 里给机器人发 `/status` 或任意消息，应正常回复。

## 🎛️ 配置项

| 配置 | 默认 | 说明 |
|------|------|------|
| `bot_token_ref` | `DSH_TELEGRAM_BOT_TOKEN` | credentials 引用名 |
| `bot_token` | 空 | 直接填 token（设置页/配置均可） |
| `allow_all` | `false` | 是否允许任何人访问（强烈建议保持 false） |
| `allowed_usernames` | `[]` | 允许的 Telegram 用户名（不带 @） |
| `allowed_chat_ids` | `[]` | 允许的聊天/群组 ID |
| `group_require_mention` | `true` | 群里需 @ 机器人才响应 |
| `proxy` | 空 | 代理地址 `http://[user:pass@]host:port` |
| `cwd` | dsh 启动目录 | 默认工作目录 |
| `polling_interval` | `2000` | getUpdates 轮询间隔（毫秒） |

## 📖 Telegram 命令

| 命令 | 说明 |
|------|------|
| `/new` | 重置当前会话 |
| `/topic <名称>` | 切换命名子会话 |
| `/cwd` | 目录树浏览 / 切换工作目录（支持新建文件夹） |
| `/skills` | 列出可用技能 |
| `/skill <名称> [参数]` | 调用技能 |
| `/model [provider model]` | 查看 / 切换模型 |
| `/sessions` | 列出会话 |
| `/status` | 当前状态 |
| `/stop` | 停止当前回合（agent 正在思考/执行时打断） |
| `/auth` | 检查授权状态 |
| `/cleanup` | 释放空闲会话 |
| `/help` | 帮助 |

## 💬 交互模式（补充信息 / 停止）

- **Agent 处理中想补充信息**：直接发消息即可。消息会进入**同聊天的串行队列**，等当前回合结束后自动处理（不会丢失，也不会打断当前回合）。
- **想停止当前回合**：发 `/stop`，agent 会立即停止思考/执行。
- **想彻底重置**（停止 + 清空对话历史）：发 `/new`。
- **查看是否在处理**：发 `/status` 看运行状态；处理中 bot 会显示"typing..."。
- **注意**：`/stop` 只停当前回合，队列里排队中的消息仍会继续处理；要全部取消用 `/new` 或 `/cleanup`。

## 🔍 排障（FAQ）

**Q: 机器人完全不回复任何消息？**
A: 大概率 token 未配置。看 dsh 终端日志，会提示 `未配置 Bot Token` 及配置方法；或在设置页检查 Bot Token 是否显示"未配置"，填好后用 **测试连接** 验证。

**Q: 测试连接失败？**
A: 1) token 是否复制完整（@BotFather 里可查看）；2) 代理是否可达、格式是否正确（`http://[user:pass@]host:port`）；3) 本机网络是否能访问 api.telegram.org。

**Q: 提示"无权访问"？**
A: 你的用户名不在白名单。设置页 → 允许的用户名 里加上（不带 @），保存后即生效（无需重启）。

**Q: 想给朋友开放？**
A: 在设置页的允许的用户名/聊天 ID 里追加即可；也可把 `allow_all` 设为 true（不推荐）。

## ⚠️ 安全须知（开源部署必读）

- **工作目录边界**：`/cwd` 允许切换到任意目录（设计为"自己遥控自己的机器"）。Bot 会话的 agent 拥有该目录的读写能力，**切勿把 Bot 白名单开放给不信任的人**。
- **群组白名单**：`allowed_chat_ids` 填入**群 ID** 后，该群内所有成员都可与 Bot 对话（绕过用户名白名单）。只想让特定成员使用请用 `allowed_usernames`。
- **公网暴露**：设置页的「测试连接」调用 `POST /telegram-bridge/test-token` 无鉴权。**不要**将 dsh Web 直接暴露到公网且不做访问控制（dsh 默认监听 127.0.0.1，反向代理暴露时请加认证）。
- **文件安全**：Bot 收到的文件保存在 `<工作目录>/telegram-inbox/`（上限 25MB/个）；Agent 发送文件仅限工作目录内（越界会被拒绝）。
- **日志**：运行日志默认在系统临时目录，诊断日志在 `~/.dsh/dsh-telegram-bridge.log`，均不记录 token 明文。

## 🛠️ 开发

- 源码即 `dist/` 下的产物（无构建步骤），`dist/client.js` 为手写 `__ModuleLoader__` bundle。
- Host 端逻辑：`dist/index.js`；浏览器配置卡片：`dist/client.js`。
- 日志：默认 `系统临时目录/tg-bridge-log.txt`，可用环境变量 `DSH_TELEGRAM_BRIDGE_LOG` 覆盖；诊断日志默认 `~/.dsh/dsh-telegram-bridge.log`，可用 `DSH_TELEGRAM_BRIDGE_DIAG` 覆盖。
- 本地部署：修改后把 `dist/`、`package.json`、`cordis.patch.yml` 复制到 profile 的 node_modules，重启 dsh。

## 📄 License

MIT
