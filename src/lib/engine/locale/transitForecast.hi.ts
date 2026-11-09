// Hindi display strings for src/lib/engine/transitForecast.ts — ids/enums stay English.

import type { ForecastAreaId } from '@/lib/engine/transitForecastAreas'

export const FORECAST_AREA_LABELS_HI: Record<ForecastAreaId, string> = {
  career: 'करियर और प्रतिष्ठा',
  wealth: 'धन और लाभ',
  relationships: 'संबंध',
  home: 'घर और परिवार',
  health: 'स्वास्थ्य और ऊर्जा',
  growth: 'शिक्षा और अध्यात्म',
}

export const TRANSIT_FORECAST_HI = {
  ordinal: {
    1: '१',
    2: '२',
    3: '३',
    4: '४',
    5: '५',
    6: '६',
    7: '७',
    8: '८',
    9: '९',
    10: '१०',
    11: '११',
    12: '१२',
  } as Record<number, string>,

  status: {
    favourable: 'शुभ',
    challenging: 'चुनौतीपूर्ण',
    vedha: '{planet} द्वारा वेध',
    vedhaFallback: 'वेध',
  },

  driver: {
    line: '{planet} {sign} में — चंद्र से {house} ({status})',
    bindus: '{n} भावाष्टकवर्ग बिंदु{qual}',
    strong: ' (बलवान)',
    weak: ' (दुर्बल)',
    dashaAmp: '{role} स्वामी — फल प्रबल',
  },

  notes: {
    juTransit: 'गुरु {house} ({sign}) में गोचर',
    juAspect: 'गुरु {house} ({sign}) पर दृष्टि',
    saTransit: 'शनि {house} में गोचर — {effect}',
    saAspect: 'शनि {house} पर दृष्टि — {effect}',
    saUpachaya: 'धीमी, अर्जित वृद्धि',
    saPressure: 'दबाव और पुनर्गठन',
    double: 'द्वि-गोचर (गुरु + शनि) {house} पर — घटना-योग्य',
    node: '{planet} {house} पर — {effect}',
    raEffect: 'प्रबल, अस्थिर',
    keEffect: 'विरक्ति, कर्मिक',
    mdLord: '{house} स्वामी {planet} महादशा चला रहे हैं',
    adLord: '{house} स्वामी {planet} अंतर्दशा चला रहे हैं',
  },

  ingress: {
    label: '{planet} {sign} में प्रवेश',
    detail: 'लग्न से {hL} भाव, चंद्र से {hM} — {status}{bindus}।',
    bindus: ', {n} बिंदु',
  },

  station: {
    labelDirect: '{planet} वक्र से सीधा',
    labelRetro: '{planet} वक्री',
    detailDirect:
      '{planet} {sign} में ({house} भाव) आगे बढ़ना शुरू करते हैं — विलंबित {house}-भाव विषय गति पकड़ते हैं।',
    detailRetro:
      '{planet} {sign} में ({house} भाव) वक्री होते हैं — समीक्षा करें, पुनरावृत्ति करें और {house}-भाव निर्णय जबरदस्ती न करें।',
  },

  dasha: {
    label: '{md} / {ad} आरंभ',
    detail:
      'विंशोत्तरी अंतर्दशा {ad} महादशा {md} के अधीन — इन दोनों स्वामियों का गोचर अब सबसे अधिक भार रखता है।',
  },

  window: {
    fav: 'अनुकूल अवधि — चालक {drivers}; {area} को सबसे अधिक लाभ।',
    caution: 'दबाव अवधि — स्रोत {drivers}; {area} संबंधी निर्णयों में धीरे बढ़ें।',
    balanced: 'संतुलित गोचर',
    mixed: 'मिश्रित गोचर',
  },

  driverShort: '{planet} चंद्र से {house}',

  headline: {
    mood: {
      supportive: 'अनुकूल चरण',
      mild: 'हल्का अनुकूल चरण',
      balanced: 'संतुलित चरण',
      testing: 'परीक्षण चरण',
      pressure: 'उच्च-दबाव चरण',
    },
    leadPos: '{planet} का चंद्र से {house}-भाव गोचर अग्रणी है',
    leadNeg: '{planet} का चंद्र से {house}-भाव गोचर सबसे अधिक भार डालता है',
    leadNone: 'कोई एक गोचर हावी नहीं',
    dirUp: 'अगले माह में सुधार',
    dirDown: 'अगले माह में दबाव बढ़ना',
    dirSteady: 'अगले माह स्थिर',
    strongRunning: ' प्रबल खिड़की {end} तक चल रही है।',
    strongNext: ' अगली प्रबल खिड़की: {start} → {end}।',
    bestArea: ' आगे सर्वश्रेष्ठ क्षेत्र: {area} ({start} → {end})।',
    core: '{mood} ({score}/१००) — {lead}; {dir}.{tail}',
  },

  method: [
    'जन्म चंद्र से गोचर, शास्त्रीय वेध सहित (बृहत् पाराशर होरा शास्त्र / फलदीपिका तालिकाएँ)।',
    'प्रत्येक गोचर को गोचरित राशि में ग्रह के भिन्नाष्टकवर्ग बिंदुओं से मिलाया गया (≥५ बलवान, ≤३ दुर्बल)।',
    'चल रही विंशोत्तरी महादशा / अंतर्दशा स्वामी १.३५–१.८× भार रखते हैं — गोचर वही फल देता है जो दशा वादा करती है।',
    'जीवन क्षेत्र लग्न से भाव पढ़ते हैं: गुरु/शनि गोचर या दृष्टि, द्वि-गोचर, छाया ग्रह, मंगल, भाव राशि का सर्वाष्टकवर्ग और भाव-स्वामी दशा।',
    'शनि, छाया ग्रह और मंगल उपचय भावों (३, ६, १०, ११) में वृद्धि गिने जाते हैं और अन्यत्र दबाव।',
  ],
} as const
