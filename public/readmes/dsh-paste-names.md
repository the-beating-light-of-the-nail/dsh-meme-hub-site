# dsh-paste-names

Paste or drop a non-image file/folder into the DSH chat → **paste** gives a native `@path` reference, **drop** inserts the **absolute path** as plain text.

在 DSH（DeepSeek Harness）Web 聊天输入框里粘贴/拖入非图片文件或文件夹时：

- **粘贴** → 解析成 DSH 原生 @ 文件引用，替代默认的「仅支持 PNG、JPG、WebP、GIF 格式的图片」报错；
- **拖放**（拖到界面任意位置）→ 直接把**绝对路径**文本插入输入框。

## 行为

### 粘贴

| 粘贴内容 | 结果 |
|---|---|
| 工作区内的文件 | `@相对/路径/文件名`（与手动 @ 选择完全等价） |
| 工作区内的目录 | `@目录/`（目录引用，带尾斜杠） |
| 含空格的路径 | `@"my docs/readme.md"` 引号语法 |
| 解析失败（工作区外 / 无匹配 / 超时） | 回退插入纯文件名 |
| 截图 / png / jpg / webp / gif | 不干预，走 DSH 原生图片附件流程 |
| 纯文本 | 不干预 |

### 拖放（v1.3.0 新增）

| 拖入内容 | 结果 |
|---|---|
| 工作区内的文件 | 插入绝对路径文本，如 `C:\repo\src\index.js ` |
| 工作区内的文件夹 | 插入绝对路径 + 尾分隔符，如 `C:\repo\docs\ ` |
| 含空格的路径 | 整体加引号：`"C:\my docs\a.txt"` |
| 解析失败（工作区外 / 无会话） | 回退插入纯文件名 |
| 纯图片拖放 | 不干预，走 DSH 原生图片附件流程 |

说明：浏览器拖放事件不暴露源文件的绝对路径（安全限制），插件按 basename 反查会话工作区后用「会话根 + 相对路径」拼出绝对路径，因此只对**会话工作区内**的条目有效。多条目以空格分隔；拖到输入框上插在光标处，拖到界面其他位置追加到末尾。

多条目粘贴时以空格分隔插入。**末位是 @ 引用时不补尾随空格**：保持 token 未闭合，让 DSH 原生 @ 菜单自动弹出且首选即精确匹配，一次回车即可升级为原生 chip（v1.3.0 行为）。

### 多候选人工选择（v1.4.0）

粘贴/拖放的条目在工作区内存在**多个同名匹配**时，不再自动取最短路径，而是弹出一个轻量选择器：

- 每个多匹配条目一组候选（≤20 条，最短路径优先，默认选中首选）；
- 点击候选改选，**插入所选**确认后一次性插入全部条目；
- **Esc / 取消** → 放弃本次插入（不写入任何内容）；
- 唯一匹配的条目不参与选择器，仍直接插入；
- 选择器跟随系统深浅色主题，定位在输入框下方（视口不足时移到上方）。

## 工作原理

插件分两半：

- **浏览器半（`lib/client.js`）**：在 document 捕获阶段拦截输入框的 `paste` 事件与全局 `dragenter/dragover/drop` 事件（先于 DSH 自带处理），识别条目后解析：粘贴以 `@` 语法插入草稿，拖放以绝对路径文本插入。会话 id 通过目标元素沿 React fiber 上溯取得。
- **宿主半（`lib/index.js`）**：注册 `GET /plugins/dsh-paste-names/resolve` 深度解析路由。

路径解析分两级，多条目共享：

1. **快查**：DSH 自带 `remote.fileReferences` @ 搜索索引（毫秒级；但索引有 10,000 条 BFS 截断，大仓库深层文件覆盖不到）。多条目并发查询；
2. **深度兜底**：宿主半用 `node:fs` 按 basename 全量扫描会话 cwd（排除 `.git` / `node_modules`；400,000 条 / 4 秒双上限；实测约 1s / 78k 条目），弥补索引截断。**批量接口**（v1.3.0）：全部未命中条目打包成一次请求（客户端按每批 40 条分块防 URL 超长），宿主半只扫一次。

### 深度扫描缓存（v1.3.0）

扫描结果以「basename → 路径」倒排索引形式按工作区根缓存：

- **30s TTL + stale-while-revalidate**：过期后请求立即返回旧索引（毫秒级），后台异步重建；只有每个根的**首次**请求才等待完整扫描；
- **并发去重**：同一根的并发构建只跑一次 BFS；
- **LRU 上限**：最多缓存 8 个工作区根，防止多会话场景内存无界增长；
- bucket 在构建时预排序（路径短者优先），查询为纯内存操作。

### resolve 路由

```
GET /plugins/dsh-paste-names/resolve?session=<id>&n=<name>&d=<0|1>&n=<name>&d=<0|1>...
  → { ok: true, root: "<abs cwd>", results: [{ name, dir, matches: [{ path, kind }, ...] }, ...] }

兼容旧单条形式：name=<basename>&dir=<0|1> → { ok: true, root, matches: [...] }
免扫描取根：root=1 且不带 n= → { ok: true, root }（供拖放拼接绝对路径）
失败 → { ok: false, error: "..." }（4xx/5xx）
```

## 安装

### 方式一：dsh plugin add（推荐）

```bash
dsh plugin --profile web add git+https://github.com/PaoMoXML/dsh-paste-names.git
```

（本包的 `package.json` 声明了 `dsh.bundle.patch`，`dsh plugin add` 会自动接线。）

### 方式二：手动

1. 克隆仓库到 profile 的插件目录：

   ```bash
   git clone https://github.com/PaoMoXML/dsh-paste-names.git ~/.dsh/profiles/web/plugins/dsh-paste-names
   ```

2. 在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 里加一行，然后在该目录执行 `pnpm install`：

   ```json
   "dsh-paste-names": "link:plugins/dsh-paste-names"
   ```

3. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

   ```yaml
   - insert:
       - id: paste-names
         name: dsh-paste-names
   ```

4. 重启 `dsh web` 并硬刷新页面（Ctrl+Shift+R）。

## 已知取舍

- 深扫排除 `.git` / `node_modules` / `target`（客户端回退宿主索引时同样过滤），如需增删改 `lib/index.js` 的 `EXCLUDED` 与 `lib/client.js` 的 `EXCLUDED_SEGS`；
- 同名多匹配弹出选择器人工确认（v1.4.0）；唯一匹配直接插入，末位 @ 引用保持未闭合以唤出原生菜单；
- 深度解析每个工作区根首次扫描约 1 秒（按仓库规模浮动），此后 30s 内为毫秒级缓存命中，过期后台重建不阻塞；
- 拖放插入的是绝对路径文本（非 @ 引用）：浏览器拖放不暴露源绝对路径（安全限制），只能按 basename 反查会话工作区后拼接。

## 测试

```bash
npm test
```

22 个回归测试（node:test，无外部依赖），覆盖本轮修过的四类缺陷：

| 套件 | 覆盖 |
|---|---|
| `test/host-route.test.js` | resolve 路由契约：单条查询同时返回 `results`+旧 `matches`（单文件粘贴落空的宿主侧）、排除目录（target 等）、同名多匹配排序、MAX_MATCHES 截断、错误路径 |
| `test/scan-race.test.js` | 并发 BFS 完整性：8 轮全新构建，30 个唯一标记目录全命中（静默丢子树竞态）、同名目录全量命中、深层可达、缓存稳定 |
| `test/client-paste.test.js` | 浏览器半在 DOM 桩中装载：单条旧形式 `{matches}` 归一（hainan 场景客户端侧）、回退宿主索引时 target 路径过滤、末位 @ 引用不补空格、纯文件名回退 |
| `test/client-chooser.test.js` | 多候选选择器交互：改选后插入用户所选、默认最短路径、Esc 取消不写入、唯一匹配不弹窗 |

说明：测试脚本直接顺序执行各文件（沙箱环境禁 `node --test` 的进程派生）；已做过变异验证——把单形状归一化修复临时回退，对应用例立即转红。

## License

MIT

