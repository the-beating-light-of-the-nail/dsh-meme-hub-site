# dsh-llm-as-a-verifier

[English](README.en.md) | 中文

> 把 [LLM-as-a-Verifier](https://github.com/llm-as-a-verifier/llm-as-a-verifier)（arXiv 上的统一验证框架）魔改进 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）：让智能体在干活时能对自己的候选答案做**细粒度概率化验证**——不再是「好/坏」一锤子判断，而是读取验证模型在 20 级评分字母上的完整 logprob 分布并取期望。

## 你会得到

三个模型可直接调用的工具（安装后自动注册，无需重启即可用）：

| 工具 | 能力 | 复杂度 |
|---|---|---|
| `verify_compare` | 对两个候选（代码/方案/轨迹）按评价标准打分，返回 [0,1] 的细粒度奖励 `(scoreA, scoreB)` | 1 次验证调用 / 标准 / 次 |
| `verify_select` | N 选一：Probabilistic Pivot Tournament（概率枢纽锦标赛），O(Nk) 次比较替代 O(N²) 全循环 | 线性于 N |
| `verify_track` | 逐步进度追踪：验证器以 A(0%)..T(100%) 为每个 checkpoint 打分，画出进度曲线 | O(K) 次调用 |

**为什么比「LLM-as-a-Judge」更细？** 上游框架的核心思想是：① 用细粒度评分（20 级字母尺度）；② 对评分 token 的**完整 logprob 分布取期望**（而不是只取 argmax）；③ 用重复评估 + 标准分解缩放可靠性。本插件基于其开源实现适配了打分提取、成对提示词、锦标赛与进度追踪，并接入 logprob 后端和 token 计量，封装为 DSH 的 Cordis 工具插件。

## 安装

```sh
dsh plugin --profile web add dsh-llm-as-a-verifier
```

要求：dsh ≥ 0.1.0-rc.6、Node ≥ 18。安装完成后重启 `dsh web`（或等待 HMR 自动生效）。

## 配置验证后端

验证模型必须是**能返回 token 级 logprobs 的 OpenAI 兼容服务**：DeepSeek 官方 API、vLLM/SGLang 本地服务、OpenAI 等均可。

在你的 profile 配置（`~/.dsh/profiles/<name>/cordis.patch.yml` 或 `~/.dsh/cordis.patch.yml`）里写：

```yaml
- id: llm-verifier
  config:
    baseUrl: https://api.deepseek.com   # 或 vLLM: http://localhost:8000/v1
    apiKey: '${DEEPSEEK_API_KEY}'       # 推荐用环境变量，见下
    model: deepseek-v4-flash            # 不填时：DeepSeek 默认 deepseek-v4-flash，其余自动探测 /models
    maxConcurrency: 8
```

**凭证解析顺序**（与上游一致）：插件 config → `OPENAI_BASE_URL` + `OPENAI_API_KEY` → `DEEPSEEK_API_KEY`（自动启用 DeepSeek 端点与 thinking 参数）。什么都不配时，工具注册不受影响，调用时才报 `MissingAPIKeyError`。

```sh
export DEEPSEEK_API_KEY=sk-...   # 最省事的配置方式
```

## 使用示例

装好后直接在对话里让智能体用（无需额外命令）：

```text
我写了三个候选实现，帮我用 verify_select 按「正确性、性能」标准选出最好的，
然后对选中的实现用 verify_track 检查我之前的修复步骤是否有进展。
```

或者手动指定：

```text
verify_compare: problem="写一个反转字符串的函数", candidateA="def rev(s): return s[::-1]",
candidateB="def rev(s): return s", criteria={"Correctness": "代码是否真的反转了字符串？"}
```

## 配置项

| 配置 | 默认 | 说明 |
|---|---|---|
| `model` | DeepSeek: `deepseek-v4-flash`；其余自动探测 | 验证模型名 |
| `baseUrl` | 按凭证推断 | OpenAI 兼容端点 |
| `apiKey` | 按环境推断 | 建议走环境变量 |
| `timeoutMs` | `60000` | 单次请求超时（毫秒） |
| `maxConcurrency` | `8` | 最大并发验证调用 |
| `deepseek` | 按 baseUrl 推断 | 强制 DeepSeek 调用路径（thinking 开启） |
| `prefill` | `true` | 非 DeepSeek 服务器上对评分标签做 prefill（vLLM/SGLang 读取字母分布更稳） |
| `compare` / `select` / `track` | `true` | 是否注册对应工具 |

工具参数（`nEvaluations` 重复评估次数、`pivots` 枢纽数、`seed` 环赛种子、`groundTruthNote` 基准提示等）与上游 `llm_verifier` Python 包一一对应，详见 [使用手册](docs/USER-GUIDE.md)。

## 作为库使用

```ts
import { Verifier } from 'dsh-llm-as-a-verifier'

const verifier = new Verifier({ baseUrl: 'http://localhost:8000/v1' })
const { scoreA, scoreB } = await verifier.compare(problem, a, b, { Correctness: '...' })
const result = await verifier.select(problem, candidates, { Correctness: '...' }, { pivots: 2 })
const curve = await verifier.track(problem, steps, { checkpoints: [1, 3] })
```

## 开发与测试

```sh
npm ci
npm run check   # typecheck + vitest（76 个用例，含本地 mock logprobs 服务器端到端测试）
npm run build
```

TDD 过程与全流程 SOP 见 [docs/SOP.md](docs/SOP.md)。

## 许可证

本项目采用 [MIT License](LICENSE)。

## 致谢

本项目的部分评分与验证实现基于 [LLM-as-a-Verifier](https://github.com/llm-as-a-verifier/llm-as-a-verifier) 适配。感谢上游作者与贡献者；相关版权与许可声明见 [LICENSE](LICENSE)。
