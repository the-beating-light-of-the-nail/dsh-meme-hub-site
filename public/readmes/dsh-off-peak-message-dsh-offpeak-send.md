# dsh-offpeak-send

DSH 谷时发送插件（标准 profile bundle）：开启「谷时模式」后，输入框发送的消息进入谷时队列，Host 计时器在谷时窗口（DeepSeek 官方峰谷计价的谷时段，价格为峰时 50%）到点时自动注入会话并触发 Agent 回复。

## 安装

```bash
# 注册到活动 profile（生成 .package-map.json，冷启动才能解析）
pnpm --dir ~/.dsh/profiles/web add --save-prod dsh-offpeak-send

# 在 ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles 追加 "dsh-offpeak-send"
# 完全退出并重新打开 DeepSeek Harness
```

## 使用

- 输入框左侧「谷时模式」胶囊开关（按会话记忆，持久化）
- ON 后：`Enter` 入队 · `⌘/Ctrl+Enter` 立即发送 · `Esc` 退出 · `Shift+Enter` 换行
- 谷时内入队立即发送；峰时排队至下一谷时起点自动发送
- 队列条显示待发条数 + 下个谷时倒计时，逐条可 [立即发送] / [取消]

## 数据

队列 / 开关 / 配置持久化于 `~/.dsh/storages/offpeak.json`（storageDomain 域 `offpeak`），与代码解耦，重启自动对账重排。

## 开发

```bash
node --check lib/index.js && node --check lib/client.js   # 语法
node test/window.test.mjs                                  # 时间窗算法测试
```

## 文档

- 仓库 README（部署/使用/架构）
- `docs/配置说明.md`（config 字段速查/谷时窗口表/价目表）
- `docs/官方价目核对.md`（峰谷计价证据与链接）

## 许可证

MIT
