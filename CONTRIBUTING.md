# Contributing to Vedaansh

## Setup

1. Node ≥ 24
2. Copy `.env.example` → `.env.local` and fill Mongo, Auth, Redis (optional locally), `EPHE_PATH=./ephe`
3. `npm ci` then `npm run dev`

Docs index: [`docs/README.md`](./docs/README.md). Agent conventions: [`AGENTS.md`](./AGENTS.md).  
Stack/prices: trust `package.json` and `src/lib/subscription/pricing.ts` over marketing copy.

## Branch & PR

1. Branch from `main` (or the active release branch used by the team).
2. Keep PRs focused — one concern per PR when possible.
3. Do **not** commit `.env`, secrets, or large generated artifacts.
4. Prefer updating existing docs over adding duplicate markdown.

## Quality bar (before review)

```bash
npm run typecheck
npm run lint
npm run security:preflight
npm run test:engine   # or at least tests covering your change
npm run build         # for risky / infra changes
```

- API routes: `guardRoute` + Zod + `{ success, error }`; enforce plans on the server.
- Engine: no React / Mongo / Redis / NextAuth imports under `src/lib/engine/**`.
- UI: plan teasers are OK; API must still gate.

## Commit messages

Concise, technical: what changed and why. No emoji. Example: `Fix chart save cap for gold plan after expiry`.

## Security

- Never log secrets or full birth PII in production logs.
- Mutating routes stay same-origin; webhooks verify HMAC.
- See [`docs/SECURITY_DEPLOY.md`](./docs/SECURITY_DEPLOY.md).
