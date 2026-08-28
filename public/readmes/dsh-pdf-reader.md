# dsh-pdf-reader

> DeepSeek Harness plugin for **content-aware PDF reading by vision models**.

The plugin reads a PDF the way its content demands: text-heavy pages are
extracted as text, while figures, tables, formula-heavy or two-column pages are
rendered as high-DPI region crops fed to the vision model — so a paper's vector
figures and structured tables are never lost to the per-image token ceiling.

Backed by **PyMuPDF**. When Python or a dependency is missing, the tools return a
clear, actionable warning (with the exact install command) for the agent to
resolve, instead of failing hard.

## Install

```sh
dsh plugin --profile web add dsh-pdf-reader
```

Requires a Python interpreter with `pymupdf`.

After installing Python, you can install the
[dsh-python-env](https://github.com/AngelosZou/dsh-python-env) plugin in DeepSeek
Harness so the agent handles the dependency automatically — it will create a
project venv and install `pymupdf` itself, with no manual steps:

```sh
dsh plugin --profile web add dsh-python-env
```

To set it up by hand instead:

```sh
python -m venv .venv
.venv\Scripts\python.exe -m pip install pymupdf
```

## Tools

| Tool | What it does |
| --- | --- |
| `pdf_scan` | Per-page content profile — columns, figures (vector regions), raster images, tables, text characters, hasGraphics, formulaRisk, hasTextLayer. Use first to decide how each page should be read. |
| `pdf_read_page` | Read one page. `mode=mixed` is the one-shot: a low-res `fullPage` preview + the page text + every auto-detected figure/table region as high-DPI PNGs (paths, cached in `.dsh-pdf-reader`). `mode=auto`/`text`/`render` force a single path. |
| `pdf_render_region` | Targeted high-res render of a `[x0,y0,x1,y1]` region at budget-filling DPI (or an explicit `dpi`), returning its path for `read_image`. |

## Recommended workflow

The tools are built around a **preview → content → refine** loop so large PDFs
stay cheap and no layout is lost to flattening:

1. **Preview (whole page, low-res).** Call `pdf_read_page --mode mixed` for a page.
   It returns a low-res **`fullPage`** render (the whole layout — formulas, table
   gridlines, figure placement, two-column order) plus the page's **text**. Look at
   the preview to see *what* is on the page before spending high-res budget on it.
2. **Content (auto, cached).** The same `mixed` call auto-detects every figure and
   table region and renders each as a high-DPI PNG. All PNGs are written to
   **`<cwd>/.dsh-pdf-reader`** and returned **only as paths** — heavy/long content
   lives in the cache, never inlined into your context. Feed the paths to
   `read_image`.
3. **Refine (on demand).** If a specific area is still too small, or was not
   auto-cropped (an uncropped formula, a crowded table cell, a sub-figure), zoom it
   with `pdf_render_region` on the exact `[x0,y0,x1,y1]` you read off the `fullPage`
   preview.

Start any document with `pdf_scan` (whole-document overview) to plan which pages
are text-only vs figure/table/formula-rich, then apply the loop per page.

## Why this design

A two-column paper's **figures are usually vector** (only page rasterization can
see them), **tables lose structure under text extraction**, and **formulas garble**
in some text layers. Meanwhile DeepSeek caps each image at ~**800×800-equivalent /
384 tokens** — so reading a whole two-column page at that budget makes each column
~350px and loses small text, sub/superscripts and figure detail. The fix:

- **Text pages → extraction** (cheap, precise, preserves prose + inline math that
  PyMuPDF decodes well).
- **Figure/table/math pages → render the region** and scale it to fill the
  ~640k-pixel budget via `dpi = 72 × sqrt(640000 / region_pt_area)`. Content is
  complete (nothing legible is lost inside the budget) and token-optimal
  (rendered AT the budget, not beyond it).

Region detection is heuristic (not a perfect classifier) and deliberately biased
toward rendering — vector clusters from `get_drawings()`, raster rects from
`get_image_rects()`, the same clustering for tables, and math from fonts + a LaTeX
producer. It over-flags (a ruled table or a logo may be treated as a figure) rather
than under-flagging, because rendering is cheap and safe.

## When dependencies are missing

Each tool resolves a Python interpreter in priority order — the activated venv
(`$VIRTUAL_ENV`) first, then PATH `python`/`python3`/`py`, then the project
`.venv`/`venv`/`env` — probes it for `pymupdf` (and optionally `pymupdf4llm`), and
picks the first one that can import it. If none can, it returns a warning naming
what is missing and how to fix it, so the agent can install the dependency,
switch interpreters, or fall back.

## Limitations

- **`page.find_tables()` false-positives** on plot grids and diagrams, so tables
  are primarily read by rendering (the reliable path); Markdown tables from
  `pymupdf4llm` are a best-effort extra.
- Formula detection is heuristic (fonts + LaTeX producer). PyMuPDF decodes inline
  math well, but stacked fractions can still be imperfect — use
  `pdf_render_region` on an equation when exact structure is needed.
- A whole page renders to only ~83 DPI-equivalent at the budget; the tools never
  do that for a two-column page — they crop regions instead, and body text uses
  extraction.
- Large PDFs are parsed into memory.

## Requirements

- Node ≥ 20, `@deepseek-ai/cordis` ^4, `@deepseek-ai/dsh-tools` (peer deps,
  provided by the harness).
- Python 3 + `pymupdf` (optional `pymupdf4llm`).

## License

MIT
