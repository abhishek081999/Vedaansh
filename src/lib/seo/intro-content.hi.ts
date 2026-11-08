// ─────────────────────────────────────────────────────────────
//  src/lib/seo/intro-content.hi.ts
//  Hindi versions of the crawlable SEO intros in intro-content.ts.
//  Same shape and same hrefs; add a page here when its UI is
//  translated, then read it through introFor() / faqFor().
// ─────────────────────────────────────────────────────────────
import type { SeoIntroProps, SeoRelatedLink } from '@/components/seo/SeoIntro.types'
import type { AppLocale } from '@/i18n/config'
import { HOME_FAQ, HOME_SEO, PANCHANG_CALENDAR_SEO, PANCHANG_SEO } from './intro-content'

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

export function panchangIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? PANCHANG_SEO_HI : PANCHANG_SEO
}

export function panchangCalendarIntro(locale: AppLocale): SeoIntroProps {
  return locale === 'hi' ? PANCHANG_CALENDAR_SEO_HI : PANCHANG_CALENDAR_SEO
}
