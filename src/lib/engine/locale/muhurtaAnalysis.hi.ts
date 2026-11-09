// Hindi text for src/lib/engine/muhurtaAnalysis.ts — ids stay English.
import type { MuhurtaActivity, ChoghadiyaType } from '@/lib/engine/muhurtaAnalysis'

export const MUHURTA_ACTIVITY_LABELS_HI: Record<MuhurtaActivity, string> = {
  BUSINESS: 'व्यापार',
  TRAVEL: 'यात्रा',
  REAL_ESTATE: 'संपत्ति / भूमि',
  RELATIONSHIP: 'संबंध',
  HEALTH: 'स्वास्थ्य',
  SPIRITUAL: 'आध्यात्मिक',
  MARRIAGE: 'विवाह',
  EDUCATION: 'शिक्षा',
  GENERAL: 'सामान्य',
}

export const SCORE_LABELS_HI = {
  Excellent: 'उत्तम',
  Good: 'अच्छा',
  Neutral: 'मध्यम',
  Challenging: 'कठिन',
  Avoid: 'टालें',
} as const

export const CHOGHADIYA_QUALITY_HI = {
  Good: 'शुभ',
  Neutral: 'सामान्य',
  Bad: 'अशुभ',
} as const

export const TARA_FACTORS_HI: Record<number, string> = {
  1: 'जन्म',
  2: 'संपत् (धन)',
  3: 'विपत् (सावधानी)',
  4: 'क्षेम (सुरक्षा)',
  5: 'प्रत्यरि (बाधाएँ)',
  6: 'साधक (सफलता)',
  7: 'वध (बड़ी बाधाएँ)',
  8: 'मित्र (मैत्री)',
  9: 'अतिमित्र (परम मित्र)',
}

export const MA_HI = {
  rahuKalam: 'राहु काल (अशुभ)',
  gulikaKalam: 'गुलिक काल (अशुभ)',
  yamaganda: 'यमगंड (अशुभ)',
  abhijit: 'अभिजित मुहूर्त (अत्यंत शुभ)',
  panchakaShubh: 'पंचक: शुभ',
  karanaBhadra: 'करण: भद्रा / विष्टि (स्थायी कार्य टालें)',
  karanaFixed: 'करण: {name} (स्थिर — सामान्य सावधानी)',
  karanaPlain: 'करण: {name}',
  yogaAuspicious: 'योग: {name} (शुभ)',
  yogaInauspicious: 'योग: {name} (अशुभ)',
  yogaNeutral: 'योग: {name} (सामान्य)',
  taraBala: 'तारा बल: {name}',
  chandraFav: 'चंद्र बल: {house}वां भाव (अनुकूल)',
  chandraHard: 'चंद्र बल: {house}वां भाव (कठिन)',
  chandraNeutral: 'चंद्र बल: {house}वां भाव (सामान्य)',
  choghadiyaGood: 'चौघड़िया: {type} (शुभ)',
  choghadiyaBad: 'चौघड़िया: {type} (अशुभ)',
  panchaka: 'पंचक: {label}',
  horaGood: 'शुभ होरा: {lord}',
  // Activity-specific
  commerceTithi: 'व्यापार के लिए अनुकूल तिथि',
  prosperityNak: 'समृद्धि नक्षत्र',
  mercuryJupiterDay: '{day} (बुध/गुरु वार)',
  travelNak: 'यात्रा के लिए उत्तम नक्षत्र',
  riktaTravel: 'रिक्ता तिथि (यात्रा टालें)',
  stabilityNak: 'स्थिरता नक्षत्र',
  auspiciousWeekday: 'शुभ वार',
  divineNak: 'दिव्य नक्षत्र',
  soulTithi: 'आत्म-शुद्धि तिथि',
  healthNak: 'स्वास्थ्य नक्षत्र',
  sunVitalityDay: 'सूर्य (प्राण) वार',
  harmonyNak: 'सौहार्द नक्षत्र',
  loveEmotionDay: 'प्रेम / भावना वार',
  vivahaNak: 'शास्त्रीय विवाह नक्षत्र',
  marriageTithi: 'विवाह के लिए बलवान तिथि',
  weddingDay: 'शुभ विवाह वार',
  knowledgeNak: 'ज्ञानार्थी नक्षत्र',
  learningTithi: 'अध्ययन के लिए अच्छी तिथि',
} as const

export function choghadiyaTypeHi(type: ChoghadiyaType): string {
  const map: Record<ChoghadiyaType, string> = {
    Amrit: 'अमृत',
    Shubh: 'शुभ',
    Labh: 'लाभ',
    Chala: 'चल',
    Rog: 'रोग',
    Kaal: 'काल',
    Udveg: 'उद्वेग',
  }
  return map[type]
}
