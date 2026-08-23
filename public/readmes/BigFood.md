# 🍳 BigFood · AI 冰箱管家

上传食材图片识别 → 推荐菜谱。支持多图混搭、冰箱食材管理、采购提醒。Food recognition, recipe recommendation, ingredient management.

> English: AI fridge manager: recognize ingredients from photos, recommend recipes, manage inventory.

## ✨ 功能

详见 [SKILL.md](SKILL.md) 完整说明。

## 🔧 环境依赖

食材识别需要多模态模型支持（上传图片分析）。

## 📥 安装（DeepSeek Harness / dsh）

本技能遵循 **Agent Skills 开放标准**（SKILL.md + YAML frontmatter），适用于 DeepSeek Harness (dsh)、OpenClaw、Claude Code 等支持 Agent Skills 的框架。

```bash
# 方式一：放入用户级共享目录（推荐）
mkdir -p ~/.agents
git clone https://github.com/kobenfang/bigfood.git ~/.agents/bigfood

# 方式二：放入项目目录
mkdir -p .agents
cp -r bigfood .agents/
```

dsh 启动后即可在技能列表中找到 `bigfood`。

## 🔍 搜索关键词

冰箱, 菜谱, 食材, 做饭, 吃什么, recipe, ingredient, cooking

## 📄 目录结构

```
bigfood/
├── SKILL.md          # 技能定义（Agent Skills 标准）
```

## ⚖️ License

MIT

---
© 2026 [kobenfang](https://github.com/kobenfang) · 更多技能见 [dsh-skills](https://github.com/kobenfang/dsh-skills)

## 📦 Also on ClawHub (OpenClaw)

This skill is also published on [ClawHub](https://clawhub.ai) for OpenClaw users:

```bash
npx clawhub install bigfood
```

Search it: `npx clawhub search bigfood`
