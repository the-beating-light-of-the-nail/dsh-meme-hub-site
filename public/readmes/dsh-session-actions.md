# dsh-session-actions · 会话菜单增强

DeepSeek Harness Web 插件：在会话行「⋯」菜单末尾加上复制 ID、置顶、导出 Markdown、永久删除。侧栏所有工作区上方可以出现「置顶」分组。不改官方组件。

English UI follows the DSH locale.

![置顶分组与会话菜单](https://raw.githubusercontent.com/xingyingyuzhui/dsh-session-actions/e8542a78fb65216597142b04750c6257a2619c25/docs/menu.png)

菜单在官方「重命名 / 分叉 / 归档」下面追加：

| 项 | 作用 |
|---|---|
| 复制会话 ID | 把 `session-…` 写进剪贴板 |
| 置顶会话 | 钉到侧栏最上方的「置顶」分组；原工作区里仍保留 |
| 导出 Markdown | 导出结构化记录（思考、工具调用、用户/助手正文） |
| 删除会话 | 确认后**永久删除**该会话目录（不是归档；归档仍用官方菜单） |

置顶分组：默认可折叠（图钉 / 悬停实心三角），行上显示相对时间，悬停出 ⋯。置顶行可在组内拖动排序。置顶名单落在 `~/.dsh/dsh-session-actions/pins.json`。

## 安装

前置：本机已能运行 `dsh web`。

```sh
dsh plugin --profile web add github:xingyingyuzhui/dsh-session-actions
```

装完重启 `dsh web`。

本地开发：

```sh
dsh plugin --profile web add link:/abs/path/to/dsh-session-actions
```

## 卸载

```sh
dsh plugin --profile web remove dsh-session-actions
```

## 开发

Client 源码在 `session-*.mjs`。改完后生成 `client.js`，不要手改那份产物：

```sh
npm run build
npm test
```

## License

MIT
