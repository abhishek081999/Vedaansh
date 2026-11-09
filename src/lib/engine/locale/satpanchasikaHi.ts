// Hindi for Ṣaṭpañcāśikā readings: the phrase glossary applied through the
// shared phrase translator. Ids, enums and the kind/time-of-day keys stay English.

import { createPhraseHi } from './phraseHi'
import { SAT_FRAG_HI } from './satpanchasikaFrag.hi'
import { SAT_FRAG_HI_2 } from './satpanchasikaFrag2.hi'

const SAT_KEEP = new Set([
  'question', 'verdict', 'strengthSource',
  'fired.ruleId', 'fired.slokaId', 'fired.polarity', 'notEvaluated.ruleId', 'notEvaluated.slokaId',
  'timing.unit', 'timing.status', 'timing.basis',
  'lostItem.object.kind', 'lostItem.whenLost.value', 'subject.strongest', 'planets.nature',
])

export const satpanchasikaHi = createPhraseHi({
  frag: { ...SAT_FRAG_HI, ...SAT_FRAG_HI_2 },
  templates: [
    // Comma lists of placements: "Venus in 9th (Virgo), Mars in 7th (Cancer)".
    [/^(.+?\)), (.+)$/, (a, b) => `${a}, ${b}`],
    [/^(.+), towards the (.+)$/, (place, dir) => `${place}, ${dir} की ओर`],
    [/^It concerns (.+)$/, (x) => `यह ${x} से संबंधित है`],
    [/^The rising navāṃśa gives (.+)$/, (x) => `उदित नवांश से ${x} मिलता है`],
    [/^the text gives this for "(.+)"$/, (x) => `पाठ यह विधि "${x}" के लिए देता है`],
  ],
  split: /(: |; |(?<=[a-zāīūṃṇṣḥ)°])\. (?=[A-ZĀŚṢ0-9"]))/,
  lists: true,
  keep: (path) => SAT_KEEP.has(path) || path.startsWith('slokaStatus.') || /(^|\.)(id|group)$/.test(path),
  // Śloka ranges: "5.1 to 5.3".
  post: (s) => s.replace(/(\d) to (\d)/g, '$1 से $2'),
})
