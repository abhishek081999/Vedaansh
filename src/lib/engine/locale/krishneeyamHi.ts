// Hindi for Krishneeyam praśna output: the phrase glossary
// (krishneeyamFrag*.hi.ts) applied through the shared phrase translator.

import { createPhraseHi } from './phraseHi'
import { KRISH_FRAG_HI_1 } from './krishneeyamFrag1.hi'
import { KRISH_FRAG_HI_2 } from './krishneeyamFrag2.hi'
import { KRISH_FRAG_HI_3 } from './krishneeyamFrag3.hi'
import { KRISH_FRAG_HI_4 } from './krishneeyamFrag4.hi'
import { KRISH_FRAG_HI_5 } from './krishneeyamFrag5.hi'

/** Paths that are ids or enums the UI compares on; they stay English. */
const KRISH_KEEP = new Set([
  'verdict', 'ascendantTypeResult', 'signTypeResult', 'aroodhaUdayaResult', 'houseReference.type',
  'scorecard.result', 'planetHousesFromReference.id', 'lawsuit.queristLevel', 'lawsuit.opponentLevel', 'exam.level',
])

export const krishneeyamHi = createPhraseHi({
  frag: { ...KRISH_FRAG_HI_1, ...KRISH_FRAG_HI_2, ...KRISH_FRAG_HI_3, ...KRISH_FRAG_HI_4, ...KRISH_FRAG_HI_5 },
  split: /( \| | → |; |: | = | — |(?<=[a-z)])\. (?=[A-Z]))/,
  // An "Arudha Lagna …" phrase reuses its "Udaya Lagna …" twin with the label swapped.
  fallback: (key, frag) => {
    if (!key.includes('Arudha Lagna')) return undefined
    for (const [from, to] of [['Udaya Lagna', 'उदय लग्न'], ['Udaya', 'उदय']] as const) {
      const twin = frag[key.replaceAll('Arudha Lagna', from)]
      if (twin !== undefined) return twin.replaceAll(to, 'आरूढ़ लग्न')
    }
    return undefined
  },
  templates: [
    [/^Perform sacrifice and worship \(Homa\) for (.+)$/, (x) => `${x} के लिए होम और पूजा करें`],
    [/^Build a temple or garden to please (.+)$/, (x) => `${x} को प्रसन्न करने के लिए मंदिर या उद्यान बनवाएँ`],
    [/^Make an idol of (.+) in silver\/gold and donate it as a gift$/, (x) => `चाँदी/सोने की ${x} की मूर्ति बनवाकर दान करें`],
    [/^Thief may be in the (.+) direction$/, (x) => `चोर ${x} दिशा में हो सकता है`],
    [/^Light a ghee lamp at sunrise, face (.+), and proceed with your query's objective$/, (x) => `सूर्योदय पर घी का दीपक जलाएँ, ${x} की ओर मुख करें, और अपने प्रश्न के उद्देश्य के साथ आगे बढ़ें`],
  ],
  post: (s) => s.replace(/\bH(\d+)\b/g, 'भाव $1'),
  keep: (path) => KRISH_KEEP.has(path),
})

export const krishneeyamTextHi = krishneeyamHi.text
/** Deep-copies a Krishneeyam result with every display string in Hindi. */
export const krishneeyamToHi = krishneeyamHi.toHi
