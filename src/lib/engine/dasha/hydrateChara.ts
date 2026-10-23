// ─────────────────────────────────────────────────────────────
//  Backfill Chara / Chara (FE) dashas for cached or legacy charts
// ─────────────────────────────────────────────────────────────

import { fromZonedTime } from 'date-fns-tz'
import type { ChartOutput, DashaNode, GrahaData, LagnaData } from '@/types/astrology'
import { calcCharaDasha, calcCharaDashaFemale } from './chara'
import { calcMandookDasha, calcSthirDasha, calcNavamshaDasha, calcBrahmaDasha } from './jaimini'

const CHARA_DEPTH = 3

export function birthUtcFromMeta(meta: Pick<ChartOutput['meta'], 'birthDate' | 'birthTime' | 'timezone'>): Date {
  const rawTime = meta.birthTime?.trim() || '12:00'
  const time = /^\d{2}:\d{2}:\d{2}$/.test(rawTime)
    ? rawTime
    : /^\d{2}:\d{2}$/.test(rawTime)
      ? `${rawTime}:00`
      : '12:00:00'
  return fromZonedTime(`${meta.birthDate}T${time}`, meta.timezone || 'UTC')
}

export function ensureCharaDashas(
  grahas: GrahaData[],
  lagnas: LagnaData,
  meta: ChartOutput['meta'],
  /** @deprecated Ignored — always recomputed so depth/formula fixes apply. */
  _existing?: Partial<Pick<ChartOutput['dashas'], 'chara' | 'chara_fe' | 'mandook' | 'sthir'>>,
): { chara: DashaNode[]; chara_fe: DashaNode[]; mandook: DashaNode[]; sthir: DashaNode[]; navamsha: DashaNode[]; brahma: DashaNode[] } {
  const birthUtc = birthUtcFromMeta(meta)
  // Always recompute so cached/legacy trees pick up depth and formula fixes
  // (e.g. full Antar→Pratyantar for previous/future periods, not current-only).
  const chara = calcCharaDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const chara_fe = calcCharaDashaFemale(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const mandook = calcMandookDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const sthir = calcSthirDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const navamsha = calcNavamshaDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const brahma = calcBrahmaDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  return { chara, chara_fe, mandook, sthir, navamsha, brahma }
}

export function hydrateCharaDashas<T extends Pick<ChartOutput, 'grahas' | 'lagnas' | 'meta'> & { dashas?: ChartOutput['dashas'] }>(
  chart: T,
): T {
  if (!chart.grahas?.length || !chart.lagnas) return chart

  const existing = chart.dashas
  const { chara, chara_fe, mandook, sthir, navamsha, brahma } = ensureCharaDashas(chart.grahas, chart.lagnas, chart.meta, existing)

  return {
    ...chart,
    dashas: {
      ...(existing ?? {}),
      chara,
      chara_fe,
      mandook,
      sthir,
      navamsha,
      brahma,
    } as ChartOutput['dashas'],
  }
}
