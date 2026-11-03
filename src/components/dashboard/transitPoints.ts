// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/transitPoints.ts
//  Natal + transit positions for every Planetary Details point
//  (grahas, lagnas, upagrahas) — shared by the scrubber views
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'

const GRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke', 'Ur', 'Ne', 'Pl']

// Same lagna set as the Planetary Details table (GrahaTable, D1).
const SPECIAL_LAGNAS: Array<{ key: keyof LagnaData; label: string; code: string }> = [
  { key: 'bhavaLagna',   label: 'Bhava Lagna',   code: 'BL' },
  { key: 'horaLagna',    label: 'Hora Lagna',    code: 'HL' },
  { key: 'ghatiLagna',   label: 'Ghati Lagna',   code: 'GL' },
  { key: 'vighatiLagna', label: 'Vighati Lagna', code: 'VL' },
  { key: 'varnadaLagna', label: 'Varnada Lagna', code: 'VrL' },
  { key: 'sriLagna',     label: 'Shri Lagna',    code: 'SL' },
  { key: 'pranapada',    label: 'Pranapada',     code: 'PP' },
  { key: 'induLagna',    label: 'Indu Lagna',    code: 'IL' },
  { key: 'bhriguBindu',  label: 'Bhrigu Bindu',  code: 'BB' },
]

const UPAGRAHA_CODE: Record<string, string> = {
  Gulika: 'Gk', Maandi: 'Md', Dhooma: 'Dh', Vyatipata: 'Vy', Paridhi: 'Pa',
  Indrachapa: 'Ic', Upaketu: 'Uk', 'Beeja Sphuta': 'BS', 'Kshetra Sphuta': 'KS',
}

export interface PointPos {
  /** Sidereal longitude 0–360 */
  lon: number
  rashi: Rashi
  degree: number
  nakshatraName: string
  pada: number
  isRetro?: boolean
}

export interface PointRow {
  key: string
  label: string
  code: string
  natal: PointPos | null
  transit: PointPos | null
  /** Graha id when the row is a planet (enables transit verdict). */
  grahaId?: GrahaId
}

export type PointKind = 'graha' | 'lagna' | 'upagraha'

export interface PointGroup {
  kind: PointKind
  title: string
  rows: PointRow[]
}

function posFromLon(lon: number | undefined): PointPos | null {
  if (lon == null || !Number.isFinite(lon)) return null
  const norm = ((lon % 360) + 360) % 360
  const nak = getNakshatra(norm)
  return {
    lon: norm,
    rashi: (Math.floor(norm / 30) + 1) as Rashi,
    degree: norm % 30,
    nakshatraName: nak.name,
    pada: nak.pada,
  }
}

/** Arudha Lagna carries only a sign; reuse the lagna's degree like the Planetary Details table. */
function arudhaPos(chart: ChartOutput | null): PointPos | null {
  const al = chart?.arudhas?.AL
  if (!chart || !al) return null
  return posFromLon((al - 1) * 30 + (chart.lagnas.ascDegree % 30))
}

export function buildPointGroups(natal: ChartOutput, transit: ChartOutput | null): PointGroup[] {
  const grahaRows: PointRow[] = GRAHA_ORDER.flatMap(id => {
    const n = natal.grahas.find(g => g.id === id)
    if (!n) return []
    const t = transit?.grahas.find(g => g.id === id)
    const toPos = (g: typeof n): PointPos => ({
      lon: g.lonSidereal, rashi: g.rashi, degree: g.degree, nakshatraName: g.nakshatraName, pada: g.pada, isRetro: g.isRetro,
    })
    return [{ key: id, label: GRAHA_NAMES[id], code: id, natal: toPos(n), transit: t ? toPos(t) : null, grahaId: id }]
  })

  const lagnaRows: PointRow[] = [
    {
      key: 'Asc', label: 'Lagna', code: 'As',
      natal: posFromLon(natal.lagnas.ascDegree),
      transit: posFromLon(transit?.lagnas.ascDegree),
    },
    { key: 'AL', label: 'Arudha Lagna', code: 'AL', natal: arudhaPos(natal), transit: arudhaPos(transit) },
    ...SPECIAL_LAGNAS.map(({ key, label, code }) => ({
      key, label, code,
      natal: posFromLon(natal.lagnas[key] as number | undefined),
      transit: posFromLon(transit?.lagnas[key] as number | undefined),
    })),
  ].filter(r => r.natal)

  const upagrahaRows: PointRow[] = Object.entries(natal.upagrahas ?? {}).map(([key, u]) => ({
    key, label: u.name, code: UPAGRAHA_CODE[key] ?? key,
    natal: posFromLon(u.lonSidereal),
    transit: posFromLon(transit?.upagrahas?.[key]?.lonSidereal),
  }))

  const groups: PointGroup[] = [
    { kind: 'graha', title: 'Grahas', rows: grahaRows },
    { kind: 'lagna', title: 'Lagnas', rows: lagnaRows },
    { kind: 'upagraha', title: 'Upagrahas & sphutas', rows: upagrahaRows },
  ]
  return groups.filter(g => g.rows.length > 0)
}
