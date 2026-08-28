# dsh-zh-labels — DSH 界面中文标签持久化插件

[![license](https://img.shields.io/github/license/Xingkong42/dsh-zh-labels)](LICENSE)

> 中文 | [English](README.en.md)

**让 DeepSeek Harness 的 Web 界面永远显示中文标签——升级也不失效。**

DSH 的 Web 界面中，工具行标题（Read / Write / Bash / Pwsh…）、思考折叠标题（Think）、
轨迹面板标签、侧边栏品牌名等硬编码在 client 模块（`lib/client.js`）中。
直接修改 `node_modules` 里的文件会在升级 DSH 时被覆盖，中文标签随之失效。

本插件在**每次 DSH 启动时自动重新应用补丁**：扫描部署安装的 client 模块文件，
把已知的英文标签替换为中文。升级覆盖文件后，下次启动自动恢复，无需手动干预。

## 特性

- **启动自动修补**：挂载后每次启动 DSH 自动执行，升级后自动恢复
- **316 条替换规则**：覆盖工具标题、思考标题、轨迹面板全部标签、侧边栏、技能行等
- **多部署根探测**：自动扫描 npm 全局、profile 共享、profile web 三个 DSH 安装点
- **幂等安全**：文件已含中文则跳过，重复运行无副作用
- **容错**：单条规则失败不影响其余；升级后字符串变化时自动跳过该条
- **UTF-8 安全**：读写保持无 BOM，不破坏源文件编码

## 安装

### 方式一：DSH 插件安装（推荐）

```sh
dsh plugin --profile web add github:Xingkong42/dsh-zh-labels
```

### 方式二：手动安装

1. 将本仓库克隆或复制到 profile 的 node_modules：

   ```sh
   cd ~/.dsh/profiles/web/node_modules
   git clone https://github.com/Xingkong42/dsh-zh-labels.git
   ```

2. 编辑 `~/.dsh/profiles/web/package.json`，在 `dsh.profile.bundles` 列表末尾加入：

   ```json
   "dsh-zh-labels"
   ```

3. 重启 DSH（`dsh web`），插件启动时自动应用补丁。

## 验证

安装后重启 DSH，浏览器打开 Web 界面（建议 Ctrl+F5 强制刷新）即可看到中文标签。
也可以通过 HTTP 接口验证：

```sh
# 检查 client 模块是否已包含中文标签
curl -s http://127.0.0.1:3080/plugins/@deepseek-ai%2Fdsh-client-ui-tool/client.js | grep -c "搜索"
```

返回非 0 即已生效。

## 更新规则

升级 DSH 后如果某些标签失效，说明对应英文字符串在该版本中发生了结构变化。
更新 `lib/index.js` 中的 `PATCHES` 规则表后重启 DSH 即可；规则表设计为容错，
未匹配的规则会自动跳过，不影响其他标签。

## 目录结构

```
dsh-zh-labels/
├── lib/
│   └── index.js          # 补丁引擎（316 条替换规则 + 部署扫描）
├── cordis.patch.yml      # 组合挂载行（bundle patch 入口）
├── package.json          # 插件声明
└── tools/
    └── verify.mjs        # 规则命中率验证脚本
```

## 许可

[MIT](LICENSE)
