# claude-style-skin · Claude Style 暖象牙

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Anthropic 暖调编辑风 DeepSeek Harness Web 皮肤 —— 依据 [anthropic.com](https://www.anthropic.com/) 界面风格蒸馏报告创作：象牙白 / 暖黑双画布、陶烬橙点睛、衬线标题 + 无衬线界面 + 等宽标签、发丝线描边、胶囊 CTA，跟随原生亮/暗主题。

![light 亮色](https://raw.githubusercontent.com/TaiyakiOffical/claude-style-skin/09cfe36237b7fa0c4e57141b364b8bf50f084d37/docs/light.png)

## 设计要点

- **暖象牙 `#FAF9F5`（亮）/ 暖黑 `#141413`（暗）双画布**，全部暖调灰阶，绝不用冷灰
- **单一陶烬橙 `#D97757` 强调**，hover 加深 `#C6613F`；强调只用于 CTA／链接／焦点（占比 <10%）
- **衬线展示标题 + 无衬线界面 + 等宽标签** —— 三字体的编辑部式层级
- 发丝暖线描边、8px 卡片圆角、全圆角胶囊 CTA
- Markdown 编辑排版：衬线标题、衬线斜体强调、陶橙左缘引用块、行内代码芯片、横向发丝表格
- 干净品牌区：鲸鱼 + wordmark 直接浮于画布，无徽章、无底衬
- 亮 / 暗双主题，跟随系统切换

![dark 暗色](https://raw.githubusercontent.com/TaiyakiOffical/claude-style-skin/09cfe36237b7fa0c4e57141b364b8bf50f084d37/docs/dark.png)

## 安装

```sh
dsh plugin --profile web add TaiyakiOffical/claude-style-skin   # GitHub 源
# 或（若已发布到 npm）
dsh plugin --profile web add claude-style-skin                    # npm 源，市场优先
```

装完**重启 `dsh web`**，刷新页面即生效。

## 与其它皮肤的互斥

同一时刻只启用一个皮肤。把当前启用皮肤的 insert 行加 `disabled: true`（编辑 profile 的 `cordis.patch.yml`），或直接用 [dsh-market](https://github.com/dsh-market/dsh-market) ／ [dsh-skin-manager](https://github.com/xiaoyangcheng84-svg/dsh-skin-manager) 一键切换：

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: ui-skin-claude-style
  name: claude-style-skin
```

## 卸载

1. 删除 profile `cordis.patch.yml` 里 `ui-skin-claude-style` 的 insert 行
2. `dsh plugin --profile web remove claude-style-skin`
3. 重启 `dsh web`

## 许可

MIT
