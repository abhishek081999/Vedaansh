// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/states.ts
//  Rules for decoded states: sleeping, kayam and dharmi planets, the
//  chart types, and house 8 acting through an empty house 2.
//  Edition per rule; text written in our own words.
// ─────────────────────────────────────────────────────────────

import { LK_STATE_EDITION } from '../states'
import { LK_GRAHAS } from '../types'
import { LK_GRAHA_AREAS } from './foundation'
import type { LkRule, LkRuleText } from './types'

export const LK_STATE_RULES: readonly LkRule[] = [
  ...LK_GRAHAS.flatMap((p): LkRule[] => [
    { id: `soya.${p}`, text: 'soya', when: { op: 'sleeping', planet: p }, effect: 'info', weight: 2, areas: LK_GRAHA_AREAS[p], planet: p, edition: LK_STATE_EDITION.sleeping },
    { id: `kayam.${p}`, text: 'kayam', when: { op: 'kayam', planet: p }, effect: 'good', weight: 2, areas: LK_GRAHA_AREAS[p], planet: p, edition: LK_STATE_EDITION.kayam },
    { id: `dharmi.${p}`, text: 'dharmi', when: { op: 'dharmi', planet: p }, effect: 'good', weight: 3, areas: LK_GRAHA_AREAS[p], planet: p, edition: LK_STATE_EDITION.dharmi },
  ]),
  { id: 'teva.andhi', text: 'teva.andhi', when: { op: 'chartType', type: 'andhi' }, effect: 'bad', weight: 5, areas: ['career', 'fortune'], edition: LK_STATE_EDITION.andhi },
  { id: 'teva.ratandh', text: 'teva.ratandh', when: { op: 'chartType', type: 'ratandh' }, effect: 'bad', weight: 4, areas: ['health', 'career'], edition: LK_STATE_EDITION.ratandh },
  { id: 'teva.nabalig', text: 'teva.nabalig', when: { op: 'chartType', type: 'nabalig' }, effect: 'mixed', weight: 4, areas: ['self'], edition: LK_STATE_EDITION.nabalig },
  { id: 'teva.dharmi', text: 'teva.dharmi', when: { op: 'chartType', type: 'dharmi' }, effect: 'good', weight: 4, areas: ['fortune', 'family'], edition: LK_STATE_EDITION.dharmi },
  { id: 'house8.through2', text: 'house8.through2', when: { op: 'all', of: [{ op: 'houseOccupied', house: 8 }, { op: 'houseEmpty', house: 2 }] }, effect: 'bad', weight: 2, areas: ['longevity', 'wealth'], edition: '1952' },
]

export const LK_STATE_TEXT: Record<string, LkRuleText> = {
  soya: { label: '{planet} is asleep', text: '{planet} is asleep: every house it looks at is empty, so it gives its own result only once it is woken.' },
  kayam: { label: '{planet} is kayam', text: '{planet} is kayam (established): no enemy sits with it, looks at it or strikes it, so it gives its own result in full.' },
  dharmi: { label: '{planet} is dharmi', text: '{planet} is dharmi (pious) in house {house}: it does not harm you, even where it would otherwise be hard.' },
  'teva.andhi': { label: 'Andhi Teva (blind chart)', text: 'House 10 holds planets that are enemies of each other, so the chart is blind: you may not see your own good, and others take the benefit of your work. Honest dealings and care of the eyes help.' },
  'teva.ratandh': { label: 'Ratandh Teva (night-blind chart)', text: 'The Sun in house 4 and Saturn in house 7 make the chart night-blind: judgement fails in the dark hours and in the second half of life. Avoid big decisions at night.' },
  'teva.nabalig': { label: 'Nabalig Teva (minor chart)', text: 'Houses 1, 4, 7 and 10 are all empty, so the chart is a minor: its results do not settle until about age 12. Early life follows the planets of the family more than your own.' },
  'teva.dharmi': { label: 'Dharmi Teva (pious chart)', text: 'Jupiter and Saturn sit together, so the chart is dharmi: harsh planets soften, and a clean, faithful life keeps this protection.' },
  'house8.through2': { label: 'House 8 acts through an empty house 2', text: 'House 8 holds {others} while house 2 is empty: the planets of the cremation ground act in their hard form. Keeping the house of worship in order helps.' },
}
