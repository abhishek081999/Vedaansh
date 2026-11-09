// Hindi for src/lib/engine/milanDeepAnalysis.ts

import type { MilanDeepResult } from '@/lib/engine/milanDeepAnalysis'
import type { EngineLang } from '@/lib/engine/lang'

export const MDA_HI = {
  houses: {
    2: 'कुटुंब',
    4: 'गृह सुख',
    5: 'प्रेम / संतान',
    7: 'विवाह / साथी',
    8: 'दीर्घायु / गहरा परिवर्तन',
    9: 'भाग्य / धर्म',
    12: 'अंतरंगता / व्यय',
  } as Record<number, string>,
  ord: (n: number) => (n === 1 ? 'पहला' : n === 2 ? 'दूसरा' : n === 3 ? 'तीसरा' : `${n}वां`),
  aspects: {
    1: 'युति / समान राशि',
    2: '2/12 अलग (कुछ तनाव)',
    3: '3/11 अलग (कुछ सहारा)',
    4: '4/10 अलग (तटस्थ)',
    5: 'त्रिकोण (5वां)',
    6: '6/8 अलग (घर्षण)',
    7: 'विपरीत (7वां)',
    8: '8/6 अलग (घर्षण)',
    9: 'त्रिकोण (9वां)',
    10: '10/4 अलग (तटस्थ)',
    11: '11/3 अलग (कुछ सहारा)',
    12: '12/2 अलग (कुछ तनाव)',
  } as Record<number, string>,
  aspectFallback: (rel: number) => `${rel}वां संबंध`,
  chemistry: {
    strong: 'मजबूत शुक्र–मंगल रसायन',
    workable: 'प्रयास से कार्य करने योग्य रसायन',
    cultivate: 'रसायन संवारने की ज़रूरत',
  },
  venusMarsOwn: (name: string) => `${name} शुक्र–मंगल (स्वयं की कुंडली)`,
  findings: {
    've-ma-attraction': { title: 'अंतर्चार्ट शुक्र–मंगल आकर्षण' },
    've-ma-weak': {
      title: 'मन्द शुक्र–मंगल कड़ी',
      detail:
        'प्रेम और वासना के ग्रह दोनों कुंडलियों में शास्त्रीय अनुकूल 1/5/7/9 लिंक नहीं बनाते। साझा रीतियों, समय और धैर्य से आकर्षण बढ़ सकता है।',
    },
    'house-match': {
      title: 'भाव कठिन प्रभाव संतुलन',
      detail:
        'मुख्य विवाह भावों में मेल दिखता है (या दोनों में साफ), जो जातक परिजात के अनुसार अनुकूल माना जाता है।',
    },
    'house-mismatch': {
      title: 'असमान भाव कठिन प्रभाव',
      detail: (houses: string) =>
        `असमान तनाव: ${houses}। इन विषयों पर खुलकर बात, साझा उपचार या परामर्श मदद कर सकता है।`,
    },
    'd9-moon': { title: 'नवांश (D9) चंद्र कड़ी' },
    'd1-lagna': { title: 'D1 लग्न संबंध' },
    'mars-tara': { title: 'मंगल नक्षत्र तारा' },
    'vaidhavya-vidhur': { title: 'साथी दीर्घायु और कल्याण योग (वैधव्य / विधुर)' },
    'varnamala': { title: 'जन्म-नाम वर्णमाला' },
    'dasha-pair': { title: 'दशा-जोड़ी समय' },
  } as Record<string, { title: string; detail?: string | ((...a: string[]) => string) }>,
  houseNotes: {
    both: (ord: string, name: string) =>
      `दोनों कुंडलियों में ${ord} भाव (${name}) पर तनाव; जातक परिजात के अनुसार साझा चुनौती पास ला सकती है।`,
    onlyA: (nameA: string, ord: string, name: string, nameB: string) =>
      `केवल ${nameA} की कुंडली में ${ord} भाव (${name}) पर तनाव; ${nameB} को वही दबाव महसूस नहीं हो सकता — खुली बात मदद करती है।`,
    onlyB: (nameB: string, ord: string, name: string, nameA: string) =>
      `केवल ${nameB} की कुंडली में ${ord} भाव (${name}) पर तनाव; ${nameA} को वही दबाव महसूस नहीं हो सकता — खुली बात मदद करती है।`,
    neither: (ord: string, name: string) =>
      `किसी कुंडली में ${ord} भाव पर महत्वपूर्ण तनाव नहीं — ${name} के लिए साफ क्षेत्र।`,
  },
  rotation: {
    readFor: (forPerson: string, readFor: string) =>
      `${forPerson} की कुंडली सप्तम को लग्न मानकर — ${readFor} विवाह कैसा अनुभव कर सकता/सकती है।`,
    clear: 'इस दृष्टि में 4, 5, 7 या 12 पर महत्वपूर्ण तनाव नहीं।',
    strain: (label: string, h: number, fromPartner: number) =>
      `${label} (जन्म भाव ${h}, साथी दृष्टि से भाव ${fromPartner}) में कुछ तनाव।`,
    married: 'वैवाहिक जीवन (7)',
    romance: 'प्रेम / संतान (5)',
    domestic: 'गृह सुख (4)',
    intimacy: 'अंतरंगता (12)',
  },
  d9Moon: {
    supportive: 'विवाह के गहरे मूल्यों में अनुकूल परत',
    caution: 'विवाह के गहरे मूल्यों में कुछ घर्षण',
    mixed: 'मिश्रित नवांश चंद्र कड़ी',
    line: (a: string, b: string, aspect: string, tail: string) =>
      `D9 चंद्र ${a} ↔ ${b} (${aspect}) — ${tail}।`,
  },
  marsTara: {
    unavailable: 'मंगल नक्षत्र डेटा अनुपलब्ध।',
    caution: 'वासना अभिव्यक्ति में कुछ घर्षण',
    support: 'दोनों मंगल नक्षत्रों के बीच अनुकूल वासना लय',
    detail: (fromBoy: string, fromGirl: string, tail: string) =>
      `मंगल तारा ${fromBoy} / ${fromGirl}: ${tail}।`,
  },
  d1: {
    incomplete: 'D1 लग्न डेटा अधूरी।',
    summary: (a: string, b: string, aspect: string) =>
      `D1 लग्न ${a} ↔ ${b} (${aspect})। सप्तमेश और शुक्र–मंगल अक्सर लग्न जोड़ी से अधिक मायने रखते हैं।`,
  },
  stage: {
    full: 'पूरी तीन-स्तरीय पढ़ाई उपयोगी',
    strong: 'मजबूत द्वितीय–तृतीय स्तर सहायता',
    care: 'द्वितीय–तृतीय स्तर: सावधानी के बिंदु',
  },
  overall: {
    workable: (chem: string) =>
      `${chem}। द्वितीय चरण के भाव और तृतीय चरण का ग्रह रसायन व्यापक रूप से कार्य करने योग्य।`,
    careful: (chem: string) =>
      `${chem}। द्वितीय चरण के भाव और तृतीय चरण का ग्रह रसायन सावधान, अनहोड़ी पढ़ाई माँगता।`,
    strongSummary:
      'शुक्र–मंगल रसायन और भाव तनाव का संतुलन चंद्र-आधारित गुणों से परे मिलान को सहारा देता है।',
    careSummary:
      'ग्रह रसायन, साथी-कल्याण योग और/या असमान भाव तनाव धैर्य, अच्छा समय और यथार्थ अपेक्षाएँ माँगते हैं। गुण कुल अकेले पूरी कहानी नहीं बताता।',
    longevityAppend: (s: string) => ` साथी दीर्घायु/कल्याण योग: ${s}`,
  },
  priorities: [
    'अष्टकूट केवल पहला चरण है — गुण कुल के साथ नीचे के बिंदु पढ़ें।',
    'शुक्र–मंगल लिंक और मंगल नक्षत्र तारा (चरण 3) देखें।',
    'दोनों में 2, 4, 5, 7, 8, 9, 12 भावों का तनाव तुलना करें (जातक परिजात)।',
    'वैधव्य/विधुर योग साथ में पढ़ें — प्रवृत्ति है, भविष्यवाणी नहीं।',
    'सप्तम को लग्न मानकर साथी का अनुभव देखें।',
    'समय सोचते समय आने वाली महादशा जोड़ियाँ तुलना करें।',
    'वर्णमाला चंद्र पद ध्वनि पर — रोज़ का नाम नहीं।',
  ],
}

/** Legacy post-localize — prefers strings already built with lang=hi in the engine. */
export function localizeMilanDeep(result: MilanDeepResult, lang: EngineLang): MilanDeepResult {
  if (lang !== 'hi') return result
  return result
}
