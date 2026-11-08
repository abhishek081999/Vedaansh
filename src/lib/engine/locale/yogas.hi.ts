// Hindi display names for the yogas detected in src/lib/engine/yogas.ts.
// Engine ids and English names never change; these are display-only.

const BASE_HI: Record<string, string> = {
  Amala: 'अमला', Anapha: 'अनफा', Budhaditya: 'बुधादित्य', 'Chandra Adhi': 'चंद्र अधि',
  'Chandra-Mangala': 'चंद्र-मंगल', Dhana: 'धन', Durudhara: 'दुरुधरा', Gajakesari: 'गजकेसरी',
  Kemadruma: 'केमद्रुम', 'Papa Kartari': 'पाप कर्तरी', Raja: 'राज', Sarasvati: 'सरस्वती',
  Shakata: 'शकट', 'Shubha Kartari': 'शुभ कर्तरी', Sunapha: 'सुनफा', Ubhayachari: 'उभयचरी',
  Vesi: 'वेशि', Vosi: 'वोशि', Harsha: 'हर्ष', Sarala: 'सरल', Vimala: 'विमल',
  Bhadra: 'भद्र', Hamsa: 'हंस', Malavya: 'मालव्य', Ruchaka: 'रुचक', Shasha: 'शश',
  Dama: 'दाम', Gola: 'गोल', Kedara: 'केदार', Pasha: 'पाश', Shula: 'शूल', Veena: 'वीणा', Yuga: 'युग',
  Parivartana: 'परिवर्तन', 'Maha Parivartana': 'महा परिवर्तन', 'Dainya Parivartana': 'दैन्य परिवर्तन',
  'Khala Parivartana': 'खल परिवर्तन', 'Viparita Raja': 'विपरीत राज',
}

export const YOGA_CATEGORY_HI: Record<string, string> = {
  mahapurusha: 'पंच महापुरुष', raja: 'राज योग', dhana: 'धन योग', special: 'विशेष योग',
  viparita: 'विपरीत राज', lunar: 'चंद्र योग', nabhasa: 'नाभस योग', malefic: 'अशुभ योग', parivartana: 'परिवर्तन',
}

export const YOGA_STRENGTH_HI: Record<string, string> = { strong: 'प्रबल', moderate: 'मध्यम', weak: 'निर्बल' }

/** "Gajakesari Yoga" → "गजकेसरी योग"; "Maha Parivartana (H2 ⇄ H9)" → "महा परिवर्तन (भाव 2 ⇄ भाव 9)". Unknown names pass through. */
export function yogaNameHi(name: string): string {
  const m = /^(.*?)(\s+Yoga)?(\s*\(H(\d+) ⇄ H(\d+)\))?$/.exec(name.trim())
  if (!m) return name
  const base = BASE_HI[m[1]]
  if (!base) return name
  const suffix = m[2] || (!m[3] && !/Parivartana|Viparita/.test(m[1])) ? ' योग' : ''
  const houses = m[3] ? ` (भाव ${m[4]} ⇄ भाव ${m[5]})` : ''
  return `${base}${suffix}${houses}`
}

// ── Effects and descriptions ────────────────────────────────
// Yogas are stored on the chart in English, so Hindi text is rebuilt on display
// from the English name and description patterns. Unknown text falls back to English.

const G: Record<string, string> = {
  Su: 'सूर्य', Mo: 'चंद्र', Ma: 'मंगल', Me: 'बुध', Ju: 'गुरु', Ve: 'शुक्र', Sa: 'शनि', Ra: 'राहु', Ke: 'केतु',
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
}
const DIG: Record<string, string> = { own: 'स्वराशि', moolatrikona: 'मूलत्रिकोण', exalted: 'उच्च' }
const ids = (list: string) => list.split(/,\s*/).map(x => G[x] ?? x).join(', ')

const EFFECT_HI: Record<string, string> = {
  Ruchaka: 'योद्धा स्वभाव, शारीरिक बल, साहस, सेना या पुलिस में नेतृत्व',
  Bhadra: 'तीक्ष्ण बुद्धि, वाक्पटुता, व्यापार, वाणिज्य और गणित में निपुणता',
  Hamsa: 'ज्ञान, आध्यात्मिकता, अध्यापन की क्षमता, निर्मल चरित्र, सबसे सम्मान',
  Malavya: 'कलात्मक प्रतिभा, इंद्रिय सुख, सौंदर्य, वाहन, विलासी जीवन',
  Shasha: 'जनसमूह पर प्रभाव, राजनीति, भूमि या प्राकृतिक संसाधनों से जुड़ा काम',
  Raja: 'अधिकार, शक्ति, करियर और सामाजिक प्रतिष्ठा में उन्नति, नेतृत्व और पहचान',
  Dhana: 'धन संचय, आर्थिक समृद्धि, आय के कई स्रोत',
  Gajakesari: 'बुद्धिमत्ता, यश, समृद्धि, दीर्घायु, समाज में सम्मानित पद',
  Budhaditya: 'तीक्ष्ण बुद्धि, विश्लेषणात्मक मन, अच्छा संवाद, बुद्धि से सफलता',
  Sarasvati: 'असाधारण बुद्धि, कलात्मक प्रतिभा, वाक्पटुता, कलाओं और विज्ञानों में निपुणता',
  'Chandra-Mangala': 'साहसी कर्म से धन, व्यापारिक समझ, दृढ़ इच्छाशक्ति, व्यावहारिक बुद्धि',
  Amala: 'निष्कलंक प्रतिष्ठा, निर्मल चरित्र, धर्मपूर्ण कर्मों से स्थायी यश',
  Ubhayachari: 'सुडौल शरीर, कुशल वक्ता, धनवान और स्थिर मन।',
  Vesi: 'संतुलित व्यक्तित्व, अच्छी स्मरणशक्ति, सुख, सत्यनिष्ठा।',
  Vosi: 'कुशल, दानशील, अच्छा वक्ता, प्रसिद्ध, और कार्यों में सफल।',
  'Chandra Adhi': 'दूसरों का अगुवा, प्रसिद्ध, स्थिर धन, प्रतिस्पर्धियों पर विजय।',
  Harsha: 'शत्रुओं पर विजय, अच्छा स्वास्थ्य, बाधाओं के बावजूद सुख',
  Sarala: 'दीर्घायु, निर्भयता, विद्वत्ता, प्रसिद्धि',
  Vimala: 'स्वतंत्र स्वभाव, संयमित व्यय, मुक्ति, निर्मल चरित्र',
  Durudhara: 'धन, ज्ञान, यश, वाहन और सुखी जीवन।',
  Sunapha: 'स्वअर्जित धन, बुद्धिमान, अच्छी प्रतिष्ठा, राजसी पद',
  Anapha: 'अच्छा स्वास्थ्य, प्रसिद्धि, उदार, सुखी, सदाचारी चरित्र',
  Kemadruma: 'अकेलापन, संघर्ष, अस्थिर भाग्य — चंद्र बलवान हो या उस पर गुरु की दृष्टि हो तो प्रभाव घटता है।',
  Shakata: 'अस्थिर भाग्य, धन और पद की हानि, पर प्रयास से फिर प्राप्ति।',
  'Maha Parivartana': 'सफलता, शक्ति, और जीवन के क्षेत्रों के बीच परस्पर सहयोग।',
  'Dainya Parivartana': 'बाधाएँ, उतार-चढ़ाव, और संघर्ष से विकास।',
  'Khala Parivartana': 'अस्थिर भाग्य, कभी ऊँचा, कभी नीचा।',
  Gola: 'अल्पायु, निर्धनता, निम्न पद (वास्तव में दुर्लभ)',
  Yuga: 'आर्थिक संघर्ष, अपरंपरागत मार्ग',
  Shula: 'साहसी पर संभवतः आक्रामक, दृढ़ इच्छाशक्ति',
  Kedara: 'कृषि में सफलता, सत्यनिष्ठा, भूमि से धन',
  Pasha: 'बाँधने वाला स्वभाव, बहुत से अनुयायी, संभवतः बातूनी',
  Dama: 'दानशील, धनवान, दूसरों के सहायक',
  Veena: 'संगीत और कलाओं से प्रेम, ज्ञान, नेतृत्व के गुण',
  'Shubha Kartari': 'रक्षा, स्वास्थ्य, परिवेश का सहयोग, बाधाएँ आसानी से पार होती हैं।',
  'Papa Kartari': 'दबाव, स्वास्थ्य संबंधी समस्याएँ, परिस्थितियों में बँधा या फँसा हुआ महसूस होना।',
}

const GAJA_REL: Record<string, string> = {
  conjunct: 'चंद्र (भाव {mo}) के साथ युति में',
  'in 4th from': 'चंद्र (भाव {mo}) से चतुर्थ',
  opposite: 'चंद्र (भाव {mo}) के सामने',
  'in 10th from': 'चंद्र (भाव {mo}) से दशम',
}

const DESC_RULES: Array<[RegExp, (m: RegExpExecArray) => string]> = [
  [/^(\w+) in (own|moolatrikona|exalted) in house (\d+) \(kendra\)$/, m => `${G[m[1]] ?? m[1]} ${DIG[m[2]]} में भाव ${m[3]} में (केंद्र)`],
  [/^(\w+) \(lord H(\d+)\) conjunct (\w+) \(lord H(\d+)\) in house (\d+)$/, m => `${G[m[1]] ?? m[1]} (भाव ${m[2]} का स्वामी) और ${G[m[3]] ?? m[3]} (भाव ${m[4]} का स्वामी) की भाव ${m[5]} में युति`],
  [/^(\w+) \(lord H(\d+)\) and (\w+) \(lord H(\d+)\) in Parivartana \(H(\d+) ⇄ H(\d+)\)$/, m => `${G[m[1]] ?? m[1]} (भाव ${m[2]} का स्वामी) और ${G[m[3]] ?? m[3]} (भाव ${m[4]} का स्वामी) में परिवर्तन (भाव ${m[5]} ⇄ भाव ${m[6]})`],
  [/^(\w+) \(lord H(\d+)\) in house (\d+) associated by aspect with (\w+) \(lord H(\d+)\) in house (\d+)$/, m => `भाव ${m[3]} में ${G[m[1]] ?? m[1]} (भाव ${m[2]} का स्वामी) का भाव ${m[6]} में स्थित ${G[m[4]] ?? m[4]} (भाव ${m[5]} का स्वामी) से दृष्टि संबंध`],
  [/^Lords of H(\d+) \((\w+)\) and H(\d+) \((\w+)\) conjunct in house (\d+)$/, m => `भाव ${m[1]} (${G[m[2]] ?? m[2]}) और भाव ${m[3]} (${G[m[4]] ?? m[4]}) के स्वामियों की भाव ${m[5]} में युति`],
  [/^Jupiter \(H(\d+)\) (conjunct|in 4th from|opposite|in 10th from) Moon \(H(\d+)\) — kendra from Moon$/, m => `गुरु (भाव ${m[1]}) ${GAJA_REL[m[2]].replace('{mo}', m[3])} — चंद्र से केंद्र में`],
  [/^Sun and Mercury conjunct in house (\d+)$/, m => `सूर्य और बुध की भाव ${m[1]} में युति`],
  [/^Jupiter \(H(\d+)\), Venus \(H(\d+)\), Mercury \(H(\d+)\) all in kendras\/trikonas$/, m => `गुरु (भाव ${m[1]}), शुक्र (भाव ${m[2]}), बुध (भाव ${m[3]}) सभी केंद्र/त्रिकोण में`],
  [/^Moon and Mars conjunct in house (\d+)$/, m => `चंद्र और मंगल की भाव ${m[1]} में युति`],
  [/^Only helpful planets \(([^)]*)\) in H10$/, m => `दशम भाव में केवल शुभ ग्रह (${ids(m[1])})`],
  [/^Planets in both 2nd and 12th from Sun\.$/, () => 'सूर्य से द्वितीय और द्वादश, दोनों में ग्रह।'],
  [/^(.+) in 2nd house from Sun$/, m => `सूर्य से द्वितीय भाव में ${ids(m[1])}`],
  [/^(.+) in 12th house from Sun$/, m => `सूर्य से द्वादश भाव में ${ids(m[1])}`],
  [/^Helpful planets \(([^)]*)\) in 6th, 7th, or 8th from Moon$/, m => `चंद्र से षष्ठ, सप्तम या अष्टम में शुभ ग्रह (${ids(m[1])})`],
  [/^Lord of H(\d+) \((\w+)\) placed in dusthana H(\d+)$/, m => `भाव ${m[1]} का स्वामी (${G[m[2]] ?? m[2]}) दुःस्थान भाव ${m[3]} में`],
  [/^Planets in both 2nd and 12th from Moon$/, () => 'चंद्र से द्वितीय और द्वादश, दोनों में ग्रह'],
  [/^(.+) in 2nd from Moon$/, m => `चंद्र से द्वितीय में ${ids(m[1])}`],
  [/^(.+) in 12th from Moon$/, m => `चंद्र से द्वादश में ${ids(m[1])}`],
  [/^No planet in 2nd or 12th from Moon \(H(\d+)\)$/, m => `चंद्र (भाव ${m[1]}) से द्वितीय या द्वादश में कोई ग्रह नहीं`],
  [/^Moon in house (\d+) is in (\d+)th from Jupiter in house (\d+)$/, m => `भाव ${m[1]} में चंद्र, भाव ${m[3]} में स्थित गुरु से ${m[2]}वें स्थान पर है`],
  [/^Lord of H(\d+) \((\w+)\) in house (\d+) and Lord of H(\d+) \((\w+)\) in house (\d+)$/, m => `भाव ${m[1]} का स्वामी (${G[m[2]] ?? m[2]}) भाव ${m[3]} में और भाव ${m[4]} का स्वामी (${G[m[5]] ?? m[5]}) भाव ${m[6]} में`],
  [/^All main planets occupy exactly (\d+) signs\.$/, m => `सभी मुख्य ग्रह ठीक ${m[1]} राशियों में स्थित हैं।`],
  [/^Lagna hemmed in by naturally helpful planet\.$/, () => 'लग्न नैसर्गिक शुभ ग्रहों के बीच घिरा है।'],
  [/^Lagna hemmed in by naturally difficult planet\.$/, () => 'लग्न नैसर्गिक पाप ग्रहों के बीच घिरा है।'],
]

export function yogaDescriptionHi(description: string): string {
  for (const [re, build] of DESC_RULES) {
    const m = re.exec(description)
    if (m) return build(m)
  }
  return description
}

/** Hindi effect for a yoga, keyed by its English name ("Gajakesari Yoga", "Maha Parivartana (H2 ⇄ H9)"). */
export function yogaEffectHi(name: string, effect: string): string {
  const base = name.replace(/\s*\(H\d+ ⇄ H\d+\)$/, '').replace(/\s+Yoga$/, '').trim()
  return EFFECT_HI[base] ?? effect
}
