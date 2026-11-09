// Hindi text for src/lib/engine/moonTransitAnalysis.ts

export const LAGNA_LABELS_HI: Record<string, string> = {
  Asc: 'लग्न',
  AL: 'आरूढ़ लग्न',
  bhavaLagna: 'भाव लग्न',
  horaLagna: 'होरा लग्न',
  ghatiLagna: 'घटी लग्न',
  vighatiLagna: 'विघटी लग्न',
  varnadaLagna: 'वर्णद लग्न',
  sriLagna: 'श्री लग्न',
  pranapada: 'प्राणपद',
  induLagna: 'इंदु लग्न',
  bhriguBindu: 'भृगु बिंदु',
}

export const CONTACT_HI = {
  house: 'आपके जन्म का {target} {nth} भाव में है — {theme}।',
  grahaGood:
    'चंद्रमा जन्म के {target} से मिलता है। मन और मनोदशा {theme} की ओर झुकती है। {house}',
  grahaBad:
    'चंद्रमा जन्म के {target} से मिलता है। {theme} को लेकर भावनाएँ तीखी हो सकती हैं; प्रतिक्रिया धीमी रखें। {house}',
  grahaMixed:
    'चंद्रमा जन्म के {target} से मिलता है। ध्यान {theme} पर केंद्रित होता है, कोई निश्चित परिणाम नहीं। {house}',
  asc:
    'चंद्रमा आपके लग्न से गुज़रता है। शरीर का बोध और आप स्वयं को कैसे प्रस्तुत करते हैं, यह आगे आता है। {house}',
  lagna:
    'चंद्रमा {target} से गुज़रता है। यह बताता है कि उस लग्न का विषय मनोदशा और गति में कैसे दिखता है। {house}',
  upaBad:
    'चंद्रमा {target} से गुज़रता है। संपर्क सटीक रहने तक तीखी नई शुरुआत के बजाय दिनचर्या चुनें। {house}',
  upa: 'चंद्रमा {target} से गुज़रता है। {theme} के आसपास सूक्ष्म समय-संकेत। {house}',
  chandra: ' चंद्र बल स्थिर अर्थ का साथ देता है।',
  lifeThemes: 'जीवन के विषय',
} as const
