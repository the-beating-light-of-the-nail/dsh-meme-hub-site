# MedSeek

[![ci](https://github.com/Mr-Neutr0n/dsh-medseek/actions/workflows/ci.yml/badge.svg)](https://github.com/Mr-Neutr0n/dsh-medseek/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A5%2022.19-brightgreen.svg)](package.json)
![dsh](https://img.shields.io/badge/DeepSeek%20Harness-0.1.x%20rc-8A63D2)

Clinical documentation and reference tools for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), as an installable `dsh` plugin bundle.

Built for the daily work of **physicians, advanced practice providers, nurses, and residents**: rounding notes, handovers, admissions, discharges, patient instructions, and cited answers from FDA labeling, MedlinePlus, PubMed, and ClinicalTrials.gov.

MedSeek drafts; a named clinician reviews everything before it is used. It is not a medical device.

[中文说明](README.zh.md) · [Intended use](docs/intended-use.md) · [Recipes](docs/recipes.md) · [Security](SECURITY.md)

## GUI integration

The bundle does not just ship tools; it takes over its slice of the dsh web GUI through sanctioned plugin surfaces only:

| Surface | What you see |
|---|---|
| Theme | Warm-paper light and espresso dark palettes across 85 platform tokens, including markdown citation chips, code banners, composer input, and scrollbars |
| Polish layer | Solid-core keyboard focus rings (3:1+ on every surface), teal selection tint, themed scrollbars, and a global reduced-motion kill switch |
| Brand badge | A small ring mark on the frame overlay layer; decorative, click-through safe |
| Settings card | Guard mode (block / ask / off) and the screened-tool list editable in Settings > Plugins, with revision-fenced writes that apply live |
| Tool results | Lookup tools render as native search cards with structured source lists; label lookups render as fetch summaries pointing at DailyMed |

Accessibility posture: every text pair is asserted in CI against WCAG 2.x AA ratios and APCA Lc gates (75 body / 60 general) in both modes. APCA remains draft guidance, so compliance claims are WCAG 2.2 AA only.

## Why

Ambient scribes capture encounters. They do not structure a note against a checklist, insist on pending results at discharge, force explicit allergy statements on admission, score patient-instruction readability, or attach a citation and retrieval date to every fact they surface. That post-hoc, deterministic layer is what MedSeek adds, locally and without EHR access, on top of any dsh deployment.

Design rules, enforced in code:

- **Drafts, never directives.** Every drafting tool returns structure plus a gap list under a review banner. Nothing prescribes care.
- **Cited or silent.** Lookup results carry source, identifier, link, and retrieval date. An empty result says so instead of filling the gap.
- **Terms and codes only leave the building.** A PHI guard screens every network-tool call for identifiers before it runs; the destination allowlist has exactly nine hosts.
- **Accountable by construction.** Every tool execution appends a content-free receipt - tool name, timestamp, error flag, and SHA-256 digests of arguments and result, never the content itself - to an append-only, hash-chained file, so compliance can prove what ran without a second copy of the chart.
- **Structure, not judgment.** Documentation checklists check presence. No diagnosis ranking, no severity scoring, no billing-code-level suggestion, no interaction checking.

## Tools (19)

| Tool | Answers | Basis | Network |
|---|---|---|---|
| `deidentify_text` | Strip HIPAA Safe Harbor identifiers, typed placeholders | 45 CFR 164.514(b)(2) categories | no |
| `sbar_handover_draft` | SBAR or I-PASS structure, then a gap list | IHI SBAR; Starmer, NEJM 2014 | no |
| `discharge_summary_draft` | Skeleton with pending results required | Joint Commission components; Kripalani, JAMA 2007 | no |
| `progress_note_draft` | SOAP or APSO daily/follow-up note, MDM-aware fields | Weed, NEJM 1968; AMA CPT E/M elements | no |
| `admission_history_physical_draft` | Admission H&P, allergies and reconciliation explicit | Joint Commission 24-hour H&P; AMA E/M hospital care | no |
| `patient_instructions_draft` | Plain-language scaffold plus readability grade | Flesch-Kincaid, SMOG; AHRQ target | no |
| `note_completeness_check` | Missing sections, error-prone abbreviations, PENDING markers | JC Do Not Use; ISMP lists | no |
| `drug_label_lookup` | Verbatim FDA label sections, DailyMed link | openFDA label, RxNorm | yes |
| `patient_education_lookup` | NLM-curated handouts in English or Spanish | MedlinePlus Connect, Clinical Tables | yes |
| `pubmed_evidence_search` | Citations with abstracts, reproducible query | NCBI E-utilities | yes |
| `trial_search` | Studies with NCT number, status, phase, sponsor | ClinicalTrials.gov v2 | yes |
| `pubmed_id_convert` | PMID/PMCID/DOI batch conversion | PMC ID Converter | yes |
| `pubmed_related_articles` | Related PMIDs via citation graph | NCBI ELink | yes |
| `europe_pmc_search` | Biomedical hits with OA status | Europe PMC (EMBL-EBI) | yes |
| `europe_pmc_fulltext` | OA section snippets via fullTextXML | Europe PMC fullTextXML | yes |
| `fda_adverse_event_search` | FAERS reports by product | openFDA FAERS | yes |
| `fda_recall_search` | Enforcement recalls by product | openFDA Enforcement | yes |
| `fda_application_lookup` | Drugs@FDA apps, counts, classes, generics | openFDA Drugs@FDA | yes |
| `clinical_trial_lookup` | Details, eligibility, investigators, endpoints | ClinicalTrials.gov v2 extended | yes |

Draft tools never invent clinical facts: called once they return the template, called again with `filled_fields` they validate and assemble the draft. Lookup tools display source material verbatim where the source is text.

## Architecture

```mermaid
flowchart LR
    subgraph dsh["DeepSeek Harness (host)"]
        WEB[Web GUI]
        TOOLS[Tool registry]
    end
    subgraph BUNDLE["dsh-medseek bundle"]
        PATCH[cordis.patch.yml<br/>persona + rows]
        HOST[medseek-tools<br/>19 tool definitions]
        GUARD[medseek-guard<br/>PHI egress screen]
        BRAND[medseek-brand<br/>title, favicon, tokens]
        AUDIT[medseek-audit<br/>hash-chained receipts]
        CLIENT[client theme<br/>Owly-derived palette]
    end
    subgraph LOCAL["Local, deterministic"]
        T1[Templates<br/>SBAR I-PASS SOAP APSO H&amp;P]
        T2[Safe Harbor engine]
        T3[Readability scorer]
    end
    subgraph API["Allowlisted reference APIs"]
        A1[eutils.ncbi.nlm.nih.gov / pmc.ncbi.nlm.nih.gov]
        A2[api.fda.gov / rxnav / dailymed]
        A3[medlineplus / clinicaltables]
        A4[clinicaltrials.gov]
        A5[www.ebi.ac.uk (Europe PMC)]
    end
    WEB --> PATCH --> HOST --> TOOLS
    HOST --> T1 & T2 & T3
    HOST -- arguments screened by --> GUARD
    HOST -- receipts on --> AUDIT
    HOST --> A1 & A2 & A3 & A4
    CLIENT --> WEB
```

One package, four host plugins (`medseek-tools`, `medseek-guard`, `medseek-brand`, `medseek-audit`) and one client plugin for theming, polish, the badge, and the settings card, composed by `cordis.patch.yml`. Install pins the whole bundle.

## Install

```sh
dsh plugin --profile web add dsh-medseek@0.1.3
```

Restart the web GUI or hard-refresh the tab, then confirm the layer:

```sh
dsh --profile web --dump-config   # expect "# == dsh-medseek"
```

If `dsh` is not on PATH:

```sh
npx -y --package @deepseek-ai/dsh@0.1.1-rc.2 dsh plugin --profile web add dsh-medseek@0.1.3
```

Uninstall with `dsh plugin --profile web remove dsh-medseek`. From a local checkout: clone, `pnpm install && pnpm verify`, then `dsh plugin --profile web add ./`.

## Quick start

Use synthetic text first. Never paste a real chart into a model provider that is not covered by your BAA.

**Round a patient.** Paste overnight events and vitals, then: "Draft today's SOAP note." The agent scaffolds with `progress_note_draft`, drafts each field from context, validates, and hands back a banner-marked draft plus its gap list.

**Hand over a shift.** "Turn these into an SBAR" (or "an I-PASS"). Same two-call pattern against `sbar_handover_draft`.

**Discharge a patient.** `discharge_summary_draft` refuses to pass while pending results are unowned. Pair it with `patient_instructions_draft` until readability hits the 6th-to-8th grade target.

**Answer with receipts.** "Boxed warning and contraindications for metformin" returns verbatim label sections, SPL set id, DailyMed link, retrieval date. Absence of an interactions section is reported as absence, never spun as safety.

**De-identify before sharing.** "Scrub this teaching snippet" replaces identifiers with typed placeholders and lists low-confidence spans for your review. It assists Safe Harbor de-identification; it does not certify it.

## Safety model

| Layer | Mechanism |
|---|---|
| Output discipline | Draft banners on every artifact; next-step guidance in every result |
| PHI egress | Guard denies (or escalates, per config) network calls whose arguments match high-confidence identifier patterns |
| Audit trail | Every tool execution appends a content-free receipt (digests only, never text) to an append-only, hash-chained `medseek-audit.jsonl` in the dsh home; cross-process writer lock, tail verified before every append - a damaged file fails closed instead of restarting the chain |
| Destination allowlist | Nine hosts, enforced in code before `fetch`; anything else throws |
| Request hygiene | Lookups send terms, codes, and status filters only |
| Regulatory posture | Self-mapped against the four non-device CDS criteria per tool in [docs/regulatory-checklist.md](docs/regulatory-checklist.md); informational and non-directive by construction |

Known platform limits, documented rather than hidden: dsh persists tool arguments in local session logs with no deletion API, so treat `$DSH_HOME/sessions` as PHI storage; keep telemetry off. The sidebar and hero brand marks are MedSeek-owned (the official brand row is disabled by the bundle); details in Persona and presets above. Details on data flow: [docs/permissions-and-data.md](docs/permissions-and-data.md).

## Configuration

Optional NCBI and openFDA keys, timeouts, result caps, and the guard (`block`, `ask`, `off`) and audit (`on`, `off`) modes are documented in [docs/configuration.md](docs/configuration.md).

## Compatibility

| | |
|---|---|
| dsh | tested against `@deepseek-ai/dsh` 0.1.1-rc.2 |
| Node | >= 22.19 |
| pnpm | >= 10 |

The `latest` dist-tag on several `@deepseek-ai/*` packages (`dsh-tools`,
`dsh-settings`, …) still points at an old `0.0.1-rc.1`; the bundle pins the
rc line deliberately.

## Persona and presets

MedSeek replaces the coding-agent persona in two places, because dsh applies
personas at two layers:

- **Deployment persona** (cordis.patch.yml): covers surfaces that mount no
  agent presets - headless runs and the TUI.
- **`medseek-clinical` agent preset**: every default web session joins an
  agent preset, and a preset persona shadows the deployment persona by
  design. MedSeek ships its own preset (the upstream `standard` composition
  with only the persona text replaced) and provisions it into
  `$DSH_HOME/.agent-presets/` on boot, so the clinical stance reaches web
  sessions while all standard tools remain mounted. The preset is
  deployment-owned: a locally edited copy is restored on the next boot.
  Sibling presets you author are never touched.

## Development

```sh
pnpm install
pnpm verify       # typecheck, tests (synthetic data only), bundle, declarations
pnpm test:mount   # pack the tarball into a scratch dsh profile and assert the layer mounts
pnpm test:persona # real-session check: default web session gets the clinical persona + full roster
pnpm eval         # regenerate eval/REPORT.md from the synthetic annotated corpus
```

CI mirrors this on every push: the unit suite on a Node matrix, the mount E2E against the pinned upstream, and the persona E2E against a stubbed model API. The deterministic claims (de-identification recall and precision, completeness detection) are measured over the fully synthetic annotated corpus in `eval/corpus` and reported in [eval/REPORT.md](eval/REPORT.md); CI gates the floors in `tests/eval.spec.ts`. See [CONTRIBUTING.md](https://github.com/Mr-Neutr0n/dsh-medseek/blob/main/CONTRIBUTING.md); issues and tests carry synthetic data only.

## Security

Private reports only via [GitHub private vulnerability reporting](https://github.com/Mr-Neutr0n/dsh-medseek/security/advisories/new). See [SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE). Attribution in [NOTICE](NOTICE). The `dsh-plugin` topic is a discovery tag, not a DeepSeek endorsement and not a medical clearance.

## FAQ

**Is this a medical device?**
No. MedSeek displays and reorganizes information the clinician supplies, cites public reference sources, and produces drafts that require human approval. The four-criteria mapping per tool is maintained in [docs/regulatory-checklist.md](docs/regulatory-checklist.md).

**Can it replace our ambient scribe?**
No, and it does not try. Scribes capture audio in the room; MedSeek structures what already exists as text and looks things up with citations. They compose.

**Does it connect to Epic?**
No. There is no EHR read or write anywhere in the bundle. Everything arrives as pasted text the operator chose.

**Why no drug-interaction checker?**
NLM retired the free RxNav interaction API in January 2024. MedSeek quotes label sections verbatim and declines to pretend a replacement exists.

**Where does my data go?**
Nowhere automatically. Local tools make zero network calls. Lookup tools send terms and codes to the nine allowlisted hosts after the guard screens them. Model traffic goes wherever the operator pointed dsh, which is why the BAA warning sits at the top of this file.

**What clinicians is it for?**
Physicians, advanced practice providers, nurses, pharmacists, and residents who already run dsh. The operator installs it; the clinician reviews everything.
