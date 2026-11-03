// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/report.ts
//  Gold layer — predictions + remedies on top of the core report.
//  Imported by the server (API route) and tests only, so the
//  prediction / remedy knowledge base stays out of the client bundle.
// ─────────────────────────────────────────────────────────────

import {
  buildNumerologyCore,
  type NumerologyCoreReport,
  type NumerologyInput,
  type NumerologyPremium,
  type NumerologyReport,
} from './calc'
import { buildPredictionBundle } from './predictions'
import { buildRemedyPackage } from './remedies'

export function buildNumerologyPremium(core: NumerologyCoreReport): NumerologyPremium {
  const predictions = buildPredictionBundle({
    date: core.date,
    moolank: core.moolank.value,
    bhagyank: core.bhagyank.value,
    namank: core.name?.value ?? null,
    gridCounts: core.grid.counts,
    cycles: core.cycles,
    today: core.today,
    gender: core.gender ?? undefined,
  })

  const remedies = buildRemedyPackage({
    moolank: core.moolank.value,
    bhagyank: core.bhagyank.value,
    namank: core.name?.value ?? null,
    personalYear: core.cycles.personalYear,
    missingNumbers: core.grid.missing.map(m => m.number),
    karmicDebts: core.karmicDebts,
    coreHarmony: core.coreHarmony,
    nameHarmony: core.nameHarmony,
  })

  return { predictions, remedies }
}

export function buildNumerologyReport(input: NumerologyInput): NumerologyReport | null {
  const core = buildNumerologyCore(input)
  return core ? { ...core, ...buildNumerologyPremium(core) } : null
}
