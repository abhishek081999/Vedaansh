# Vedaansh — documentation index

**Source of truth:** live code (`package.json`, `src/`, `proxy.ts`, `render.yaml`). Prefer code when docs disagree.  
**Synced:** 2026-10-14 against `jyotish-platform` v2.6.0 (Next.js 16.3, default prices Gold ₹168 / Platinum ₹336).

| Doc | Purpose |
|-----|---------|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Architecture, layers, request flows |
| [API.md](./API.md) | REST inventory — auth, plans, response shape |
| [DATA_MODEL.md](./DATA_MODEL.md) | Mongo collections, indexes, relations |
| [PRODUCT.md](./PRODUCT.md) | Personas, journeys, scope |
| [RUNBOOK.md](./RUNBOOK.md) | Ops: health, incidents, common failures |
| [TESTING.md](./TESTING.md) | Test strategy and commands |
| [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md) | Production security checklist |
| [adr/](./adr/) | Architecture Decision Records |

**Repo root (also keep current):**

| File | Purpose |
|------|---------|
| [../README.md](../README.md) | Product overview, features, setup |
| [../AGENTS.md](../AGENTS.md) | Conventions for humans + coding agents |
| [../SUBSCRIPTION_MATRIX.md](../SUBSCRIPTION_MATRIX.md) | Enforced entitlements by plan |
| [../CHANGELOG.md](../CHANGELOG.md) | User-facing release notes |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Branch, PR, quality bar |
| [../.env.example](../.env.example) | Environment variable reference |
