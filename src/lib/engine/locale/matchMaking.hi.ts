// Hindi for src/lib/engine/matchMaking.ts

import type { MatchMakingResult } from '@/lib/engine/matchMaking'
import type { EngineLang } from '@/lib/engine/lang'

export const MM_HI = {
  emptyAsc: 'इस मिलान पढ़ाई के लिए दोनों कुंडलियों में लग्न गणना ज़रूरी है।',
  steps: {
    mars: 'मंगल — शरीर और ऊर्जा',
    venus: 'शुक्र — स्नेह',
    sun: 'सूर्य — प्राण और अहंकार',
    moon: 'चंद्र — विचार और भावना',
    navamsha: 'नवांश — विवाह का फल',
    dasha: 'दशा — पूरक अवधियाँ',
    d1: 'राशि ओवरलैप — पहले भाव',
    d4: 'D4 — जिस घर में रहते हैं',
    axis: 'मेष–तुला — साझेदारी अक्ष',
  } as Record<string, string>,
  pillars: {
    bed: 'शारीरिक बंधन',
    mind: 'समझ',
    money: 'धन',
    others: 'परिवार और बाहरी प्रभाव',
  } as Record<string, string>,
  vargas: {
    D1: { name: 'D1 राशि', purpose: 'कुल ऊर्जा और एक कुंडली दूसरी पर भार' },
    D9: { name: 'D9 नवांश', purpose: 'विवाह का दीर्घकालिक फल और शारीरिक बंधन' },
    D3: { name: 'D3 द्रेक्काण', purpose: 'साझा सोच — मन मिले तो विवाह अन्य कठिनाइयाँ झेल सकता है' },
    D4: { name: 'D4 चतुर्थांश', purpose: 'गृह जीवन: वास्तव में जिस घर में रहते हैं' },
    D2: { name: 'D2 होरा', purpose: 'आपस का धन' },
    D7: { name: 'D7 सप्तांश', purpose: 'संतान और परिवार के बाहर का प्रभाव' },
    D10: { name: 'D10 दशांश', purpose: 'करियर — अलग पैटर्न अक्सर दोनों को काम करने देते हैं' },
    D16: { name: 'D16 षोडशांश', purpose: 'वाहन और सुख' },
    D27: { name: 'D27 भांश', purpose: 'छिपी ताकत और कमज़ोरी' },
  } as Record<string, { name: string; purpose: string }>,
  headlines: {
    weakD9: 'नवांश पढ़ाई हल्की ओर',
    lagnaMars: 'लग्न और मंगल दोनों अतिरिक्त सावधानी सुझाते हैं',
    supportive: 'यह जोड़ी अनुकूल संकेत दिखाती है',
    mixed: 'यह जोड़ी मिश्रित चित्र दिखाती है',
  },
  lockedDetail: 'चरण-दर-चरण क्रम, चार स्तंभ और दोनों कुंडलियों के लिए वर्ग चार्ट ओवरलैप।',
  notOnBoth: (name: string) => `${name} दोनों कुंडलियों पर नहीं।`,
  person1: 'जन 1',
  person2: 'जन 2',
  planetNA: (name: string, g: string) => `${name}: ${g} उपलब्ध नहीं`,
  planetLine: (name: string, g: string, sign: string, house: number, mark: number) =>
    `${name}: ${g} ${sign} में · भाव ${house} · ${mark}/5`,
  overlay: {
    sameTitle: (g: string, house: number) => `${g} पर ${g} · भाव ${house}`,
    sameDetail: (g: string, house: number) =>
      `दोनों कुंडलियों में ${g} भाव ${house} में। थीम स्थिर, दूसरी गुणवत्ता नहीं जोड़ती।`,
    fall: (a: string, gA: string, b: string, gB: string, house: number) =>
      `${a} का ${gA} ${b} के ${gB} पर भाव ${house} में पड़ता है।`,
    ketuOn: (g: string) => `केतु का अशांत प्रभाव ${g} पर पड़ता है।`,
    strain: (b: string, g: string) => `${b} का ${g} तनाव महसूस कर सकता है।`,
    genericTitle: (gA: string, gB: string) => `${gB} पर ${gA}`,
    houseSuffix: (house: number) => ` · भाव ${house}`,
  },
  dasha: {
    same: (g: string) =>
      `दोनों ${g} दशा में। अवधियाँ मेल खाती हैं — परिचित और सहज; समय कोई दूसरी गुणवत्ता नहीं जोड़ता।`,
    neutral: (a: string, b: string) => `${a} और ${b} — कोई विशेष शास्त्रीय पूरक या टकराव नहीं।`,
    unavailable: 'दोनों कुंडलियों के लिए विंशोत्तरी दशा उपलब्ध नहीं — अभी तुलना नहीं।',
  },
  mars: {
    gapHigh: (a: number, b: number) =>
      `शारीरिक ऊर्जा अलग (${a}/5 बनाम ${b}/5)। इच्छा एक स्तर पर नहीं — धैर्य और खुली बात मदद करती है।`,
    equal: (m: number) => `दोनों मंगल अंक ${m}/5। गर्मी मेल; कोई अलग शारीरिक लय नहीं।`,
    close: (a: number, b: number) => `मंगल अंक ${a}/5 और ${b}/5। समान शारीरिक लय के करीब।`,
  },
  venus: {
    gap: (a: number, b: number) => `स्नेह की शक्ति अलग (${a}/5 बनाम ${b}/5)। एक साथी शुक्र आसानी से अभिव्यक्त कर सकता है।`,
    close: (a: number, b: number) => `शुक्र अंक ${a}/5 और ${b}/5।`,
  },
  sun: {
    gap: (a: number, b: number) => `प्राण अलग (${a}/5 बनाम ${b}/5)। आत्मविश्वास और जीवन शक्ति एक स्तर पर नहीं।`,
    close: (a: number, b: number) => `सूर्य अंक ${a}/5 और ${b}/5।`,
  },
  navamsha: {
    d9Missing: 'D9 उपलब्ध नहीं',
    lagnaMissing: 'दोनों D9 लग्न उपलब्ध नहीं।',
    lagnaLine: (a: string, b: string, level: string, reason: string) => `D9 लग्न ${a} और ${b}: ${level}. ${reason}`,
    weak: (score: number) => `नवांश ${score}/10 — विवाह के दीर्घकालिक फल की ओर हल्की पढ़ाई; अन्य परतें संदर्भ देती हैं।`,
  },
  fourth: (a: string, b: string, level: string, reason: string) =>
    `चतुर्थ भाव ${a} और ${b} (${level})। ${reason}`,
  d1Step: (a: string, b: string, level: string, reason: string, element: string | null) =>
    `${a} लग्न ${b} लग्न के साथ ${level}। ${reason}${element ? ` ${element}` : ''}`,
  d4Missing: 'D4 उपलब्ध नहीं',
  varga: {
    overlap: (n: number, score: number) => `${n} भाव ओवरलैप${n === 1 ? '' : 's'}। अंक ${score}/10।`,
    d10Clear: (score: number) => `D10 में ग्रह–ग्रह पतन नहीं। अंक ${score}/10। दोनों करियर रख सकते हैं।`,
    none: (name: string, score: number) => `${name} में भाव से ग्रह पतन नहीं। अंक ${score}/10।`,
  },
  summary: {
    lead: (a: string, b: string, level: string) => `${a} और ${b}: ${level}।`,
    marsGap: (a: number, b: number) => `मंगल शक्ति अलग (${a}/5 बनाम ${b}/5) — शारीरिक ऊर्जा पर बात करें।`,
    marsClose: (a: number, b: number) => `मंगल अंक ${a}/5 और ${b}/5।`,
    weakDiv: (codes: string) => `इन वर्गों में हल्की पढ़ाई: ${codes}।`,
    noWeak: 'कोई वर्ग विशेष रूप से निम्न अंक नहीं दिखाता।',
  },
  pillar: {
    unscored: (title: string, vname: string) => `${title} अंकित नहीं। ${vname} एक कुंडली पर उपलब्ध नहीं।`,
    scored: (title: string, score: number, named: string) => `${title} अंक ${score}/10। ${named}।`,
    scoredEmpty: (title: string, score: number) => `${title} अंक ${score}/10। इस वर्ग में ग्रह–ग्रह पतन नहीं।`,
  },
  d9Spark: {
    missing: 'दोनों D9 ग्रह उपलब्ध नहीं — सप्तम मंगल–शुक्र चिंगारी जाँच नहीं हो सकी।',
    maVe7: (a: string, b: string) =>
      `एक नवांश में मंगल सप्तम, दूसरे में शुक्र सप्तम: ${a} और ${b} में मजबूत शारीरिक खिंचाव, अक्सर राशि से परे टिकता है।`,
    suMa1: 'एक नवांश लग्न में सूर्य और दूसरे में मंगल — पूरक गर्माहट।',
    fallback: 'नवांश में सूर्य–मंगल लग्न या मंगल–शुक्र सप्तम जोड़ी नहीं — शारीरिक खिंचाव अन्य ओवरलैप से।',
  },
}

export function localizeMatchMaking(result: MatchMakingResult, lang: EngineLang): MatchMakingResult {
  if (lang !== 'hi') return result
  return result
}

