// Hindi display strings for src/lib/engine/numerology/couple.ts

import type { CoupleNumerology, CouplePairId } from '@/lib/engine/numerology/couple'
import type { EngineLang } from '@/lib/engine/lang'
import { NUMBER_PROFILES, type CoreNumber } from '@/lib/engine/numerology/data'

export const COUPLE_FALLBACK_HI = { person1: 'पहला व्यक्ति', person2: 'दूसरा व्यक्ति' } as const

const PAIR_LABEL_HI: Record<CouplePairId, string | ((a: string, b: string) => string)> = {
  'moolank-moolank': 'मूलांक ↔ मूलांक',
  'bhagyank-bhagyank': 'भाग्यांक ↔ भाग्यांक',
  'cross-a-moolank-b-bhagyank': (a, b) => `${a} मूलांक ↔ ${b} भाग्यांक`,
  'cross-a-bhagyank-b-moolank': (a, b) => `${a} भाग्यांक ↔ ${b} मूलांक`,
  'namank-namank': 'नामांक ↔ नामांक',
}

const PLANE_HI: Record<string, { name: string; meaning: string }> = {
  mental: { name: 'मानस तल', meaning: 'तीक्ष्ण बुद्धि, अच्छी स्मृति और विश्लेषणात्मक शक्ति।' },
  emotional: { name: 'भावनात्मक तल', meaning: 'आध्यात्मिक और भावनात्मक रूप से मजबूत; करुणामय।' },
  practical: { name: 'व्यावहारिक तल', meaning: 'भौतिक दक्षता, हाथ से काम और लौकिक सफलता।' },
  thought: { name: 'विचार तल', meaning: 'अच्छा योजनाकार और रणनीतिकार।' },
  will: { name: 'इच्छा तल', meaning: 'मजबूत संकल्प; शुरू किया हुआ पूरा करते हैं।' },
  action: { name: 'कर्म तल', meaning: 'विचारों को शीघ्र क्रिया में बदलते हैं।' },
  golden: { name: 'स्वर्ण योग (सफलता)', meaning: 'सफलता, धन और प्रतिष्ठा का राजयोग।' },
  silver: { name: 'रजत योग (संपत्ति)', meaning: 'भूमि, संपत्ति और स्थिर संपत्ति से लाभ।' },
}

const PROFILE_HI: Record<CoreNumber, { planet: string; keyword: string }> = {
  1: { planet: 'सूर्य', keyword: 'नेतृत्व' },
  2: { planet: 'चंद्र', keyword: 'संवेदनशीलता' },
  3: { planet: 'गुरु', keyword: 'ज्ञान' },
  4: { planet: 'राहु', keyword: 'अपरंपरागत' },
  5: { planet: 'बुध', keyword: 'बुद्धि' },
  6: { planet: 'शुक्र', keyword: 'संतुलन' },
  7: { planet: 'केतु', keyword: 'आत्मा' },
  8: { planet: 'शनि', keyword: 'कर्म' },
  9: { planet: 'मंगल', keyword: 'ऊर्जा' },
}

const PERSONAL_YEAR_HI: Record<CoreNumber, { theme: string; guidance: string }> = {
  1: { theme: 'नई शुरुआत', guidance: 'नए प्रकल्प शुरू करें, पहल लें और दीर्घकालिक लक्ष्य तय करें।' },
  2: { theme: 'साझेदारी और धैर्य', guidance: 'सहयोग करें, संबंधों को पोषें और योजनाओं को परिपक्व होने दें।' },
  3: { theme: 'विस्तार और अभिव्यक्ति', guidance: 'सीखें, सिखाएँ, रचना करें और सामाजिक दायरा बढ़ाएँ।' },
  4: { theme: 'नींव और परिश्रम', guidance: 'संरचना बनाएँ, कड़ी मेहनत करें और कटौती से बचें।' },
  5: { theme: 'परिवर्तन और स्वतंत्रता', guidance: 'यात्रा करें, अनुकूलन करें और बदलाव स्वीकारें — लेकिन लापरवाही से बचें।' },
  6: { theme: 'परिवार और जिम्मेदारी', guidance: 'गृह, विवाह, सौंदर्य और सेवा पर ध्यान दें।' },
  7: { theme: 'आत्म-चिंतन', guidance: 'अध्ययन, ध्यान और चिंतन — बड़े निवेश/अटकलों से बचें।' },
  8: { theme: 'कर्म और उपलब्धि', guidance: 'पूर्व प्रयास का फल — धन और अधिकार बुद्धिमानी से संभालें।' },
  9: { theme: 'पूर्णता', guidance: 'चक्र समाप्त करें, पुराना छोड़ें और दूसरों की सेवा करें।' },
}

const PLANE_ID_BY_NAME: Record<string, string> = {
  'Mental Plane': 'mental',
  'Emotional Plane': 'emotional',
  'Practical Plane': 'practical',
  'Thought Plane': 'thought',
  'Will Plane': 'will',
  'Action Plane': 'action',
  'Golden Yoga (Success)': 'golden',
  'Silver Yoga (Property)': 'silver',
}

export function couplePlanetLabel(n: CoreNumber, lang: EngineLang): string {
  if (lang === 'hi') return PROFILE_HI[n].planet
  return NUMBER_PROFILES[n].planet
}

export function localizeCoupleNumerology(result: CoupleNumerology, lang: EngineLang): CoupleNumerology {
  if (lang !== 'hi') return result
  const aLabel = result.a.label
  const bLabel = result.b.label
  return {
    ...result,
    pairs: result.pairs.map(p => {
      const tpl = PAIR_LABEL_HI[p.id]
      const label = typeof tpl === 'function' ? tpl(aLabel, bLabel) : tpl
      return { ...p, label }
    }),
    sharedPlanes: result.sharedPlanes.map(p => {
      const id = PLANE_ID_BY_NAME[p.name]
      const hi = id ? PLANE_HI[id] : undefined
      return hi ? { ...p, name: hi.name, meaning: hi.meaning } : p
    }),
    relationshipNumber: {
      ...result.relationshipNumber,
      planet: PROFILE_HI[result.relationshipNumber.value].planet,
      keyword: PROFILE_HI[result.relationshipNumber.value].keyword,
      theme: PERSONAL_YEAR_HI[result.relationshipNumber.value].theme,
      guidance: PERSONAL_YEAR_HI[result.relationshipNumber.value].guidance,
    },
  }
}
