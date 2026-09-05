# 🐋 awesome-dsh-skills — Tested Skills for DeepSeek Harness

**19 original engineering skills (SKILL.md). Every skill passes a format validator mirroring the official `@deepseek-ai/dsh-skill-filesystem` rules plus an isolated-DSH_HOME load smoke test. Copy, drop in, done.**

[中文](README.zh.md) · Sibling repos: [dsh-lab](https://github.com/hackerFish/dsh-lab) · [awesome-dsh-presets](https://github.com/hackerFish/awesome-dsh-presets) · [dsh-video-studio](https://github.com/hackerFish/dsh-video-studio) · [dsh-restart](https://github.com/hackerFish/dsh-restart)

## What DSH skills are

DSH scans skill roots (`~/.dsh/skills`, `.agents/skills`, project `.dsh/skills`) and registers `SKILL.md` files into the model-visible catalog. Each skill: `name` (kebab-case) + `description` required in frontmatter; optional `whenToUse` / `metadata` / `disable-model-invocation` / `user-invocable`.

## Install

```bash
git clone https://github.com/hackerFish/awesome-dsh-skills ~/dsh-skills
mkdir -p ~/.dsh/skills
cp -r ~/dsh-skills/skills/* ~/.dsh/skills/   # all, or copy individual skill dirs
```

## Quality gates (every skill)

1. `node tools/validate-skills.mjs` — field whitelist, kebab-case names, boolean value forms, single-level structure, per official rules
2. `node tools/smoke-load.mjs` — loads every skill through the real `@deepseek-ai/dsh-skill-filesystem` provider in an isolated `DSH_HOME` and asserts all register with no parse rejections. Needs a local DSH install; auto-resolves the package or pass `--pkg <path>`. Last verified against `dsh-skill-filesystem@0.1.1-rc.2` (2026-09).
3. Content rule: verified facts only; no unverified "magic prompts"

## Skills (19)

| Skill | Purpose |
|---|---|
| dsh-git-commit | Conventional commits + pre-commit self-check |
| dsh-code-review | Six-dimension structured review |
| dsh-test-first | Red→green→refactor discipline |
| dsh-doc-sync | Keep docs/changelog/versions in sync |
| dsh-plugin-dev | DSH plugin dev with verified manifest/patch structures |
| dsh-plugin-client | DSH plugin client half: slot/standard-kit registration, dual build, `__ModuleLoader__` wrap, self-test |
| dsh-plugin-i18n | DSH plugin UI localization (zh/en): locale namespaces, slot `locale`, `t()` with instant switching |
| dsh-plugin-publish | Publish a DSH plugin to GitHub + awesome-dsh inclusion: build-artifact commits, repo/topics API, PR etiquette, encoding traps |
| dsh-preset-authoring | Author/edit a DSH agent preset (`agent.cordis.yml` + `preset.yml`): verified row structure, id rules, `.agent-presets` install, harness validation |
| dsh-dependency-audit | Dependency & install-script risk audit |
| dsh-refactor-safe | Baseline-first safe refactoring |
| dsh-debug-session | DSH boot/plugin failure triage |
| dsh-changelog | Keep a Changelog discipline |
| dsh-chinese-docs | Chinese technical writing conventions |
| dsh-pr-review | PR review checklist & structured feedback |
| dsh-task-breakdown | Task decomposition with acceptance criteria |
| dsh-skill-adapter | Adapt public portable skills to DSH discovery roots, active tools, and safety constraints |
| dsh-webapp-testing | Browser-evidence web-app testing with console, network, server, and regression-test checks |
| dsh-office-artifacts | Format-aware XLSX, DOCX, PPTX, and PDF creation or repair with reopen/render verification |

See [CONTRIBUTING.md](CONTRIBUTING.md) to submit a skill. Contributors: [CONTRIBUTORS.md](CONTRIBUTORS.md)

## License

[MIT](LICENSE)

