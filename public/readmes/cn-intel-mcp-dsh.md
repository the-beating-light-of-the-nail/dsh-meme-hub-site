# cn-intel-mcp-dsh

**China hard-tech supply chain intelligence plugin for DeepSeek Harness.**

Connects DSH to the [cn-intel MCP](https://github.com/lory69060/cn-intel-board) server (Streamable HTTP) and exposes 6 tools under `mcp__cn_intel__*`:

| Tool | What it gives the model |
|------|------------------------|
| `read_signal_board` | 33 structured information-gap signals (industry / predicted_on / verify_by / result) |
| `read_earnings_tracker` | H1 2026 earnings forecast vs actual verification tracker |
| `get_track_record` | Historical hit-rate statistics — the judgment layer, not raw data |
| `ask_edge` | Natural-language Q&A over supply-chain information gaps |
| `list_articles` | Research article index (China hard-tech supply chains) |
| `read_article` | Full article text for citation-grounded analysis |

## Install

```sh
dsh plugin --profile web add cn-intel-mcp-dsh
# or from the Plugin Market: search "cn-intel"
```

Then set the token:

```bash
export CN_INTEL_MCP_TOKEN="<your-token>"
```

**Trial token (shared, rate-limited to 200 req/day):**

```bash
export CN_INTEL_MCP_TOKEN="cninte…ad3c"
```

Request a dedicated free token or Pro tier by opening an issue in this repo.

## Verify

In the DSH tools panel you should see:

```
mcp__cn_intel__read_signal_board
mcp__cn_intel__read_earnings_tracker
mcp__cn_intel__get_track_record
mcp__cn_intel__ask_edge
mcp__cn_intel__list_articles
mcp__cn_intel__read_article
```

## Example prompts

See [examples/prompts.md](examples/prompts.md) for 5 ready-to-use prompts (compliance query, signal board, track record, earnings tracker, article reading).

## How it works

The plugin is a thin [dsh-mcp-client](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/mcp/mcp-client) bridge to the remote cn-intel MCP endpoint (`https://cn-intel-mcp.lory69060.workers.dev/mcp`). Data lives on GitHub Pages (GEO-optimized); the Worker is stateless with 300s caching.

## License

MIT

## FAQ

**Q: Do I need a DeepSeek API key for this plugin?** A: Yes, DSH itself needs a model provider. The plugin only adds supply-chain data tools on top.

**Q: Is the data free?** A: The trial token gives 200 requests/day shared. Dedicated free tokens and a Pro tier are available on request via GitHub issues.

**Q: What data sources back the signals?** A: Public disclosures (earnings reports, exchange announcements) via akshare, cross-checked and timestamped. The track-record tool exposes historical hit rates so you can judge reliability yourself.

**Q: Can I self-host?** A: The data is public on GitHub Pages; the MCP endpoint is a thin proxy. See docs/architecture.md.
