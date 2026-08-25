<div align="center">

**dsh-ultramath** — UltraMath 数学建模竞赛多 Agent 求解插件

[![npm](https://img.shields.io/npm/v/dsh-ultramath)](https://www.npmjs.com/package/dsh-ultramath)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)
[![dsh](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4FC08D)](https://github.com/deepseek-ai/deepseek-harness)
[![CI](https://github.com/Andiii208/dsh-ultramath/actions/workflows/ci.yml/badge.svg)](https://github.com/Andiii208/dsh-ultramath/actions/workflows/ci.yml)

</div>

# dsh-ultramath

UltraMath 数学建模竞赛多 Agent 求解插件：把获奖级数模方法论打包成 DeepSeek Harness 原生 agent 预设 + 技能包。**一个预设跑通「读题 → 框架 → 推导 → 编码 → 验算 → 论文 → 审稿」全流程**，是 DSH 生态里首个（也是目前唯一）数模竞赛专用插件。

> **为什么选它**
> - 不是纯 markdown skill，而是带**工具编排的真 agent 预设**（subagent / workflow / todo / goal 全接入）；
> - 内置 **33 篇模型库 + 独立验算 + B1-B9 阻断项 + 三席盲评 + 数字冻结防漂移 + 学术诚信门控**；
> - **完全自包含**：论文模板、审稿脚本、模型库全部随包分发，**不依赖任何外部仓库**，安装即用。

## 安装

```bash
dsh plugin --profile web add github:Andiii208/dsh-ultramath
```

安装后**重启 DSH**，新建会话：
- 预设选择器出现「UltraMath」主控 + 4 个单阶段角色（数学家 / 工程师 / 作家 / 审稿人）。
- 技能选择器出现 `ultramath` 主入口技能，模型库位于 `~/.dsh/skills/ultramath/模型库/`。

> 插件启动时会自动把预设、模型库、论文模板幂等同步到 `~/.dsh/`，无需手动配置。

## 快速上手（直接复制提示词）

**全自动跑通**：新建会话选「UltraMath」主控，直接贴题目 + 数据附件，全程不询问、一次跑完。

**只想做某一步**：

```
只做问题 1 的建模和求解，先不写论文
```

```
已有推导和结果，直接帮我写论文并编译
```

```
已成稿，只跑评审收敛（多视角评审 → 修复 → 终审）
```

**想要人工把关（Friendly Mode）**：

```
用人工把关模式：每个关键决策点停下来给我编号选项确认，再继续
```

（触发词：人工把关 / manual / 逐步 / 分步 / friendly）

**方法选型求助**：直接问「这类问题该用什么模型」，会按 `触发词索引.md` + `方法选择决策树.md` 推荐并加载对应模型库文档。

**中途续跑**：把已有的 `求解/` 目录放进工作区，说「继续求解」，会按 `求解/进度.md` 从断点继续。

## 特性

- **UltraMath 主控 + 4 角色预设**：主控自包含全流程 + 数学家/工程师/作家/审稿人单阶段切入，启动时幂等同步到 `~/.dsh/.agent-presets/`。
- **33 篇模型库 + 93 篇语料摘要方法论**：`skills/模型库/` 33 篇方法文档，另有补实的《摘要写作增强》（九条原则 + 三段式骨架 + 两阶段闭环 + 评审 30 秒阅读路径）。
- **全流程阶段 + 质量门禁**：Phase 0 框架 → 1 推导 → 2 编码 → 2.5 独立验算 → 3 论文 → 4 审稿，每阶段有门禁，审稿发现阻断项可回退。
- **三席独立盲评 + 结构化 scorecard**：Phase 4 终审派 3 个互不共享上下文的评委（旗舰通审 / 创新与决策 / 正确性可复现），结构化打分（国一≥85 / floor70，国二≥75 / floor60），分歧 >20 分走证据仲裁，不取平均。
- **数字冻结 + 传播检测**：`冻结数字.json` 让论文每个数字可追溯到 CSV/脚本输出；改代码后 grep 检测 stale 引用，杜绝「改代码忘改论文数字」。
- **学术诚信 7 类门控**：抄袭 / 数据造假 / 引用伪造 / 图片伪造 / 不可复现 / 匿名性违规 / 越权署名，任一触发一票否决。
- **自包含**：论文模板（`templates/论文/`，`.tex`/`.cls`，字体缺省自动降级）+ 审稿脚本（`scripts/check_*.py` + `scripts/review_loop/*`）随包分发。
- **进度可视化**：全流程维护 `求解/进度.md` + todo 驱动，收尾输出 steps/progress 可视化。

## 全流程

```
读题 → Phase 0 框架设计 → Phase 1 逐题推导 → Phase 2 逐题编码
     → Phase 2.5 独立验算 → Phase 3 论文 → Phase 4 审稿(三席盲评，可回退)
```

- **Phase 0**：`求解/模型推导/框架设计.md`（核心思想 / 核心量 / 五问递进映射 / 命题树）
- **Phase 1**：每问一份 `求解/模型推导/问题X_数学推导.md`（量纲、假设[强/弱]、方法理由 + 备选）
- **Phase 2**：每问 `求解/问题X/问题X_求解.py`，必须实际运行并产出 `结果/*.csv` + `图片/*.png`
- **Phase 2.5**：独立验算（信息隔离），分歧 >30% FAIL / 10-30% SUSPECT / <10% PASS
- **Phase 3**：`论文/*.tex`，xelatex×2 编译，Error = 0
- **Phase 4**：逐项检查 + 阻断项 B1-B9 一票否决 + 三席盲评

## 项目结构

```
dsh-ultramath/
├── lib/index.js           # 宿主逻辑：预设/技能/模板幂等同步 + systemPrompt 公告
├── presets/               # 5 个 agent 预设（agent.cordis.yml）
│   ├── ultramath/         #   主控：自包含全流程 + 三席盲评 + Friendly Mode
│   ├── ultramath-mathematician/   # 数学家（读题/推导）
│   ├── ultramath-engineer/        # 工程师（编码/运行/验算）
│   ├── ultramath-writer/          # 作家（论文/编译）
│   └── ultramath-reviewer/        # 审稿人（scorecard/诚信门控）
├── skills/模型库/          # 33 篇方法文档 + 触发词索引 + 方法选择决策树
├── templates/论文/         # 论文模板（论文.tex + 章节 + cumcmthesis.cls + format.cls）
├── scripts/               # 审稿脚本（check_*.py + review_loop/engine 等）
├── SKILL.md               # 根主入口技能（frontmatter + 入口路由）
├── cordis.patch.yml       # bundle 装载补丁（id=ultramath）
└── dsh.plugin.json        # registry 元数据
```

## 模型库索引（33 篇）

按需加载，禁止一次加载全部。先查 `触发词索引.md` 命中，再读对应文档：

优化类 · 评价类 · 预测类 · 图论类 · 机理分析类 · 统计回归模型 · 统计分析类 · 灰色系统类 · 敏感性分析 · 全局敏感性分析 · 聚类分析类 · 博弈论与排队论 · 多目标优化 · 系统动力学 · 稳定性分析 · 马氏链模型 · 动态优化 · 差分方程模型 · 概率与随机模型 · 量纲分析与相似理论 · 数据预处理与特征工程 · 现代求解器 · 凸优化与非线性规划 · 启发式优化 · 复杂网络与Agent-Based建模 · 竞赛类型适配 · 方法选择决策树 · 论文架构设计 · 摘要写作增强 · 国奖论文评审对照表 · LaTeX排版与编译 · 出版级图表规范 · 触发词索引

## 工作原理

- node 半侧在主机启动时把 `presets/` 下 5 个预设幂等同步到 `~/.dsh/.agent-presets/`（字节相同跳过，校验 `agent.cordis.yml` 结构：缺 name / name 前缀非法 / 重复 id 视为失败）。
- 把根 `SKILL.md` + `skills/模型库/` + `templates/` + `scripts/`（审稿脚本）幂等同步到 `~/.dsh/skills/ultramath/`，并校验 SKILL.md 的 frontmatter 与必要章节。
- 通过 `systemPrompt` 区块向模型公告插件存在性与边界。

## 自定义与开发

- **添加模型库文档**：往 `skills/模型库/` 放一个带 frontmatter（`name`/`description`）的 `.md`，并在 `触发词索引.md` 登记一行。
- **修改角色指令**：编辑 `presets/*/agent.cordis.yml` 的 persona `text` 块。
- **本地验证**：`npm test`（23 例）+ `node scripts/validate-package.mjs`（结构校验）+ `plugin_check check`（合规）。
- **发版检查**：`node scripts/sync-standalone.mjs --check`（双仓一致性）。

## 常见问题（FAQ）

- **编译报错缺字体？** 随包 `format.cls` 已带字体降级链（SimSun/SimKai → Noto CJK → Fandol），缺字体不报错；Windows 自带中文字体，Linux 建议装 `fonts-noto-cjk`。
- **如何更新到新版本？** `dsh plugin --profile web add github:Andiii208/dsh-ultramath` 重装，然后重启 DSH。
- **和 Claude Code 版的关系？** 本插件是同一套方法论的 DSH 原生封装；领域资产内部维护在作者私密工作区，插件包本身完全自包含，不依赖任何外部仓库。
- **审稿脚本在哪？** 随包在 `scripts/`（check_figures / check_ai_taste + review_loop 内核），插件启动时同步到 `~/.dsh/skills/ultramath/scripts/`，审稿人 persona 已接线为默认 evidence_command。

## 开发与验证

```bash
npm ci
npm test            # lib 单测（node:test，23 例）
npm run check       # 包结构校验（SKILL.md / frontmatter / 触发词索引完整性 / presets）
node scripts/validate-package.mjs --pack   # npm pack 内容核验（发布前置）
```

## 致谢

方法论提炼自开源数模 skills 的精华（仅取精华互补，不复制文件）：
- 摘要语料方法论 ← [cumcm-step-review](https://github.com/yuanchen-home/cumcm-step-review)
- 结构化评分与盲评 ← [mathodology](https://github.com/sweetcornna/mathodology)
- 数字冻结与诚信门控 ← [math-modeling-skills](https://github.com/xuec699-sudo/math-modeling-skills)

## License

MIT © Andiii208
