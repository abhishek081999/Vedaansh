// ─────────────────────────────────────────────────────────────
//  Backfill Chara / Chara (FE) dashas for cached or legacy charts
// ─────────────────────────────────────────────────────────────

import { fromZonedTime } from 'date-fns-tz'
import type { ChartOutput, DashaNode, GrahaData, LagnaData } from '@/types/astrology'
import { calcCharaDasha, calcCharaDashaFemale } from './chara'

const CHARA_DEPTH = 3

function birthUtcFromMeta(meta: ChartOutput['meta']): Date {
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
  existing?: Partial<Pick<ChartOutput['dashas'], 'chara' | 'chara_fe'>>,
): { chara: DashaNode[]; chara_fe: DashaNode[] } {
  const birthUtc = birthUtcFromMeta(meta)
  const chara =
    existing?.chara && existing.chara.length > 0
      ? existing.chara
      : calcCharaDasha(grahas, lagnas, birthUtc, CHARA_DEPTH)
  const chara_fe =
    existing?.chara_fe && existing.chara_fe.length > 0
      ? existing.chara_fe
      : calcCharaDashaFemale(grahas, lagnas, birthUtc, CHARA_DEPTH)
  return { chara, chara_fe }
}

export function hydrateCharaDashas<T extends Pick<ChartOutput, 'grahas' | 'lagnas' | 'meta'> & { dashas?: ChartOutput['dashas'] }>(
  chart: T,
): T {
  if (!chart.grahas?.length || !chart.lagnas) return chart

  const existing = chart.dashas
  if (existing?.chara?.length && existing?.chara_fe?.length) return chart

  const { chara, chara_fe } = ensureCharaDashas(chart.grahas, chart.lagnas, chart.meta, existing)

  return {
    ...chart,
    dashas: {
      ...(existing ?? {}),
      chara,
      chara_fe,
    } as ChartOutput['dashas'],
  }
}
