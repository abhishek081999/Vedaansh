// Hindi text for src/lib/engine/todayReading.ts (and the tara / remedy
// tables it reads). Templates use {slots} filled by fill().
import type { GrahaId } from '@/types/astrology'
import type { PlanetRemedy } from '@/lib/engine/dashboardInsights'

/** Oblique Hindi ordinals ("चौथे भाव में", "आपके चंद्र से चौथे"). */
const ORD_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']
export function ordHi(n: number): string {
  return ORD_HI[n] ?? `${n}वें`
}

/** Direct-case ordinals for headings ("तीसरा भाव"). */
const ORD_HI_DIRECT = ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ', 'छठा', 'सातवाँ', 'आठवाँ', 'नौवाँ', 'दसवाँ', 'ग्यारहवाँ', 'बारहवाँ']
export function ordHiDirect(n: number): string {
  return ORD_HI_DIRECT[n] ?? `${n}वाँ`
}

/** Short themes per house 1–12, lower-case style phrases. */
export const HOUSE_SHORT_THEMES_HI: Record<number, string> = {
  1: 'शरीर, व्यक्तित्व और स्वास्थ्य', 2: 'धन, परिवार और वाणी', 3: 'साहस, भाई-बहन और संवाद',
  4: 'घर, माता और मन की शांति', 5: 'बुद्धि, संतान और सृजन', 6: 'रोग, ऋण, शत्रु और सेवा',
  7: 'विवाह, साझेदारी और व्यापार', 8: 'आयु, रहस्य और अचानक परिवर्तन', 9: 'भाग्य, धर्म और गुरु',
  10: 'करियर, कर्म और प्रतिष्ठा', 11: 'लाभ, आय और मित्र', 12: 'व्यय, विदेश और मोक्ष',
}

export const LEVEL_LABEL_HI: Record<number, string> = { 1: 'महादशा', 2: 'अंतर्दशा', 3: 'प्रत्यंतर्दशा', 4: 'सूक्ष्म दशा' }

export const NATAL_THEMES_HI: Record<string, string> = {
  Su: 'ओज, अधिकार और पिता', Mo: 'मन, माता और भावनात्मक सुरक्षा', Ma: 'ऊर्जा, साहस और संपत्ति',
  Me: 'संवाद, व्यापार और बुद्धि', Ju: 'ज्ञान, वृद्धि और मार्गदर्शन', Ve: 'प्रेम, सुख और आनंद',
  Sa: 'कर्तव्य, अनुशासन और सहनशक्ति', Ra: 'महत्वाकांक्षा और अपरंपरागत बातें', Ke: 'वैराग्य और आध्यात्मिकता',
  Asc: 'शरीर, पहचान और दिशा',
}

export const AREA_LABELS_HI: Record<string, string> = {
  mind: 'मन और मनोदशा', career: 'करियर और प्रतिष्ठा', money: 'धन और लाभ',
  love: 'प्रेम और संबंध', health: 'स्वास्थ्य और ऊर्जा', home: 'घर और परिवार',
}

export const DIGNITY_HI: Record<string, string> = {
  exalted: 'उच्च', moolatrikona: 'मूलत्रिकोण', own: 'स्वराशि', great_friend: 'अधिमित्र राशि', friend: 'मित्र राशि',
  neutral: 'सम राशि', enemy: 'शत्रु राशि', great_enemy: 'अधिशत्रु राशि', debilitated: 'नीच',
}

export const GOCHAR_STATUS_HI: Record<string, string> = {
  favourable: 'शुभ', unfavourable: 'अशुभ', vedha: 'वेध', neutral: 'सम',
}

export const LABEL_HI: Record<string, string> = {
  Excellent: 'उत्कृष्ट', Good: 'अच्छा', Balanced: 'संतुलित', Cautious: 'सावधानी वाला', Demanding: 'कठिन',
}

export const TARA_HI: Record<string, { name: string; shortLabel: string; meaning: string; experience: string; decisionWindow: string; trap?: string }> = {
  Janma: { name: 'जन्म', shortLabel: 'विकास और स्वभाव', meaning: 'जन्म नक्षत्र — शरीर और आत्मा की वृद्धि पर पहला प्रभाव; आपका मूल स्वभाव तय करता है।', experience: 'पहचान, अहं, नेतृत्व की शैली और जन्म नक्षत्र का मनोविज्ञान।', decisionWindow: 'अपने स्वभाव के अनुसार काम करें; कोई नया व्यक्तित्व ओढ़ने का प्रयास न करें।' },
  Sampat: { name: 'संपत्', shortLabel: 'लाभ और अवसर', meaning: 'धन / अवसर की तारा — लाभ, नए अवसर और भौतिक या प्रतिष्ठा में वृद्धि।', experience: 'द्वार खुलते हैं; साधन और अवसर आसानी से मिलते हैं।', decisionWindow: 'अनुकूल अवसरों को स्वीकारें; फिर भी कुंडली के बल से पुष्टि करें।' },
  Vipat: { name: 'विपत्', shortLabel: 'संकट और संघर्ष', meaning: 'सावधानी की तारा। समस्याएँ और चिंता अधिक महसूस हो सकती हैं, और आगे बढ़ने के लिए ज़ोर लगाना पड़ सकता है।', experience: 'संघर्ष, घर्षण और "यह मुझे करना ही है" वाला हठ; परिणाम अक्सर अधूरे।', decisionWindow: 'स्वयं को साबित करने की कोशिश न करें; जोखिम भरे कदम टालें; अच्छे लक्ष्यों पर भी घर्षण की अपेक्षा रखें।', trap: 'हठ संकट को और गहरा कर सकता है।' },
  Kshema: { name: 'क्षेम', shortLabel: 'रक्षा और समाधान', meaning: 'कल्याण की तारा — रक्षा और समाधान (अक्सर कठिनाई के बाद या उसके बीच)।', experience: 'समस्याएँ आ सकती हैं, पर साथ ही समाधान और सहारा भी आता है।', decisionWindow: 'सुधार, उपचार और जो पहले से है उसे मज़बूत करने पर ध्यान दें।' },
  Pratyari: { name: 'प्रत्यरि', shortLabel: 'विरोध', meaning: 'विरोध की तारा — चुनौतियाँ, प्रतिरोध और स्वयं को साबित करने का दबाव।', experience: 'जहाँ आप बोलते या ज़ोर लगाते हैं, वहाँ विरोध बढ़ता है; परखे जाने का कर्म।', decisionWindow: 'कम बोलें, अधिक सुनें; टकराव से साबित करने से बचें। जहाँ बोलेंगे, वहीं अटक सकते हैं।', trap: 'ज़रूरत से ज़्यादा सफ़ाई देना या बहस करना परिणाम बिगाड़ता है।' },
  Sadhaka: { name: 'साधक', shortLabel: 'उपलब्धि और परिवर्तन', meaning: 'उपलब्धि की तारा — सफलता और परिवर्तन (केवल आध्यात्मिक नहीं)।', experience: 'कौशल, प्रयास और जीवन की दिशा के बदलाव स्पष्ट परिणाम देते हैं।', decisionWindow: 'परिवर्तन के कार्य के लिए प्रतिबद्ध हों; मानें कि बदलाव अच्छा भी लग सकता है और कठिन भी।' },
  Vadha: { name: 'वध', shortLabel: 'हानि और त्याग', meaning: 'छोड़ने की तारा। अंत, अहं पर चोट और चीज़ों को छोड़ना पड़ने का संकेत।', experience: 'कसकर पकड़ी हुई कोई चीज़ ढीली होती है; अहं या आसक्ति को चोट लगती है।', decisionWindow: 'छोड़ें, पूरा करें और चिपके न रहें। अहं से प्रेरित झगड़े शुरू न करें।', trap: 'चिपके रहना हानि को लंबी पीड़ा में बदल देता है।' },
  Mitra: { name: 'मित्र', shortLabel: 'सहयोग', meaning: 'मित्र तारा — सहयोगी, सहारा और मिलकर मिलने वाली मदद।', experience: 'लोग और परिस्थितियाँ आपके पक्ष में झुकती हैं; साझेदारी से भार हल्का होता है।', decisionWindow: 'मिलकर काम करें, मदद माँगें और गठबंधन बनाएँ।' },
  'Ati-Mitra': { name: 'अतिमित्र', shortLabel: 'कृपा और रक्षा', meaning: 'परम मित्र तारा — कृपा, सहारा और प्रबल रक्षक परिणाम।', experience: 'अधिकांश परिणाम अनुकूल रहते हैं; दैवी रक्षा का भाव।', decisionWindow: 'अति-नियंत्रण के बिना सफलता स्वीकारें; विनम्र रहें।' },
}

export const PLANET_REMEDIES_HI: Partial<Record<GrahaId, PlanetRemedy>> = {
  Su: { gemstone: 'माणिक्य', metal: 'सोना या ताँबा', day: 'रविवार', mantra: 'ॐ सूर्याय नमः', charity: 'गेहूँ, गुड़, ताँबा', color: 'लाल या नारंगी' },
  Mo: { gemstone: 'मोती', metal: 'चाँदी', day: 'सोमवार', mantra: 'ॐ चन्द्राय नमः', charity: 'चावल, दूध, सफ़ेद वस्त्र', color: 'सफ़ेद' },
  Ma: { gemstone: 'मूंगा', metal: 'ताँबा', day: 'मंगलवार', mantra: 'ॐ अङ्गारकाय नमः', charity: 'मसूर दाल, मिठाई', color: 'लाल' },
  Me: { gemstone: 'पन्ना', metal: 'काँसा या सोना', day: 'बुधवार', mantra: 'ॐ बुधाय नमः', charity: 'हरी मूँग, पुस्तकें', color: 'हरा' },
  Ju: { gemstone: 'पुखराज', metal: 'सोना', day: 'गुरुवार', mantra: 'ॐ गुरवे नमः', charity: 'चना दाल, हल्दी, पीला वस्त्र', color: 'पीला' },
  Ve: { gemstone: 'हीरा या सफ़ेद पुखराज', metal: 'चाँदी या प्लैटिनम', day: 'शुक्रवार', mantra: 'ॐ शुक्राय नमः', charity: 'चावल, चीनी, सफ़ेद वस्त्र', color: 'सफ़ेद या हल्के रंग' },
  Sa: { gemstone: 'नीलम', metal: 'लोहा', day: 'शनिवार', mantra: 'ॐ शनैश्चराय नमः', charity: 'तिल, काली उड़द, कंबल', color: 'नीला या काला' },
  Ra: { gemstone: 'गोमेद', metal: 'मिश्रित धातु', day: 'शनिवार', mantra: 'ॐ राहवे नमः', charity: 'उड़द दाल, कंबल', color: 'धुएँ जैसा नीला' },
  Ke: { gemstone: 'लहसुनिया', metal: 'मिश्रित धातु या चाँदी', day: 'मंगलवार', mantra: 'ॐ केतवे नमः', charity: 'कंबल, कुत्तों को भोजन', color: 'धूसर या बहुरंगी' },
}

/** Sentence frames. Keys mirror TODAY_EN in todayReading.ts. */
export const TODAY_HI = {
  chandraGood: 'चंद्र बल (आज आपके लिए चंद्रमा का बल) अच्छा है: मन अधिक स्थिर है और लोगों से व्यवहार आसान है।',
  chandraBad: 'चंद्र बल (आज आपके लिए चंद्रमा का बल) कठिन है: भावनाएँ ऊपर रहती हैं, इसलिए बड़ी प्रतिक्रियाओं से पहले रुकें।',
  chandraAvg: 'चंद्र बल (आज आपके लिए चंद्रमा का बल) सम है: चंद्रमा न आपको ऊपर उठाता है, न दबाता है।',
  chandraLine: 'चंद्र बल (आपके लिए चंद्रमा का बल): आज का चंद्रमा आपके जन्म चंद्र से {nth} भाव में है',
  taraLine: 'तारा बल (आज आपके लिए नक्षत्र का बल): {name} ({label})',
  varaValue: '{vara} · {lord}',
  varaNote: '{lord} आज के दिन का स्वामी है और आपके {nth} भाव में ({dignity}) बैठा है। {guidance}',
  tithiValue: '{paksha} {tithi}',
  tithiNote: '{group} तिथि ({meaning})। {guidance}',
  nakValue: '{nak} · पद {pada}',
  nakNote: '{group}: {goodFor}।',
  yogaNote: '{meaning}। {guidance}',
  yogaFallback: 'वर्तमान सूर्य–चंद्र संयोग।',
  karanaBhadra: '{karana} (भद्रा)',
  karanaNote: '{meaning}। {guidance}',
  karanaFallback: 'चांद्र दिवस का वर्तमान अर्ध भाग।',
  labelValue: '{label}: {value}',
  varaStrong: 'आज के वार का स्वामी {lord} आपकी कुंडली में बलवान है',
  varaWeak: 'आज के वार का स्वामी {lord} आपकी कुंडली में निर्बल है',
  where: 'आपके चंद्र से {nth} भाव में',
  statusGood: 'शुभ स्थिति',
  statusVedha: 'सामान्यतः शुभ, पर {by} से वेध (रोकने वाला प्रभाव)',
  statusBad: 'परीक्षा वाली स्थिति',
  gocharNote: '{where}: {status}।',
  gocharFlavour: 'लग्न से {nth} भाव में — {flavour}',
  gocharLine: '{planet} {where} गोचर कर रहा है',
  sadeSati: 'शनि आपके चंद्र से {nth} भाव में है: साढ़े साती का {phase} चरण। साढ़े साती आपके चंद्रमा के आसपास शनि का लगभग 7.5 वर्ष का गोचर है। प्रायः यह धीमी प्रगति और अधिक ज़िम्मेदारी का समय होता है, इसलिए जल्दबाज़ी के बजाय धैर्य और नियमितता चुनें।',
  sadeRising: 'आरंभिक', sadePeak: 'मध्य (चरम)', sadeSetting: 'अंतिम',
  kantaka: 'शनि आपके चंद्र से चौथे भाव में है (कंटक शनि): घर और भावनाओं में अधिक दबाव महसूस हो सकता है, इसलिए घरेलू मामलों को स्थिर रखें।',
  ashtama: 'शनि आपके चंद्र से आठवें भाव में है (अष्टम शनि): जोखिम भरी प्रतिबद्धताओं और विवाद से बचें, और स्वास्थ्य का ध्यान रखें।',
  saturnClear: 'अभी साढ़े साती, कंटक या अष्टम शनि नहीं है।',
  sadeLine: 'साढ़े साती सक्रिय है: शनि आपके चंद्र से {nth} भाव में है, इसलिए धीमी प्रगति और अधिक ज़िम्मेदारी की अपेक्षा रखें',
  ashtamaLine: 'अष्टम शनि: शनि आपके चंद्र से आठवें भाव में है, इसलिए बड़े जोखिमों में सावधानी रखें',
  dashaMoon: 'आज चंद्रमा आपके जन्म चंद्र से {nth} भाव में है।',
  dashaTransit: 'आज यह आपके चंद्र से {nth} भाव में गोचर कर रहा है ({status})।',
  owns: ', आपके {houses} भाव का स्वामी',
  and: ' और ',
  dashaNote: '{lord} {rashi} में ({dignity}), आपके {nth} भाव में{own}। {gochar}',
  levelLabel: 'स्तर {n}',
  dashaGood: '{level} स्वामी {lord} अच्छी स्थिति में है',
  dashaBad: '{level} स्वामी {lord} दबाव में है',
  yourAsc: 'आपके लग्न',
  natalOf: 'जन्म के {planet}',
  conjoins: 'से युति कर रहा है',
  opposes: 'के सामने (प्रतियुति) है',
  toneSupport: '{themes} पर शुभ प्रभाव',
  tonePressure: '{themes} से जुड़ा दबाव और परीक्षा',
  toneFocus: '{themes} केंद्र में आते हैं',
  triggerText: 'गोचर {planet} {natal} {verb} ({orb}° अंतर) — {tone}।',
  triggerLine: 'गोचर {planet} {natal} पर',
  ascendant: 'लग्न',
  areaMoon: 'चंद्रमा आपके {nth} भाव को सक्रिय करता है ({state})',
  strained: 'दबाव में', supported: 'सहयोगी',
  areaTransit: '{planet} आपके {nth} भाव में गोचर कर रहा है',
  areaChandra: 'चंद्र बल {area} के लिए {state}',
  chandraSupports: 'सहायक है', chandraStrains: 'दबाव डालता है', chandraNeutral: 'सम है',
  areaKaraka: '{planet} (कारक) गोचर में {state} है',
  favourable: 'शुभ', obstructed: 'बाधित', unfavourable: 'अशुभ',
  rahu: 'राहु काल', yamaganda: 'यमगंड', gulika: 'गुलिक काल',
  abhijit: 'अभिजित मुहूर्त',
  abhijitNote: 'दोपहर का समय जो शास्त्रीय रूप से अधिकांश दोषों से सुरक्षित है',
  chogSlot: '{name} चौघड़िया',
  chogNote: 'शुभ समय, राहु / यमगंड / गुलिक से मुक्त',
  hora: '{planet} होरा',
  horaSuited: '{purposes} के लिए उपयुक्त',
  horaGeneral: 'सामान्य कार्य',
  doBest: 'अपना महत्वपूर्ण प्रयास {area} में लगाएँ — आज यही सबसे अधिक समर्थित क्षेत्र है ({score})।',
  avoidLow: 'आज {area} में धीरे चलें ({score}); वहाँ अपरिवर्तनीय निर्णय टालें।',
  doVara: 'आज {vara} के लिए श्रेष्ठ: {bestFor}।',
  avoidMoon: 'जब तक चंद्रमा आपके लिए तनावपूर्ण है, बहस और भावनात्मक निर्णयों से बचें; प्रतिक्रिया जल्दी हो तो उत्तर देने में देरी करें।',
  avoidBhadra: 'विष्टि (भद्रा) करण के रहते नए उपक्रम शुरू न करें; सामान्य कार्य ठीक हैं।',
  avoidRikta: 'रिक्ता तिथि: शुभ आरंभ न करें; इसके बजाय कार्य पूरे करें और निपटाएँ।',
  avoidSaturn: 'जोखिम भरे दाँव और टकराव छोड़ें; शनि के प्रभाव में स्थिर, अनुशासित प्रयास बेहतर फल देता है।',
  avoidVara: 'वार की सावधानी: {challenge}।',
  remedyMoon: 'आज चंद्रमा आपके लिए तनावपूर्ण है',
  remedyAntar: '{lord} (अंतर्दशा स्वामी) दबाव में है',
  moonName: 'चंद्र',
  narrativeMoon: '{label} दिन ({score}/100)। {rashi} ({nak}) में चंद्रमा आपके जन्म चंद्र से {nth} भाव में है — {bala} — और आपके {lagnaNth} भाव ({theme}) से गुज़र रहा है।',
  balaGood: 'शुभ चंद्र बल', balaBad: 'कठिन चंद्र बल', balaAvg: 'सम चंद्र बल',
  narrativeTara: '{name} तारा ({label}): {advice}',
  narrativePanchang: 'पंचांग: {vara} ({lord}), {paksha} {tithi} ({group}), {yoga} योग{bhadra}।',
  bhadraRunning: ', विष्टि (भद्रा) करण के साथ',
  narrativeDasha: 'चल रही दशा {chain}: {lord} ({level}) {state}।',
  dashaStateGood: 'अच्छी स्थिति में है और आपका साथ देता है',
  dashaStateBad: 'दबाव में है, इसलिए धीमे परिणाम की अपेक्षा रखें',
  dashaStateMixed: 'मिश्रित है, इसलिए परिणाम प्रयास पर निर्भर हैं',
  narrativeTransit: 'सबसे प्रबल पृष्ठभूमि गोचर: {planet} {rashi} में, आपके चंद्र से {nth} भाव में ({status})।',
  narrativeAreas: 'आज सबसे अधिक समर्थित: {best} ({bestScore})। {low} ({lowScore}) में धीरे चलें।',
  headline: {
    Excellent: 'प्रबल रूप से समर्थित दिन: जो महत्वपूर्ण है उस पर काम करें',
    Good: 'शुभ दिन: स्थिर प्रगति की संभावना',
    Balanced: 'मिश्रित दिन: अपनी लड़ाइयाँ सोच-समझकर चुनें',
    Cautious: 'संवेदनशील दिन: धीमे चलें और सरल रखें',
    Demanding: 'कठिन दिन: ऊर्जा बचाएँ और बड़े कदम टालें',
  },
  verdict: { Favourable: 'अनुकूल', Good: 'अच्छा', Neutral: 'सम', Careful: 'सावधान' },
}
