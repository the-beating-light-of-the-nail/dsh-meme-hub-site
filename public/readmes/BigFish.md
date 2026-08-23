# 🎣 BigFish · AI 钓鱼助手

钓点分析 · 鱼情分析 · 钓点分享。拍水面分析鱼情，结合天气气压推荐鱼种·钓法·饵料。支持路亚、台钓、野钓、海钓，自动记录渔获和出钓报告。

> English: AI fishing assistant: spot analysis, fish activity, bait/lure recommendations, fishing log.

## ✨ 功能

详见 [SKILL.md](SKILL.md) 完整说明。

## 🔧 环境依赖

纯知识库驱动（4 个 YAML），无需脚本依赖；天气数据建议配合 weather 类工具。

## 📥 安装（DeepSeek Harness / dsh）

本技能遵循 **Agent Skills 开放标准**（SKILL.md + YAML frontmatter），适用于 DeepSeek Harness (dsh)、OpenClaw、Claude Code 等支持 Agent Skills 的框架。

```bash
# 方式一：放入用户级共享目录（推荐）
mkdir -p ~/.agents
git clone https://github.com/kobenfang/bigfish.git ~/.agents/bigfish

# 方式二：放入项目目录
mkdir -p .agents
cp -r bigfish .agents/
```

dsh 启动后即可在技能列表中找到 `bigfish`。

## 🔍 搜索关键词

钓鱼, 鱼情, 钓点, 路亚, 台钓, 饵料, fishing, angling, lure

## 📄 目录结构

```
bigfish/
├── SKILL.md          # 技能定义（Agent Skills 标准）
├── scripts/knowledge/bait-recipes.yaml
├── scripts/knowledge/fish-species.yaml
├── scripts/knowledge/lure-guide.yaml
├── scripts/knowledge/spot-analysis.yaml
```

## ⚖️ License

MIT

---
© 2026 [kobenfang](https://github.com/kobenfang) · 更多技能见 [dsh-skills](https://github.com/kobenfang/dsh-skills)

## 📦 Also on ClawHub (OpenClaw)

This skill is also published on [ClawHub](https://clawhub.ai) for OpenClaw users:

```bash
npx clawhub install bigfish
```

Search it: `npx clawhub search bigfish`
