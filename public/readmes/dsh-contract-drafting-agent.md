# dsh-contract-drafting-agent

**English** | [**中文**](README.zh-CN.md)

**A professional contract-drafting agent mode for DeepSeek Harness**, built for Mainland China legal practice.

[![License](https://img.shields.io/github/license/songoao25/dsh-contract-drafting-agent)](LICENSE)
[![Release](https://img.shields.io/github/v/release/songoao25/dsh-contract-drafting-agent)](https://github.com/songoao25/dsh-contract-drafting-agent/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/songoao25/dsh-contract-drafting-agent/ci.yml?branch=main)](https://github.com/songoao25/dsh-contract-drafting-agent/actions)
[![Last commit](https://img.shields.io/github/last-commit/songoao25/dsh-contract-drafting-agent)](https://github.com/songoao25/dsh-contract-drafting-agent/commits/main)
[![Stars](https://img.shields.io/github/stars/songoao25/dsh-contract-drafting-agent)](https://github.com/songoao25/dsh-contract-drafting-agent)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025E8C?logo=dependabot)](https://github.com/songoao25/dsh-contract-drafting-agent/network/dependencies)

---

## What is this?

This is a **run mode** (agent preset) for DeepSeek Harness. You describe your deal and your core terms in plain words; the agent runs a lawyer-style workflow and produces a complete, professional, executable contract — **without a single prompt-to-draft shortcut**.

It works like a real lawyer using AI:

> **You decide the deal and the allocation of value. The agent understands, organizes, completes, researches, drafts, reviews, finds flaws, revises, and delivers the final contract.**

Designed for mainland China legal practice (default jurisdiction: the People's Republic of China, mainland). One domain-agnostic core workflow covers many contract types through pluggable **domain packs**.

## How it differs from a plain chat model

- **No "one-shot contract generation".** It first understands the transaction, builds a deal sheet, discovers the questions you did not know to ask, and only then drafts.
- **Asks only material questions.** How is profit defined? Who bears losses? Should exit require compensation? Each question comes with options (A/B/C) and a recommendation from your side — no questionnaires.
- **5-way parallel AI review.** After the first draft, five independent reviewers check legal validity, clause completeness, counterparty attack surface, litigation readiness, and internal consistency; a synthesizer consolidates and revises.
- **Never fabricates.** Unknown company names, amounts, statutes, or case numbers stay as placeholders (`【待填写：…】`) until filled in before signing.
- **Clear provenance in delivery.** The final package distinguishes *your decisions / AI-added clauses / AI assumptions / items to confirm*.

## Install

```bash
dsh plugin --profile <profile-name> add songoao25/dsh-contract-drafting-agent
```

Restart DeepSeek Harness once, then start a new session. The bundle makes the
contract-workflow skills available in the selected profile. To use the full
named preset (including its persona and tool composition), install `preset/`
separately as documented in the repository.

## Usage

Describe your transaction and core terms directly, for example:

> 帮我起草一个合作协议。甲方出资50万元。乙方负责实际运营。利润甲方60%，乙方40%。任何一方退出需要提前30天通知。乙方未经甲方同意不得把业务交给第三方。

The agent will: intake the matter → produce a deal sheet → analyze clause gaps → ask a few material questions (with options) → research and verify the law → draft → run the 5-way review → revise → run a 16-point verification → deliver the contract package (final contract / core-terms summary / AI-added clauses / risk memo / pending items).

## What you get

Every matter is saved under `matters/<id>/` in your workspace: deal sheet, core-terms register, gap report, decision log, review reports, revision log, drafts, and the final package — fully auditable and traceable.

## Structure

```
preset/
├── preset.yml                  # Display name: 合同起草模式
├── agent.cordis.yml            # DSH preset composition (persona + tools + skills mount)
└── skills/
    ├── 01-matter-intake          # Intake: confidentiality gate + matter + deal sheet
    ├── 02-matter-router          # Domain routing + domain-pack selection
    ├── 03-clause-gap-analysis    # Core-terms register + gap analysis
    ├── 04-decision-gate          # Decision gate (option-based questions)
    ├── 05-legal-research         # Legal research with independent verification
    ├── 06-contract-architecture  # Contract architecture
    ├── 07-drafting               # Draft v1
    ├── 08-multi-agent-review     # 5-way parallel review (+ REVIEWER-PROMPTS.md)
    ├── 09-review-synthesis       # Synthesis & revision
    ├── 10-final-verification     # 16-point final verification
    ├── 11-final-delivery         # Final delivery package
    └── dp-*                      # Domain packs (general contract / employment / investment)
```

## FAQ

- **Is this legal advice?** No. Drafts are working documents, not formal legal opinions. For major transactions, have a licensed lawyer review before signing.
- **Can I add a new contract domain?** Yes. Add a new `dp-<domain>/SKILL.md` domain pack; the core workflow does not change.
- **Does it support non-mainland jurisdictions?** The default jurisdiction is mainland China. The intake step re-detects jurisdiction when Hong Kong, Macau, Taiwan, cross-border parties, or foreign law is involved.

## License

[MIT](LICENSE) © songoao25
