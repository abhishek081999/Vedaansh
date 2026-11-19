// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/combinations.ts
//  Rules and text for planet pairs in one house and for masnui
//  (artificial) planets. Text written in our own words.
// ─────────────────────────────────────────────────────────────

import { LK_PAIR_EFFECT, LK_PAIRS } from '../conjunctions'
import { LK_MASNUI } from '../masnui'
import type { LkArea } from '../types'
import { LK_GRAHA_AREAS } from './foundation'
import type { LkRule, LkRuleText } from './types'

function areasOf(...lists: (readonly LkArea[])[]): LkArea[] {
  return [...new Set(lists.flat())]
}

const MASNUI_PAIRS = new Set(LK_MASNUI.map((m) => m.id))

/** Pairs that form a masnui planet are read by the masnui rule instead. */
export const LK_PAIR_RULES: readonly LkRule[] = LK_PAIRS.filter(([, , id]) => !MASNUI_PAIRS.has(id)).map(([a, b, id]) => ({
  id: `pair.${id}`,
  text: `pair.${id}`,
  when: { op: 'with', planet: a, other: b },
  effect: LK_PAIR_EFFECT[id],
  weight: 2,
  areas: areasOf(LK_GRAHA_AREAS[a], LK_GRAHA_AREAS[b]),
  planet: a,
  edition: '1952',
}))

export const LK_MASNUI_RULES: readonly LkRule[] = LK_MASNUI.map((m) => ({
  id: `masnui.${m.id}`,
  text: `masnui.${m.id}`,
  when: { op: 'with', planet: m.pair[0], other: m.pair[1] },
  effect: m.effect,
  weight: 3,
  areas: LK_GRAHA_AREAS[m.becomes],
  planet: m.pair[0],
  edition: m.edition,
}))

export const LK_COMBINATION_TEXT: Record<string, LkRuleText> = {
  'pair.SuMo': { label: 'Sun with Moon', text: 'Sun and Moon in house {house}: a steady mind and support from both parents; good for work with the government.' },
  'pair.SuMa': { label: 'Sun with Mars', text: 'Sun and Mars in house {house}: courage and the will to lead; a hot temper needs watching.' },
  'pair.SuMe': { label: 'Sun with Mercury', text: 'Sun and Mercury in house {house}: a sharp mind and good speech; together they act as good Mars.' },
  'pair.SuJu': { label: 'Sun with Jupiter', text: 'Sun and Jupiter in house {house}: respect, learning and the blessing of the father and elders.' },
  'pair.SuVe': { label: 'Sun with Venus', text: 'Sun and Venus in house {house}: the two are enemies, so married life and the father\'s wishes pull against each other; the spouse\'s health needs care.' },
  'pair.SuSa': { label: 'Sun with Saturn', text: 'Sun and Saturn in house {house}: father and son pull apart and authority brings delays; together they act as hard Mars.' },
  'pair.SuRa': { label: 'Sun with Rahu (grahan)', text: 'Sun and Rahu in house {house} eclipse each other: status and the father suffer, with trouble from authority or false blame.' },
  'pair.SuKe': { label: 'Sun with Ketu (grahan)', text: 'Sun and Ketu in house {house}: changes of work and place; sons and nephews need care.' },
  'pair.MoMa': { label: 'Moon with Mars', text: 'Moon and Mars in house {house}: money through land and effort; the mother and brothers stand together.' },
  'pair.MoMe': { label: 'Moon with Mercury', text: 'Moon and Mercury in house {house}: a quick but restless mind; words cause friction with sisters or the mother\'s side.' },
  'pair.MoJu': { label: 'Moon with Jupiter', text: 'Moon and Jupiter in house {house}: peace of mind, learning and family wealth.' },
  'pair.MoVe': { label: 'Moon with Venus', text: 'Moon and Venus in house {house}: the mother and the spouse pull different ways, so comfort at home comes and goes.' },
  'pair.MoSa': { label: 'Moon with Saturn', text: 'Moon and Saturn in house {house}: worry and low moods, with strain on the eyes or chest; together they act as weak Ketu.' },
  'pair.MoRa': { label: 'Moon with Rahu (grahan)', text: 'Moon and Rahu in house {house} eclipse each other: a clouded mind, sudden fears, and the mother\'s health needs care.' },
  'pair.MoKe': { label: 'Moon with Ketu (grahan)', text: 'Moon and Ketu in house {house} eclipse each other: restless travel and worry, with strain between the mother and sons.' },
  'pair.MaMe': { label: 'Mars with Mercury', text: 'Mars and Mercury in house {house}: sharp words and arguments; brothers and sisters fall out. Together they act like Saturn.' },
  'pair.MaJu': { label: 'Mars with Jupiter', text: 'Mars and Jupiter in house {house}: courage guided by wisdom; property and respect grow.' },
  'pair.MaVe': { label: 'Mars with Venus', text: 'Mars and Venus in house {house}: strong desire and attraction; married life is passionate but needs restraint.' },
  'pair.MaSa': { label: 'Mars with Saturn', text: 'Mars and Saturn in house {house}: hard work, but a risk of accidents, injury and disputes over property. Together they act like Rahu.' },
  'pair.MaRa': { label: 'Mars with Rahu', text: 'Mars and Rahu in house {house}: sudden anger and danger from fire, weapons or electricity; brothers face trouble.' },
  'pair.MaKe': { label: 'Mars with Ketu', text: 'Mars and Ketu in house {house}: injuries to the joints or feet, and quarrels with the maternal family.' },
  'pair.MeJu': { label: 'Mercury with Jupiter', text: 'Mercury and Jupiter in house {house}: cleverness argues with wisdom, and the advice of elders gets doubted.' },
  'pair.MeVe': { label: 'Mercury with Venus', text: 'Mercury and Venus in house {house}: charm, art and trade; together they act like the Sun and bring respect.' },
  'pair.MeSa': { label: 'Mercury with Saturn', text: 'Mercury and Saturn in house {house}: practical skill, good accounts and steady business.' },
  'pair.MeRa': { label: 'Mercury with Rahu', text: 'Mercury and Rahu in house {house}: quick, clever gains with a risk of deceit; keep money matters clean.' },
  'pair.MeKe': { label: 'Mercury with Ketu', text: 'Mercury and Ketu in house {house}: nervous strain and doubt; travel for study or work.' },
  'pair.JuVe': { label: 'Jupiter with Venus', text: 'Jupiter and Venus in house {house}: learning and pleasure pull apart. Together they act like Saturn of the Ketu kind.' },
  'pair.JuSa': { label: 'Jupiter with Saturn', text: 'Jupiter and Saturn in house {house}: a pious pairing that protects the whole chart; a slow but sure rise.' },
  'pair.JuRa': { label: 'Jupiter with Rahu (guru chandal)', text: 'Jupiter and Rahu in house {house}: wisdom is clouded and elders or teachers bring trouble. Together they act like Mercury.' },
  'pair.JuKe': { label: 'Jupiter with Ketu', text: 'Jupiter and Ketu in house {house}: a spiritual bent and help on journeys; sons do well.' },
  'pair.VeSa': { label: 'Venus with Saturn', text: 'Venus and Saturn in house {house}: a stable marriage and gains from property; together they act as strong Ketu.' },
  'pair.VeRa': { label: 'Venus with Rahu', text: 'Venus and Rahu in house {house}: illusions in love and sudden changes in married life.' },
  'pair.VeKe': { label: 'Venus with Ketu', text: 'Venus and Ketu in house {house}: comfort with some detachment; the spouse and children support each other.' },
  'pair.SaRa': { label: 'Saturn with Rahu', text: 'Saturn and Rahu in house {house}: big gains through machines or cunning, and big falls if the means are wrong.' },
  'pair.SaKe': { label: 'Saturn with Ketu', text: 'Saturn and Ketu in house {house}: delays and a sense of isolation; take care of the legs and joints.' },
  'masnui.SuVe': { label: 'Masnui Jupiter (Sun + Venus)', text: 'Sun and Venus together in house {house} form an artificial Jupiter. It gives Jupiter\'s results, but unsteadily, because the two that make it are enemies.' },
  'masnui.MeVe': { label: 'Masnui Sun (Mercury + Venus)', text: 'Mercury and Venus together in house {house} form an artificial Sun: respect and authority through trade, art or speech.' },
  'masnui.SuJu': { label: 'Masnui Moon (Sun + Jupiter)', text: 'Sun and Jupiter together in house {house} form an artificial Moon: peace of mind and the mother\'s kind of blessing.' },
  'masnui.SuMe': { label: 'Masnui good Mars (Sun + Mercury)', text: 'Sun and Mercury together in house {house} form good Mars: courage, help from brothers and the strength to protect.' },
  'masnui.SuSa': { label: 'Masnui hard Mars (Sun + Saturn)', text: 'Sun and Saturn together in house {house} form hard Mars: anger, accidents and quarrels in the family need watching.' },
  'masnui.JuVe': { label: 'Masnui Saturn like Ketu (Jupiter + Venus)', text: 'Jupiter and Venus together in house {house} act like Saturn of the Ketu kind: delays and detachment in what the house rules.' },
  'masnui.MaMe': { label: 'Masnui Saturn like Rahu (Mars + Mercury)', text: 'Mars and Mercury together in house {house} act like Saturn of the Rahu kind: sudden twists and clever dealings.' },
  'masnui.MaSa': { label: 'Masnui strong Rahu (Mars + Saturn)', text: 'Mars and Saturn together in house {house} form a strong Rahu: great force, which builds when it is used honestly and destroys when it is not.' },
  'masnui.JuRa': { label: 'Masnui Mercury (Jupiter + Rahu)', text: 'Jupiter and Rahu together in house {house} form an artificial Mercury: cleverness that can serve or mislead.' },
  'masnui.VeSa': { label: 'Masnui strong Ketu (Venus + Saturn)', text: 'Venus and Saturn together in house {house} form a strong Ketu: protection on journeys and good for sons.' },
  'masnui.MoSa': { label: 'Masnui weak Ketu (Moon + Saturn)', text: 'Moon and Saturn together in house {house} form a weak Ketu: worry about sons and restless travel.' },
}
