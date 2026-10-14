# Vedaansh — testing strategy

**Runner:** Vitest  
**Suites:** `__tests__/engine/`, `__tests__/security/`, `__tests__/admin/`, `__tests__/ui/`  
**Rule:** Engine tests must **not** import redis / mongoose / next-auth (Windows Vitest segfault risk). See `__tests__/engine/phase2.test.ts` and `.cursor/rules/tests.mdc`.

---

## 1. Commands

| Command | What |
|---------|------|
| `npm run test:engine` | `vitest run` — full Vitest suite as configured |
| `npm run test:security` | Security unit tests only |
| `npm run security:check` / `security:preflight` | Alias → security tests |
| `npm run security:audit` | `npm audit --omit=dev --audit-level=high` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm run test:watch` | Watch engine under `src/lib/engine` |
| `npm run test:mongo` | Connectivity script for Atlas |

**Before ship (local):**

```bash
npm ci
npm run typecheck
npm run lint
npm run security:preflight
npm run test:engine
npm run build
```

Production deploy checklist: [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md).

---

## 2. What each layer covers

| Layer | Location | Goal |
|-------|----------|------|
| **Engine** | `__tests__/engine/**` | Pure Jyotish math — dashas, yogas, muhurta, ashtakavarga, nakshatra, milan, etc. No I/O. |
| **Security** | `__tests__/security/**` | Rate limits, CSP, CSRF/origin, body limits, password policy, plan access, presets, tokens, login throttle |
| **Admin** | `__tests__/admin/**` | Admin guards, user/chart query helpers |
| **UI** | `__tests__/ui/**` | Design-system smoke (tokens / conventions) |

There is **no** full E2E browser suite in-repo today. Rely on manual smoke from the runbook after deploy.

---

## 3. Conventions

1. Prefer asserting **behavior** (outputs, status codes, gate results) over implementation details.
2. New engine modules: add Vitest coverage next to related `__tests__/engine/*` files.
3. New API routes: at minimum, security preset + plan gate covered by existing security tests or a focused unit test; do not skip `guardRoute`.
4. Do not pull Mongo/Redis into engine tests — keep the purity boundary.

---

## 4. Definition of done (feature)

- [ ] Typecheck + lint clean
- [ ] Engine/security tests relevant to change pass
- [ ] Plan gates match [`SUBSCRIPTION_MATRIX.md`](../SUBSCRIPTION_MATRIX.md)
- [ ] Manual smoke of touched user journey (calculate / save / paid path as applicable)
- [ ] Docs updated if API, model, or ops behavior changed

---

## Related

- [RUNBOOK.md](./RUNBOOK.md) — post-deploy smoke
- [CONTRIBUTING.md](../CONTRIBUTING.md) — PR quality bar
- [AGENTS.md](../AGENTS.md) — agent test rules
