# dsh-tradingagents

DeepSeek Harness (dsh) 的 A 股多智能体投研分析插件：把 [TradingAgents-AShare](https://github.com/KylinMountain/TradingAgents-AShare) 的 14 角色分析管线移植为 dsh 原生插件，通过 `/trading-agent` 命令一键运行，模型调用走 dsh 已配置的 LLM 路由（无需单独配 API Key）。

## 分析管线（14 个角色）

```
意图解析（标的/关注点/持仓上下文）
  └─ 数据采集（并行、逐源降级）：K线+技术指标 / 新闻 / 快讯 / 资金流 / 板块 / 龙虎榜 / 涨停池 / 财务三大报表
      └─ 7 位分析师并行：市场技术 / 新闻宏观 / 社交舆情 / 基本面 / 宏观板块 / 机构资金 / 量价(VPA)
          └─ 多空研究员辩论 ×2 轮（互相反驳对方最新论点）
              └─ 投研经理裁决（Buy/Sell/Hold + 可执行方案）
                  └─ 交易员初步方案
                      └─ 风控三方辩论（激进/保守/中性）
                          └─ 风控经理审核（仓位/止损/前提条件/降风险触发）
                              └─ 交易员最终决策
```

## 用法

在 dsh web 的输入框：

```
/trading-agent 600519
/trading-agent 调研比亚迪，短线能否创新高
/trading-agent 300750 关注电池新技术和主力资金，仓位 60% 成本 180
```

完整分析约需数分钟，报告同时返回到会话并保存到 `~/.dsh/tradingagents/reports/`（含结论速览表、交易计划速览、每角色完整输出、数据附录）。

**结构化决策记录**：每次分析还会落一份机读 JSON 边车 `<报告id>.decision.json`（与 Markdown 同目录），含冻结行情基线、全部角色结论、合并后的交易计划（动作/信心/入场/止损/目标/仓位，注明来源与是否经文本回退恢复）。供后续准确率统计、记忆系统、通知触发等直接读取，无需再解析 Markdown：

```bash
curl http://127.0.0.1:3080/tradingagents/reports/<报告id>/decision
```

设置 → 投研报告的详情页顶部会以标签形式展示该交易计划。

## 安装

```bash
pnpm install && pnpm build   # 构建
dsh plugin --profile web add /path/to/dsh-tradingagents
# 重启 dsh web
```

## 技术说明

- **模型**：`ctx.llm`（复用 dsh 当前会话的模型路由，含推理档位），无独立 LLM 配置
- **数据**：公开行情接口直连（腾讯 K 线 + 东财延迟行情/数据中心/新闻），逐源超时降级，单一数据源失败不阻塞分析
- **指标**：SMA/EMA/RSI/MACD/BOLL/ATR/VWMA 与 VPA 量价形态本地计算
- **决策记录**：交易员/风控经理的 `VERDICT` 机读块扩展可选交易计划键；缺失键从其正文的「最终交易建议 / 目标价 / 止损价」回退提取，机读值优先；计划字段无值时留空不编造
- **测试**：57 个 vitest 用例（指标数学、接口解析、VERDICT/JSON 提取、计划回退与合并、决策记录组装、边车读写、意图回退、全管线编排、报告组装、命令注册）

本插件生成的内容不构成投资建议。
