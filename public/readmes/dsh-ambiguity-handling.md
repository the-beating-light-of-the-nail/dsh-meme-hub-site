# dsh-ambiguity-handling

DeepSeek Harness（dsh）插件：当用户请求存在歧义、范围不清或可能有多种理解时，向 system prompt 追加「歧义处理规则」，引导模型先澄清用户意图，而不是臆测或假设。

> 已收录于 [dsh.pub](https://dsh.pub/en/plugins/dsh-ambiguity-handling/)

## 功能

- 以独立 section 形式向 system prompt 注入歧义处理规则，不覆盖已有的 system prompt 内容。
- 注入的 section 名称为 `ambiguity-handling`，`order` 为 `50`，用于控制它与其他 system prompt section 的相对顺序。
- 规则要求模型：明确指认歧义、列出 2–4 种中文理解、提供「其他」补充选项，并请用户确认后再继续。

## 注入的规则内容

插件会在 system prompt 末尾追加以下文本：

```text
# 歧义处理规则

当用户请求存在歧义、范围不清或可能有多重理解时，你必须：

1. 明确指出请求存在歧义，不要臆测、不要假设。
2. 列出 2-4 种最可能的中文理解。
3. 额外提供一个"其他"选项，让用户自行补充。
4. 请用户选择其中一项或补充说明。

输出格式示例：

"您的请求存在多种理解，请选择最符合您意图的一项：
A. ...
B. ...
C. ...
D. 其他（请补充说明）"
```

## 目录结构

```text
dsh-ambiguity-handling/
├── index.ts                 # 插件源码：导出 name / inject / apply，向 systemPrompt 注入 section
├── index.js                 # 预构建 JS 入口（package.json 的 main 指向这里）
├── package.json             # 插件元信息 + dsh.bundle 组合包 manifest
├── cordis.patch.yml         # 组合包 patch 层（按包名引用本插件）
├── test/smoke.test.mjs      # node:test 冒烟测试
├── scripts/validate-package.mjs  # 发布包 manifest 校验脚本
├── .github/workflows/ci.yml # GitHub Actions CI
├── README.md                # 中文说明文档
├── README.en.md             # 英文说明文档
├── PUBLISHING.md            # 发布与上架指南
├── CHANGELOG.md             # 变更日志
├── SECURITY.md              # 安全说明
└── LICENSE                  # MIT 许可
```

## 安装

### 方式一：组合包安装（发布到 npm / GitHub 后推荐）

dsh 读取本包的 `dsh.bundle` 声明后会自动激活 `cordis.patch.yml` 层，不需要手动编辑 profile 的 patch：

```sh
# npm 发布后
dsh plugin --profile web add dsh-ambiguity-handling

# GitHub 仓库
dsh plugin --profile web add github:changlianxiya-139/dsh-ambiguity-handling

# 本地 tarball
dsh plugin --profile web add ./dsh-ambiguity-handling-1.0.0.tgz
```

headless profile 需要时同样执行，并把 `web` 换成 `headless`。发布与上架步骤见 [PUBLISHING.md](PUBLISHING.md)。

### 方式二：本地 file: 部署（本机当前方式）

插件目录位于：

```text
/home/aa/.dsh/plugins/dsh-ambiguity-handling
```

## 配置（本地 file: 部署）

dsh 会按 profile 加载 `cordis.patch.yml`。本地部署时，插件需要注册到实际使用的 profile 中。

### web profile

`~/.dsh/profiles/web/cordis.patch.yml` 的 `- insert:` 列表中加入：

```yaml
- id: dsh-ambiguity-handling
  name: 'file:/home/aa/.dsh/plugins/dsh-ambiguity-handling'
```

完整示例：

```yaml
# Web profile 用户 patch 层
- insert:
    - id: tool-cordis
      name: '@deepseek-ai/dsh-tool-cordis'
    - id: dsh-ambiguity-handling
      name: 'file:/home/aa/.dsh/plugins/dsh-ambiguity-handling'
```

### headless profile

`~/.dsh/profiles/headless/cordis.patch.yml` 内容为：

```yaml
- insert:
    - id: dsh-ambiguity-handling
      name: 'file:/home/aa/.dsh/plugins/dsh-ambiguity-handling'
```

## 工作原理

1. 插件通过 `export const inject = ['systemPrompt']` 声明依赖 dsh 的 `systemPrompt` 注入点。
2. dsh 加载插件时调用 `apply(ctx)`。
3. `ctx.systemPrompt.section({ ... })` 将规则注册为一个有序 section：

```ts
ctx.systemPrompt.section({
  name: 'ambiguity-handling',
  order: 50,
  text: ambiguityRule,
})
```

- `name`：section 唯一标识，避免重复注入时产生冲突。
- `order`：section 顺序，数值越小越靠前（具体表现以 dsh 最终拼接实现为准）。
- `text`：追加到 system prompt 的实际文本。

## 生效与验证

- 修改 patch 配置或插件代码后，必须 **重启 dsh**（对应的 web / headless profile）才会重新加载插件。
- 可用 `--dump-config` 验证插件行已进入生效配置：

  ```sh
  dsh --profile web --dump-config | grep -A1 'id: dsh-ambiguity-handling'
  ```

- 重启后新建会话，确认 system prompt 中已包含「歧义处理规则」段落和 `ambiguity-handling` section。
- 验证方法：对模型发送一个有歧义的请求（如「帮我写一下」），观察模型是否按规则列出 A/B/C/D 选项请求澄清。

## 修改规则

- 源码在 `index.ts` 的 `ambiguityRule` 模板字符串中。
- 修改后请同步更新预构建入口 `index.js`（重新转译或手动同步），否则发布包仍使用旧规则。
- 重启 dsh 生效。

## 停用插件

- **组合包安装**：`dsh plugin --profile <name> remove dsh-ambiguity-handling`
- **本地 file: 部署**：从对应 profile 的 `cordis.patch.yml` 删除该插件的 `- id: dsh-ambiguity-handling` 条目

之后重启 dsh 即可。

## 市场收录状态

- [dsh.pub](https://dsh.pub/en/plugins/dsh-ambiguity-handling/)：已收录
- [DSH Hub](https://dshhub.dev/)：已提交（Issue #5，等待处理）
- awesome-dsh-plugin / dsh-market：待仓库满足「创建满 1 天且 ≥10 commits」后提交

## 发布与上架

发布到 npm、GitHub 或社区插件市场（dsh-market / DSH Hub / dsh.pub 等）的完整清单见 [PUBLISHING.md](PUBLISHING.md)。

## 许可

MIT，详见 [LICENSE](LICENSE)。
