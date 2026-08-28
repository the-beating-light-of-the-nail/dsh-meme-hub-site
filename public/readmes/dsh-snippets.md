# dsh-snippets

DeepSeek Harness 极简「常用片段/命令」工具箱：把高频命令、代码、网址、提示词存下来，任何会话里一条工具调用就能找回。

- 一个 JSONL 文件（`~/.dsh/snippets/snippets.jsonl`），人类可读、可手工编辑、本身就是备份
- 五个工具，语义一眼可懂，没有多余概念
- 零 UI、零数据库、零网络：不加新运行时依赖，只有 harness SDK
- 显式记忆：AI 不会自动记录你的对话，只有你明确说「存」才存

## 功能

| 工具 | 作用 |
| --- | --- |
| `snippet_save` | 保存或覆盖一条片段（同名覆盖并更新时间） |
| `snippet_search` | 按子串搜索（匹配名称/正文/标签，不区分大小写） |
| `snippet_get` | 按确切名字取回一条 |
| `snippet_delete` | 删除一条 |
| `snippet_count` | 统计总数 |

## 用法（模型视角）

- 存：`snippet_save(name: "docker-logs", text: "docker logs -f --tail 100 myapp", tags: ["ops"])`
- 找：`snippet_search(query: "logs")` → 返回 `docker-logs`
- 取回：`snippet_get(name: "docker-logs")` → 拿到全文直接执行

## 为什么极简

- **不占上下文**：不自动注入记忆，只在调用工具时才取回
- **可预期**：存了什么、在哪、长什么样，一清二楚（就是那个 JSONL 文件）
- **内容是你挑的**：存的是你特意收藏的，不是 AI 替你判断的
- **轻**：无数据库、无向量库、无 UI 面板、无额外服务

## 数据

- 路径：`~/.dsh/snippets/snippets.jsonl`
- 每行一条 JSON：`{"name","text","tags","updatedAt"}`
- 损坏行自动跳过，不影响其余数据
- 片段名限制 `[A-Za-z0-9._-]{1,80}`，单条上限 2 万字符

## 安装

```sh
# 从 GitHub 安装（与 taxueseek 其他插件一致）
dsh plugin --profile web add "github:taxueseek/dsh-snippets#main&path:."
# 重启 dsh web
```

（本地开发：`dsh plugin --profile web add /path/to/dsh-snippets`）

## 配置

```yaml
- id: snippets-toolkit
  name: 'dsh-snippets'
  config:
    snippetsDir: '~/.dsh/snippets'   # 数据目录
    maxEntryChars: 20000             # 单条片段字符上限
    defaultLimit: 20                 # search 默认返回条数
```

## 开发

```sh
npm install --include=dev
npm test          # node --test 单元测试（11 项）
npm run build     # tsc 编译 host TS
```

## 许可

MIT

## 安装

\`\`\`sh
dsh plugin --profile web add taxueseek/dsh-snippets
\`\`\`

## 贡献

欢迎提交 PR。
