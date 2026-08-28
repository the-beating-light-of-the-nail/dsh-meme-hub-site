# @frog755/dsh-prompt-vault

[English README](./README_EN.md) | 中文说明

Prompt Vault —— DeepSeek Harness（DSH）输入框上方的提示词库（灵感来自 voyager 的 Prompt Vault）。

<p align="center">
  <img src="https://raw.githubusercontent.com/Frog755/dsh-prompt-vault/714e9939617270a0f7b3a33b5c4aadcd1a6e8ac3/assets/screenshot-panel.png" alt="Prompt 库面板" width="860">
</p>

- 输入框工具行左侧 **📚 按钮**，点开在输入框上方展开 Prompt 列表面板
- 每条只显示主题名 + 首行预览；**点条目 = 整条填入输入框**（已有草稿时自动追加，不覆盖）
- **▸** 展开完整内容；支持新建 / 编辑 / 删除（二次确认）/ 搜索
- 数据持久化在 `~/.dsh/prompt-library.json`（环境变量 `DSH_PROMPT_VAULT_FILE` 可覆盖）
- 首次使用自带两条示例 prompt（代码审查 / 中英互译），可随意编辑或删除

## 安装

**前置**：已装好 DSH（`dsh web` 能正常运行），Node.js ≥ 20。

```sh
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @frog755/dsh-prompt-vault
```

装完**硬刷新浏览器**（Cmd/Ctrl+Shift+R）即可在输入框工具行看到 📚 按钮。

> 该命令自动完成：登记依赖 → 识别包内 `dsh.bundle.patch`（`cordis.patch.yml`）→ 注册进 `dsh.profile.bundles` 挂载。插件以 npm 包发布，**不修改 DSH 源码**。

## 更新

```sh
npx -y --package @deepseek-ai/dsh dsh plugin --profile web update @frog755/dsh-prompt-vault
```

然后硬刷新浏览器。client 改动热加载生效，无需重启 DSH；host 半改动才需重启。

## 卸载

```sh
npx -y --package @deepseek-ai/dsh dsh plugin --profile web remove @frog755/dsh-prompt-vault
```

数据文件 `~/.dsh/prompt-library.json` 会保留。

## 数据文件

| 项 | 值 |
| --- | --- |
| 默认路径 | `~/.dsh/prompt-library.json` |
| 覆盖方式 | 环境变量 `DSH_PROMPT_VAULT_FILE` |
| 格式 | `{ version, items: [{ id, title, content, createdAt, updatedAt }] }` |

## 结构

| 文件 | 作用 |
| --- | --- |
| `src/index.js` | Host 半：`/__prompt-vault/list·save·delete` HTTP 端点 + JSON 文件存储 |
| `src/client.js` | Client 半（ModuleLoader bundle）：📚 按钮 + 展开面板，填入走 `inputActions.setDraft` |
| `cordis.patch.yml` | bundle patch：把 `prompt-vault` 行插入 profile roster |

## 从源码安装 / 开发（可选）

1. `~/.dsh/profiles/web/package.json` 的 `dependencies` 加：
   `"@frog755/dsh-prompt-vault": "link:C:/path/to/dsh-prompt-vault"`
2. 在 `~/.dsh/profiles/web` 目录执行 `pnpm install`
3. 重启 DSH（新 bundle 进入 boot graph 需要 host 重启；此后只改 client.js 热刷新即可）

## 许可

[MIT](LICENSE)
