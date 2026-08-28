<div align="center">

# dsh-mobile-ui

**为手掌重做 DeepSeek Harness。**

*A mobile shell for DSH — not a scaled-down desktop.*

[English](#english) · [中文](#中文)

[![License: MIT](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/yuanzhenqi/dsh-mobile-ui?style=flat-square&color=111111)](package.json)
[![DSH Plugin](https://img.shields.io/badge/DSH-plugin-111111?style=flat-square)](https://github.com/deepseek-ai/dsh)

</div>

<br/>

官方 Web 为书桌而设计：三栏并置，鼠标优先。把它塞进手机，侧栏、标题与输入框会叠在一起；点开一段会话，系统键盘还会自己弹起来。

本插件不压缩桌面，而是另做一层掌上界面——会话收入抽屉，对话铺满全宽，标题栏只留真正用得上的动作。

> DeepSeek Harness Web was designed for a desk. This plugin is designed for a hand.

---

## 中文

### 设计取舍

| 桌面原样塞进窄屏 | 本插件 |
| :---: | :---: |
| 三栏布局互相挤压 | 抽屉导航 · 对话铺满 |
| 点会话后键盘抢焦点 | 切会话即收起，键盘保持落下 |
| 上下文 / 记忆被挤出标题栏 | 保留核心动作，只隐藏 Session log |
| 设置页被底栏切断 | 全宽 sheet，可滚动、可点按 |
| 左右控件风格分裂 | 同一套圆形触控按钮 |

额外提供本机文件上传（≤ 50 MB → `~/.dsh/uploads/`），供手机把普通文件交给 Agent。

### 安装

```bash
dsh plugin --profile web add yuanzhenqi/dsh-mobile-ui
```

刷新 Web UI 即可。无需账号、域名或网关。

适用于 DSH Web `0.1.x` 官方 web profile。

远程访问（HTTPS 网关、Android 壳）是另一套自托管方案，不在本仓库。请使用你自己的证书与口令，不要把凭据写入插件。

---

## English

### The idea

DSH Web is a three-column desktop. On a phone that layout collapses on itself: sidebar, header and composer compete for the same strip of glass, and choosing a session autofocuses the composer — so the system keyboard appears uninvited.

`dsh-mobile-ui` does not scale that desktop down. It replaces the narrow-screen chrome:

| Official Web, squeezed | This plugin |
| :---: | :---: |
| Three columns fighting the viewport | Drawer navigation, full-width conversation |
| Session tap pops the keyboard | Drawer closes; keyboard stays down |
| Context / memory vanish from the header | Core actions stay; only Session log is hidden |
| Settings crushed by the bottom chrome | Full-width sheet, scrollable and tappable |
| Mismatched left / right controls | One circular control language |

A small extra for the handset: upload ordinary files (up to 50 MB) into `~/.dsh/uploads/` on the host.

### Install

```bash
dsh plugin --profile web add yuanzhenqi/dsh-mobile-ui
```

Reload the Web UI. No account, domain, or gateway.

Requires DSH Web `0.1.x` with the official web profile.

Remote access — an HTTPS gateway and Android wrapper — is a separate, self-hosted concern. Use your own certificate and password. Never commit credentials here.

---

MIT License
