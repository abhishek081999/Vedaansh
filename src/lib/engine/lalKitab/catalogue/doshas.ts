// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/doshas.ts
//  Doshas the Lal Kitab way. Lal Kitab judges a dosha by the state of
//  the planet behind it, so Manglik is hard only when Mars itself is
//  harmed or debilitated, and Kaal Sarp is shown as a pattern rather
//  than a dosha of its own. Pitra dosh is read as Pitri Rin (rin.ts).
//  Edition: 1952 for grahan, bad and good Mars; commentary for the
//  Manglik split and Kaal Sarp.
// ─────────────────────────────────────────────────────────────

import type { LkCondition } from '../conditions'
import type { LkRule, LkRuleText } from './types'

const MARS_HARMED: LkCondition = {
  op: 'any',
  of: [
    { op: 'neech', planet: 'Ma' },
    { op: 'enemyWith', planet: 'Ma' },
    { op: 'aspectedByEnemy', planet: 'Ma' },
    { op: 'takkarFromEnemy', planet: 'Ma' },
  ],
}

const MANGLIK_HOUSES: LkCondition = { op: 'inHouse', planet: 'Ma', houses: [1, 4, 7, 8, 12] }

export const LK_DOSHA_IDS = ['grahanSu', 'grahanMo', 'mangalBad', 'mangalNek', 'manglik', 'manglikMild', 'guruChandal', 'kaalSarp'] as const
export type LkDoshaId = (typeof LK_DOSHA_IDS)[number]

export const LK_DOSHA_RULES: readonly LkRule[] = [
  { id: 'dosha.grahanSu', text: 'dosha.grahanSu', planet: 'Su', when: { op: 'any', of: [{ op: 'with', planet: 'Su', other: 'Ra' }, { op: 'with', planet: 'Su', other: 'Ke' }] }, effect: 'bad', weight: 4, areas: ['father', 'career', 'self'], edition: '1952' },
  { id: 'dosha.grahanMo', text: 'dosha.grahanMo', planet: 'Mo', when: { op: 'any', of: [{ op: 'with', planet: 'Mo', other: 'Ra' }, { op: 'with', planet: 'Mo', other: 'Ke' }] }, effect: 'bad', weight: 4, areas: ['mother', 'health'], edition: '1952' },
  { id: 'dosha.mangalBad', text: 'dosha.mangalBad', planet: 'Ma', when: { op: 'any', of: [{ op: 'with', planet: 'Su', other: 'Sa' }, { op: 'neech', planet: 'Ma' }, { op: 'all', of: [{ op: 'inHouse', planet: 'Ma', houses: [8] }, { op: 'not', cond: { op: 'kayam', planet: 'Ma' } }] }] }, effect: 'bad', weight: 4, areas: ['siblings', 'health'], edition: '1952' },
  { id: 'dosha.mangalNek', text: 'dosha.mangalNek', planet: 'Ma', when: { op: 'any', of: [{ op: 'inHouse', planet: 'Ma', houses: [3] }, { op: 'with', planet: 'Su', other: 'Me' }, { op: 'uchcha', planet: 'Ma' }] }, effect: 'good', weight: 3, areas: ['siblings', 'health'], edition: '1952' },
  { id: 'dosha.manglik', text: 'dosha.manglik', planet: 'Ma', when: { op: 'all', of: [MANGLIK_HOUSES, MARS_HARMED] }, effect: 'bad', weight: 4, areas: ['marriage'], edition: 'commentary' },
  { id: 'dosha.manglikMild', text: 'dosha.manglikMild', planet: 'Ma', when: { op: 'all', of: [MANGLIK_HOUSES, { op: 'not', cond: MARS_HARMED }] }, effect: 'info', weight: 2, areas: ['marriage'], edition: 'commentary' },
  { id: 'dosha.guruChandal', text: 'dosha.guruChandal', planet: 'Ju', when: { op: 'with', planet: 'Ju', other: 'Ra' }, effect: 'bad', weight: 3, areas: ['fortune', 'children'], edition: '1952' },
  { id: 'dosha.kaalSarp', text: 'dosha.kaalSarp', planet: 'Ra', when: { op: 'kaalSarp' }, effect: 'info', weight: 3, areas: ['fortune'], edition: 'commentary' },
]

export const LK_DOSHA_TEXT: Record<string, LkRuleText> = {
  'dosha.grahanSu': { label: 'Grahan dosh on the Sun', text: 'The Sun shares house {house} with {others}, so the Sun is eclipsed: the father, standing and dealings with authority suffer until the Sun is strengthened.' },
  'dosha.grahanMo': { label: 'Grahan dosh on the Moon', text: 'The Moon shares house {house} with {others}, so the Moon is eclipsed: peace of mind and the mother\'s side suffer until the Moon is strengthened.' },
  'dosha.mangalBad': { label: 'Mangal Bad (hard Mars)', text: 'Mars has turned hard: anger, accidents, blood trouble and quarrels with brothers need watching. Lal Kitab treats this as the real Mars dosha.' },
  'dosha.mangalNek': { label: 'Mangal Nek (good Mars)', text: 'Mars is good here: courage, protection and help from brothers. It also eases a Manglik placement.' },
  'dosha.manglik': { label: 'Lal Kitab Manglik', text: 'Mars sits in house {house}, a Manglik house, and is harmed or debilitated, so the placement weighs on married life. Matching the partner\'s chart and strengthening Mars both help.' },
  'dosha.manglikMild': { label: 'Manglik placement, Mars unharmed', text: 'Mars sits in house {house}, a Manglik house, but no enemy harms it. Lal Kitab does not count this as a dosha.' },
  'dosha.guruChandal': { label: 'Guru Chandal', text: 'Jupiter shares house {house} with Rahu: wisdom is clouded and elders or teachers bring trouble. Respect for elders and a clean life keep Jupiter clear.' },
  'dosha.kaalSarp': { label: 'Kaal Sarp pattern', text: 'All the other planets sit on one side of Rahu and Ketu. Lal Kitab does not name this a separate dosha; it reads Rahu in house {house} and Ketu opposite instead.' },
}
