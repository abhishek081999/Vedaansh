// ─────────────────────────────────────────────────────────────
//  src/i18n/jyotish.ts
//  The Jyotish glossary: one Hindi spelling for every term, shared by
//  the UI and the engine. Pure data + functions (no React, no Next),
//  so src/lib/engine/** may import it.
//
//  Engine output carries English names ('Ashwini', 'Shukla', 'Vishti').
//  termHi() maps any of those to its Hindi form; unknown names come
//  back unchanged so nothing renders blank.
// ─────────────────────────────────────────────────────────────
import type { GrahaId, Rashi } from '@/types/astrology'
import type { AppLocale } from './config'
import { SAMVATSARA_NAMES } from '@/lib/panchang/hindu-calendar'

export const GRAHA_HI: Record<GrahaId, string> = {
  Su: 'सूर्य', Mo: 'चंद्र', Ma: 'मंगल', Me: 'बुध', Ju: 'गुरु', Ve: 'शुक्र',
  Sa: 'शनि', Ra: 'राहु', Ke: 'केतु', Ur: 'अरुण (यूरेनस)', Ne: 'वरुण (नेपच्यून)', Pl: 'यम (प्लूटो)',
}

/** Short graha labels for chart cells (two Devanagari letters at most). */
export const GRAHA_SHORT_HI: Record<GrahaId, string> = {
  Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु',
  Sa: 'श', Ra: 'रा', Ke: 'के', Ur: 'अ', Ne: 'व', Pl: 'य',
}

export const RASHI_HI: Record<Rashi, string> = {
  1: 'मेष', 2: 'वृषभ', 3: 'मिथुन', 4: 'कर्क', 5: 'सिंह', 6: 'कन्या',
  7: 'तुला', 8: 'वृश्चिक', 9: 'धनु', 10: 'मकर', 11: 'कुंभ', 12: 'मीन',
}

/** Indexed 0–26, same order as NAKSHATRA_NAMES. */
export const NAKSHATRA_HI: readonly string[] = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा',
  'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा',
  'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा',
  'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती',
]

/** Short nakshatra labels for tight chart rings. Indexed 0–26. */
export const NAKSHATRA_SHORT_HI: readonly string[] = [
  'अश्वि', 'भर', 'कृत्ति', 'रोहि', 'मृग', 'आर्द्रा', 'पुन', 'पुष्य', 'आश्ले', 'मघा',
  'पू.फा', 'उ.फा', 'हस्त', 'चित्रा', 'स्वा', 'विशा', 'अनु', 'ज्ये', 'मूल', 'पू.षा',
  'उ.षा', 'श्रव', 'धनि', 'शत', 'पू.भा', 'उ.भा', 'रेव',
]

/**
 * Lunar / solar month names. Kept apart from TERMS_HI because three of
 * them share a spelling with a nakshatra (Jyeshtha, Shravana, Magha)
 * but are written differently in Hindi (ज्येष्ठ / श्रावण / माघ).
 */
const MASA_HI: Record<string, string> = {
  caitra: 'चैत्र', chaitra: 'चैत्र', vaishakha: 'वैशाख', jyeshtha: 'ज्येष्ठ', ashadha: 'आषाढ़',
  shravana: 'श्रावण', bhadrapada: 'भाद्रपद', ashvina: 'आश्विन', ashwin: 'आश्विन', karttika: 'कार्तिक',
  kartika: 'कार्तिक', margashirsha: 'मार्गशीर्ष', pausha: 'पौष', magha: 'माघ', phalguna: 'फाल्गुन',
}

export function masaHi(name: string): string {
  return MASA_HI[name.trim().toLowerCase()] ?? name
}

/** 60-year samvatsara cycle in Hindi, same order as SAMVATSARA_NAMES (1 = प्रभव). */
export const SAMVATSARA_HI: readonly string[] = [
  'प्रभव', 'विभव', 'शुक्ल', 'प्रमोद', 'प्रजापति', 'अंगिरा', 'श्रीमुख', 'भाव', 'युवा', 'धाता',
  'ईश्वर', 'बहुधान्य', 'प्रमाथी', 'विक्रम', 'वृष', 'चित्रभानु', 'सुभानु', 'तारण', 'पार्थिव', 'व्यय',
  'सर्वजित', 'सर्वधारी', 'विरोधी', 'विकृति', 'खर', 'नंदन', 'विजय', 'जय', 'मन्मथ', 'दुर्मुख',
  'हेमलंबी', 'विलंबी', 'विकारी', 'शार्वरी', 'प्लव', 'शुभकृत', 'शोभन', 'क्रोधी', 'विश्वावसु', 'पराभव',
  'प्लवंग', 'कीलक', 'सौम्य', 'साधारण', 'विरोधकृत', 'परिधावी', 'प्रमादी', 'आनंद', 'राक्षस', 'नल',
  'पिंगल', 'कालयुक्त', 'सिद्धार्थ', 'रौद्र', 'दुर्मति', 'दुंदुभि', 'रुधिरोद्गारी', 'रक्ताक्षी', 'क्रोधन', 'अक्षय',
]

export function samvatsaraHi(name: string): string {
  const i = (SAMVATSARA_NAMES as readonly string[]).findIndex((n) => n.toLowerCase() === name.trim().toLowerCase())
  return i >= 0 ? SAMVATSARA_HI[i] : name
}

/** Compact chara-karaka codes for chart badges (AK → आ.का.). */
export const KARAKA_SHORT_HI: Record<string, string> = {
  AK: 'आ.का.', AmK: 'अ.का.', BK: 'भ्रा.का.', MK: 'मा.का.', PK: 'पु.का.', PiK: 'पि.का.', GK: 'ज्ञा.का.', DK: 'दा.का.',
}

/** Nakshatra deities, index 0–26. */
export const NAKSHATRA_DEITY_HI: readonly string[] = [
  'अश्विनी कुमार', 'यम', 'अग्नि', 'ब्रह्मा / प्रजापति', 'चंद्र', 'रुद्र', 'अदिति', 'बृहस्पति', 'सर्प (नाग)', 'पितृ',
  'भग', 'अर्यमा', 'सविता (सूर्य)', 'त्वष्टा / विश्वकर्मा', 'वायु', 'इंद्र-अग्नि', 'मित्र', 'इंद्र', 'निर्ऋति', 'आपः (जल)',
  'विश्वेदेव', 'विष्णु', 'अष्ट वसु', 'वरुण', 'अज एकपाद', 'अहिर्बुध्न्य', 'पूषा',
]

/** Nakshatra symbols, index 0–26. */
export const NAKSHATRA_SYMBOL_HI: readonly string[] = [
  'अश्व का मुख', 'योनि', 'उस्तरा / अग्निशिखा', 'शकट / रथ', 'मृग का मुख', 'अश्रु-बिंदु / हीरा', 'धनुष और तूणीर', 'पुष्प (कमल)',
  'कुंडली मारे सर्प', 'राजसभा', 'पलंग', 'अंजीर वृक्ष / शय्या', 'हाथ (खुली हथेली)', 'मोती / दीपक', 'प्रवाल / अग्निशिखा',
  'कुम्हार का चाक', 'छत्र / वितान', 'छत्र / कुंडल', 'हाथी का अंकुश', 'पंखा / दाँत', 'हाथी दाँत / शय्या', 'कान (श्रवण)',
  'मृदंग', '100 तारे / रिक्त वृत्त', 'तलवार / अर्थी के आगे के दो पाए', 'जल में सर्प / अर्थी के पीछे के दो पाए', 'मृदंग / जल में मछली',
]

/** Avakahada naming syllables per nakshatra pada, index 0–26 × pada 1–4. */
export const PADA_SOUNDS_HI: readonly (readonly string[])[] = [
  ['चू', 'चे', 'चो', 'ला'], ['ली', 'लू', 'ले', 'लो'], ['अ', 'इ', 'उ', 'ए'], ['ओ', 'वा', 'वी', 'वू'],
  ['वे', 'वो', 'का', 'की'], ['कु', 'घ', 'ङ', 'छ'], ['के', 'को', 'हा', 'ही'], ['हु', 'हे', 'हो', 'डा'],
  ['डी', 'डू', 'डे', 'डो'], ['मा', 'मी', 'मू', 'मे'], ['मो', 'टा', 'टी', 'टू'], ['टे', 'टो', 'पा', 'पी'],
  ['पू', 'ष', 'ण', 'ठ'], ['पे', 'पो', 'रा', 'री'], ['रू', 'रे', 'रो', 'ता'], ['ती', 'तू', 'ते', 'तो'],
  ['ना', 'नी', 'नू', 'ने'], ['नो', 'या', 'यी', 'यू'], ['ये', 'यो', 'भा', 'भी'], ['भू', 'धा', 'फा', 'ढा'],
  ['भे', 'भो', 'जा', 'जी'], ['जू', 'जे', 'जो', 'खी'], ['खू', 'खे', 'खो', 'गा'], ['गो', 'सा', 'सी', 'सू'],
  ['से', 'सो', 'दा', 'दी'], ['दू', 'थ', 'झ', 'ञ'], ['दे', 'दो', 'चा', 'ची'],
]

/** House (bhava) names, index 1–12. */
export const BHAVA_HI: Record<number, string> = {
  1: 'प्रथम भाव (लग्न)', 2: 'द्वितीय भाव (धन)', 3: 'तृतीय भाव (पराक्रम)', 4: 'चतुर्थ भाव (सुख)',
  5: 'पंचम भाव (संतान)', 6: 'षष्ठ भाव (रोग-शत्रु)', 7: 'सप्तम भाव (विवाह)', 8: 'अष्टम भाव (आयु)',
  9: 'नवम भाव (भाग्य)', 10: 'दशम भाव (कर्म)', 11: 'एकादश भाव (लाभ)', 12: 'द्वादश भाव (व्यय)',
}

export const VAAR_HI: readonly string[] = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']

/**
 * English spelling (as the engine emits it) → Hindi. Covers panchang
 * elements, dasha systems and the common chart vocabulary. Keys are
 * matched case-insensitively.
 */
const TERMS_HI: Record<string, string> = {
  // Graha (English + Sanskrit spellings)
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र',
  Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु', Uranus: 'अरुण', Neptune: 'वरुण', Pluto: 'यम',
  Surya: 'सूर्य', Chandra: 'चंद्र', Mangala: 'मंगल', Budha: 'बुध', Guru: 'गुरु', Shukra: 'शुक्र', Shani: 'शनि',
  // Rashi (English + Sanskrit spellings)
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या',
  Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
  Mesha: 'मेष', Vrishabha: 'वृषभ', Mithuna: 'मिथुन', Karka: 'कर्क', Simha: 'सिंह', Kanya: 'कन्या',
  Tula: 'तुला', Vrishcika: 'वृश्चिक', Vrishchika: 'वृश्चिक', Vrischika: 'वृश्चिक', Dhanu: 'धनु', Makara: 'मकर', Kumbha: 'कुंभ', Mina: 'मीन', Meena: 'मीन',
  // Nakshatra
  Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका', Rohini: 'रोहिणी', Mrigashira: 'मृगशिरा',
  Ardra: 'आर्द्रा', Punarvasu: 'पुनर्वसु', Pushya: 'पुष्य', Ashlesha: 'आश्लेषा', Magha: 'मघा',
  'Purva Phalguni': 'पूर्व फाल्गुनी', 'Uttara Phalguni': 'उत्तर फाल्गुनी', Hasta: 'हस्त', Chitra: 'चित्रा', Swati: 'स्वाति',
  Vishakha: 'विशाखा', Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा', Mula: 'मूल', 'Purva Ashadha': 'पूर्वाषाढ़ा',
  'Uttara Ashadha': 'उत्तराषाढ़ा', Shravana: 'श्रवण', Dhanishtha: 'धनिष्ठा', Shatabhisha: 'शतभिषा',
  'Purva Bhadra': 'पूर्व भाद्रपद', 'Uttara Bhadra': 'उत्तर भाद्रपद', 'Purva Bhadrapada': 'पूर्व भाद्रपद',
  'Uttara Bhadrapada': 'उत्तर भाद्रपद', Revati: 'रेवती', Abhijit: 'अभिजित',
  // Tithi
  Pratipada: 'प्रतिपदा', Dwitiya: 'द्वितीया', Tritiya: 'तृतीया', Chaturthi: 'चतुर्थी', Panchami: 'पंचमी',
  Shashthi: 'षष्ठी', Saptami: 'सप्तमी', Ashtami: 'अष्टमी', Navami: 'नवमी', Dashami: 'दशमी',
  Ekadashi: 'एकादशी', Dwadashi: 'द्वादशी', Trayodashi: 'त्रयोदशी', Chaturdashi: 'चतुर्दशी',
  Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या',
  Shukla: 'शुक्ल', Krishna: 'कृष्ण', 'Shukla Paksha': 'शुक्ल पक्ष', 'Krishna Paksha': 'कृष्ण पक्ष', Paksha: 'पक्ष',
  // Nitya yoga
  Vishkambha: 'विष्कुंभ', Priti: 'प्रीति', Ayushman: 'आयुष्मान', Saubhagya: 'सौभाग्य', Shobhana: 'शोभन',
  Atiganda: 'अतिगंड', Sukarma: 'सुकर्मा', Dhriti: 'धृति', Shula: 'शूल', Ganda: 'गंड',
  Vriddhi: 'वृद्धि', Dhruva: 'ध्रुव', Vyaghata: 'व्याघात', Harshana: 'हर्षण', Vajra: 'वज्र',
  Siddhi: 'सिद्धि', Vyatipata: 'व्यतीपात', Variyan: 'वरीयान', Parigha: 'परिघ', Shiva: 'शिव',
  Siddha: 'सिद्ध', Sadhya: 'साध्य', Shubha: 'शुभ', Brahma: 'ब्रह्म', Indra: 'इंद्र', Vaidhriti: 'वैधृति',
  // Karana
  Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव', Taitila: 'तैतिल', Garija: 'गर', Vanija: 'वणिज',
  Vishti: 'विष्टि (भद्रा)', Kimstughna: 'किंस्तुघ्न', Shakuni: 'शकुनि', Chatushpada: 'चतुष्पद', Naga: 'नाग',
  // Ritu and ayana
  Vasanta: 'वसंत', Grishma: 'ग्रीष्म', Varsha: 'वर्षा', Sharad: 'शरद', Hemanta: 'हेमंत', Shishira: 'शिशिर',
  Uttarayana: 'उत्तरायण', Dakshinayana: 'दक्षिणायन',
  Bhadra: 'भद्रा',
  // Koota / nakshatra traits
  Vata: 'वात', Pitta: 'पित्त', Kapha: 'कफ', Brahmin: 'ब्राह्मण', Kshatriya: 'क्षत्रिय', Vaishya: 'वैश्य', Shudra: 'शूद्र',
  Mleccha: 'म्लेच्छ', Human: 'नर (मानव)', Quadruped: 'चतुष्पद', Water: 'जलचर', Insect: 'कीट', 'Wild Animal': 'वनचर',
  Fire: 'अग्नि', Earth: 'पृथ्वी', Air: 'वायु', Sthira: 'स्थिर', Mixed: 'मिश्र', Mridu: 'मृदु', Tikshna: 'तीक्ष्ण', Ugra: 'उग्र',
  'Aadi (Vata / Sushumna)': 'आदि (वात / सुषुम्ना)', 'Madhya (Pitta / Pingala)': 'मध्य (पित्त / पिंगला)', 'Antya (Kapha / Ida)': 'अंत्य (कफ / इड़ा)',
  'Swarna (Gold)': 'स्वर्ण', 'Rajata (Silver)': 'रजत', 'Tamra (Copper)': 'ताम्र', 'Lauha (Iron)': 'लौह',
  Day: 'दिन', Night: 'रात्रि',
  Horse: 'अश्व', Elephant: 'गज', Goat: 'मेष (बकरा)', Serpent: 'सर्प', Dog: 'श्वान', Cat: 'मार्जार', Rat: 'मूषक', Cow: 'गौ',
  Buffalo: 'महिष', Tiger: 'व्याघ्र', Hare: 'मृग (शशक)', Monkey: 'वानर', Mongoose: 'नकुल', Lion: 'सिंह', Fish: 'मत्स्य',
  // Chara karakas
  Bhratrikaraka: 'भ्रातृकारक', Matrikaraka: 'मातृकारक', Putrakaraka: 'पुत्रकारक', Gnatikaraka: 'ज्ञातिकारक',
  Pitrikaraka: 'पितृकारक', AK: 'आत्मकारक', AmK: 'अमात्यकारक', BK: 'भ्रातृकारक', MK: 'मातृकारक', PK: 'पुत्रकारक',
  GK: 'ज्ञातिकारक', DK: 'दारकारक', PiK: 'पितृकारक',
  // Avasthas
  Bala: 'बाल', Kumara: 'कुमार', Yuva: 'युवा', Vriddha: 'वृद्ध', Mrita: 'मृत', Jagrat: 'जाग्रत', Swapna: 'स्वप्न', Sushupti: 'सुषुप्ति',
  // Natal yoga names
  'Raja Yoga': 'राज योग', 'Dhana Yoga': 'धन योग', 'Gaja Kesari Yoga': 'गजकेसरी योग', 'Gajakesari Yoga': 'गजकेसरी योग',
  'Budhaditya Yoga': 'बुधादित्य योग', 'Hamsa Yoga': 'हंस योग', 'Malavya Yoga': 'मालव्य योग', 'Ruchaka Yoga': 'रुचक योग',
  'Bhadra Yoga': 'भद्र योग', 'Shasha Yoga': 'शश योग', 'Viparita Raja Yoga': 'विपरीत राज योग', 'Neecha Bhanga Raja Yoga': 'नीचभंग राज योग',
  // Upagrahas
  Dhuma: 'धूम', Parivesha: 'परिवेष', Indrachapa: 'इंद्रचाप', Upaketu: 'उपकेतु', Gulika: 'गुलिक', Mandi: 'मांदि',
  Kala: 'काल', Mrityu: 'मृत्यु', Yamaghantaka: 'यमघंटक', Ardhaprahara: 'अर्धप्रहर',
  // Choghadiya
  Udveg: 'उद्वेग', Chal: 'चल', Labh: 'लाभ', Amrit: 'अमृत', Rog: 'रोग', Kaal: 'काल', Shubh: 'शुभ', Char: 'चर',
  // Tara bala
  Janma: 'जन्म', Sampat: 'संपत्', Vipat: 'विपत्', Kshema: 'क्षेम', Pratyak: 'प्रत्यरि', Sadhana: 'साधक',
  Naidhana: 'नैधन', Mitra: 'मित्र', Atimitra: 'अतिमित्र', 'Ati-mitra': 'अतिमित्र',
  Pratyari: 'प्रत्यरि', Sadhaka: 'साधक', Vadha: 'वध', 'Ati-Mitra': 'अतिमित्र',
  // Weekday Sanskrit names
  Ravivara: 'रविवार', Somavara: 'सोमवार', Mangalavara: 'मंगलवार', Budhavara: 'बुधवार',
  Guruvara: 'गुरुवार', Shukravara: 'शुक्रवार', Shanivara: 'शनिवार',
  // Weekdays
  Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार',
  Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार',
  // Dasha systems and periods
  Vimshottari: 'विंशोत्तरी', Yogini: 'योगिनी', Ashtottari: 'अष्टोत्तरी', 'Chara Dasha': 'चर दशा',
  Mahadasha: 'महादशा', Antardasha: 'अंतर्दशा', Pratyantardasha: 'प्रत्यंतर्दशा', Dasha: 'दशा',
  // Core vocabulary
  Lagna: 'लग्न', Ascendant: 'लग्न', Bhava: 'भाव', House: 'भाव', Graha: 'ग्रह', Planet: 'ग्रह',
  Rashi: 'राशि', Sign: 'राशि', Nakshatra: 'नक्षत्र', Pada: 'पद', Tithi: 'तिथि', Yoga: 'योग', Karana: 'करण',
  Vaar: 'वार', Vara: 'वार', Panchang: 'पंचांग', Muhurta: 'मुहूर्त', Kundali: 'कुंडली', Navamsha: 'नवांश',
  Varga: 'वर्ग', Gochar: 'गोचर', Transit: 'गोचर', Retrograde: 'वक्री', Combust: 'अस्त',
  Exalted: 'उच्च', Debilitated: 'नीच', 'Own Sign': 'स्वराशि', Moolatrikona: 'मूलत्रिकोण',
  Friend: 'मित्र', Enemy: 'शत्रु', Neutral: 'सम', 'Great Friend': 'अधिमित्र', 'Great Enemy': 'अधिशत्रु',
  Kendra: 'केंद्र', Trikona: 'त्रिकोण', Dusthana: 'दुःस्थान', Upachaya: 'उपचय',
  Benefic: 'शुभ ग्रह', Malefic: 'पाप ग्रह', Auspicious: 'शुभ', Inauspicious: 'अशुभ',
  Sunrise: 'सूर्योदय', Sunset: 'सूर्यास्त', Moonrise: 'चंद्रोदय', Moonset: 'चंद्रास्त',
  'Rahu Kalam': 'राहु काल', 'Rahu Kaal': 'राहु काल', Yamaganda: 'यमगंड', 'Gulika Kalam': 'गुलिक काल',
  'Abhijit Muhurta': 'अभिजित मुहूर्त', Choghadiya: 'चौघड़िया', Hora: 'होरा',
  Ayanamsha: 'अयनांश', 'Sade Sati': 'साढ़े साती', Manglik: 'मांगलिक', Dosha: 'दोष', Upay: 'उपाय', Remedy: 'उपाय',
  Ashtakavarga: 'अष्टकवर्ग', Shadbala: 'षड्बल', Atmakaraka: 'आत्मकारक', Amatyakaraka: 'अमात्यकारक',
  Darakaraka: 'दारकारक', Arudha: 'आरूढ़', 'Arudha Lagna': 'आरूढ़ लग्न', Upapada: 'उपपद',
  Varshaphal: 'वर्षफल', Prashna: 'प्रश्न', 'Kundali Milan': 'कुंडली मिलान', Ashtakoot: 'अष्टकूट', Guna: 'गुण',
  Varna: 'वर्ण', Vashya: 'वश्य', Tara: 'तारा', Yoni: 'योनि', 'Graha Maitri': 'ग्रह मैत्री',
  Gana: 'गण', Bhakoot: 'भकूट', Nadi: 'नाड़ी', Deva: 'देव', Manushya: 'मनुष्य', Rakshasa: 'राक्षस',
}

const TERMS_HI_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(TERMS_HI).map(([k, v]) => [k.toLowerCase(), v]),
)

/** Hindi form of an English/Sanskrit Jyotish term; unknown terms come back unchanged. */
export function termHi(term: string): string {
  return TERMS_HI_LOWER[term.trim().toLowerCase()] ?? term
}

/** Locale-aware term lookup: English stays as the engine wrote it. */
export function term(termEn: string, locale: AppLocale): string {
  return locale === 'hi' ? termHi(termEn) : termEn
}

export function grahaName(id: GrahaId, locale: AppLocale, englishName: string): string {
  return locale === 'hi' ? GRAHA_HI[id] ?? englishName : englishName
}

export function rashiName(rashi: Rashi, locale: AppLocale, englishName: string): string {
  return locale === 'hi' ? RASHI_HI[rashi] ?? englishName : englishName
}

export function nakshatraName(index: number, locale: AppLocale, englishName: string): string {
  return locale === 'hi' ? NAKSHATRA_HI[index] ?? englishName : englishName
}

/** Every glossary entry, for the glossary test. */
export function glossaryEntries(): ReadonlyArray<readonly [string, string]> {
  return Object.entries(TERMS_HI)
}
