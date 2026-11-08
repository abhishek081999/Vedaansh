// Hindi text for src/lib/engine/interpretationHub.ts. Templates use
// {slots} filled by fill(); ids, tones and numbers stay English.
import type { Rashi } from '@/types/astrology'

export const HUB_DIGNITY_HI: Record<string, string> = {
  exalted: 'उच्च',
  moolatrikona: 'मूलत्रिकोण',
  own: 'स्वराशि',
  great_friend: 'अधिमित्र',
  friend: 'मित्र राशि',
  neutral: 'सम',
  enemy: 'शत्रु राशि',
  great_enemy: 'अधिशत्रु',
  debilitated: 'नीच',
}

export const HUB_CATEGORY_HI: Record<string, string> = {
  strength: 'बल',
  vulnerability: 'संवेदनशीलता',
  special: 'विशेष',
  summary: 'सारांश',
}

export const HUB_SECTION_HI: Record<string, { label: string; intro: string }> = {
  overview: { label: 'सारांश', intro: 'मुख्य विषय, योग और पूरी कुंडली के ढर्रे।' },
  planets: { label: 'ग्रह', intro: 'हर ग्रह को उसके भाव, राशि, गरिमा, नक्षत्र, स्वामित्व और वक्री/अस्त स्थिति से पढ़ा गया है।' },
  houses: { label: 'भाव', intro: 'सभी 12 भाव — उनकी राशि, स्वामी की स्थिति, स्थित ग्रह, दृष्टियाँ और भाव बल।' },
  rashis: { label: 'राशियाँ', intro: 'पहले लग्न, चंद्र और सूर्य राशि, फिर हर वह राशि जिसमें कोई ग्रह है।' },
  strength: { label: 'बल', intro: 'ग्रहों को षड्बल अनुपात से क्रम दिया गया है, उसके बाद भाव बल।' },
  transit: { label: 'गोचर', intro: 'आज ग्रह कहाँ हैं — आपके लग्न और जन्म चंद्र से, शास्त्रीय गोचर और वेध नियमों के साथ।' },
  dasha: { label: 'दशा', intro: 'इस कुंडली के लिए विंशोत्तरी दशा डेटा उपलब्ध नहीं है।' },
}

export const HUB_PROFILE_HI: Record<string, string> = {
  balanced: 'संतुलित',
  'top-heavy': 'शीर्ष-भारी',
  strained: 'तनावग्रस्त',
}

export const HUB_BAND_HI: Record<string, string> = {
  excellent: 'उत्कृष्ट',
  strong: 'प्रबल',
  average: 'औसत',
  weak: 'निर्बल',
}

export const HUB_AREA_STRENGTH_HI: Record<string, string> = {
  high: 'अधिक',
  medium: 'मध्यम',
  low: 'कम',
  quiet: 'शांत',
}

export const HUB_SATURN_FROM_MOON_HI: Record<number, { label: string; text: string }> = {
  12: { label: 'साढ़े साती — आरंभिक चरण', text: 'चंद्र से बारहवें भाव में शनि: खर्च, नींद और पुरानी व्यवस्थाओं को छोड़ना।' },
  1: { label: 'साढ़े साती — शिखर चरण', text: 'जन्म चंद्र पर शनि: भावनात्मक दबाव, ज़िम्मेदारी और परिपक्वता की परीक्षा।' },
  2: { label: 'साढ़े साती — अंतिम चरण', text: 'चंद्र से दूसरे भाव में शनि: परिवार, धन और वाणी का पुनर्गठन।' },
  4: { label: 'कंटक शनि', text: 'चंद्र से चौथे भाव में शनि: घर, मन की शांति और संपत्ति में धैर्य चाहिए।' },
  8: { label: 'अष्टम शनि', text: 'चंद्र से आठवें भाव में शनि: रूपांतरण और अचानक ढाँचागत बदलाव; दशा से पुष्टि करें।' },
}

/** Rashi profile summaries (RASHI_PROFILES[r].coreSummary / lordSummary). */
export const HUB_RASHI_HI: Record<Rashi, { core: string; lord: string }> = {
  1: {
    core: 'आरंभ करने वाली अग्नि: अचानक समस्या-समाधान, कर्म के झोंके, मार्गदर्शन की ज़रूरत और कुछ भी नया रचने का ताप।',
    lord: 'मंगल तार्किक आदेश की ऊर्जा है — दबाव में उत्कृष्ट, पर जहाँ संबंधों को भावनात्मक बारीकी चाहिए वहाँ कमज़ोर।',
  },
  2: {
    core: 'टिकाऊ संसाधनों का क्षेत्र — धन, वंश, संचय, ज़िद्दी धैर्य; ख़तरा होने पर उग्र।',
    lord: 'शुक्र भक्ति, साज-सज्जा/आत्म-मूल्य, ओज/पुनर्प्राप्ति है — और परिवार बनाम जीवनसाथी का स्वाभाविक घर्षण (वृषभ/तुला 6/8)।',
  },
  3: {
    core: 'संवाद के परिपथ, शौक, आस-पास का दिमाग़ — पहले गुरु की नकल, फिर नवाचार; विषयों को तीन गुना करता है।',
    lord: 'बुध को एक आधार ग्रह चाहिए, वह 3–12 वर्ष की आयु पर शासन करता है, विषयों को तीन गुना करता है और दादा-दादी के पालन का संकेत दे सकता है।',
  },
  4: {
    core: 'माँ-मन और रस का सागर — परिवेश को सोख लेता है; तर्क विफल; चंद्र से दसवाँ सच्ची इच्छा दिखाता है।',
    lord: 'चंद्र स्पंज है; दशाएँ सोखने वाले मन से होकर चलती हैं; बचपन के चंद्र की रक्षा करें और संगति शुद्ध रखें।',
  },
  5: {
    core: 'प्रतिष्ठा, नैतिकता, वंश और त्याग का सिंहासन — सूर्य दाता है; ईर्ष्या पतन है।',
    lord: 'सूर्यवंशी ढर्रे और सूर्य के आयु-चक्र (16/28/40…; त्याग 14/26/38…) फल तय करते हैं।',
  },
  6: {
    core: 'सेवक की कार्यविधि वाली राशि — अंतर्ज्ञान शून्य, बाल की खाल निकालना ऋण/रोग/शत्रु बनाता है; साफ़ मेज़ उपचार है।',
    lord: 'विश्लेषक बुध का शिखर — चुपचाप सेवा करें; व्याकरण की पहरेदारी और साथी पर मोल-भाव बंद करें।',
  },
  7: {
    core: 'कूटनीति और चुनाव — केवल सबकी जीत; तुला क्षेत्रों में ज़िद्दी प्रभुत्व पतन लाता है; सार्वजनिक छवि का भाव।',
    lord: 'शुक्र की कूटनीति; नीच सूर्य से अहं-टकराव; उच्च शनि धीरे निर्णय लेता है; प्रेम विवाह को छानबीन चाहिए।',
  },
  8: {
    core: 'गहरी स्मृति और छिपी जड़ें — असाध्य लगती समस्याएँ, दबी भावनाएँ, विपरीतों का चुंबक, बिना कमाया धन।',
    lord: 'मंगल–केतु सह-स्वामित्व: कर्म बनाम बिना सिर की चिंता — सिंह बनाम भौंकते कुत्ते का घर्षण; केतु के लिए फकीर सिद्धांत।',
  },
  9: {
    core: 'आस्था की छिपी अग्नि — परत-दर-परत ज्ञान, गुरु पर भरोसा, वामन जैसा विस्तार; वचन मायने रखते हैं; दूसरों के लिए पारस स्पर्श।',
    lord: 'गुरु/वामन: छोटी माँग → पूरे जीवन पर अधिकार; अधूरे वचन प्रगति रोक देते हैं; कफ/आस्था को कथा चाहिए।',
  },
  10: {
    core: 'धैर्य और बिना धन्यवाद वाला नींव का काम — मगरमच्छ जैसी पकड़ वाले लक्ष्य, धीमे स्थायी फल, कर्क के विपरीत सुख-विरोधी।',
    lord: 'शनि कड़ा शिक्षक है — साढ़े साती/शनि दशा में घबराएँ नहीं, शॉर्टकट न लें; पसीना और व्यवस्था उसे प्रसन्न करते हैं।',
  },
  11: {
    core: 'जुनून और संपर्कों की राशि — मना नहीं कर पाती, धूसर क्षेत्र के लाभ, गूढ़/अचानक फल; राहु वराह की तरह हर कीमत पर खोज।',
    lord: 'शास्त्रीय रूप से शनि; आधुनिक फलित परत राहु पर ज़ोर देती है — घूमते उतार-चढ़ाव, दिखावा, विस्तार, राहु से नौवें का हृदय-विदारक त्याग।',
  },
  12: {
    core: 'समर्पण का सागर — तर्क से ऊपर आस्था, अहं का विलय, नींद एक मापदंड, 10% दान, विश्वास की छलांग वाली दशाएँ।',
    lord: 'गुरु का सागर — उच्च शुक्र भक्ति के अंधकार में फलता है; उत्तर न मिलने पर बुध घबराता है; नींद की गुणवत्ता बारहवें भाव को आँकती है।',
  },
}

/** Planet-mix layer labels by layer id (planetInterpretationMix). */
export const HUB_LAYER_HI: Record<string, { label: string; source: string }> = {
  house_theme: { label: 'भाव {h} के विषय', source: 'भाव मार्गदर्शिका' },
  house_classical: { label: 'भाव {h} — शास्त्र', source: 'शास्त्रीय भाव' },
  planet_house_platform: { label: '{graha} भाव {h} में', source: 'ग्रह×भाव' },
  planet_house_classical: { label: '{graha} भाव {h} में — शास्त्र', source: 'शास्त्रीय ग्रह×भाव' },
  rashi_core: { label: '{rashi} राशि', source: 'राशि मार्गदर्शिका' },
  rashi_classical: { label: '{rashi} — शास्त्र', source: 'शास्त्रीय राशि' },
  rashi_in_house: { label: '{rashi} भाव {h} में', source: 'राशि×भाव' },
  sign_in_house: { label: 'भाव में राशि (भाव {h} · {rashi})', source: 'राशि×भाव तालिका' },
  planet_sign_platform: { label: '{graha} {rashi} में', source: 'ग्रह×राशि' },
  planet_sign_classical: { label: '{graha} {rashi} में — शास्त्र', source: 'शास्त्रीय ग्रह×राशि' },
  planet_sign_psych: { label: '{graha} {rashi} में — मनोवृत्ति', source: 'राशि फलादेश' },
  dignity: { label: 'गरिमा · {dignity}', source: 'गरिमा' },
  nakshatra: { label: '{nak} पद {pada}', source: 'नक्षत्र' },
  vakri_ast: { label: 'वक्री / अस्त', source: 'वक्री·अस्त' },
  lordship: { label: 'लग्नेश भाव {h} में', source: 'स्वामित्व' },
}

export const HUB_HI = {
  lordshipOwns: '{graha} इस लग्न से भाव {owns} का स्वामी',
  houseLabel: '{nth} भाव',
  insightSubtitleHouse: '{category} · {nth} भाव',
  action: 'उपाय',
  yogaSubtitle: '{category} योग · {strength}',
  formation: 'निर्माण',
  houses: 'भाव',
  multiVakri: 'कई वक्री ग्रह',
  planetTitle: '{graha} {rashi} में',
  planetSubtitle: '{nth} भाव · {nak} पद {pada} · {dignity}',
  planetFallback: '{graha} {nth} भाव में है।',
  retro: 'वक्री',
  combust: 'अस्त',
  gandanta: 'गंडांत',
  houseTitle: '{nth} भाव — {english}',
  houseSubtitle: '{sanskrit} · {rashi}',
  houseSubtitleLord: '{sanskrit} · {rashi} · स्वामी {lord}',
  meaning: 'अर्थ',
  rashiOnHouse: 'इस भाव पर {rashi}',
  houseLord: 'भाव स्वामी',
  houseLordText: '{lord} इस भाव का स्वामी है और {nth} भाव में बैठा है।',
  occupantHere: '{graha} यहाँ',
  aspectFrom: '{graha} की दृष्टि {nth} भाव से',
  classical: 'शास्त्रीय',
  bhavaBala: 'भाव बल',
  rupas: '{n} रूप',
  lagna: 'लग्न',
  moonSign: 'चंद्र राशि',
  sunSign: 'सूर्य राशि',
  rashiSubtitle: '{nth} भाव · स्वामी {lord}',
  nature: 'स्वभाव',
  lord: 'स्वामी',
  inYourHouse: 'आपके {nth} भाव में',
  planetInRashi: '{graha} {rashi} में',
  specialRule: 'विशेष नियम',
  remedy: 'उपाय',
  strengthTitle: '{graha} — {band}',
  strengthSubtitle: 'षड्बल {total} / {required} रूप · अनुपात {ratio}',
  strengthStrong: '{graha} के पास अपने कारकत्व भरोसे से देने लायक बल है।',
  strengthWeak: '{graha} अपने आवश्यक बल से कम है; उसके फलों को सहारा चाहिए।',
  shash: '{n} षष्ट्यंश',
  sthana: 'स्थान (स्थिति)',
  dig: 'दिक् (दिशा)',
  kala: 'काल (समय)',
  chesta: 'चेष्टा (गति)',
  naisargika: 'नैसर्गिक (स्वाभाविक)',
  drik: 'दृक् (दृष्टि)',
  strongest: 'सबसे प्रबल',
  weakest: 'सबसे निर्बल',
  bhavaBalaTitle: 'भाव बल (भावों की शक्ति)',
  bhavaBalaSubtitle: 'सबसे प्रबल {strong} · सबसे निर्बल {weak}',
  bhavaBalaSummary: '{strongNth} भाव ({strongThemes}) के जीवन-क्षेत्र सबसे सहज चलते हैं; {weakNth} भाव ({weakThemes}) को सबसे अधिक सचेत प्रयास चाहिए।',
  bhavaBalaPoint: '{n} रूप — {english}',
  strengthIntroProfile: 'कुल बल प्रोफ़ाइल: {profile}। ग्रहों को षड्बल अनुपात से क्रम दिया गया है।',
  transitLoading: 'वर्तमान ग्रह स्थितियाँ लोड हो रही हैं…',
  transitUnavailable: 'वर्तमान गोचर स्थितियाँ उपलब्ध नहीं हैं।',
  saturn: 'शनि',
  gocharGood: 'चंद्र से अनुकूल गोचर ({nth} भाव)।',
  gocharVedha: 'अनुकूल स्थिति पर चंद्र से {nth} भाव में स्थित {graha} का वेध।',
  gocharBad: 'चंद्र से अनुकूल गोचर भाव नहीं ({nth})।',
  transitTitle: '{graha} {rashi} में गोचर',
  retroMark: ' (व)',
  transitSubtitle: 'लग्न से {lagnaNth} · {moonPart}{nak} पद {pada}',
  fromMoonPart: 'चंद्र से {nth} · ',
  fromLagnaLabel: 'लग्न से — {nth} भाव',
  fromMoonLabel: 'चंद्र से — {nth} भाव',
  returnLabel: 'वापसी',
  returnText: '{graha} अपनी जन्म राशि में लौट आया है — उसका जन्मकालीन वादा फिर सक्रिय है।',
  retroText: 'नए विषय शुरू करने के बजाय {nth} भाव के विषयों की समीक्षा करें और उन पर लौटें।',
  whatHappens: 'क्या होता है',
  watch: 'सावधानी',
  balance: 'संतुलन',
  balanceText: '{fav}% अनुकूल · {neu}% सम · {cha}% चुनौतीपूर्ण',
  note: 'टिप्पणी',
  mdLord: 'महादशा स्वामी — {graha}',
  adLord: 'अंतर्दशा स्वामी — {graha}',
  rules: '{list} का स्वामी',
  activates: '{nth} भाव सक्रिय',
  vargottama: 'वर्गोत्तम',
  vargottamaText: '{graha} D1 और D9 में एक ही राशि में है — फल भरोसेमंद हैं।',
  navamsha: 'नवांश',
  navamshaText: 'D9 में {dignity}।',
  shadbala: 'षड्बल',
  ratio: 'अनुपात {ratio}',
  lifeAreas: 'अभी सक्रिय जीवन-क्षेत्र',
  upcoming: 'आने वाली अवधियाँ',
  upcomingSummary: 'अगली अंतर्दशाएँ और उनके स्वामी जिन भावों में बैठे हैं।',
  subPeriod: '{graha} की उप-अवधि।',
}

/** Nakshatra detail rows in the planet-mix layer (nakshatraAdvanced tables). */
export const NAK_BODY_PART_HI: readonly string[] = [
  'घुटने', 'जाँघ की हड्डी/श्रोणि', 'कूल्हे', 'माथा/आँखें', 'आँखें/भौंहें',
  'आँखें/मस्तिष्क', 'कान/गला', 'मुख/चेहरा', 'कान/ठोड़ी', 'नाक/होंठ',
  'दायाँ हाथ', 'बायाँ हाथ', 'हाथ/उँगलियाँ', 'गर्दन', 'गर्दन/छाती',
  'छाती/पेट', 'पेट/स्तन', 'गर्दन/दायाँ भाग', 'कूल्हे/जाँघें', 'पीठ/जाँघें',
  'जाँघें/घुटने', 'कान/घुटने', 'टखने', 'निचले पैर/टखने', 'बाईं जाँघ/उदर',
  'पसलियाँ/बगल', 'पैर/उदर',
]
export const NAK_NATURE_HI: Record<string, string> = {
  Chara: 'चर', Sthira: 'स्थिर', Mridu: 'मृदु', Tikshna: 'तीक्ष्ण', Ugra: 'उग्र', Mixed: 'मिश्र',
}
export const NAK_GANA_HI: Record<string, string> = { Deva: 'देव', Manushya: 'मनुष्य', Rakshasa: 'राक्षस' }
export const NAK_NADI_HI: Record<string, string> = { Vata: 'वात', Pitta: 'पित्त', Kapha: 'कफ' }
export const NAK_ROW_HI = {
  meta: 'स्वामी {lord} · देवता {deity} · {gana} गण · {nadi} नाड़ी · {symbol}',
  shakti: 'शक्ति: {v}',
  nature: 'स्वभाव: {v}',
  body: 'शरीर: {v}',
  ownsLord: '{list} के स्वामी के रूप में, भाव {h} के फल उन भावों को भी रंगते हैं।',
}
