// ─────────────────────────────────────────────────────────────
//  src/lib/seo/intro-content.hi.ts
//  Hindi versions of the crawlable SEO intros in intro-content.ts.
//  Same shape and same hrefs; add a page here when its UI is
//  translated, then read it through introFor() / faqFor().
// ─────────────────────────────────────────────────────────────
import type { SeoIntroProps, SeoRelatedLink } from '@/components/seo/SeoIntro.types'
import type { AppLocale } from '@/i18n/config'
import { ACG_SEO, COMPARE_SEO, HOME_FAQ, HOME_SEO, JAIMINI_SEO, MUHURTA_SEO, NADI_SEO, NAKSHATRA_SEO, NUMEROLOGY_SEO, PANCHANG_CALENDAR_SEO, PANCHANG_SEO, PRASHNA_SEO, ROADMAP_SEO, SBC_SEO, VASTU_SEO } from './intro-content'

function guideLink(slug: string, label: string): SeoRelatedLink {
  return { href: `/guides/${slug}`, label }
}

export const HOME_SEO_HI: SeoIntroProps = {
  ariaLabel: 'Vedaansh — निःशुल्क वैदिक ज्योतिष प्लेटफ़ॉर्म',
  titleAs: 'h1',
  h1: 'Vedaansh — निःशुल्क वैदिक ज्योतिष एवं कुंडली गणना',
  paragraphs: [
    'स्विस एफ़ेमेरिस की आर्क-सेकंड सटीकता के साथ अपनी निःशुल्क वैदिक जन्म कुंडली तुरंत बनाएँ। लॉगिन की आवश्यकता नहीं। इसमें विंशोत्तरी दशा, 16 षोडशवर्ग कुंडलियाँ, नवांश (D9), पंचांग, आरूढ़ लग्न एवं पद, षड्बल, अष्टकवर्ग और बहुत कुछ शामिल है।',
    'ग्रहों की आर्क-सेकंड तक सटीक स्थिति के लिए Vedaansh स्विस एफ़ेमेरिस लाइब्रेरी का उपयोग करता है। लाहिरी (चित्रपक्ष) अयनांश समर्थित है।',
  ],
  h2: 'Vedaansh में क्या-क्या है',
  bullets: [
    { label: 'निःशुल्क वैदिक जन्म कुंडली', desc: 'भाव स्वामियों सहित लग्न, चंद्र और सूर्य कुंडली' },
    { label: 'वर्ग (विभागीय) कुंडलियाँ', desc: 'हर योजना में 16 षोडशवर्ग कुंडलियाँ, और Platinum में पूरी 41' },
    { label: 'विंशोत्तरी एवं योगिनी दशा', desc: 'अंतर्दशा और प्रत्यंतर्दशा की सटीक समयरेखा' },
    { label: 'दैनिक पंचांग', desc: 'तिथि, नक्षत्र, योग, करण और राहु काल' },
    { label: 'अष्टकवर्ग एवं षड्बल', desc: 'बिंदु, रेखाएँ और ग्रह बल की तालिकाएँ' },
    { label: 'जैमिनी ज्योतिष', desc: 'आत्मकारक, चर दशा, आरूढ़ लग्न एवं पद' },
    { label: 'KP नक्षत्र पद्धति', desc: 'भाव संधियों के परस्पर संबंध सहित उप-स्वामी पद्धति' },
    { label: 'कुंडली मिलान', desc: '36 गुणों का अष्टकूट मिलान' },
    { label: 'आज का फल', desc: 'आपके चंद्रमा, चल रही दशा और वर्तमान गोचर पर आधारित व्यक्तिगत दैनिक फल' },
    { label: 'गोचर एवं साढ़े साती', desc: 'हर योजना में गोचर रोडमैप और लाइव गोचर; Gold में साढ़े साती, दृष्टि, द्वि-चक्र और कैलेंडर' },
    { label: 'संबंध एवं विवाह', desc: 'हर योजना में कुंडली और मुख्य अंक; Gold में विवाह का समय, मंगल और विवाह फलादेश' },
    { label: 'करियर एवं व्यवसाय', desc: 'हर योजना में कुंडली, मुख्य अंक और पद्धति के उत्तर; Gold में पूरा सात चरणों वाला फलादेश' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'निःशुल्क कुंडली मार्गदर्शिका'),
    guideLink('what-is-navamsha-d9-chart', 'नवांश (D9)'),
    guideLink('what-is-dashamsha-d10-chart', 'दशमांश (D10)'),
    guideLink('ashtakoot-guna-milan-explained', 'कुंडली मिलान'),
    guideLink('vimshottari-dasha-explained', 'विंशोत्तरी दशा'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
    { href: '/search', label: 'खोजें' },
  ],
}

export const HOME_FAQ_HI: { q: string; a: string }[] = [
  {
    q: 'क्या Vedaansh का जन्म कुंडली कैलकुलेटर निःशुल्क है?',
    a: 'हाँ। मूल कुंडली गणना, विंशोत्तरी दशा, 16 षोडशवर्ग कुंडलियाँ, पंचांग और कई ज्योतिष उपकरण हमेशा के लिए निःशुल्क हैं, किसी क्रेडिट कार्ड की आवश्यकता नहीं।',
  },
  {
    q: 'Vedaansh कितना सटीक है?',
    a: 'Vedaansh निरयन ग्रह स्थितियों की आर्क-सेकंड सटीकता के लिए लाहिरी (चित्रपक्ष) अयनांश के साथ स्विस एफ़ेमेरिस लाइब्रेरी का उपयोग करता है।',
  },
  {
    q: 'क्या कुंडली बनाने के लिए खाता बनाना ज़रूरी है?',
    a: 'नहीं। आप तुरंत पूरी वैदिक जन्म कुंडली बना और देख सकते हैं। निःशुल्क खाते से आप कुंडलियाँ अपनी लाइब्रेरी में सहेज सकते हैं।',
  },
  {
    q: 'Vedaansh के कुंडली मिलान में क्या-क्या शामिल है?',
    a: 'मिलान उपकरण में 36 गुणों का अष्टकूट मिलान, दोष जाँच और दो जन्म विवरणों की कुंडलियाँ साथ-साथ देखने की सुविधा है।',
  },
  {
    q: 'क्या Vedaansh विवाह और करियर ज्योतिष भी बताता है?',
    a: 'हाँ। संबंध एवं विवाह और करियर एवं व्यवसाय पैनल वर्ग कुंडलियों, दशा के समय और शास्त्रीय पद्धतियों से आपकी कुंडली का विश्लेषण करते हैं। मुख्य अंक निःशुल्क योजना में उपलब्ध हैं; पूरा फलादेश Gold योजना का हिस्सा है।',
  },
]

export function homeIntro(locale: AppLocale): { seo: SeoIntroProps; faq: { q: string; a: string }[] } {
  return locale === 'hi'
    ? { seo: HOME_SEO_HI, faq: HOME_FAQ_HI }
    : { seo: HOME_SEO, faq: [...HOME_FAQ] }
}

export const PANCHANG_SEO_HI: SeoIntroProps = {
  ariaLabel: 'दैनिक वैदिक पंचांग — Vedaansh',
  h1: 'निःशुल्क दैनिक वैदिक पंचांग — तिथि, नक्षत्र, योग और राहु काल',
  paragraphs: [
    'अपने शहर के खगोलीय सूर्योदय और सूर्यास्त के साथ आज का पंचांग देखें। Vedaansh लाहिरी अयनांश सहित स्विस एफ़ेमेरिस की निरयन स्थितियों से तिथि, वार, नक्षत्र, योग, करण, राहु काल, गुलिक, यमगंड और अभिजित मुहूर्त की गणना करता है।',
    'भारतीय मानक समय के सटीक परिवर्तन-समय के साथ दैनिक कार्य, मंदिर दर्शन और साधना की योजना बनाएँ। जन्म नक्षत्र जोड़ने पर व्यक्तिगत शुभता के लिए तारा बल और चंद्र बल भी दिखते हैं।',
  ],
  h2: 'Vedaansh पंचांग की सुविधाएँ',
  bullets: [
    { label: 'लाइव तिथि और नक्षत्र', desc: 'वास्तविक स्थानीय सूर्योदय के आधार पर हर अंग का समाप्ति-समय' },
    { label: 'राहु काल और गुलिक', desc: 'नई शुरुआत के लिए टालने योग्य अशुभ समय' },
    { label: 'होरा तालिका', desc: 'दिन भर की ग्रह होराएँ' },
    { label: 'स्थान अनुसार', desc: 'दुनिया के किसी भी शहर की खोज' },
  ],
  relatedLinks: [
    guideLink('what-is-panchang-tithi-nakshatra', 'पंचांग क्या है?'),
    guideLink('rahu-kalam-explained', 'राहु काल की व्याख्या'),
    guideLink('chandra-bala-tara-bala', 'चंद्र बल और तारा बल'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export const PANCHANG_CALENDAR_SEO_HI: SeoIntroProps = {
  ariaLabel: 'मासिक वैदिक पंचांग कैलेंडर — Vedaansh',
  h1: 'मासिक पंचांग कैलेंडर — हर दिन की तिथि और नक्षत्र',
  paragraphs: [
    'पूरे महीने का वैदिक पंचांग एक नज़र में देखें। हर दिन तिथि, नक्षत्र, वार, योग और करण दिखाता है — पूरे चांद्र मास में विवाह, यात्रा और पर्वों की योजना के लिए आदर्श।',
    'आँकड़े आपके चुने स्थान के लिए स्विस एफ़ेमेरिस से गणना किए जाते हैं और तेज़ लोडिंग के लिए सहेजे जाते हैं।',
  ],
  h2: 'कैलेंडर की विशेषताएँ',
  bullets: [
    { label: 'मासिक ग्रिड', desc: 'शुभ और अशुभ दिन जल्दी देखें' },
    { label: 'हर दिन का विवरण', desc: 'परिवर्तन और समय विस्तार से देखें' },
    { label: 'IST के अनुरूप', desc: 'भारतीय पर्व और मुहूर्त योजना के लिए बना' },
  ],
  relatedLinks: [
    guideLink('what-is-panchang-tithi-nakshatra', 'पंचांग क्या है?'),
    guideLink('rahu-kalam-explained', 'राहु काल की व्याख्या'),
    { href: '/panchang', label: 'दैनिक पंचांग' },
  ],
}

export const COMPARE_SEO_HI: SeoIntroProps = {
  ariaLabel: 'कुंडली मिलान और तुलना — Vedaansh',
  h1: 'निःशुल्क कुंडली मिलान — अष्टकूट गुण मिलान और अंतरदृष्टि',
  paragraphs: [
    '36-गुण अष्टकूट (गुण मिलान), मंगल और नाड़ी जाँच, और द्वि-चार्ट सिनैस्ट्री के साथ दो जन्म कुंडलियाँ साथ-साथ देखें। दोनों के जन्म विवरण दर्ज करें — सहेजी चार्ट ज़रूरी नहीं।',
    'Vedaansh लाहिरी अयनांश के साथ स्विस एफ़ेमेरिस के निरयन स्थानों से शास्त्रीय परंपरा के अनुरूप विवाह-मेल विश्लेषण देता है।',
  ],
  h2: 'मिलान-सुविधाएँ',
  bullets: [
    { label: 'अष्टकूट मिलान', desc: 'वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट और नाड़ी' },
    { label: 'दोष विश्लेषण', desc: 'मंगल दोष, नाड़ी और भकूट संघर्ष के विशेष बिंदु' },
    { label: 'दोहरी कुंडलियाँ', desc: 'साथ-साथ D1, दशा और पंचांग तुलना' },
    { label: 'बिना लॉगिन', desc: 'तुरंत निःशुल्क मेल-जाँच' },
  ],
  relatedLinks: [
    guideLink('ashtakoot-guna-milan-explained', 'अष्टकूट गुण मिलान'),
    guideLink('mangal-dosha-explained', 'मंगल दोष'),
    guideLink('what-is-navamsha-d9-chart', 'नवांश (D9)'),
    guideLink('what-is-dashamsha-d10-chart', 'दशमांश (D10)'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function compareIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? COMPARE_SEO_HI : COMPARE_SEO
}

export function panchangIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? PANCHANG_SEO_HI : PANCHANG_SEO
}

export function panchangCalendarIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? PANCHANG_CALENDAR_SEO_HI : PANCHANG_CALENDAR_SEO
}

export const MUHURTA_SEO_HI: SeoIntroProps = {
  ariaLabel: 'वैदिक मुहूर्त खोजक — Vedaansh',
  h1: 'वैदिक मुहूर्त खोजक — शुभ समय-खिड़कियाँ',
  paragraphs: [
    'विवाह, यात्रा, व्यापार, संपत्ति, शिक्षा आदि के लिए शुभ मुहूर्त खोजें। Vedaansh प्रत्येक दिन को योग गुणवत्ता, तिथि, नक्षत्र, वार स्वामी और राहु काल / गुलिक से बचाव के आधार पर मूल्यांकित करता है।',
    'अभिजित मुहूर्त और व्यक्तिगत तारा/चंद्र बल (जन्म कुंडली सहित) इलेक्शनल ज्योतिष के निर्णय को परिष्कृत करते हैं।',
  ],
  h2: 'मुहूर्त विश्लेषण में शामिल',
  bullets: [
    { label: 'गतिविधि-विशिष्ट स्कोर', desc: 'विवाह, गृह प्रवेश, यात्रा, अनुबंध आदि' },
    { label: 'टाइमलाइन दृश्य', desc: 'तिथि सीमा में अनुकूल अंतराल देखें' },
    { label: 'शास्त्रीय नियम', desc: 'ज्योतिष परंपरा के योग, तिथि और नक्षत्र फ़िल्टर' },
  ],
  relatedLinks: [
    guideLink('muhurta-for-marriage', 'विवाह मुहूर्त'),
    guideLink('what-is-panchang-tithi-nakshatra', 'पंचांग मूल बातें'),
    guideLink('rahu-kalam-explained', 'राहु काल'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function muhurtaIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? MUHURTA_SEO_HI : MUHURTA_SEO
}

export const ROADMAP_SEO_HI: SeoIntroProps = {
  ariaLabel: 'व्यक्तिगत गोचर रोडमैप — Vedaansh',
  h1: 'व्यक्तिगत वैदिक गोचर रोडमैप — दशा और ग्रह खिड़कियाँ',
  paragraphs: [
    'आगामी ग्रह गोचर, विंशोत्तरी दशा अवधि और महत्वपूर्ण ज्योतिष समय-खिड़कियाँ अपनी जन्म कुंडली से जुड़ी समयरेखा पर देखें।',
    'शनि, गुरु, राहु–केतु और दशा परिवर्तन के आसपास निर्णय योजना बनाने के लिए स्विस एफ़ेमेरिस सटीकता वाले रोडमैप का उपयोग करें।',
  ],
  h2: 'रोडमैप की मुख्य बातें',
  bullets: [
    { label: 'गोचर समयरेखा', desc: 'आगामी प्रमुख ग्रह संक्रमण और दृष्टि' },
    { label: 'दशा ओवरले', desc: 'एक ही दृश्य में महादशा और अंतर्दशा' },
    { label: 'साढ़े साती ट्रैकर', desc: 'उदय / शिखर / अस्त के साथ चंद्र से कंटक और अष्टम' },
    { label: 'दृष्टि और बहु-गोचर', desc: 'गुरु/शनि/राहु/केतु गोचर प्रभाव और दोहरी/त्रिगुणित खिड़कियाँ' },
    { label: 'द्वि-चक्र + मूर्ति + D9', desc: 'जन्म/गोचर चक्र, संक्रमण मूर्ति, नवांश गोचर' },
    { label: 'मासिक कैलेंडर', desc: 'मुद्रण योग्य HTML सहित व्यक्तिगत गोचर माह ग्रिड (Gold+)' },
  ],
  relatedLinks: [
    guideLink('vimshottari-dasha-explained', 'विंशोत्तरी दशा'),
    guideLink('ashtakavarga-explained', 'अष्टकवर्ग'),
    { href: '/transit/sade-sati', label: 'साढ़े साती ट्रैकर' },
    { href: '/transit/aspects', label: 'दृष्टि और बहु-गोचर' },
    { href: '/transit/biwheel', label: 'द्वि-चक्र · मूर्ति · D9' },
    { href: '/transit/calendar', label: 'गोचर कैलेंडर' },
    { href: '/transit/scrubber', label: 'लाइव गोचर स्क्रबर' },
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function transitIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? ROADMAP_SEO_HI : ROADMAP_SEO
}

export const NAKSHATRA_SEO_HI: SeoIntroProps = {
  ariaLabel: 'नक्षत्र विश्लेषण — Vedaansh',
  h1: 'नक्षत्र विश्लेषण — जन्म तारा, अनुकूलता और उपाय',
  paragraphs: [
    'अपने जन्मनक्षत्र का पाद, अधिष्ठातृ देवता, ग्रह, गण, नाड़ी और प्रतीक सहित अन्वेषण करें। Vedaansh नवतारा फल (दशा निर्णय खिड़कियाँ, जन्म ग्रह तारा क्षमता), अनुकूलता अंक, व्यक्तिगत उपाय, गोचर सक्रियण और नक्षत्र-आधारित मुहूर्त मार्गदर्शन देता है।',
    'सभी गणनाएँ स्विस एफ़ेमेरिस सायन देशांतर और लाहिरी अयनांश से होती हैं — शास्त्रीय ज्योतिष से मेल खाती सटीकता।',
  ],
  h2: 'नक्षत्र उपकरण',
  bullets: [
    { label: 'परिचय', desc: 'जन्म तारे का सार और प्रारंभिक फलादेश' },
    { label: 'अनुकूलता', desc: 'नवतारा, रज्जु, वेध और संबंध अंक' },
    { label: 'उपाय', desc: 'मंत्र, रत्न, रंग और देवता उपासना' },
    { label: 'गोचर और मुहूर्त', desc: 'ग्रह सक्रियण और शुभ तारा समय' },
  ],
  relatedLinks: [
    guideLink('chandra-bala-tara-bala', 'तारा बल और चंद्र बल'),
    guideLink('vimshottari-dasha-explained', 'विंशोत्तरी दशा'),
    guideLink('yogini-dasha-explained', 'योगिनी दशा'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function nakshatraIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? NAKSHATRA_SEO_HI : NAKSHATRA_SEO
}

export const NUMEROLOGY_SEO_HI: SeoIntroProps = {
  ariaLabel: 'वैदिक अंक ज्योतिष — Vedaansh',
  h1: 'वैदिक अंक ज्योतिष — फल, उपाय और अंक कैलकुलेटर',
  paragraphs: [
    'ग्रह स्वामियों के साथ अपना मूलांक, भाग्यांक और कैल्डियन नामांक निकालें, फिर अंक ज्योतिष से जीवन-क्षेत्र फल, परिपक्वता अंक, शिखर, चुनौतियाँ, अंक योग और पूरा व्यक्तिगत उपाय पैकेज पढ़ें।',
    'वैदिक और लो शु ग्रिड, कुआ दिशाएँ, व्यक्तिगत वर्ष और मासिक पूर्वानुमान, दैनिक अंक मुहूर्त, शिशु नाम, व्यवसाय मिलान, दशा↔अंक समय, विवाह खिड़कियाँ, ब्रांड/प्लेट अंक, नक्षत्र-अक्षर सेतु, यंत्र, वास्तु×कुआ, और पीडीएफ निर्यात (Gold) देखें।',
  ],
  h2: 'वैदिक अंक ज्योतिष की सुविधाएँ',
  bullets: [
    { label: 'फल और दशा', desc: 'जीवन क्षेत्र, शिखर, योग, और कुंडली से जुड़ा महादशा अंक समय' },
    { label: 'उपाय और यंत्र', desc: 'प्राथमिकता वाले मंत्र, रत्न, रंग, साप्ताहिक योजना और यंत्र पैक' },
    { label: 'उन्नत उपकरण', desc: 'शिशु नाम, व्यवसाय मिलान, विवाह समय, ब्रांड/प्लेट, माह कैलेंडर, वास्तु×कुआ' },
    { label: 'मूल, ग्रिड और चक्र', desc: 'मूलांक, भाग्यांक, नामांक, लो शु, मित्रता पद्धति, व्यक्तिगत दिन और पीडीएफ रिपोर्ट' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'कुंडली की मूल बातें'),
    { href: '/guides', label: 'सभी ज्योतिष मार्गदर्शिकाएँ' },
  ],
}

export function numerologyIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? NUMEROLOGY_SEO_HI : NUMEROLOGY_SEO
}

export const VASTU_SEO_HI: SeoIntroProps = {
  ariaLabel: 'जन्म कुंडली से वास्तु शास्त्र — Vedaansh',
  h1: 'वैदिक वास्तु — कुंडली से ग्रह दिशाएँ और दिग्बल',
  paragraphs: [
    'अपनी जन्म कुंडली को वास्तु दिशाओं से जोड़ें: ग्रहों का दिग्बल, दिशात्मक बल, कक्षों की सिफारिश और वास्तु दोष — ग्रह स्थिति और भाव स्वामियों से निकाले गए।',
    'व्यक्तिगत ज्योतिष-वास्तु मार्गदर्शन ज्योतिष कुंडली के तर्क को घर और कार्यस्थल की व्यावहारिक स्थान-योजना से जोड़ता है।',
  ],
  h2: 'वास्तु विश्लेषण',
  bullets: [
    { label: 'दिग्बल मानचित्र', desc: 'प्रत्येक ग्रह का दिशात्मक बल' },
    { label: 'कक्ष मार्गदर्शन', desc: 'निद्रा, रसोई, अध्ययन और पूजा के अनुकूल क्षेत्र' },
    { label: 'दोष संकेत', desc: 'कुंडली कारकों से जुड़े दिशात्मक असंतुलन' },
    { label: 'उपाय', desc: 'प्रत्येक दिशा के शास्त्रीय सुधार-सुझाव' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'वैदिक जन्म कुंडली'),
    guideLink('shadbala-explained', 'षड्बल'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function vastuIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? VASTU_SEO_HI : VASTU_SEO
}

export const NADI_SEO_HI: SeoIntroProps = {
  ariaLabel: 'नाड़ी ज्योतिष — Vedaansh',
  h1: 'नाड़ी ज्योतिष — भाव, योग, करियर और समय',
  paragraphs: [
    'आपकी वैदिक जन्म कुंडली पर नाड़ी कार्यक्षेत्र। अभी सक्रिय पंक्ति आगे रहती है। राशि चक्र पठन के साथ रहता है, और हर टैब एक हिस्सा खोलता है: भाव, योग, विवाह, करियर, धन, आने वाले वर्ष, गोचर और उपाय।',
    'पठन Vedaansh की बाकी गणनाओं वाली ही स्विस एफ़ेमेरिस कुंडली से होता है, भृगु भाव, वर्ग कुंडलियों और चल रही विंशोत्तरी दशा के साथ।',
  ],
  h2: 'इस खंड में क्या दिखता है',
  bullets: [
    { label: 'सक्रिय पठन', desc: 'करियर, चल रहा वर्ष, दशा और अगला जुड़ा वर्ष' },
    { label: 'भाव', desc: 'बारह भाव — राशि, स्वामी, बैठे ग्रह और भृगु भाव' },
    { label: 'जीवन पठन', desc: 'योग, विवाह, करियर, धन, संपत्ति और वाहन' },
    { label: 'समय और आकाश', desc: 'अंश वर्ष, आने वाली दशाएँ, लाइव गोचर और इस कुंडली का रत्न' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'कुंडली क्या है?'),
    { href: '/jaimini', label: 'जैमिनी ज्योतिष' },
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function nadiIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? NADI_SEO_HI : NADI_SEO
}

export const PRASHNA_SEO_HI: SeoIntroProps = {
  ariaLabel: 'प्रश्न होरेरी ज्योतिष — Vedaansh',
  h1: 'प्रश्न ज्योतिष — कृष्णीय केरल होरेरी कुंडली',
  paragraphs: [
    'हाँ/नहीं, समय, खोई वस्तु, स्वास्थ्य, यात्रा और संबंध के प्रश्नों के लिए तुरंत प्रश्न (होरेरी) कुंडली बनाएँ। Vedaansh श्री कृष्ण आचार्य की कृष्णीय विधि लगाता है — आरूढ़-उदय, शीर्षोदय और शास्त्रीय केरल होरेरी युक्ति के साथ।',
    'प्रश्न के क्षण पर कुंडली स्थिर करें और स्पष्ट निर्णय, अंकपत्र और नियम-उद्धरण पाएँ।',
  ],
  h2: 'प्रश्न श्रेणियाँ',
  bullets: [
    { label: 'हाँ / नहीं', desc: 'सिद्धि प्रश्न का निर्णय और विश्वास अंक' },
    { label: 'खोई वस्तु', desc: 'नष्ट प्रश्न — दिशा और प्राप्ति का समय' },
    { label: 'कब और कौन', desc: 'घटना का समय और कारक विश्लेषण' },
    { label: 'स्वास्थ्य और यात्रा', desc: 'श्रेणी के अनुसार कृष्णीय अध्याय' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'कुंडली क्या है?'),
    guideLink('lahiri-ayanamsha-explained', 'लाहिरी अयनांश'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function prashnaIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? PRASHNA_SEO_HI : PRASHNA_SEO
}

export const SBC_SEO_HI: SeoIntroProps = {
  ariaLabel: 'सर्वतोभद्र चक्र — Vedaansh',
  h1: 'सर्वतोभद्र चक्र — 9×9 वैदिक गोचर वेध ग्रिड',
  paragraphs: [
    'शास्त्रीय सर्वतोभद्र चक्र (SBC): गोचर वेध, जीवन-क्षेत्र की गति, मुहूर्त और भविष्य के समय के लिए 9×9 नक्षत्र ग्रिड।',
    'देखें कि गोचर ग्रह आपके जन्म नक्षत्र, नाम नक्षत्र और मुख्य जीवन क्षेत्रों पर वेध कैसे डालते हैं — पंक्ति-स्तंभ की चमक और श्रेणी के फल के साथ।',
  ],
  h2: 'SBC की सुविधाएँ',
  bullets: [
    { label: 'गोचर वेध', desc: 'परिधि ग्रिड पर लाइव ग्रह वेध' },
    { label: 'जीवन क्षेत्र', desc: 'धन, स्वास्थ्य, यात्रा और संबंध की गति' },
    { label: 'मुहूर्त टैब', desc: 'आज के गोचर वेध से शुभ समय' },
    { label: 'प्रश्न उपयोग', desc: 'ग्रिड के संबंधों से श्रेणी के फल' },
  ],
  relatedLinks: [
    guideLink('vimshottari-dasha-explained', 'विंशोत्तरी दशा'),
    guideLink('what-is-panchang-tithi-nakshatra', 'पंचांग'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function sbcIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? SBC_SEO_HI : SBC_SEO
}

export const JAIMINI_SEO_HI: SeoIntroProps = {
  ariaLabel: 'जैमिनी ज्योतिष — Vedaansh',
  h1: 'जैमिनी ज्योतिष — चर कारक, चर दशा और आरूढ़ पद',
  paragraphs: [
    'आपकी वैदिक कुंडली पर अलग जैमिनी कार्यक्षेत्र: आत्मकारक, चर दशा वृक्ष, जैमिनी दृष्टि, आरूढ़ लग्न, कारकांश और अर्गला — इंटरैक्टिव D1 और D9 दृश्यों के साथ।',
    'उन विद्यार्थियों और अभ्यासियों के लिए जो उसी स्विस एफ़ेमेरिस कुंडली पर पराशरी ज्योतिष के साथ जैमिनी पद्धति पढ़ते हैं।',
  ],
  h2: 'जैमिनी उपकरण',
  bullets: [
    { label: 'चर कारक', desc: 'आत्मकारक से दारकारक तक, आत्मा की रचना का सार' },
    { label: 'चर दशा', desc: 'राशि-आधारित दशा, सीधी और उलटी क्रम सहित' },
    { label: 'आरूढ़ पद', desc: 'आरूढ़ लग्न और भाव-पद कुंडली पर' },
    { label: 'जैमिनी योग', desc: 'अर्गला, द्वार और बल की तालिकाएँ' },
  ],
  relatedLinks: [
    guideLink('jaimini-atmakaraka-explained', 'आत्मकारक की व्याख्या'),
    guideLink('what-is-navamsha-d9-chart', 'नवांश (D9)'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function jaiminiIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? JAIMINI_SEO_HI : JAIMINI_SEO
}

export const ACG_SEO_HI: SeoIntroProps = {
  ariaLabel: 'वैदिक एस्ट्रोकार्टोग्राफी — Vedaansh',
  h1: 'वैदिक एस्ट्रोकार्टोग्राफी — ग्रह रेखाएँ और स्थानांतरण बल',
  paragraphs: [
    'वैदिक एस्ट्रोकार्टोग्राफी (ACG) से विश्व भर में शक्ति-स्थान खोजें: ग्रह कोणीय रेखाएँ, परिवर्तना क्षेत्र, और जन्म कुंडली से निकली स्थानांतरण-कुंडली की शक्ति।',
    'Vedaansh स्विस एफ़ेमेरिस के सायन देशांतर को भूगोल पर मानचित्रित करता है, ताकि आप कर्म, संबंध और आध्यात्मिक वृद्धि के लिए नगरों की तुलना ज्योतिष के स्थान-तर्क से कर सकें।',
  ],
  h2: 'ACG उपकरण',
  bullets: [
    { label: 'ग्रह रेखाएँ', desc: 'प्रत्येक ग्रह की लग्न, मध्याह्न, अस्त और पाताल रेखाएँ' },
    { label: 'परिवर्तना क्षेत्र', desc: 'ग्रहों के बीच परस्पर स्वागत के गलियारे' },
    { label: 'स्थानांतरण बल', desc: 'कोई नगर भाव और दिग्बल के कारकों को कैसे बदलता है' },
    { label: 'मानचित्र अन्वेषण', desc: 'संभावित स्थानों की तुलना एक संवादात्मक मानचित्र पर' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'जन्म कुंडली की मूल बातें'),
    guideLink('lahiri-ayanamsha-explained', 'लाहिरी अयनांश'),
    { href: '/guides', label: 'सभी मार्गदर्शिकाएँ' },
  ],
}

export function acgIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? ACG_SEO_HI : ACG_SEO
}
