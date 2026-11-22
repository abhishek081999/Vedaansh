// ─────────────────────────────────────────────────────────────
//  src/lib/panchang/festivalNames.hi.ts
//  Hindi names for the festival / vrat calendar (FESTIVAL_RULES ids,
//  Ekadashi names, vrat and eclipse titles). Pure data.
// ─────────────────────────────────────────────────────────────

import type { EclipseType } from '@/lib/engine/eclipses'

export const FESTIVAL_HI: Record<string, string> = {
  'chaitra-navratri': 'चैत्र नवरात्रि आरंभ',
  ugadi: 'गुड़ी पड़वा और उगादि',
  'ram-navami': 'राम नवमी',
  'hanuman-jayanti': 'हनुमान जयंती',
  'akshaya-tritiya': 'अक्षय तृतीया',
  'narasimha-jayanti': 'नृसिंह जयंती',
  'buddha-purnima': 'बुद्ध पूर्णिमा',
  'vat-savitri': 'वट सावित्री व्रत',
  'ganga-dussehra': 'गंगा दशहरा',
  'nirjala-ekadashi': 'निर्जला एकादशी',
  'rath-yatra': 'जगन्नाथ रथ यात्रा',
  'devshayani-ekadashi': 'देवशयनी एकादशी',
  'guru-purnima': 'गुरु पूर्णिमा',
  'hariyali-teej': 'हरियाली तीज',
  'nag-panchami': 'नाग पंचमी',
  'raksha-bandhan': 'रक्षा बंधन',
  janmashtami: 'कृष्ण जन्माष्टमी',
  'hartalika-teej': 'हरतालिका तीज',
  'ganesh-chaturthi': 'गणेश चतुर्थी',
  'anant-chaturdashi': 'अनंत चतुर्दशी',
  'pitru-paksha': 'पितृ पक्ष आरंभ',
  'mahalaya-amavasya': 'महालया (सर्व पितृ) अमावस्या',
  'sharad-navratri': 'शारदीय नवरात्रि आरंभ',
  'durga-ashtami': 'दुर्गा अष्टमी',
  'maha-navami': 'महा नवमी',
  dussehra: 'दशहरा (विजयादशमी)',
  'sharad-purnima': 'शरद पूर्णिमा',
  'karwa-chauth': 'करवा चौथ',
  'ahoi-ashtami': 'अहोई अष्टमी',
  dhanteras: 'धनतेरस',
  'narak-chaturdashi': 'नरक चतुर्दशी (छोटी दिवाली)',
  diwali: 'दिवाली (लक्ष्मी पूजा)',
  'govardhan-puja': 'गोवर्धन पूजा',
  'bhai-dooj': 'भाई दूज',
  'chhath-puja': 'छठ पूजा',
  'dev-uthani-ekadashi': 'देव उठनी एकादशी',
  'kartik-purnima': 'कार्तिक पूर्णिमा और देव दीपावली',
  'vivah-panchami': 'विवाह पंचमी',
  'gita-jayanti': 'गीता जयंती (मोक्षदा एकादशी)',
  'dattatreya-jayanti': 'दत्तात्रेय जयंती',
  'mauni-amavasya': 'मौनी अमावस्या',
  'vasant-panchami': 'वसंत पंचमी',
  'ratha-saptami': 'रथ सप्तमी',
  'maha-shivratri': 'महाशिवरात्रि',
  'holika-dahan': 'होलिका दहन',
  holi: 'होली',
  'makar-sankranti': 'मकर संक्रांति',
  pongal: 'पोंगल',
  baisakhi: 'बैसाखी और मेष संक्रांति',
}

/** English Ekadashi name (as in EKADASHI_NAMES) → Hindi. */
export const EKADASHI_HI: Record<string, string> = {
  Kamada: 'कामदा', Varuthini: 'वरूथिनी', Mohini: 'मोहिनी', Apara: 'अपरा',
  Nirjala: 'निर्जला', Yogini: 'योगिनी', Devshayani: 'देवशयनी', Kamika: 'कामिका',
  'Shravana Putrada': 'श्रावण पुत्रदा', Aja: 'अजा', Parsva: 'पार्श्व', Indira: 'इंदिरा',
  Papankusha: 'पापांकुशा', Rama: 'रमा', Prabodhini: 'प्रबोधिनी', Utpanna: 'उत्पन्ना',
  Mokshada: 'मोक्षदा', Saphala: 'सफला', 'Pausha Putrada': 'पौष पुत्रदा', Shattila: 'षटतिला',
  Jaya: 'जया', Vijaya: 'विजया', Amalaki: 'आमलकी', Papmochani: 'पापमोचनी',
  Padmini: 'पद्मिनी', Parama: 'परमा',
}

/** Vrat titles other than Ekadashi (finder English title → Hindi). */
export const VRAT_TITLE_HI: Record<string, string> = {
  Purnima: 'पूर्णिमा',
  Amavasya: 'अमावस्या',
  'Sankashti Chaturthi': 'संकष्टी चतुर्थी',
  'Angaraki Sankashti Chaturthi': 'अंगारकी संकष्टी चतुर्थी',
  'Pradosh Vrat': 'प्रदोष व्रत',
  'Som Pradosh': 'सोम प्रदोष',
  'Bhauma Pradosh': 'भौम प्रदोष',
  'Shani Pradosh': 'शनि प्रदोष',
}

export const VRAT_DETAIL_HI: Record<string, string> = {
  ekadashi: 'भगवान विष्णु का व्रत; पारण अगले दिन द्वादशी में सूर्योदय के बाद।',
  purnima: 'सूर्योदय पर पूर्णिमा तिथि।',
  amavasya: 'सूर्योदय पर अमावस्या तिथि; पितरों के लिए तर्पण।',
  sankashti: 'चंद्रोदय पर कृष्ण चतुर्थी; चंद्र दर्शन के बाद व्रत खोलें।',
  pradosh: 'प्रदोष काल (सूर्यास्त के बाद) में त्रयोदशी; शिव पूजा।',
}

export const ECLIPSE_TYPE_HI: Record<EclipseType, string> = {
  total: 'पूर्ण', annular: 'वलयाकार', hybrid: 'संकर', partial: 'आंशिक', penumbral: 'उपच्छाया',
}
