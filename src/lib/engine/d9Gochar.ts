// ─────────────────────────────────────────────────────────────
//  src/lib/engine/d9Gochar.ts
//  Transit grahas mapped into Navamsha (D9) vs natal D9
//  Pure — safe for client (uses vargas.ts, no sweph).
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { D9 } from '@/lib/engine/vargas'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { D9_GOCHAR_HI } from '@/lib/engine/locale/d9Gochar.hi'

function isVargottama(d1: Rashi, d9: Rashi): boolean {
  return d1 === d9
}

export interface D9GocharRow {
  planetId: GrahaId
  planetName: string
  transitD1Rashi: Rashi
  transitD1Name: string
  transitD9Rashi: Rashi
  transitD9Name: string
  natalD9Rashi: Rashi | null
  natalD9Name: string | null
  houseFromD9Lagna: number | null
  overNatalD9Ids: GrahaId[]
  isVargottamaTransit: boolean
  note: string
}

export interface D9GocharReport {
  d9Lagna: Rashi | null
  d9LagnaName: string | null
  rows: D9GocharRow[]
  highlights: string[]
}

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function houseFrom(sign: Rashi, asc: Rashi): number {
  return ((sign - asc + 12) % 12) + 1
}

function planetLabel(id: GrahaId, lang: EngineLang): string {
  return lang === 'hi' ? gName(id, 'hi') : GRAHA_NAMES[id]
}

function signLabel(rashi: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? rName(rashi, 'hi') : RASHI_NAMES[rashi]
}

function buildNote(
  id: GrahaId,
  transitD9: Rashi,
  houseFromD9Lagna: number | null,
  vargottama: boolean,
  overNatalD9Ids: GrahaId[],
  lang: EngineLang,
): string {
  const planet = planetLabel(id, lang)
  const rashi = signLabel(transitD9, lang)
  if (lang === 'hi') {
    let note = fill(D9_GOCHAR_HI.noteBase, { planet, rashi })
    if (houseFromD9Lagna != null) note += fill(D9_GOCHAR_HI.noteHouse, { house: houseFromD9Lagna })
    if (vargottama) note += D9_GOCHAR_HI.noteVargottama
    if (overNatalD9Ids.length) {
      note += fill(D9_GOCHAR_HI.noteOverNatal, {
        planets: overNatalD9Ids.map(x => planetLabel(x, lang)).join(', '),
      })
    }
    return note
  }

  let note = `Transit ${planet} in D9 ${rashi}`
  if (houseFromD9Lagna != null) note += ` (H${houseFromD9Lagna} from D9 lagna)`
  if (vargottama) note += ' — vargottama in transit'
  if (overNatalD9Ids.length) {
    note += ` — over natal D9 ${overNatalD9Ids.map(x => planetLabel(x, lang)).join(', ')}`
  }
  return note
}

/**
 * Build D9 gochar rows from transit longitudes + natal D9 chart.
 */
export function analyzeD9Gochar(input: {
  transitGrahas: Pick<GrahaData, 'id' | 'rashi' | 'lonSidereal'>[]
  natalD9: Pick<GrahaData, 'id' | 'rashi'>[]
  d9Lagna?: Rashi | null
  lang?: EngineLang
}): D9GocharReport {
  const lang: EngineLang = input.lang === 'hi' ? 'hi' : 'en'
  const d9Lagna = input.d9Lagna ?? null
  const natalBySign = new Map<Rashi, GrahaId[]>()
  for (const g of input.natalD9) {
    if (!ORDER.includes(g.id)) continue
    const list = natalBySign.get(g.rashi as Rashi) ?? []
    list.push(g.id)
    natalBySign.set(g.rashi as Rashi, list)
  }
  const natalD9ById = new Map(input.natalD9.map(g => [g.id, g.rashi as Rashi]))

  const rows: D9GocharRow[] = []
  const highlights: string[] = []

  for (const id of ORDER) {
    const tg = input.transitGrahas.find(g => g.id === id)
    if (!tg || typeof tg.lonSidereal !== 'number') continue

    const transitD1 = tg.rashi as Rashi
    const transitD9 = D9(tg.lonSidereal) as Rashi
    const natalD9 = natalD9ById.get(id) ?? null
    const houseFromD9Lagna = d9Lagna != null ? houseFrom(transitD9, d9Lagna) : null
    const overNatalD9Ids = (natalBySign.get(transitD9) ?? []).filter(x => x !== id)
    const vargottama = isVargottama(transitD1, transitD9)

    const note = buildNote(id, transitD9, houseFromD9Lagna, vargottama, overNatalD9Ids, lang)

    if (vargottama || overNatalD9Ids.length > 0 || (houseFromD9Lagna != null && [1, 5, 7, 9, 10].includes(houseFromD9Lagna))) {
      highlights.push(note)
    }

    rows.push({
      planetId: id,
      planetName: planetLabel(id, lang),
      transitD1Rashi: transitD1,
      transitD1Name: signLabel(transitD1, lang),
      transitD9Rashi: transitD9,
      transitD9Name: signLabel(transitD9, lang),
      natalD9Rashi: natalD9,
      natalD9Name: natalD9 != null ? signLabel(natalD9, lang) : null,
      houseFromD9Lagna,
      overNatalD9Ids,
      isVargottamaTransit: vargottama,
      note,
    })
  }

  return {
    d9Lagna,
    d9LagnaName: d9Lagna != null ? signLabel(d9Lagna, lang) : null,
    rows,
    highlights: highlights.slice(0, 8),
  }
}
