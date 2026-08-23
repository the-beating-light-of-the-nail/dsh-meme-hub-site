# ☯ Big8 · AI 玄学助手

读图看风水 · 看面相 · 算八字 · 查星座 · 每日一卦 · 老黄历。上传图片分析家居风水/面相，输入生日排八字，查星座运势，起卦占卜。

> English: AI fortune-telling assistant: feng shui, face reading, BaZi (Chinese astrology), zodiac, daily divination, almanac.

## ✨ 功能

详见 [SKILL.md](SKILL.md) 完整说明。

## 🔧 环境依赖

Python 3 + lunar-python (`pip install lunar-python`)。风水/面相解读需要多模态模型支持。

## 📥 安装（DeepSeek Harness / dsh）

本技能遵循 **Agent Skills 开放标准**（SKILL.md + YAML frontmatter），适用于 DeepSeek Harness (dsh)、OpenClaw、Claude Code 等支持 Agent Skills 的框架。

```bash
# 方式一：放入用户级共享目录（推荐）
mkdir -p ~/.agents
git clone https://github.com/kobenfang/big8.git ~/.agents/big8

# 方式二：放入项目目录
mkdir -p .agents
cp -r big8 .agents/
```

dsh 启动后即可在技能列表中找到 `big8`。

## 🔍 搜索关键词

玄学, 风水, 八字, 星座, 面相, 算命, feng shui, BaZi, fortune telling, Chinese astrology

## 📄 目录结构

```
big8/
├── SKILL.md          # 技能定义（Agent Skills 标准）
├── scripts/big8.py
├── scripts/knowledge/bazi.yaml
├── scripts/knowledge/face.yaml
├── scripts/knowledge/fengshui.yaml
├── scripts/knowledge/zodiac.yaml
```

## ⚖️ License

MIT

---
© 2026 [kobenfang](https://github.com/kobenfang) · 更多技能见 [dsh-skills](https://github.com/kobenfang/dsh-skills)

## 📦 Also on ClawHub (OpenClaw)

This skill is also published on [ClawHub](https://clawhub.ai) for OpenClaw users:

```bash
npx clawhub install big8
```

Search it: `npx clawhub search big8`
