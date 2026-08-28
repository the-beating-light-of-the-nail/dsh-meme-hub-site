# dsh-complete-chime

[English](#english) · [中文](#zhongwen)

A DeepSeek Harness (`dsh`) plugin that plays a short sound when a conversation turn finishes. Works in the Web UI and Desktop. Built-in tones plus one custom upload, configured in **Settings → Plugins**.

![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-7c3aed)
![license](https://img.shields.io/badge/license-MIT-blue)

设置入口：**设置 → 插件 → 插件配置**。展开「对话完成提示音」即可开关、换音色、调音量、试听和上传自定义音频。

![Settings → Plugins → Plugin configuration](https://raw.githubusercontent.com/Whale-Zhang/dsh-complete-chime/9536566e14e61c676adfd155a9c3b7497ab75ee1/docs/settings-card.png)

<a id="zhongwen"></a>

## 中文

会话回合真正结束后播放提示音。网页端与桌面端同一套设置。

### 行为

- 任一会话回合结束（不是手动停止、不是刷新回放）播一次
- 多会话并行：谁完成谁响，互不吞掉；当前正在看的会话也会响
- 子代理会话默认不响
- 内置三种短提示音：铃声 / 叮咚 / 钟声
- 可上传一条自定义音频（mp3 / wav 等，最大 2MB）

### 设置

打开 **设置 → 插件 → 插件配置**，展开「对话完成提示音」：

- 启用开关
- 音色
- 音量（滑动条）
- 试听
- 上传 / 更换 / 移除自定义音频

自定义文件存在 `$DSH_HOME/complete-chime/`（默认 `~/.dsh/complete-chime/`），偏好写在用户设置文档的 `dsh-complete-chime` 命名空间。Web 与 Desktop 两个 profile 共用。

浏览器若拦截自动播放，在页面上点击一次即可解锁。切回前台时会尝试恢复 `AudioContext`，避免后台标签页把提示音静音后一直不响。

### 安装

需要已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)。

```sh
dsh plugin --profile web add github:Whale-Zhang/dsh-complete-chime
dsh plugin --profile desktop add github:Whale-Zhang/dsh-complete-chime
```

装完后**重启对应 profile**。用 `dsh --profile web --dump-config` 应能看到 `dsh-complete-chime` 这一行。

本地开发（拷进运行时目录后再 `file:` 安装）：

```sh
dsh plugin --profile web add file:$HOME/.dsh/plugins/dsh-complete-chime
dsh plugin --profile desktop add file:$HOME/.dsh/plugins/dsh-complete-chime
```

### 卸载

```sh
dsh plugin --profile web remove @dsh-external/dsh-complete-chime
dsh plugin --profile desktop remove @dsh-external/dsh-complete-chime
```

---

<a id="english"></a>

## English

Play a short cue when an agent turn finishes. Same settings on Web and Desktop.

### Behavior

- Fires once when a session turn actually ends (not a user abort, not a refresh replay)
- Concurrent sessions each get their own cue; the session you are viewing also rings
- Subagent sessions stay quiet
- Three built-in synthesized tones: Chime / Ding / Bell
- Optional custom audio upload (mp3 / wav, max 2MB)

### Settings

**Settings → Plugins → Plugin configuration → Completion chime**

Enable, sound, volume slider, preview, and custom-file upload. Chrome matches the built-in plugin cards (expand, reset, discard, save).

Custom audio lives under `$DSH_HOME/complete-chime/`. Preferences use the `dsh-complete-chime` settings namespace.

If the browser blocks autoplay, click once on the page to unlock audio. Returning to the tab resumes the audio context so later completions still ring.

Custom files must be real audio (sniffed on the host) and at most 2MB. Non-audio or oversized picks are rejected before save.

### Install

Requires [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

```sh
dsh plugin --profile web add github:Whale-Zhang/dsh-complete-chime
dsh plugin --profile desktop add github:Whale-Zhang/dsh-complete-chime
```

Restart the profile after installing. `dsh --profile web --dump-config` should list `dsh-complete-chime`.

### License

MIT
