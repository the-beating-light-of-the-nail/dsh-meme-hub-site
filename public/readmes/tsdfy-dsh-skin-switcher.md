# dsh-skin-switcher

DeepSeek Harness（dsh）Web UI 的**皮肤切换器**插件：右上角一键切换皮肤，支持自动发现社区皮肤。

- ✅ 不修改 dsh 核心源码，纯 Cordis 插件
- ✅ 右上角悬浮按钮，点一下秒切皮肤
- ✅ 选择自动记住，下次打开还是上次的皮肤
- ✅ 自动发现社区皮肤（style/link 注入型），新皮肤装上自动冒出按钮
- ✅ 切走皮肤时清理干净：样式表、body 属性、theme token 覆盖全部还原

## 安装

```bash
# 方式一：npm（发布后）
dsh plugin --profile web add dsh-skin-switcher

# 方式二：本地 tarball
dsh plugin --profile web add ./dsh-skin-switcher-0.2.0.tgz

# 方式三：GitHub 仓库 / tag
dsh plugin --profile web add github:tsdfy/dsh-skin-switcher#v0.2.0

dsh web
```

安装后普通 `dsh web` 自动加载，无需手动改 `~/.dsh` 或追加 `--patch`。

## 使用

刷新页面，右上角出现胶囊按钮组：

| 按钮 | 效果 |
|---|---|
| **默认** | dsh 原生界面 |
| **鲸鱼娘** | 深海女仆工坊（maid-atelier）皮肤 |
| **终末地** | 工业风工作台（endfield-ui）皮肤 |
| **Aqua** | 玻璃拟态毛玻璃主题（装了才出现） |
| **其他自动发现的皮肤** | 点它 = 只开它，其余全关 |

## 内置适配

以下皮肤有专属适配逻辑（切换时深度清理）：

- `@dsh-external/dsh-client-ui-skin-maid-atelier`（鲸鱼娘/深海女仆工坊）：靠 body 属性 `data-dsh-maid-atelier` 开关 + 皮肤装饰节点显隐
- `@rison/dsh-endfield-ui`（终末地工作台）：样式表 link 开关 + 71 个 theme token 覆盖的写回/清理
- `@deepseek-ai/dsh-client-ui-aqua`（Aqua 毛玻璃）：样式元素开关（该包挂在官方 scope 下，自动发现会跳过它，故内置适配）

## 自动发现机制

插件会监听 `<head>` 变化，扫描带 `data-plugin` 标记的 `<style>`/`<link>` 元素：

- 跳过 `@deepseek-ai/` 官方前缀
- 跳过已内置适配的皮肤
- 名称含 `skin` / `theme` / `maid` / `whale` / `aqua` 等关键词的会被收编为切换按钮

**限制**：走 theme token 覆盖、overlay 插槽、素材路由等复杂花活的皮肤（如终末地），需要为它写专属适配。给本插件提 issue 附上皮肤名即可。

## 卸载

```bash
dsh plugin --profile web remove dsh-skin-switcher
```

卸载后恢复 dsh 原生界面，用户数据不受影响。

## License

MIT