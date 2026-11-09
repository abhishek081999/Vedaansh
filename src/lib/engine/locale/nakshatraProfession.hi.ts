// Hindi for nakshatraProfession.ts display strings.
// Career-field chips, hidden powers, diagnosis directions, planet skills,
// pada execution, indicator labels, and the formula summary are reused from
// nakshatraProfessionD10.hi.ts wherever the English source string matches.
// Gana, lord, and priority enums stay English.

import type { GrahaId, Rashi } from '@/types/astrology'
import {
  NP_DIRECTION_HI,
  NP_FIELD_HI,
  NP_HIDDEN_POWER_HI,
  NP_INDICATOR_LABEL_HI,
  NP_PADA_STYLE_HI,
  NP_SKILL_HI,
  NP_SUMMARY_HI,
} from '@/lib/engine/locale/nakshatraProfessionD10.hi'

export { NP_DIRECTION_HI, NP_FIELD_HI, NP_HIDDEN_POWER_HI, NP_INDICATOR_LABEL_HI, NP_PADA_STYLE_HI, NP_SKILL_HI, NP_SUMMARY_HI }

export interface ProfessionProseHi {
  coreMeaning: string
  workingStyle: string
  bottomLine: string
  pitfall: string
}

const DEVA_PITFALL = 'अति-आदर्शवाद (देव)'
const MANUSHYA_PITFALL = 'लालच (मनुष्य)'
const RAKSHASA_PITFALL = 'नियंत्रण की आसक्ति (राक्षस)'

/** Indexed 0–26, same order as NAKSHATRA_PROFESSIONS. hiddenPower is NP_HIDDEN_POWER_HI. */
export const PROFESSION_PROSE_HI: readonly ProfessionProseHi[] = [
  { coreMeaning: 'आरंभ, शुरुआत', workingStyle: 'तेज़, तत्काल कर्म', bottomLine: 'जो पहले कदम उठाए, वही जीतता है; सबसे तेज़ कर्म करने वाला सफल होता है', pitfall: DEVA_PITFALL },
  { coreMeaning: 'रूपांतरण, नियंत्रण, सहन', workingStyle: 'अत्यधिक दबाव में काम; दर्द को थामे रखना', bottomLine: 'उच्च दबाव वाले वातावरण में काम करना ही इसका क्षेत्र है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'काटना, शोधन, तीक्ष्ण निर्णय', workingStyle: 'द्वैत — सब या कुछ नहीं (आर या पार)', bottomLine: 'तीक्ष्ण काट से स्पष्टता आती है; अलगाव ही औज़ार है', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'वृद्धि, आकर्षण, सौंदर्य', workingStyle: 'हर चीज़ को सुंदर बनाता और गढ़ता है', bottomLine: 'मूल्य बनाना और बढ़ाना — धन का नक्षत्र', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'खोज, अन्वेषण, जिज्ञासा', workingStyle: 'लगातार खोज; खोज कभी खत्म नहीं होती', bottomLine: 'ऐसी खोज जो समाप्त नहीं होती; लक्ष्य हमेशा ऊँचे', pitfall: DEVA_PITFALL },
  { coreMeaning: 'पुनर्निर्माण के लिए विनाश, नवाचार', workingStyle: 'व्यवस्था तोड़ता है, फिर नया गढ़ता है', bottomLine: 'पहले अव्यवस्था, फिर बिलकुल नई रचना', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'पुनर्स्थापना, मूल की ओर लौटना', workingStyle: 'दोहराव, फिर सुधार, फिर दोहराव का चक्र', bottomLine: 'सिद्ध करने में वर्ष लगते हैं — अंत में उत्कृष्ट रचना', pitfall: DEVA_PITFALL },
  { coreMeaning: 'पोषण, मौन सहारा', workingStyle: 'चुपचाप सहारा-तंत्र बनाता है', bottomLine: 'अदृश्य रीढ़, जो सब कुछ थामे रखती है', pitfall: DEVA_PITFALL },
  { coreMeaning: 'बंधन, अदृश्य नियंत्रण', workingStyle: 'अदृश्य ढंग से बाँधता और प्रभावित करता है', bottomLine: 'लोगों से काम कराना, बिना उन्हें पता चले', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'विरासत, राजसी अधिकार', workingStyle: 'विरासत में मिली शक्ति को आगे बढ़ाता और फैलाता है', bottomLine: 'पहले से आई शक्ति को आगे ले जाना और बढ़ाना', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'आनंद, आकर्षण, मोहक स्वभाव', workingStyle: 'अपने आकर्षण से खींचता है', bottomLine: 'करियर पूरी तरह व्यक्तिगत आकर्षण पर टिका होता है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'समझौता, ढाँचा, टिकाऊपन', workingStyle: 'व्यवस्थित, निरंतर, अनुशासित', bottomLine: 'चमक से अधिक टिकाऊपन; निरंतरता ही महाशक्ति है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'हाथों से कौशल, सूक्ष्मता', workingStyle: 'हाथ से काम; आजीविका हाथों से', bottomLine: 'कमाई उसी से होती है जो हाथ कर सकते हैं', pitfall: DEVA_PITFALL },
  { coreMeaning: 'सुंदर संरचनाएँ गढ़ना', workingStyle: 'सौंदर्य और सूक्ष्मता को जोड़ता है', bottomLine: 'ऐसी संरचनाएँ जो उपयोगी भी हों और सुंदर भी', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'स्वतंत्रता और लचीलापन', workingStyle: 'स्वतंत्रता में सबसे अच्छा काम; आसानी से ढल जाता है', bottomLine: 'जहाँ स्वतंत्रता है, वहीं वृद्धि है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'लक्ष्य, मंज़िल, गंतव्य', workingStyle: 'लक्ष्य पर आसक्त एकाग्रता', bottomLine: 'एक बिंदु पर आसक्त ध्यान; लक्ष्य ही सब कुछ है', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'मित्रता, नेटवर्क', workingStyle: 'पूरी तरह संबंधों से निर्माण', bottomLine: 'सफलता जान-पहचान से आती है; नेटवर्क ही सब कुछ है', pitfall: DEVA_PITFALL },
  { coreMeaning: 'श्रेष्ठता, वरिष्ठता, गोपनीयता', workingStyle: 'छिपाव से शक्ति', bottomLine: 'काम जितना गुप्त, शक्ति उतनी अधिक', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'मूल कारण, नींव, जड़ से उखाड़ना', workingStyle: 'समझने के लिए चीज़ों को जड़ तक तोड़ता है', bottomLine: 'समझने के लिए तोड़ना पड़ता है; फिर जड़ से पुनर्निर्माण', pitfall: RAKSHASA_PITFALL },
  { coreMeaning: 'मनाने से विजय', workingStyle: 'लगातार मनाना; हार नहीं मानता', bottomLine: 'सफलता मनाने की क्षमता है; देने से पहले दृष्टि बेचता है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'अनुशासन से स्थायी विजय', workingStyle: 'निरंतर, अनुशासित, दीर्घकालिक प्रतिबद्धता', bottomLine: 'नौकरी कभी न बदलें — टिके रहना ही रणनीति है; छोड़ना सबसे बड़ी भूल', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'सुनकर सीखना', workingStyle: 'गहराई से सुनकर ज्ञान सोखता है', bottomLine: 'गहराई से सुनना ज़रूरी है; ज्ञान और सफलता कानों से आती है', pitfall: DEVA_PITFALL },
  { coreMeaning: 'लय, समय, धन', workingStyle: 'धन सही समय से आता है', bottomLine: 'सही समय ही धन है; समय ही एकमात्र निर्णायक है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'एकांत से उपचार', workingStyle: 'अकेले काम; खोज एकांत में होती है', bottomLine: 'जितना एकांत, उतनी खोज; एकांत ही कार्यस्थल है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'चरम रूपांतरण', workingStyle: 'छलाँग के लिए चीज़ों को चरम तक ले जाता है', bottomLine: 'सच्ची छलाँग केवल चरम तक जाकर ही संभव है', pitfall: MANUSHYA_PITFALL },
  { coreMeaning: 'स्थिरता से गहराई', workingStyle: 'टिकी स्थिरता से गहरी महारत', bottomLine: 'सच्ची गहराई के बिना सफलता नहीं; महारत ही सब कुछ है', pitfall: DEVA_PITFALL },
  { coreMeaning: 'पूर्णता, मार्गदर्शन', workingStyle: 'मार्गदर्शन देकर और लेकर आगे बढ़ता है', bottomLine: 'करियर मार्गदर्शन से बढ़ता है — देकर भी और लेकर भी', pitfall: DEVA_PITFALL },
]

export function careerFieldsHi(fields: readonly string[]): string[] {
  return fields.map(f => NP_FIELD_HI[f] ?? f)
}

export interface GroupTextHi {
  label: string
  coreFunction: string
  bestEnvironments: string
}

export const GROUP_TEXT_HI: Record<string, GroupTextHi> = {
  starters: { label: 'आरंभकर्ता', coreFunction: 'आरंभ करना, शुरू करना, नई चीज़ें खोलना', bestEnvironments: 'स्टार्टअप, आपात सेवाएँ, नई परियोजनाएँ' },
  builders: { label: 'निर्माता', coreFunction: 'रचना, निर्माण, दीर्घकालिक टिकाव', bestEnvironments: 'वित्त, प्रशासन, निर्माण, दीर्घकालिक कॉर्पोरेट' },
  analyzers: { label: 'विश्लेषक', coreFunction: 'शोध, अन्वेषण, समय की सटीकता', bestEnvironments: 'शोध, बिक्री, संचालन, संगीत' },
  destroyers: { label: 'विघटनकर्ता', coreFunction: 'तोड़ना, विघटित करना, नया गढ़ना', bestEnvironments: 'आईटी, शोध, नवाचार प्रयोगशालाएँ, ध्वंस-कार्य' },
  controllers: { label: 'नियंत्रक', coreFunction: 'नियंत्रण, प्रभुत्व, प्रशासन', bestEnvironments: 'गुप्तचर सेवा, राजनीति, वरिष्ठ प्रबंधन' },
  networkers: { label: 'संबंध-निर्माता', coreFunction: 'जोड़ना, सहयोग, संबंध बनाना', bestEnvironments: 'मानव संसाधन, कूटनीति, व्यापार विकास' },
  performers: { label: 'प्रदर्शनकर्ता', coreFunction: 'मनाना, प्रदर्शन, चरम से रूपांतरण', bestEnvironments: 'मनोरंजन, मार्केटिंग, दर्शन' },
  strategists: { label: 'रणनीतिकार', coreFunction: 'आसक्त योजना, सहन, गहरी महारत', bestEnvironments: 'राजनीति, उच्च-दबाव प्रशासन, गहन परामर्श' },
  listeners: { label: 'श्रोता', coreFunction: 'सोखना, सीखना, सुनकर पुनर्स्थापना', bestEnvironments: 'मीडिया, अध्यापन, सलाह, नीति' },
}

export const GANA_TEXT_HI = {
  Deva: {
    theme: 'वृद्धि और विस्तार; तंत्र-निर्माण',
    strength: 'तंत्र बनाना और फैलाना; अध्यापन; सलाह',
    pitfall: 'अति-आदर्शवाद',
    pitfallDamage: 'अवास्तविक मानदंड तय करता है; व्यावहारिक पकड़ खोता है; आसानी से निराश होता है',
    solution: 'अपेक्षाओं को ज़मीन पर लाएँ; व्यावहारिक अपूर्णता स्वीकार करें',
  },
  Manushya: {
    theme: 'व्यावहारिक, व्यापार और निष्पादन',
    strength: 'वाणिज्य, मीडिया, प्रबंधन, निष्पादन',
    pitfall: 'लालच',
    pitfallDamage: 'बहुत पतला बिखर जाता है; सब कुछ दौड़ता है; एक मार्ग पर टिक नहीं पाता',
    solution: 'एक मुख्य मार्ग चुनें; चौड़ाई से पहले गहराई',
  },
  Rakshasa: {
    theme: 'शक्ति और नियंत्रण',
    strength: 'रणनीति, बुद्धि, रूपांतरण, राजनीति',
    pitfall: 'नियंत्रण की आसक्ति',
    pitfallDamage: 'सहकर्मियों को दूर करता है; सूक्ष्म नियंत्रण; विषैला वातावरण बनाता है',
    solution: 'जिम्मेदारी सौंपना सीखें; प्रक्रिया पर भरोसा करें; नियंत्रण छोड़ें',
  },
} as const

export const PADA_TEXT_HI: Record<Rashi, { energy: string; exampleProfessions: string }> = {
  1: { energy: 'कर्म, जोखिम, स्टार्टअप ऊर्जा', exampleProfessions: 'आपात चिकित्सक, उद्यमी, सैन्य अधिकारी' },
  2: { energy: 'वित्त, मूल्य, संपत्ति, उपचार', exampleProfessions: 'धन प्रबंधक, उपचारक, संपत्ति निर्माता' },
  3: { energy: 'संवाद, विचार, मीडिया', exampleProfessions: 'स्टार्टअप विपणक, ब्रांड विशेषज्ञ, संवादक' },
  4: { energy: 'देखभाल, जन, आतिथ्य, पोषण', exampleProfessions: 'चिकित्सक-परामर्शदाता, देखभालकर्ता, आतिथ्य पेशेवर' },
  5: { energy: 'अधिकार, नेतृत्व, आदेश', exampleProfessions: 'नेता, निर्देशक, सार्वजनिक अधिकार की भूमिका' },
  6: { energy: 'विश्लेषण, प्रक्रिया, सूक्ष्मता', exampleProfessions: 'विश्लेषक, प्रक्रिया अभियंता, गुणवत्ता नियंत्रक' },
  7: { energy: 'व्यापार, मोलभाव, साझेदारी', exampleProfessions: 'व्यापारी, मोलभाव करने वाला, मध्यस्थ' },
  8: { energy: 'शोध, गोपनीयता, गहराई', exampleProfessions: 'शोधकर्ता, गुप्तचर अधिकारी, अन्वेषक' },
  9: { energy: 'अध्यापन, विधि, यात्रा, दर्शन', exampleProfessions: 'शिक्षक, विधिवेत्ता, यात्री, दार्शनिक' },
  10: { energy: 'प्रशासन, ढाँचा, शासन', exampleProfessions: 'प्रशासक, नौकरशाह, प्रबंधक' },
  11: { energy: 'तकनीक, नवाचार, तंत्र', exampleProfessions: 'तकनीकी पेशेवर, नवप्रवर्तक, तंत्र-डिज़ाइनर' },
  12: { energy: 'सृजन, आध्यात्म, कल्पना', exampleProfessions: 'कलाकार, आध्यात्मिक मार्गदर्शक, सृजनशील पेशेवर' },
}

export interface AshwiniPadaHi {
  combo: string
  expression: string
  roles: string
}

export const ASHWINI_PADA_HI: readonly AshwiniPadaHi[] = [
  { combo: 'अश्विनी (गति) + मेष (कर्म)', expression: 'आपात कर्म की भूमिकाएँ', roles: 'आपात चिकित्सक, आपदा प्रबंधन, प्रथम प्रतिक्रियाकर्ता' },
  { combo: 'अश्विनी (उपचार) + वृषभ (संपत्ति और मूल्य)', expression: 'उपचार और संपत्ति-निर्माण', roles: 'अपना चिकित्सालय रखने वाला उपचारक, स्वास्थ्य-संपत्ति प्रबंधन' },
  { combo: 'अश्विनी (आरंभ) + मिथुन (विचार)', expression: 'तेज़ विचार-सृजन', roles: 'स्टार्टअप संस्थापक, मार्केटिंग रणनीतिकार, ब्रांड विशेषज्ञ' },
  { combo: 'अश्विनी (देखभाल) + कर्क (पोषण)', expression: 'भावनात्मक उपचार और देखभाल', roles: 'चिकित्सक-परामर्शदाता, भावनात्मक देखभालकर्ता, पोषण करने वाला चिकित्सक' },
]

export const ARIES_PADA_HI: Record<number, { base: string; ariesAdds: string; expression: string }> = {
  0: { base: 'गति, आरंभ', ariesAdds: 'आक्रामक कर्म', expression: 'आपात चिकित्सक, आपदा प्रबंधन, तेज़ पहल करने वाला' },
  3: { base: 'वृद्धि, मूल्य का गुणन', ariesAdds: 'आक्रामक वृद्धि', expression: 'व्यापार की आक्रामक वृद्धि, समय से पहले पदोन्नति (अर्धसैनिक बल सहित)' },
  6: { base: 'पुनर्स्थापना, सुधार', ariesAdds: 'कर्म-केंद्रित परामर्श', expression: 'संस्था को जल्दी पुनः आरंभ और पुनर्निर्माण करने वाला परामर्शदाता' },
  9: { base: 'विरासत, अधिकार', ariesAdds: 'आक्रामक अधिकार', expression: 'राजनीति, दृढ़ अधिकार वाली भूमिकाएँ' },
  12: { base: 'हाथों का कौशल', ariesAdds: 'कौशल के साथ तेज़ कर्म', expression: 'गति वाला कुशल कारीगर, कर्म-केंद्रित डिज़ाइनर' },
  15: { base: 'आसक्त लक्ष्य', ariesAdds: 'आक्रामक लक्ष्य-पीछा', expression: 'उच्च-प्रदर्शन बिक्री, आक्रामक राजनीति' },
}

export interface PlanetSkillTextHi {
  skill: string
  positive: string
  ifWeak: string
}

export const PLANET_SKILL_TEXT_HI: Record<GrahaId, PlanetSkillTextHi> = {
  Su: { skill: NP_SKILL_HI.Su, positive: 'नेतृत्व, सरकार, दिशा', ifWeak: 'अधिकार नहीं संभाल पाता; पद छूटते हैं' },
  Mo: { skill: NP_SKILL_HI.Mo, positive: 'जन-आकर्षण, जनता से जुड़ी भूमिकाएँ', ifWeak: 'असंतुष्ट; भावनात्मक पूर्ति नहीं' },
  Ma: { skill: NP_SKILL_HI.Ma, positive: 'निष्पादन, सैन्य सूक्ष्मता, खेल', ifWeak: 'कर नहीं पाता; गति रुक जाती है' },
  Me: { skill: NP_SKILL_HI.Me, positive: 'विश्लेषण, लेखन, तकनीक, व्यापार', ifWeak: 'कमज़ोर संवाद; अवसर चूकते हैं' },
  Ju: { skill: NP_SKILL_HI.Ju, positive: 'अध्यापन, सलाह, दर्शन', ifWeak: 'कमज़ोर विवेक; भटके निर्णय' },
  Ve: { skill: NP_SKILL_HI.Ve, positive: 'कला, विलास, मनोरंजन', ifWeak: 'परिणाम अनाकर्षक; आकर्षण कम' },
  Sa: { skill: NP_SKILL_HI.Sa, positive: 'प्रशासन, दीर्घकालिक निर्माण', ifWeak: 'ढाँचा नहीं; अव्यवस्थित काम' },
  Ra: { skill: NP_SKILL_HI.Ra, positive: 'तकनीक, विदेश, अपरंपरागत मार्ग', ifWeak: 'अस्थिर; डगमगाता अपरंपरागत मार्ग' },
  Ke: { skill: NP_SKILL_HI.Ke, positive: 'शोध, आध्यात्म, गहरी एकाग्रता', ifWeak: 'छोड़ नहीं पाता; गहराई बिखरती है' },
  Ur: { skill: '', positive: '', ifWeak: '' },
  Ne: { skill: '', positive: '', ifWeak: '' },
  Pl: { skill: '', positive: '', ifWeak: '' },
}

export const COMBO_SKILL_HI: Record<string, string> = {
  Authority: 'अधिकार',
  'Public emotion': 'जन-भावना',
  'Action, Drive': 'कर्म, प्रेरणा',
  Intelligence: 'बुद्धि',
  Wisdom: 'ज्ञान',
  Attraction: 'आकर्षण',
  Structure: 'संरचना',
  Innovation: 'नवाचार',
  Detachment: 'वैराग्य',
}

/** Notes keyed by `${grahaId}:${nakshatraIndex}`. Expressions come from NP_FIELD_HI. */
export const COMBO_NOTES_HI: Record<string, string> = {
  'Su:9': 'सरकार और कॉर्पोरेट अधिकार',
  'Su:20': 'दीर्घकालिक सरकारी भूमिकाएँ',
  'Su:15': 'रणनीतिक अधिकार',
  'Su:21': 'संवाद का अधिकार',
  'Su:8': 'गुप्त अधिकार',
  'Mo:3': 'मूल्य और देखभाल एक साथ',
  'Mo:14': 'स्वतंत्र वाणिज्य',
  'Mo:23': 'एकांत में उपचार',
  'Mo:16': 'संबंधों से चलने वाला काम',
  'Ma:2': 'तीक्ष्ण काटने वाला कर्म',
  'Ma:22': 'समयबद्ध कर्म',
  'Ma:18': 'जड़ तक जाने वाला कर्म',
  'Ma:17': 'बुद्धिमान गुप्त कर्म',
  'Me:0': 'तेज़ बुद्धिमान आरंभ',
  'Me:5': 'तकनीकी बुद्धि',
  'Me:12': 'हाथों की बुद्धि',
  'Me:21': 'वाचिक बुद्धि',
  'Ju:6': 'पुनर्स्थापक ज्ञान',
  'Ju:15': 'रणनीतिक ज्ञान',
  'Ju:25': 'गहरी स्थिर बुद्धि',
  'Ve:3': 'सौंदर्य और मूल्य',
  'Ve:10': 'शुद्ध आकर्षण की अभिव्यक्ति',
  'Ve:13': 'सौंदर्य की सूक्ष्मता',
  'Sa:20': 'संरचित अनुशासन',
  'Sa:23': 'संरचित एकांत',
  'Sa:16': 'नेटवर्क वाली संरचना',
  'Ra:5': 'विघटनकारी नवाचार',
  'Ra:14': 'स्वतंत्र वैश्विक नवाचार',
  'Ra:23': 'भविष्य की तकनीक का नवाचार',
  'Ke:18': 'अलग रहकर गहरी खोज',
  'Ke:0': 'वैराग्य से उपचार',
  'Ke:26': 'मार्गदर्शन से पूर्णता',
}

export const LORD_MEANING_HI: Record<GrahaId, string> = {
  Ke: 'आध्यात्मिक दिशा, मुख्यधारा से वैराग्य',
  Ve: 'आकर्षण, विलास, करियर में आनंद',
  Su: 'अधिकार, सरकार, व्यवस्थित शक्ति',
  Mo: 'जनता, भावना, जन-संपर्क',
  Ma: 'कर्म, इंजीनियरिंग, लय',
  Ra: 'नवाचार, तकनीक, उलट-फेर',
  Ju: 'ज्ञान, अध्यापन, दर्शन',
  Sa: 'संरचना, अनुशासन, दीर्घकालिक महारत',
  Me: 'बुद्धि, संवाद, मार्गदर्शन',
  Ur: '', Ne: '', Pl: '',
}

export const INDICATOR_REVEALS_HI = {
  tenthLord: 'करियर का खाका — पेशे की पूरी रूपरेखा और दिशा',
  moon: 'संतोष, जुनून, भावनात्मक पूर्ति — क्या आनंद रहेगा?',
  rahu: 'अपरंपरागत पथ — अचानक उत्थान या अचानक पतन',
} as const

export const HOUSE_WHERE_HI = 'दशम भाव — सार्वजनिक करियर का क्षेत्र'

export const SKILL_FALLBACK_HI = 'कौशल'
