# GateCraft（门控工艺）

[English](README.en.md)

> 门控式数学建模 skill 套件（9 skills + DSH preset）for DeepSeek Harness。**不做无脑端到端自动化**——agent 求解与质检，人在每个阶段门思考与决策，产出带自己品味的建模成果。

## 内容

- **9 skills**：`competition-workflow`（五阶段流水线总控：阶段门 / EDA 五问 / 验证三件套 / 脚本化质检）· `guozhan-paper`（国奖写作范式）· `vision-ocr`（题面与范文阅读）· `sensitivity-analysis` · `statistical-diagnosis` · `math-modeling-paper`（论文内容）· `math-paper-template`（LaTeX 排版）· `tex-pdf-image-to-word`（转换 Word）· `paper-gate`（交付强制验收层）
- **assets**：`optimization-playbook`（优化求解/验证决策表）· `figure-playbook`（流程图与图件模板）· `prompt-pack`（14 条实战提示词）· `flowchart_gen.py`（规格 → drawio 生成器）· `ocr_batch.py`（并发 OCR）· `docgate.py`（paper-gate 执行引擎）· `official-paper-format.md`（官方格式真源）
- **DSH preset**：`presets/math-modeling/` — 粘贴一道竞赛题即可自动启动工作流

## 安装

```sh
dsh plugin add Crayonnan/dsh-math-modeling-skills-Gatecraft-
```

可选：把 `presets/math-modeling/` 拷贝到 `${DSH_HOME:-$HOME}/.dsh/.agent-presets/math-modeling/`，新会话选择"数学建模模式"。

## 技能协作图（数模一条龙）

```
                    competition-workflow（总控，两模式：流水线 / Day1-3 时间线）
                              │ 阶段0 读题
                              ▼
                         vision-ocr（OCR 落盘，按需取段）
                              │ 阶段1 分析建模 → ANALYSIS_MODELING_REPORT.md
                              │ 阶段2 代码结果 → RESULTS_REPORT.md
                              │     └─ statistical-diagnosis（模型诊断 → DIAGNOSIS_REPORT.md）
                              │ 阶段3 灵敏度 → sensitivity-analysis（题型自适应 → SENSITIVITY_REPORT.md）
                              │ 阶段4 论文
                              ▼
          math-modeling-paper（内容） ──► math-paper-template（排版） ──► PDF
                 │ 参考 guozhan-paper（国奖范式）       │ 需要 Word 版
                 └── official-paper-format.md ◄────────┴──► tex-pdf-image-to-word（11 条检查）
                              │ 阶段5 验收 → VERIFY_DOCGATE.md + VERIFY_REPORT.md
                              ▼
                  paper-gate + docgate.py（交付强制闸门：FAIL 禁交）
                              ▼
                        提交前检查清单（★项逐条勾验）
```

## paper-gate —— 论文交付强制验收层

模型内核达标而失分集中在表达层与验收层（图表超版心、编号双轨、AI 工具混入文献、摘要数量级跳变、声明强度超过证据等级、篇幅失衡、错别字群），且既有检查全部绑定 LaTeX 管线、对实际提交的 docx 工件静默失效。由此建立：

1. **工件唯一性铁律**：只认最终提交文件；任何转换/另存后必须重跑检查。
2. **`docgate.py` 机械 gate**：对 docx(OOXML)/tex 双后端执行 13 项检查——图片几何（版心动态读取）、图/表/式编号对账、AI 痕迹全文扫描（含参考文献区）、摘要数字映射+数量级哨兵、篇幅均衡、跨章重复、错别字模式库、变量空解释残骸、语言去AI化等。FAIL 未清零禁止提交。
3. **声明强度校准**：求解结论按证据等级五档（解析证明→仅启发式）映射允许措辞。
4. **规则参数化**：阈值/词表/赛事页数全部在 `paper-gate-rules.yaml`，换赛事只改配置。

用法：`python assets/docgate.py <提交文件.docx|.tex> [--results RESULTS_REPORT.md] [--problem 题面.txt]`

依赖与回归测试：`pip install -r requirements.txt` 后运行 `python tests/test_docgate.py`（合成夹具验证干净文档零 FAIL、脏文档逐项命中且退出码为 1；对历史真实缺陷论文另有人工回归基准）。

## 理念

- **阶段门**：报告必须通过自检才进下一阶段；失败迭代 2-3 轮，记录"改动 → 效果 → 指标"。
- **报告先行**：论文每个句子都来自阶段报告中的事实；范文句子只作样例，不抄模板。
- **数值纪律**：论文每个数字只许来自 reports/ 报告或代码输出；改脚本重跑后做「论文数字↔csv」零漂移核对。
- **批判性验证**：外部指南逐条核实、第三方结论重算、结果对照文献基准。
- **品味来自范式**：四项衔接要求（R1-R4）每条带"标准 + 正面样例 + 反例"。

## 适用范围

在**统计分析类与优化/决策类**（典型" C"题）上经过实战检验。机理/物理仿真（A 题）与图论/工程（B 题）未经检验——自行扩充检查清单并回馈社区。

## 与 MathModelAgent 的分工

不是重复，是分工：其求解器作为后端（`mma_exec_python` 钩子已预留），GateCraft 是编排与质检层——**思考、转向与深度参与发生在阶段门上**。

## 结构

```
skills/         9 skills（competition-workflow 为总控）
assets/         playbooks / prompt-pack / docgate.py / 生成器（与 skills 同步）
presets/        math-modeling（DSH preset）
index.js + cordis.patch.yml + package.json   dsh bundle 打包
```

## License

MIT。贡献遵循一种格式：`要求 / 可判定标准 / 正面样例（含页码） / 反例（含页码）`——每条清单项必须来自一次真实失败或一次真实获奖。
