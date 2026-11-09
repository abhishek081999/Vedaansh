// ─────────────────────────────────────────────────────────────
//  src/lib/seo/intro-content.hi.ts
//  Hindi versions of the crawlable SEO intros in intro-content.ts.
//  Same shape and same hrefs; add a page here when its UI is
//  translated, then read it through introFor() / faqFor().
// ─────────────────────────────────────────────────────────────
import type { SeoIntroProps, SeoRelatedLink } from '@/components/seo/SeoIntro.types'
import type { AppLocale } from '@/i18n/config'
import { COMPARE_SEO, HOME_FAQ, HOME_SEO, MUHURTA_SEO, PANCHANG_CALENDAR_SEO, PANCHANG_SEO, ROADMAP_SEO } from './intro-content'

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
