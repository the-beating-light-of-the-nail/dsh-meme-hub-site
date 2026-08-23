# 📋 BigPlan · AI 产品调研

按产品方向分析市场/技术/供应链，输出高中低三套产品规格方案。Product research, competitive analysis, market analysis, product planning.

> English: AI product research: market/tech/supply-chain analysis, 3-tier product spec proposals.

## ✨ 功能

详见 [SKILL.md](SKILL.md) 完整说明。

## 🔧 环境依赖

无脚本依赖，纯提示词驱动；建议配合联网搜索。

## 📥 安装（DeepSeek Harness / dsh）

本技能遵循 **Agent Skills 开放标准**（SKILL.md + YAML frontmatter），适用于 DeepSeek Harness (dsh)、OpenClaw、Claude Code 等支持 Agent Skills 的框架。

```bash
# 方式一：放入用户级共享目录（推荐）
mkdir -p ~/.agents
git clone https://github.com/kobenfang/bigplan.git ~/.agents/bigplan

# 方式二：放入项目目录
mkdir -p .agents
cp -r bigplan .agents/
```

dsh 启动后即可在技能列表中找到 `bigplan`。

## 🔍 搜索关键词

产品调研, 市场分析, 竞品分析, 产品规划, product research, market analysis

## 📄 目录结构

```
bigplan/
├── SKILL.md          # 技能定义（Agent Skills 标准）
```

## ⚖️ License

MIT

---
© 2026 [kobenfang](https://github.com/kobenfang) · 更多技能见 [dsh-skills](https://github.com/kobenfang/dsh-skills)

## 📦 Also on ClawHub (OpenClaw)

This skill is also published on [ClawHub](https://clawhub.ai) for OpenClaw users:

```bash
npx clawhub install bigplan
```

Search it: `npx clawhub search bigplan`
