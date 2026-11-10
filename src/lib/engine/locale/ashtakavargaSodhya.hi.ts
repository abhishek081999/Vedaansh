// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/ashtakavargaSodhya.hi.ts
//  Hindi display text for Sodhya Pinda readings.
//  Strength bands stay English enums.
// ─────────────────────────────────────────────────────────────

import { fill } from '@/lib/engine/lang'
import type { SodhyaStrengthBand } from '@/lib/engine/ashtakavargaSodhyaGuide'

export const SODHYA_BAND_HI: Record<SodhyaStrengthBand, string> = {
  exceptional: 'असाधारण शक्ति',
  strong: 'प्रबल फल',
  moderate: 'मध्यम अभिव्यक्ति',
  weak: 'घटित फल',
}

export const SODHYA_SIG_HI: Record<string, string> = {
  Su: 'अधिकार, पिता, प्राण',
  Mo: 'मन, माता, जन',
  Ma: 'साहस, संपत्ति, सहोदर',
  Me: 'बुद्धि, वाणिज्य, वाणी',
  Ju: 'विवेक, संतान, धर्म',
  Ve: 'संबंध, सुख, कला',
  Sa: 'अनुशासन, आयु, कर्म',
}

export function sodhyaReadingHi(name: string, sodhya: number, band: SodhyaStrengthBand, rasi: number, graha: number): string {
  return fill(
    '{name} शोध्या पिंड {sodhya} ({band})। राशि {rasi} + ग्रह {graha}।',
    { name, sodhya, band: SODHYA_BAND_HI[band], rasi, graha },
  )
}

export function sodhyaEventHi(sig: string, band: SodhyaStrengthBand, ageYear: number): string {
  if (band === 'exceptional' || band === 'strong') {
    return fill(
      'दशा/गोचर मेल खाए तो {sig} के लिए अनुकूल। आयु-चक्र वर्ष {age} पर {sig} की उल्लेखनीय घटनाएँ संभव।',
      { sig, age: ageYear },
    )
  }
  if (band === 'weak') {
    return fill(
      '{sig} के फल के लिए अधिक दृढ़ दशा-सहारा चाहिए। आयु-चक्र वर्ष {age} पर काल सावधानी से देखें।',
      { sig, age: ageYear },
    )
  }
  return fill(
    '{sig} का फल मिश्रित; काल के लिए भिन्न गोचर और दशा मिलाएँ। चक्र वर्ष {age}।',
    { sig, age: ageYear },
  )
}

export function sodhyaSummaryHi(strongName: string, strongPinda: number, weakName: string, weakPinda: number): string {
  return fill(
    'सबसे प्रबल शोध्या फल: {strongName} ({strongPinda})। सबसे दुर्बल: {weakName} ({weakPinda})। घटना-काल के लिए घटे हुए भिन्न बिंदु के साथ प्रयोग करें।',
    { strongName, strongPinda, weakName, weakPinda },
  )
}

export const SODHYA_MISSING_HI = 'शोध्या पिंड विश्लेषण के लिए पुनर्गणित कुंडली आँकड़े चाहिए।'
