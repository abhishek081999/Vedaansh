// Hindi for src/lib/engine/lagnaMatch.ts

import type { LagnaMatchLevel } from '@/lib/engine/lagnaMatch'
import PAIRS_REASON_HI from '@/lib/engine/locale/data/lagnaPairsReason.hi.json'

export const LM_LEVEL_HI: Record<LagnaMatchLevel, string> = {
  excellent: 'उत्कृष्ट',
  good: 'अच्छा',
  strong: 'प्रबल',
  moderate: 'मध्यम',
  neutral: 'तटस्थ',
  difficult: 'कठिन',
  incompatible: 'असंगत',
}

export const LM_DEFAULT_REASON_HI =
  'इस लग्न जोड़ी के लिए सामान्य नोट संग्रहित नहीं। भाव संबंध से शुरू करें, फिर राशियाँ देखें।'

export const LM_ELEMENT_HI = {
  water: 'दोनों लग्न जल। दया याद रहती है; बंधन भावना पर टिका है। विश्वास टूटने या लंबे अकेलेपन का बोझ भारी पड़ सकता है।',
  fire: 'दोनों लग्न अग्नि। पहल और चिंगारी साझी। दोनों अग्नि से प्रतिक्रिया करें तो विवाद जल्दी बढ़ सकते हैं।',
  earth: 'दोनों लग्न पृथ्वी। दिनचर्या, धन और टिकाव पर बना मेल। भावना के लिए समय न दें तो गायब हो सकती है।',
  air: 'दोनों लग्न वायु। विचार और संगति आसान। घर को व्यावहारिक रूप से जमीन पर रखना किसी एक को करना होगा।',
} as const

export const LM_PAIRS_REASON_HI = PAIRS_REASON_HI as Record<string, string>

export function lagnaLevelLabel(level: LagnaMatchLevel, lang: 'en' | 'hi'): string {
  return lang === 'hi' ? (LM_LEVEL_HI[level] ?? level) : level
}
