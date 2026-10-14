## graphify

Optional knowledge-graph tooling. Prefer live code and [`docs/`](../../docs/README.md) when `graphify-out/` is missing or stale.

Rules:
- If `graphify-out/GRAPH_REPORT.md` exists, you may use it for high-level architecture orientation
- If `graphify-out/wiki/index.md` exists, navigate it for wiki-style browsing
- If the graphify MCP server is active, tools like `query_graph`, `get_node`, and `shortest_path` can help — otherwise use repo search / docs
- CLI equivalents (when installed): `graphify query`, `graphify path`, `graphify explain`
- After modifying code, `graphify update .` refreshes the graph if the tool is installed (AST-only)
