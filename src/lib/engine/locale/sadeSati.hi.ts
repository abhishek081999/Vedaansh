// Hindi display strings for src/lib/engine/sadeSati.ts — ids/enums stay English.

import type { SaturnMoonPhaseKind } from '@/lib/engine/sadeSati'

export const SADE_SATI_PHASE_HI: Record<SaturnMoonPhaseKind, { label: string; summary: string }> = {
  sade_sati_rising: {
    label: 'साढ़े साती — उदय',
    summary:
      'चंद्र से द्वादश में शनि। तैयारी चरण: व्यय, एकांत के विषय, और शिखर से पहले पुनर्गठन।',
  },
  sade_sati_peak: {
    label: 'साढ़े साती — शिखर',
    summary:
      'जन्म चंद्र राशि पर शनि। मन, शरीर और जीवन नींव पर मूल दबाव — अनुशासन और धैर्य ही उपाय।',
  },
  sade_sati_setting: {
    label: 'साढ़े साती — अस्त',
    summary:
      'चंद्र से द्वितीय में शनि। समापन चरण: वाणी, पारिवारिक संसाधन और मूल्य शनि की अंतिम सीख के अधीन।',
  },
  kantaka: {
    label: 'कंटक / ढैया शनि',
    summary:
      'चंद्र से चतुर्थ में शनि (~२.५ वर्ष)। शास्त्रीय “छोटी पनौती” — घरेलू शांति, संपत्ति और भावनात्मक सुरक्षा पर ध्यान दें।',
  },
  ashtama: {
    label: 'अष्टम शनि',
    summary:
      'चंद्र से अष्टम में शनि (~२.५ वर्ष)। रूपांतरण, आयु संबंधी विषय और अचानक संरचना परिवर्तन — दशा से पुष्टि करें।',
  },
  clear: {
    label: 'प्रमुख शनि–चंद्र तनाव से मुक्त',
    summary: 'शनि जन्म चंद्र से द्वादश, चंद्र राशि, द्वितीय, चतुर्थ या अष्टम में नहीं है।',
  },
}

export const SADE_SATI_HI = {
  cycleLabel: 'साढ़े साती {start}–{end}',
  phaseTail: 'शनि {rashi} में (चंद्र से {house}वाँ)।',
  nowTail: 'गोचर शनि {saRashi} में — चंद्र ({moonRashi}) से {house}वाँ।',
  softenerTitle: 'साढ़े साती मृदुकारक',
  softenerDetail:
    'लग्न से प्रथम, पंचम या नवमेश चंद्र या शनि है — शास्त्र मृदु साढ़े साती का उल्लेख करते हैं। फिर भी दशा और अष्टकवर्ग से पुष्टि करें।',
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
} as const
