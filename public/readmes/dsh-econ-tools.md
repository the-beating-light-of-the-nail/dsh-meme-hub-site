# 📊 dsh-econ-tools — Econometrics Research Assistant

English | [中文](README.zh.md)

> A DeepSeek Harness plugin providing **6 ready-to-use econometrics tools** covering the full research workflow: method selection, data preparation, model specification, empirical analysis, robustness checks, and result reporting.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![DSH Plugin](https://img.shields.io/badge/DSH-Web%20profile-5B4CF0?style=flat-square)
[![Changelog](https://img.shields.io/badge/changelog-Keep%20a%20Changelog-2EA44F)](CHANGELOG.md)

---

## Feature Overview

| Tool | Function | Use Case |
|------|----------|----------|
| 🎯 `econ_method_guide` | **Method Guide** — Recommend appropriate econometric models based on research question and data type | Research design stage, unsure which model to use |
| 🧹 `econ_data_prep` | **Data Preparation** — Missing value handling, outlier detection, variable transformation, categorical encoding, with Python code snippets | Cleaning raw data before analysis |
| ⚙️ `econ_model_spec` | **Model Specification & Variable Selection** — Theory-driven, data-driven, hybrid, and ML-based (LASSO/Ridge/ElasticNet) strategies, with diagnostic checklists | Selecting core variables and controls |
| 🔬 `econ_run_analysis` | **Empirical Analysis** — Supports OLS, IV/2SLS, Logit, Probit, panel FE, DID, RDD; auto-generates Python/R/Stata code templates with interpretation guidance | Running regressions, interpreting results |
| 🛡️ `econ_robustness` | **Robustness Checks** — Omitted variables, measurement error, sample selection, model specification, outliers, parallel trends, placebo tests — 7 dimensions | Verifying whether core findings are reliable |
| 📝 `econ_report` | **Result Reporting** — Generate descriptive statistics tables, baseline regression tables, and robustness check summaries in Markdown / LaTeX / HTML, bilingual (CN/EN) | Writing papers, formatting result tables |

---

## Quick Start

### Installation

#### Option 1: From GitHub (Recommended)

Install directly via the `dsh` CLI:

```bash
dsh plugin --profile web add github:Chaos-Hyper/dsh-econ-tools
```

#### Option 2: Local File Installation

If you already have the source directory, install by path:

```bash
dsh plugin --profile web add /path/to/dsh-econ-tools
```

Or manually add it to the web profile dependencies (edit `~/.dsh/profiles/web/package.json`):

```json
"dependencies": {
    "dsh-econ-tools": "link:/path/to/dsh-econ-tools"
}
```

Then add `"dsh-econ-tools"` to the `dsh.profile.bundles` array, and run:

```bash
cd ~/.dsh/profiles/web
pnpm install
```

Restart DSH for the changes to take effect.

### Usage

The Agent will automatically call the appropriate tool based on your research needs. For example:

> *"I want to study the impact of education on income using cross-sectional data. What model should I use?"*
> → Agent calls `econ_method_guide`, recommending OLS, IV methods, etc.

> *"Run robustness checks for potential omitted variable bias."*
> → Agent calls `econ_robustness`, providing Oster stability test and other solutions.

---

## Tool Details

### 1. econ_method_guide

**Parameters:**
- `research_goal`: Research goal (causal inference / prediction / policy evaluation)
- `dependent_type`: Dependent variable type (continuous / binary / panel)
- `data_structure`: Data structure (cross-section / time series / panel)
- `endogeneity_concern`: Whether endogeneity is a concern (optional)

**Sample output:**
```json
{
  "recommended_models": ["OLS", "DID"],
  "methodology_notes": ["Run model diagnostics", "Use robust standard errors"],
  "next_tools": ["econ_data_prep", "econ_model_spec", "econ_run_analysis"]
}
```

### 2. econ_data_prep

**Parameters:**
- `missing_rate`: Missing data proportion (none / low / moderate / high)
- `outlier_concern`: Whether to address outliers
- `variable_types`: Variable types (continuous / categorical / dummy)
- `need_transformation`: Whether variable transformation is needed

**Output includes Python code:** KNNImputer for missing values, Winsorize for outliers.

### 3. econ_model_spec

**Four strategies:**
| Strategy | Method | Best For |
|----------|--------|----------|
| Theory-driven | Core model based on economic theory, add controls stepwise | Replication studies |
| Data-driven | Stepwise regression + AIC/BIC | Many candidates, weak theory |
| Hybrid | Theory screening → data-driven → LASSO review | Most empirical research |
| ML-based | LASSO / Ridge / Elastic Net / Random Forest | High-dimensional data, prediction |

### 4. econ_run_analysis

**Supported models:** OLS, IV/2SLS, Logit, Probit, Panel FE, DID, RDD

**Auto-generated code:**
- Python: `statsmodels` + robust SE
- R: `fixest` + `lmtest` + `sandwich`
- Stata: `reg` + `robust`

### 5. econ_robustness

**Seven dimensions:**
| Dimension | Key Methods |
|-----------|-------------|
| Omitted variables | Oster (2019) stability test, Altonji-Elder-Taber ratio |
| Measurement error | Alternative variable estimation, IV correction |
| Sample selection | Heckman two-stage, PSM |
| Model specification | Functional form change, quantile regression, Bootstrap |
| Outliers | Winsorize 1%/5%, trim extremes, M-estimation |
| Parallel trends | Event study plot, placebo treatment time, permutation test |
| Placebo test | Random treatment assignment, fictitious treatment time |

### 6. econ_report

**Report types:**
- Descriptive statistics table (Table 1)
- Baseline regression table (Table 2, with significance stars, controls, FE, R² footnotes)
- Robustness checks summary (Table 3)
- Full research summary (all three tables)

**Formats:** Markdown, LaTeX, HTML

**Languages:** Chinese, English

---

## Suggested Workflow

```
econ_method_guide    → Determine research method and model
       ↓
econ_data_prep       → Clean and preprocess data
       ↓
econ_model_spec      → Specify model, select variables
       ↓
econ_run_analysis    → Run regression analysis
       ↓
econ_robustness      → Verify result robustness
       ↓
econ_report          → Generate result report
```

---

## License

MIT