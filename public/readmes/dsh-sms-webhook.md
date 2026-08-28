<div align="center">

# 📲 DSH-SmsWebhook

![banner](https://raw.githubusercontent.com/huaxiren6/dsh-sms-webhook/f5ff3615788fac553812913178a710a7ebf56901/assets/banner.png)

**DeepSeek Harness 短信转发 Webhook 插件**

[![npm version](https://img.shields.io/npm/v/dsh-sms-webhook?color=blue)](https://www.npmjs.com/package/dsh-sms-webhook)
[![license](https://img.shields.io/npm/l/dsh-sms-webhook)](https://github.com/huaxiren6/DSH-SmsWebhook/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/huaxiren6/DSH-SmsWebhook?style=social)](https://github.com/huaxiren6/DSH-SmsWebhook)

接收手机短信转发 App 推来的消息，落盘存储，让模型可以读取手机短信（验证码场景开箱即用）。

</div>

---

## 简介

在电脑上起一个本地 HTTP 服务，手机上的短信转发 App（SMS Forwarder / Tasker / iOS 快捷指令）把新短信 POST 过来，插件落盘存储并暴露给模型查询。

## 功能特性

- 📨 `sms_recent` — 最近短信（可选关键词过滤）
- 🔍 `sms_search` — 全文搜索存储
- 🔑 自动提取 `otp` 字段（第一个 4–8 位数字），验证码直接可用
- 💾 JSONL 落盘，重启不丢（上限 5000 条自动裁剪）
- 🔎 可选 `keywords` 白名单，只收含指定词的短信（如 `["验证码", "code"]`）

## 安装

```sh
dsh plugin --profile web add dsh-sms-webhook
```

## 手机端设置

用任意能「转发短信到 HTTP」的 App，例如：

- **[SMS Forwarder](https://play.google.com/store/apps/details?id=com.onecloud.smsforwarder)**（安卓，最常用）
- Tasker / MacroDroid 的自定义 HTTP POST
- iOS 的快捷指令（收到短信 → 获取 URL 内容）

转发目标填：

```
POST http://<电脑IP>:8899/
Content-Type: application/json
```

JSON 格式（字段名兼容常见别名）：

```json
{
  "from": "10086",
  "body": "您的验证码是 123456，5 分钟内有效。",
  "receivedAt": 1787180000000,
  "device": "Pixel 8"
}
```

- `from` 也可写作 `sender` / `number` / `phone`
- `body` 也可写作 `text` / `message` / `content`
- 时间戳省略则用服务器当前时间

## HTTP 接口

| 方法/路径 | 用途 |
|---|---|
| `POST /` | 接收短信（200=已存储，202=被关键词过滤） |
| `GET /?limit=20&q=验证码` | 查询最近短信（`q` 可选过滤） |
| `GET /health` | 存活探针 |

## 配置

| 键 | 默认 | 含义 |
|---|---|---|
| `host` | `0.0.0.0` | 监听地址（局域网转发保持默认） |
| `port` | `8899` | 监听端口 |
| `store` | `$DSH_HOME/data/dsh-sms-webhook/messages.jsonl` | 存储文件 |
| `keywords` | `[]` | 非空时只收含这些词的消息（如 `["验证码", "code"]`） |

> ⚠️ `0.0.0.0` 意味着局域网内任何人都能 POST——建议在手机 App 里限制来源，或仅在可信网络使用。

## License

[MIT](LICENSE)
