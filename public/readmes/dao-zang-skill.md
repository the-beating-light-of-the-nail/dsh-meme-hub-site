# dao-zang-skill

DaoZang offline retrieval & original-text extraction skill for
[DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness).

Search 285,117 scripture chunks of the Daoist Canon (《中华道藏》《正统道藏》)
by keyword or semantics, and extract exact original text from the source
Markdown with line numbers and hit markers. Fully offline — no embedding API,
no network needed for retrieval.

## Install

```sh
dsh plugin --profile web add dao-zang-skill
```

Or from source:

```sh
dsh plugin --profile web add https://github.com/Godners-Code/dao-zang-skill
```

After install, restart `dsh web`; type `/` in the chat input and select
**dao-zang**, or ask the assistant to "use the dao-zang skill".

## What you get

- **text engine** (default, zero deps): ChromaDB full-text filter + TF/IDF ranking
- **semantic engine** (optional): local bge-m3 ONNX model, same 1024-dim cosine
  vectors as the database
- **launcher** (`daozang.cmd`): auto-locates Python and the workspace
- **self-check** (`check_env.py --selftest`): environment + smoke query
- **original-text extraction** (`--original`): locates the hit in the raw
  `.md` with `⟦...⟧` markers and line numbers
- **file filter** (`--source`): restrict search to files whose name contains a keyword
- **one-click workspace setup**: `setup_workspace.py` downloads data from the
  [Godners/DaoZang](https://huggingface.co/datasets/Godners/DaoZang) dataset
  (3,152 markdown files + 6 parquet shards with bge-m3 embeddings) and rebuilds
  the local ChromaDB offline

## Data

The workspace needs `ChromaDB/` (285,117 chunks) and `Markdowns/` (3,152 files).
Prepare it with:

```sh
python assets/dao-zang/scripts/setup_workspace.py --dir <workspace>
```

See [USAGE.md](assets/dao-zang/references/USAGE.md) for details.

## Distribution packages

Three ready-made installers are available under
[`dao-zang-plugin` releases](https://huggingface.co/datasets/Godners/daozang-data):

| Version | Install | Package contents |
|---|---|---|
| v1-full | direct copy, no network | skill + ChromaDB + Markdowns |
| v2-hf | download + offline rebuild | skill + Markdowns + HF links for the RAG DB |
| v3-git | clone + download + cleanup | install script + GitHub clone link + HF links |

## License

MIT
