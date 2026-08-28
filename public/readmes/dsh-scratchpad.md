# dsh-scratchpad

<p align="center">
  <b>DeepSeek Harness (DSH) Web GUI 临时对话工作区自动化管理插件</b>
</p>

<p align="center">
  一键拉起临时工作区会话 · 自动归纳聚合分组 · 原生无感交互体验
</p>

---

## 背景痛点

在日常使用 DeepSeek Harness (DSH) Web GUI 时，经常需要进行一些临时测试、写个小脚本或随时快速提问：
- **原生痛点**：默认新建会话必须绑定当前项目工作区，或手动选择新的本地目录；如果每次随便选一个目录或新建临时文件夹，不仅操作繁琐，而且会导致左侧栏的工作区树散落大量的孤立文件夹，难以管理。
- **解决方案**：`dsh-scratchpad` 在侧栏顶部提供与「新会话」平齐的 **「临时对话」** 快捷操作，并自动将所有临时会话聚合收纳在 `临时对话` 折叠分组中。

---

## 核心特性

- **零配置一键直达**：在侧边栏顶部提供与「新会话」并排的「临时对话」按钮，点击立即创建并聚焦新会话，无需每次手动选择文件夹。
- **统一聚合分组 & 始终置顶**：所有临时对话沉淀在 `~/.dsh/scratchpads/` 下的 `临时对话` 分组中，自动监听并持久保持在左侧工作区树最顶部，不会因为导入新工作区而被挤下去。
- **原生一致视觉**：
  - **展开模式（Expanded）**：与原生「新会话」按钮像素级对齐（50% / 50% 并排布局、官方圆角/边框/背景色与悬停反馈）；
  - **折叠模式（Rail）**：自动切换为 36×36 紧凑胶囊图标，悬停带有原生 Tooltip 提示。
- **极致纯净与安全**：基于 DSH 标准的 Client 模块系统（Lazy CJS）与响应式状态机构建，零全局 CSS 污染，零死循环风险。

---

## 安装与配置

### 方式一：通过 DSH 插件市场一键安装（推荐）
在 DSH Web GUI 中打开 **设置 → 插件市场**，搜索 `dsh-scratchpad` 并点击「安装」即可。

### 方式二：手动配置安装
1. 将本仓库克隆至你的 DSH 插件目录：
   ```bash
   git clone https://github.com/Waverly-W/dsh-scratchpad ~/.dsh/plugins/dsh-scratchpad
   ```
2. 在 Profile 配置文件 `~/.dsh/profiles/web/package.json` 的 `dependencies` 中添加：
   ```json
   "dependencies": {
     "dsh-scratchpad": "file:../../plugins/dsh-scratchpad"
   }
   ```
3. 在 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 数组中添加 `"dsh-scratchpad"`。
4. 在 `~/.dsh/profiles/web` 下执行 `pnpm install` 即可生效。

---

## 本地开发与校验

```bash
# 检查语法合规性
npm run check
```

---

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
