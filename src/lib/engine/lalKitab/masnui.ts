// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/masnui.ts
//  Masnui (artificial) planets: two planets in one house that together
//  behave like a third. Source: 1952 edition; the "like Rahu / like
//  Ketu" readings follow common commentary and are tagged.
// ─────────────────────────────────────────────────────────────

import type { LkTeva } from './chart'
import type { LkEdition, LkEffect, LkGraha, LkHouse } from './types'

export type LkMasnuiKind = 'plain' | 'nek' | 'bad' | 'likeRahu' | 'likeKetu' | 'uchcha' | 'neech'

export interface LkMasnuiDef {
  id: string
  pair: readonly [LkGraha, LkGraha]
  becomes: LkGraha
  kind: LkMasnuiKind
  effect: LkEffect
  edition: LkEdition
}

export const LK_MASNUI: readonly LkMasnuiDef[] = [
  { id: 'SuVe', pair: ['Su', 'Ve'], becomes: 'Ju', kind: 'plain', effect: 'mixed', edition: '1952' },
  { id: 'MeVe', pair: ['Me', 'Ve'], becomes: 'Su', kind: 'plain', effect: 'good', edition: '1952' },
  { id: 'SuJu', pair: ['Su', 'Ju'], becomes: 'Mo', kind: 'plain', effect: 'good', edition: '1952' },
  { id: 'SuMe', pair: ['Su', 'Me'], becomes: 'Ma', kind: 'nek', effect: 'good', edition: '1952' },
  { id: 'SuSa', pair: ['Su', 'Sa'], becomes: 'Ma', kind: 'bad', effect: 'bad', edition: '1952' },
  { id: 'JuVe', pair: ['Ju', 'Ve'], becomes: 'Sa', kind: 'likeKetu', effect: 'mixed', edition: 'commentary' },
  { id: 'MaMe', pair: ['Ma', 'Me'], becomes: 'Sa', kind: 'likeRahu', effect: 'mixed', edition: 'commentary' },
  { id: 'MaSa', pair: ['Ma', 'Sa'], becomes: 'Ra', kind: 'uchcha', effect: 'mixed', edition: '1952' },
  { id: 'JuRa', pair: ['Ju', 'Ra'], becomes: 'Me', kind: 'plain', effect: 'mixed', edition: '1952' },
  { id: 'VeSa', pair: ['Ve', 'Sa'], becomes: 'Ke', kind: 'uchcha', effect: 'good', edition: 'commentary' },
  { id: 'MoSa', pair: ['Mo', 'Sa'], becomes: 'Ke', kind: 'neech', effect: 'bad', edition: 'commentary' },
]

export interface LkMasnuiFormed {
  def: LkMasnuiDef
  house: LkHouse
}

export function lkMasnuiFormed(teva: LkTeva): LkMasnuiFormed[] {
  return LK_MASNUI
    .filter((m) => teva.house[m.pair[0]] && teva.house[m.pair[0]] === teva.house[m.pair[1]])
    .map((def) => ({ def, house: teva.house[def.pair[0]] }))
}
