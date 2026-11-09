// Hindi text for src/lib/engine/muhurtaElection.ts
import type { MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'

export const ELECTIONAL_LAGNA_NOTE_HI: Record<MuhurtaActivity, string> = {
  MARRIAGE: 'विवाह के लिए स्थिर / शुक्र-अनुकूल लग्न प्राथमिक',
  TRAVEL: 'चर लग्न यात्राओं का समर्थन करता है',
  BUSINESS: 'व्यापार के लिए बुध / गुरु / शुक्र राशियाँ',
  REAL_ESTATE: 'संपत्ति के लिए स्थिर / भूमि तत्त्व लग्न',
  RELATIONSHIP: 'शुक्र / चंद्र अनुकूल लग्न',
  HEALTH: 'अग्नि / प्राण लग्न; दुःस्थान (६, ८, १२) लग्न से बचें',
  SPIRITUAL: 'साधना के लिए जल / धर्म लग्न',
  EDUCATION: 'अध्ययन के लिए बुध / गुरु लग्न',
  GENERAL: 'स्थिर शुभ लग्न',
}

export const ME_HI = {
  lagnaFav: 'निर्वाचन लग्न R{rashi} (अनुकूल)',
  lagnaAvoid: 'निर्वाचन लग्न R{rashi} (कम उपयुक्त)',
  lagnaNeutral: 'निर्वाचन लग्न R{rashi} (सामान्य)',
  gandanta: 'चंद्र गंडांत ({severity})',
  tyajya: 'त्याज्य / विष नक्षत्र अंश',
  grahan: 'ग्रहण योग ({type}) — बड़े आरंभ टालें',
  dashaSupport: 'महादशा {maha} — {activity} के लिए सहायक',
  dashaHard: 'महादशा {maha} — {activity} के लिए कठिन',
  antarCaution: 'अंतर्दशा {antar} — सावधानी',
  savStrong: 'लग्न पर SAV: {bindus} बिंदु (बलवान)',
  savWeak: 'लग्न पर SAV: {bindus} बिंदु (कमज़ोर)',
  savMid: 'लग्न पर SAV: {bindus} बिंदु',
  gandantaSeverity: {
    exact: 'सटीक',
    near: 'निकट',
    none: 'नहीं',
  },
  grahanType: {
    solar: 'सूर्य',
    lunar: 'चंद्र',
  },
  activityLabel: {
    BUSINESS: 'व्यापार',
    TRAVEL: 'यात्रा',
    REAL_ESTATE: 'संपत्ति',
    RELATIONSHIP: 'संबंध',
    HEALTH: 'स्वास्थ्य',
    SPIRITUAL: 'आध्यात्मिक',
    MARRIAGE: 'विवाह',
    EDUCATION: 'शिक्षा',
    GENERAL: 'सामान्य',
  } satisfies Record<MuhurtaActivity, string>,
} as const
