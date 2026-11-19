// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/conjunctions.ts
//  The 35 two-planet pairs that can share a house (Rahu and Ketu are
//  always opposite, so never together). Each pair has a fixed effect;
//  text lives in catalogue/combinations.ts. Source: 1952 edition for
//  the eclipse (grahan) and guru-chandal pairs; the rest restate the
//  pair's nature from the friendship table and karakas.
// ─────────────────────────────────────────────────────────────

import type { LkTeva } from './chart'
import { LK_GRAHAS, type LkEffect, type LkGraha, type LkHouse } from './types'

export type LkPairId = `${LkGraha}${LkGraha}`

export const LK_PAIR_EFFECT: Record<string, LkEffect> = {
  SuMo: 'good', SuMa: 'good', SuMe: 'good', SuJu: 'good', SuVe: 'bad', SuSa: 'bad', SuRa: 'bad', SuKe: 'mixed',
  MoMa: 'good', MoMe: 'mixed', MoJu: 'good', MoVe: 'mixed', MoSa: 'bad', MoRa: 'bad', MoKe: 'bad',
  MaMe: 'bad', MaJu: 'good', MaVe: 'mixed', MaSa: 'bad', MaRa: 'bad', MaKe: 'bad',
  MeJu: 'mixed', MeVe: 'good', MeSa: 'good', MeRa: 'mixed', MeKe: 'mixed',
  JuVe: 'mixed', JuSa: 'good', JuRa: 'bad', JuKe: 'good',
  VeSa: 'good', VeRa: 'bad', VeKe: 'good',
  SaRa: 'mixed', SaKe: 'mixed',
}

/** Every pair in planet order, as [first, second, id]. */
export const LK_PAIRS: readonly (readonly [LkGraha, LkGraha, string])[] = LK_GRAHAS.flatMap((a, i) =>
  LK_GRAHAS.slice(i + 1).map((b) => [a, b, `${a}${b}`] as const)).filter(([, , id]) => id in LK_PAIR_EFFECT)

export interface LkConjunction {
  id: string
  a: LkGraha
  b: LkGraha
  house: LkHouse
  effect: LkEffect
}

export function lkConjunctions(teva: LkTeva): LkConjunction[] {
  return LK_PAIRS
    .filter(([a, b]) => teva.house[a] && teva.house[a] === teva.house[b])
    .map(([a, b, id]) => ({ id, a, b, house: teva.house[a], effect: LK_PAIR_EFFECT[id] }))
}
