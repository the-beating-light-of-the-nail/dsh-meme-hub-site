<div align="center">

# dsh-plugin-marketplace

**装在 DeepSeek Harness 里的插件市场** · A plugin marketplace inside DeepSeek Harness

浏览、搜索、收藏、一键下载社区插件 —— browse, search, favorite, and one-click download community plugins.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/PetCT/dsh-plugin-marketplace?style=social)](https://github.com/PetCT/dsh-plugin-marketplace)
[![awesome-dsh-plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

</div>

---

## ✨ 功能 Features

- 🔍 **浏览 + 搜索**：完整社区目录，中文关键词搜索（插件名 / 作者 / npm 包 / 描述）
- 🗂️ **分类筛选**：按 UI、主题、模型、工具、记忆、工作流等 12 类筛选
- ⭐ **排序**：星标（高→低 / 低→高）、最新收录、下载量
- ❤️ **收藏**：一键收藏/取消，持久化保存
- 📄 **详情页**：功能说明（中英）、最近更新（GitHub `pushed_at`）、主题标签、截图、弃用提示
- ⬇️ **一键下载**：`git clone` 到本地数据目录，不执行任何构建脚本
- ✅ **已装标记**：已下载的插件显示「已安装 ✓」，可一键打开目录

## 🚀 安装 Install

```sh
dsh plugin --profile web add github:PetCT/dsh-plugin-marketplace
```

重启 `dsh web`，打开 **设置 → 插件市场**。

## 🧭 使用 Usage

1. 打开 DSH 设置页 → **插件市场**
2. 用搜索 / 筛选 / 排序找到想要的插件
3. 点「安装」，插件会下载到 `~/.dsh/dsh-plugin-marketplace/installed/<owner>--<name>/`

## 🗂️ 数据源 Data Source

- **实时**：`https://awesome-dsh-plugin.com/plugins.json`（社区策展目录，每日刷新）
- **兜底**：`data/registry-snapshot.json`（打包进本仓库的离线快照，839 个插件）

## 🔒 安全 Security

- 只允许下载 registry 内收录的插件
- 仅执行 `git clone --depth 1`，**不执行插件内任何构建脚本**
- 收录 ≠ 背书：插件是第三方代码，请只安装你信任的来源

## 📁 目录结构 Structure

```
dsh-plugin-marketplace/
├─ src/index.js          # Host：Node 原生 + webServer 路由
├─ src/client/index.tsx  # Client：设置页 UI（React + fetch）
├─ client/client.js      # 构建产物（tsdown）
├─ data/registry-snapshot.json  # 离线目录快照
├─ cordis.patch.yml      # DSH bundle 补丁
├─ package.json          # dsh 插件声明（dsh.bundle / dsh.client）
└─ tsdown.config.ts      # 客户端构建配置
```

## 🔧 开发 Development

```sh
npm install
npm run build   # 生成 client/client.js
```

## 📄 许可 License

MIT © PetCT

- 设计参考：[dsh-market/dsh-market](https://github.com/dsh-market/dsh-market)（MIT）
- 目录数据：[awesome-dsh-plugin](https://awesome-dsh-plugin.com)（[GitHub](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)）