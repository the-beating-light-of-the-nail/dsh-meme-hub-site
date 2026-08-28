# ccs-balance

DSH 插件：同步 cc-switch 各 provider 的余额，并统计 DSH 会话的 token 用量与花费。

## 功能

- **余额页**：拉取 cc-switch 中每个 provider 的余额（支持 newapi / general / DeepSeek / OpenAI / Moonshot / SiliconFlow），支持每个 provider 独立币种（￥ / $）与全局 USD→CNY 汇率。
- **用量页**：按日 / 按月 / 总量统计输入、输出、缓存读、缓存写 token 与花费；按日视图支持近 7 天 / 近 30 天 / 全部；堆叠柱状图 + 模型构成。
- **会话页**：按会话统计 token 用量与花费，支持搜索、排序；加载全部会话并直接滚动查看，不再展开单条详情。
- **面板尺寸**：余额 / 用量 / 会话三个页面高度均固定为 500px，内容超出时在面板内滚动。

## 安装

```bash
dsh plugin add ccs-balance
```

或手动加到 profile 依赖：

```json
{ "dependencies": { "ccs-balance": "^1.0.0" } }
```

并在 `dsh.profile.bundles` 里加入 `"ccs-balance"`。

## 数据来源

- 余额：cc-switch 数据库中的 provider 配置，通过各中转站 API 查询。
- 用量与花费：cc-switch 的 `usage_daily_rollups` 与 `proxy_request_logs`（中转站实际扣费），缺失时回退按 `model_pricing` 估算。
- 会话列表：DSH session store。

## 使用说明

1. 安装并启用插件后，侧边栏底部会出现「CCS 余额」入口。
2. 余额页底部有使用说明（点 ⚙ 展开）。
3. 花费默认显示为元（￥）。如果你的中转站是真实美元计费，把余额页的 USD→CNY 汇率改成相应值（如 7.2）；USD 当元的中转站保持 1。

## 配置

- 插件设置保存在插件目录 `settings.json`。
- 每个 provider 的币种（￥/$）在余额页 provider 名旁下拉框设置。

## 开发

```bash
node --check lib/index.js
node --check lib/client.js
python -m py_compile lib/ccs_host_helper.py
```

## License

MIT

## FAQ

- 余额显示为 0 或负数？说明该中转站余额查询失败或已透支，检查 provider 配置和 API key。
- 花费显示为 0？可能该会话没有 cc-switch 流水记录，或模型未命中定价表。
- 汇率改了没反应？切到其他标签页会自动重新计算。
