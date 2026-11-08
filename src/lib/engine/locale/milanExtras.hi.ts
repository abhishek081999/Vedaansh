// Hindi for src/lib/engine/milanExtras.ts

export const ME_HI = {
  firstChart: 'पहली कुंडली',
  secondChart: 'दूसरी कुंडली',
  person: 'जन',
  lagnaMissing: 'लग्न अनुपलब्ध',
  lagnaMissingFull: 'लग्न अनुपलब्ध — यह पढ़ाई नहीं बन सकी।',
  noFactors: 'कोई मजबूत शास्त्रीय साथी-कल्याण कारक नहीं मिला',
  longevityNote: (band: string, notes: string) =>
    notes.length ? `${band} कल्याण और दीर्घायु संकेत (${notes})` : `${band} कल्याण संकेत — अष्टम भाव स्कैन से`,
  bands: { fragile: 'नाज़ुक', moderate: 'मध्यम', strong: 'मजबूत' } as Record<string, string>,
  vaidhavya: {
    cancelled:
      'दोनों कुंडलियों के साथी-कल्याण संकेत समान बल के — शास्त्रीय ध्यान से संतुलन। पूरी कुंडली के साथ पढ़ें।',
    critical: (name: string, intensity: string, band: string) =>
      `एक कुंडली (${name}, ${intensity}/10) में संकेत दूसरी से मजबूत — दूसरी की दीर्घायु ${band}। समान बल शास्त्रीय रूप से पसंद — सौम्य ध्यान और गहरी पढ़ाई, भविष्यवाणी नहीं।`,
    uneven: (gap: string) =>
      `साथी-कल्याण संकेत असमान (अंतर ${gap})। विश्वसनीय ज्योतिषी के साथ पूरी पढ़ाई संदर्भ दे सकती है।`,
    none: 'इस स्कैन में किसी कुंडली में मजबूत वैधव्य/विधुर कारक नहीं।',
    mild: (a: string, ai: string, b: string, bi: string) =>
      `हल्के साथी-कल्याण संकेत (${a} ${ai}/10, ${b} ${bi}/10)। दीर्घायु और दशा के साथ पढ़ें।`,
  },
  dasha: {
    currentOverlap: 'वर्तमान ओवरलैप',
    nowNext: (a: string, b: string) => `${a} अभी × ${b} अगला`,
    nextOverlap: 'अगला ओवरलैप',
    marriageTouch: ' दशा स्वामी सप्तम-विषयों को छूता है — साझेदारी सक्रिय महसूस हो सकती है।',
    patience: ' धैर्य और स्पष्ट समझौते इस विंडो में मदद करते हैं।',
    currentPair: 'वर्तमान महादशा जोड़ी',
    dataIncomplete:
      'एक या दोनों कुंडलियों में विंशोत्तरी दशा अधूरी। पुनर्गणना करें।',
    summaryCaution: 'आने वाले दशा ओवरलैप सामंजस्य के लिए चुनौतीपूर्ण — बड़े निर्णय समय पर सोचकर।',
    summarySupport: 'निकट भविष्य में कम से कम एक अनुकूल दशा स्वामी जोड़ी।',
    summaryMixed: 'दशा जोड़ी मिश्रित; अंतरदशा बारीक समय देती है।',
    relation: {
      same: 'एक ही स्वामी',
      rahu: 'राहु/केतु अवधि — अक्सर बेचैनी या कर्मिक चरण',
      friends: 'परस्पर मित्र',
      enemy: 'स्वामी प्राकृतिक मित्र नहीं',
      neutral: 'तटस्थ या मिश्रित',
    } as Record<string, string>,
  },
  varnamala: {
    missing: 'एक या दोनों की जन्म-नाम ध्वनि वर्णमाला समूह से नहीं मिली।',
    enemies: (a: string, sA: string, b: string, sB: string) =>
      `जन्म-नाम प्राणी विरोधी समूहों में: ${a} (${sA}) और ${b} (${sB})। चंद्र पद ध्वनि पर आधारित — रोज़ के नाम पर नहीं।`,
    same: (animal: string, sA: string, sB: string) =>
      `एक जैसा वर्णमाला प्राणी (${animal}) — ${sA} और ${sB}।`,
    comfortable: (a: string, sA: string, b: string, sB: string) =>
      `${a} (${sA}) और ${b} (${sB}) विरोधी समूहों में नहीं — यह बिंदु सहज।`,
  },
  role: { vaidhavya: 'वैधव्य', vidhur: 'विधुर' },
  spouseFactors: {
    lagnaUnavailable: 'इस कुंडली के लिए लग्न अनुपलब्ध',
    longevityUnavailable: 'अनुपलब्ध',
    noFactors: 'कोई मजबूत शास्त्रीय साथी-कल्याण कारक नहीं मिला',
    malefic7: (g: string) => `${g} सप्तम भाव में`,
    malefic8: (g: string) => `${g} अष्टम भाव में`,
    maSaSpouse: 'मंगल और शनि दोनों सप्तम/अष्टम को प्रभावित करते हैं (शास्त्रीय संकेत — पूरी कुंडली के साथ पढ़ें)',
    lord7Dusthana: (h: number) => `सप्तमेश कठिन भाव में (भाव ${h})`,
    lord7Combust: 'सप्तमेश अस्त (सूर्य के निकट, कमज़ोर)',
    lord8Dusthana: (h: number) => `अष्टमेश कठिन भाव में (भाव ${h})`,
    venusStrain: 'साझेदारी सुख का कारक शुक्र तनाव में',
    juStrain: 'गुरु कठिन भाव में — सुरक्षात्मक सहारा हल्का',
    malefic8Note: (g: string) => `${g} अष्टम भाव में`,
    lord8Challenging: (h: number) => `अष्टम स्वामी कठिन भाव में (भाव ${h})`,
    saturnEndurance: 'शनि दीर्घायु में सहारा देता है',
  },
}
