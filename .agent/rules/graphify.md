## graphify

This project has a knowledge graph at `graphify-out/` (built by the graphify CLI / `/graphify` skill).

Rules:
- Before broad codebase exploration, run `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`
- If `graphify-out/wiki/index.md` exists, use it for wiki-style browsing instead of raw source walks
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review when query/path/explain are not enough
- Prefer live code and [`docs/`](../../docs/README.md) when `graphify-out/` is missing or stale
- After modifying code, `graphify update .` refreshes the graph (AST-only, no API cost); a post-commit hook also rebuilds
