# GateCraft（门控工艺）

[English](README.en.md)

> 门控式数学建模 skill 套件（9 skills + DSH preset）for DeepSeek Harness。**不做无脑端到端自动化**——agent 求解与质检，人在每个阶段门思考与决策，产出带自己品味的建模成果。

## 内容

- **9 skills**：`competition-workflow`（五阶段流水线总控：阶段报告 / EDA 五问 / 验证三件套）· `guozhan-paper`（国奖写作范式）· `vision-ocr`（题面与范文阅读）· `sensitivity-analysis` · `statistical-diagnosis` · `math-modeling-paper`（论文内容）· `math-paper-template`（LaTeX 排版）· `tex-pdf-image-to-word`（转换 Word）· `paper-gate`（交付验收层 + 全仓库约束分级约定的唯一真源）
- **按需加载**：`competition-workflow/references/`（模型选型决策树、交稿自查）与 `guozhan-paper/references/`（获奖论文实证语料、页码级正反例）不占常驻上下文，用到时才读。
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
                  paper-gate + docgate.py（机械检查：FAIL 只拦事实错误与真实性问题）
                              ▼
                  references/submission-checklist.md（docgate 查不到的人工自查问句）
```

## paper-gate —— 交付验收层与约束分级真源

模型内核达标而失分集中在表达层与验收层（图表超版心、编号双轨、AI 工具混入文献、摘要数量级跳变、声明强度超过证据等级、篇幅失衡、错别字群），且既有检查全部绑定 LaTeX 管线、对实际提交的 docx 工件静默失效。由此建立：

1. **约束分级**（全仓库唯一说明处）：规则分三层——【事实】官方明文与工程事实、【不变量】可机械验证的真实性与一致性、【观察】获奖样本统计。前两层可以硬，且**硬在代码里**；第三层写硬了会诱发凑指标，只能写成"样本中常见 + 以当届模板为准"。
2. **工件唯一性**：只认最终提交文件；任何转换/另存后重跑检查（源文件通过 ≠ 提交版通过）。
3. **`docgate.py` 机械检查**：对 docx(OOXML)/tex 双后端执行 13 项——图片几何（版心动态读取）、图/表/式编号对账、AI 痕迹扫描、摘要数量级哨兵、篇幅均衡、跨章重复、错别字模式库、变量空解释残骸、重述原创度等。**FAIL = 事实错误或真实性问题（编号断裂、摘要数字在正文找不到、图片超版心…），修复后重跑；WARN = 手艺判断，逐条人工裁决。** 报告头披露 WARN/SKIP 数量，防止把"gate 通过"读成"论文没问题"。
4. **声明强度校准**：求解结论按证据等级五档（解析证明→仅启发式）映射允许措辞。
5. **规则参数化**：阈值/词表/赛事页数**与 FAIL/WARN 归属**全部在 `paper-gate-rules.yaml`，换赛事只改配置、不改 `docgate.py`。

用法：`python assets/docgate.py <提交文件.docx|.tex> [--results RESULTS_REPORT.md] [--problem 题面.txt]`

依赖与回归测试：`pip install -r requirements.txt` 后运行 `python tests/test_docgate.py`。回归输入是 `tests/make_fixtures.py` 合成的带已知缺陷夹具（私有论文不入库），除判级外还锁定一组基线：脏文档 5 FAIL（02/03 文献区/04 数量级/08/12）+ 5 WARN（01/03 正文/05/06/09），干净文档 0 FAIL。

## 理念

- **硬约束只留给事实与真实性**：官方明文、工程约束、可机械验证的一致性用硬语气，且尽量写进 `docgate.py` 而不是散文；篇幅、句式、检验选型这类手艺判断用"常见误区 + 推荐/不推荐 + 自查问句"表达。对强模型来说，把手艺分歧伪装成阻断条件不会更严格，只会诱发凑指标。
- **阶段报告不是审批关卡**：它的作用是让下一阶段的每个数字有出处。一个子问题通常迭代 2-3 轮，每轮记录"改动 → 效果 → 指标"；指标不达标时，是继续优化还是如实声明局限，由人判断。
- **报告先行**：论文每个句子都来自阶段报告中的事实；范文句子只作样例，不抄模板。
- **数值纪律**：论文每个数字只许来自 reports/ 报告或代码输出；改脚本重跑后做「论文数字↔csv」零漂移核对。
- **批判性验证**：外部指南逐条核实、第三方结论重算、结果对照文献基准。
- **品味来自范式**：四项衔接要求（R1-R4）每条带"标准 + 正面样例（含页码） + 反例（含页码）"。

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
