// Hindi text for src/lib/engine/transitMomentAnalysis.ts
import { HOUSE_SHORT_THEMES_HI } from '@/lib/engine/locale/todayReading.hi'

type MomentLabel = 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid'

export const TRANSIT_HOUSE_THEME_HI: Record<number, string> = HOUSE_SHORT_THEMES_HI

export const MOMENT_LABEL_TEXT_HI: Record<MomentLabel, string> = {
  Excellent: 'उत्कृष्ट',
  Good: 'अनुकूल',
  Neutral: 'मिश्रित',
  Challenging: 'कठिन',
  Avoid: 'टालें',
}

export const MOMENT_SUMMARY_HI: Record<MomentLabel, string> = {
  Excellent:
    'कुल मिलाकर पहल, मिलन और सकारात्मक कार्य के लिए सहायक खिड़की — खासकर जहाँ गुरु, शुक्र और चंद्रमा बलवान हैं।',
  Good:
    'कुल मिलाकर पहल, मिलन और सकारात्मक कार्य के लिए सहायक खिड़की — खासकर जहाँ गुरु, शुक्र और चंद्रमा बलवान हैं।',
  Neutral:
    'मिला-जुला ब्रह्मांडीय मौसम — जागरूकता से आगे बढ़ें; बड़े निर्णयों की बजाय नियमित कार्यों पर ध्यान दें।',
  Challenging:
    'माँग वाला समय — अप्रतिवर्ती निर्णय टालें; उपचार, स्वास्थ्य और साधना पर ध्यान दें।',
  Avoid:
    'अत्यंत संवेदनशील क्षण — संभव हो तो टकराव, शल्यक्रिया और बड़ी प्रतिबद्धताएँ टालें।',
}

/** Tara names from transit moment scoring (Janma … Ati-Mitra with hint). */
export const TARA_MOMENT_HI: Record<number, { name: string }> = {
  1: { name: 'जन्म (संवेदनशील)' },
  2: { name: 'संपत् (धन)' },
  3: { name: 'विपत् (सावधानी)' },
  4: { name: 'क्षेम (सुरक्षा)' },
  5: { name: 'प्रत्यरी (बाधा)' },
  6: { name: 'साधक (सफलता)' },
  7: { name: 'वध (बड़ी बाधा)' },
  8: { name: 'मित्र (मैत्री)' },
  9: { name: 'अतिमित्र (अत्यंत अनुकूल)' },
}

export const TM_HI = {
  neutralTara: 'तटस्थ',
  retroSuffix: ' वक्री — आगे धकेलने के बजाय समीक्षा और पुनर्कार्य करें।',
  gocharLine: 'गोचर {house} ({rashi}): {houseText}',
  returnSign:
    'जन्म राशि ({rashi}) में लौटना: {graha} के लिए कर्म पूर्णता और नवीनीकरण। {houseText}',
  houseMove: 'जन्म के {natalH} से गोचर {transitH} में जाता है। {houseText}',
  houseFallback:
    '{graha} आपका {house}{ordinal} भाव सक्रिय करता है — {theme} के विषय।',
  detailNatal: 'जन्म: {rashi} भाव {house}, {dignity} — {dignityNote}.',
  detailTransit: 'गोचर: {rashi} भाव {house}, {dignity}{retro}.',
  detailFooter: 'अस्थायी गोचर रंग के रूप में पढ़ें — कार्य से पहले दशा से पुष्टि करें।',
  retroFlag: ', वक्री',
  avgStrength: 'औसत बल',
  favorableTransit: '{graha} अनुकूल गोचर में ({rashi}, भाव {house})',
  demandingTransit: '{graha} कठिन गोचर में (भाव {house}{retro})',
  chandraGood:
    'चंद्र बल: चंद्रमा जन्म चंद्र से {nth} — भावनात्मक रूप से सहायक',
  chandraHard:
    'चंद्र बल: चंद्रमा जन्म चंद्र से {nth} — भावनात्मक संवेदनशीलता',
  taraGood: 'तारा बल: {name}',
  taraCaution: 'तारा बल: {name}',
  juBlessing: 'गुरु का आशीर्वाद भाव {house} में — विस्तार और संरक्षण',
  saPressure: 'शनि का दबाव भाव {house} में — धैर्य और अनुशासन आवश्यक',
} as const

export function transitHouseThemeHi(house: number): string {
  return TRANSIT_HOUSE_THEME_HI[house] ?? 'जीवन की गतिविधि'
}

export function momentSummaryHi(label: MomentLabel): string {
  return MOMENT_SUMMARY_HI[label]
}
