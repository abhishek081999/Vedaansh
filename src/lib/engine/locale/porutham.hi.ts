// Hindi display strings for src/lib/engine/porutham.ts

export const POR_HI = {
  score: {
    Poor: 'कमज़ोर',
    Excellent: 'उत्कृष्ट',
    Good: 'अच्छा',
    Average: 'औसत',
    Challenging: 'चुनौतीपूर्ण',
  } as Record<string, string>,
  summary: (matched: number, label: string, critical: number) =>
    `${matched}/10 पोरुथम मेल (${label})। गंभीर विफल: ${critical}। दक्षिण भारतीय परंपरा — उत्तरी अष्टकूट के साथ तुलना करें।`,
  items: {
    Dina: {
      ok: 'वधू→वर तारा शुभ (विपत/प्रत्यारी/वध नहीं)।',
      bad: 'वधू→वर तारा विपत / प्रत्यारी / वध में — परंपरागत रूप से अस्वीकार।',
    },
    Gana: (gB: string, gG: string, ok: boolean) =>
      `${gB} (वर) × ${gG} (वधू) — ${ok ? 'स्वीकार्य स्वभाव' : 'गण मेल नहीं'}।`,
    Mahendra: (count: number, ok: boolean) =>
      ok
        ? `गिनती वधू→वर = ${count}। माहेन्द्र 4/7/10/13/16/19/22/25 चाहता है — संतान और दीर्घायु अनुकूल।`
        : `गिनती वधू→वर = ${count}। माहेन्द्र 4/7/10/13/16/19/22/25 चाहता है।`,
    'Stree Deergha': (count: number, ok: boolean) =>
      ok
        ? `दूरी ${count} ≥ 13 — वधू की समृद्धि / दीर्घ वैवाहिक जीवन अनुकूल।`
        : `दूरी ${count} < 13 — कठोर शाखाओं में स्त्री दीर्घ कमज़ोर।`,
    Yoni: (a: string, b: string, pts: number) =>
      `${a} × ${b} (${pts}/4)। शत्रु योनि पोरुथम विफल।`,
    Rasi: (nth: number, ok: boolean) =>
      `वर चंद्र वधू चंद्र से ${nth}वां — ${ok ? 'स्वीकार्य' : '6/8 राशि दोष'}।`,
    Rasyadhipati: (lB: string, lG: string, ok: boolean) =>
      `चंद्र स्वामी ${lB} × ${lG} — ${ok ? 'मित्र / समान' : 'परस्पर मित्र नहीं'}।`,
    Vasya: (vB: string, vG: string, ok: boolean) =>
      `${vB} × ${vG} — पारस्परिक प्रभाव ${ok ? 'कार्य कर सकता है' : 'कठोर'}।`,
    Rajju: (rB: string, rG: string, ok: boolean) =>
      ok
        ? `${rB} × ${rG} — अलग रज्जु (अच्छा)।`
        : `एक ही ${rB} रज्जु — परंपरागत रूप से टाला जाता है।`,
    Vedha: {
      bad: 'नक्षत्र शास्त्रीय वेध जोड़ी बनाते हैं — सामंजस्य में रुकावट।',
      ok: 'जन्म नक्षत्रों के बीच वेध नहीं।',
    },
  },
}
