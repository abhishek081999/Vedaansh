// Hindi display strings for src/lib/engine/marriageSynastry.ts

export const MS_HI = {
  d9Label: { strong: 'प्रबल', weak: 'दबाव में', mid: 'मध्यम' } as Record<'strong' | 'weak' | 'mid', string>,
  d9Titles: {
    aligned: 'नवमांश शुक्र और सप्तमेश एक-दूसरे को सहारा देते हैं',
    strained: 'नवमांश शुक्र और सप्तमेश दोनों ओर कुछ दबाव में हैं',
    mixed: 'नवमांश विवाह शक्ति मिश्रित है',
  },
  d9Detail: `{nameA}: नवमांश (D9) शुक्र {veA}, सप्तमेश {lordA}। {nameB}: नवमांश शुक्र {veB}, सप्तमेश {lordB}। दोनों नवमांशों की तुलना विवाह का गहरा फल दिखाती है; संरेखित कुंडलियाँ दबाव में बेहतर टिकती हैं।`,
  headlineHits: 'क्रॉस-चार्ट ओवरले: {count} विवाह-भाव संपर्क',
  headlineNone: 'क्रॉस-चार्ट ओवरले: 1, 5, 7, 8 या 12 भावों पर कोई प्रबल संपर्क नहीं',
  summary: `नवमांश-से-नवमांश अंक: {score}। ओवरले दिखाता है प्रत्येक व्यक्ति के ग्रह दूसरी कुंडली में कहाँ पड़ते हैं, और उसका अनुभव कैसा हो सकता है।`,
  d9Score: { aligned: 'संरेखित', strained: 'तनावपूर्ण', mixed: 'मिश्रित' } as Record<string, string>,
  overlayTitle: `{label} → {intoName} का भाव {house}`,
  overlay: {
    h7: `{fromName} का {label} {intoName} के सप्तम भाव में — साझेदारी और आपसी गर्माहट को छूता है।`,
    h5: `{fromName} का {label} {intoName} के पंचम भाव में — प्रेम और संतान को छूता है।`,
    h1: `{fromName} का {label} {intoName} की लग्न पर — पहचान और उपस्थिति को छूता है।`,
    h8: `{fromName} का {label} {intoName} के अष्टम भाव में — गहराई, साझा संकट और गहरे बंधन को छूता है।`,
    h12: `{fromName} का {label} {intoName} के द्वादश भाव में — अंतरंगता, विदेश और छोड़ने को छूता है।`,
    h6: `{fromName} का {label} {intoName} के षष्ठ भाव में — सेवा, प्रयास और कभी-कभार घर्षण को छूता है।`,
    other: `{fromName} का {label} {intoName} के भाव {house} में।`,
  },
  dkSuffix: ' (DK)',
}
