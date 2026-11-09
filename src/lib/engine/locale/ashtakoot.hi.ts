// Hindi user-facing strings for src/lib/engine/ashtakoot.ts
// Ids, points, bands and enums stay English; overlay string fields only.

import type { AshtakootResult, KootaKey, KootaScore } from '@/lib/engine/ashtakoot'
import { termHi } from '@/i18n/jyotish'
import { fill } from '@/lib/engine/lang'

export const KOOTA_MEANINGS_HI: Record<KootaKey, string> = {
  varna: 'आध्यात्मिक और अहंकार-मेल (स्थिति और मूल्यों पर दृष्टिकोण)',
  vashya: 'परस्पर प्रभाव और संबंध में देना-लेना',
  tara: 'साझा भाग्य और ऊर्जा संतुलन',
  yoni: 'शारीरिक निकटता की शैली और स्वाभाविक मेल',
  maitri: 'चंद्र-राशि स्वामियों से भावनात्मक मित्रता',
  gana: 'स्वभाव और प्रतिक्रिया के पैटर्न',
  bhakoot: 'जीवन-दृष्टि, साझा भाग्य और चुनौतियों का सामना',
  nadi: 'जीवन-शक्ति, स्वास्थ्य और परिवार-जीवन',
}

const VARNA_PSYCH_HI: Record<string, string> = {
  Brahmin: 'विचारशील, भावनात्मक रूप से अनुकूलनशील, भीतरी आध्यात्मिक दिशा (जल)।',
  Kshatriya: 'नेतृत्व, सहनशीलता और दबाव में साहस (अग्नि); शक्ति आक्रामकता नहीं, स्थिरता के रूप में दिखती है।',
  Vaishya: 'व्यावहारिक, कूटनीतिक, लक्ष्य-संचालित; काम पूरे करने वाले (पृथ्वी)।',
  Shudra: 'सेवा-भावी, सामाजिक और सहानुभूतिपूर्ण; लोगों को जोड़ने में निपुण (वायु)।',
}

const GANA_PSYCH_HI: Record<string, string> = {
  Deva: 'शांत, कोमल, संयत प्रतिक्रिया-पैटर्न।',
  Manushya: 'संयम और तीव्रता के बीच संतुलित स्वभाव।',
  Rakshasa: 'तीव्र, मुखर, उच्च-ऊर्जा प्रतिक्रियाएँ।',
}

const YONI_PSYCH_HI: Record<string, string> = {
  Horse: 'स्वतंत्र निकटता; स्थान और गति चाहिए।',
  Elephant: 'स्थिर, मापा हुआ, परिपक्व स्नेह।',
  Sheep: 'दृढ़, क्षेत्रीय गर्माहट।',
  Serpent: 'तीव्र, निजी, रूपांतरकारी बंधन।',
  Dog: 'वफादार, रक्षक, आसक्ति-उन्मुख।',
  Cat: 'स्वतंत्र स्नेह; चुनिंदा निकटता।',
  Rat: 'जिज्ञासु, अनुकूलनशील शारीरिक रसायन।',
  Cow: 'पोषणकारी, स्थिर, परिवार-केंद्रित स्नेह।',
  Buffalo: 'दृढ़ इच्छा, रक्षात्मक गर्माहट।',
  Tiger: 'उत्साही, प्रबल शारीरिक उपस्थिति।',
  Hare: 'कोमल, संवेदनशील, संकोची निकटता।',
  Monkey: 'चंचल, बेचैन, विविधता चाहने वाला बंधन।',
  Lion: 'गर्वीला, आत्मविश्वासी इच्छा-अभिव्यक्ति।',
  Mongoose: 'सतर्क, सावधान, रणनीतिक निकटता।',
}

/** Exact English note → Hindi (dynamic lines use fill below). */
export const ASHTAKOOT_NOTES_HI: Record<string, string> = {
  'Fire + Water: the Water (Brahmin) partner may feel their own voice fade if the Fire partner dominates.':
    'अग्नि + जल: जल (ब्राह्मण) साथी को लग सकता है कि अग्नि साथी के सामने उनकी आवाज़ दब जाती है।',
  'Fire + Fire: egos may clash unless both soften.':
    'अग्नि + अग्नि: दोनों नरम न हों तो अहंकार टकरा सकते हैं।',
  'Bride-to-groom distance 1–9: traditionally the Ashubh (less favourable) energy band.':
    'वधू से वर की दूरी 1–9: पारंपरिक रूप से अशुभ (कम अनुकूल) ऊर्जा-बैंड।',
  'Bride-to-groom distance 10–18: the Madhyam (medium) luck band.':
    'वधू से वर की दूरी 10–18: मध्यम भाग्य-बैंड।',
  'Bride-to-groom distance above 18: the Shubh (favourable) luck band.':
    'वधू से वर की दूरी 18 से अधिक: शुभ भाग्य-बैंड।',
  'Same Moon rashi: considered Shubh for Bhakoot (worth confirming the nakshatra and pada differ).':
    'समान चंद्र-राशि: भकूट के लिए शुभ माना जाता है (नक्षत्र और पद भिन्न हों — पुष्टि करें)।',
  'Dwi-Dwadash (2–12, Moon signs next to each other) cancelled: the sign lords are natural friends or an exempt pair.':
    'द्वि-द्वादश (2–12) निरस्त: राशि-स्वामी स्वाभाविक मित्र या छूट-युग्म हैं।',
  "Dwi-Dwadash (2–12): the groom's Moon is 2nd from the bride's Moon, traditionally seen as less favourable.":
    'द्वि-द्वादश (2–12): वर का चंद्र वधू के चंद्र से दूसरे में — पारंपरिक रूप से कम अनुकूल।',
  "Dwi-Dwadash (2–12): the groom's Moon is 12th from the bride's Moon. This direction is milder, though classical scoring still gives 0.":
    'द्वि-द्वादश (2–12): वर का चंद्र वधू से बारहवें में — दिशा हल्की है, फिर भी शास्त्रीय अंक 0।',
  "Nav-Pancham (5–9): the groom's Moon is 5th from the bride's, treated as an acceptable exception (the concern about children is reduced).":
    'नव-पंचम (5–9): वर का चंद्र वधू से पाँचवें में — स्वीकार्य अपवाद; संतान-चिंता कम मानी जाती है।',
  "Nav-Pancham (5–9): the groom's Moon is 9th from the bride's. Classically this touches Santana (children) and scores 0; it is a tendency, not a prediction.":
    'नव-पंचम (5–9): वर का चंद्र वधू से नवें में — शास्त्रीय रूप से संतान से जुड़ा और 0 अंक; प्रवृत्ति है, भविष्यवाणी नहीं।',
  'Shadashtak (6–8) cancelled: the sign lords are the same or friendly, so the usual health and serious-loss themes of this pairing are set aside.':
    'षडष्टक (6–8) निरस्त: स्वामी समान या मित्र; स्वास्थ्य और भारी हानि के विषय सामान्यतः टाले जाते हैं।',
  'Shadashtak (6–8): the two moons sit 6/8 apart, a pull that can feel like constant friction. Classically it is linked with health and serious-loss themes and scores 0.':
    'षडष्टक (6–8): दोनों चंद्र 6/8 पर — निरंतर घर्षण जैसा खिंचाव; स्वास्थ्य और भारी हानि से जुड़कर 0 अंक।',
  'Chatur-Dash (4–10) Daridra Yoga pair: money matters may need joint planning even when Bhakoot points are full.':
    'चतुर-दश (4–10) दारिद्र योग युग्म: भकूट पूर्ण होने पर भी धन के लिए संयुक्त योजना उपयोगी।',
  'Bhakoot dosha is often set aside when Nadi is clear, Tara is Shubh, or Vashya and Nadi score well; Stage 2 looks at this further.':
    'नाड़ी स्पष्ट, तारा शुभ या वश्य–नाड़ी मजबूत होने पर भकूट दोष अक्सर टाला जाता है; चरण 2 आगे देखता है।',
  "The groom's nakshatra is immediately after the bride's, which traditions treat as a sensitive pairing at the nakshatra level.":
    'वर का नक्षत्र वधू के ठीक बाद — परंपरा में नक्षत्र-स्तर पर संवेदनशील युग्म।',
  'Nadi Dosha cancelled: same Moon rashi, different nakshatra.':
    'नाड़ी दोष निरस्त: समान चंद्र-राशि, भिन्न नक्षत्र।',
  'Nadi Dosha cancelled: same nakshatra, different rashi.':
    'नाड़ी दोष निरस्त: समान नक्षत्र, भिन्न राशि।',
  'Nadi Dosha cancelled: same nakshatra, different charan/pada.':
    'नाड़ी दोष निरस्त: समान नक्षत्र, भिन्न चरण/पद।',
  'Same Nadi (Nadi Dosha): the two vital-energy types are alike rather than complementary, which tradition links with concern for children’s vitality. Cancellation rules and a routine health check are worth considering.':
    'समान नाड़ी (नाड़ी दोष): दोनों की जीवन-ऊर्जा समान, पूरक नहीं — परंपरा बच्चों की जीवन-शक्ति से जोड़ती है। निरस्तीकरण नियम और सामान्य स्वास्थ्य जाँच पर विचार करें।',
}

const GANA_SCHOOL_HI: Record<string, string> = {
  classical: 'शास्त्रीय',
  parampara: 'परंपरा',
}

function trTerm(s: string): string {
  return termHi(s)
}

function translateNote(note: string): string {
  if (note in ASHTAKOOT_NOTES_HI) return ASHTAKOOT_NOTES_HI[note]!
  if (note.startsWith('Rashi relation ')) {
    const m = note.match(/^Rashi relation (\d+)\/(\d+): Shubh for Bhakoot\.$/)
    if (m) return fill('राशि संबंध {a}/{b}: भकूट के लिए शुभ।', { a: m[1]!, b: m[2]! })
  }
  if (note.startsWith('Gana school: ')) {
    const school = note.slice('Gana school: '.length)
    return fill('गण पद्धति: {school}', { school: GANA_SCHOOL_HI[school] ?? school })
  }
  return note
}

function buildInsightHi(key: KootaKey, raw: KootaScore & { dosha?: boolean }): string {
  if (key === 'varna') {
    return `${VARNA_PSYCH_HI[raw.p1] ?? ''} ↔ ${VARNA_PSYCH_HI[raw.p2] ?? ''}`.trim()
  }
  if (key === 'gana') {
    return `${GANA_PSYCH_HI[raw.p1] ?? ''} ↔ ${GANA_PSYCH_HI[raw.p2] ?? ''}`.trim()
  }
  if (key === 'yoni') {
    return `${YONI_PSYCH_HI[raw.p1] ?? ''} ↔ ${YONI_PSYCH_HI[raw.p2] ?? ''}`.trim()
  }
  if (key === 'vashya') {
    if (raw.points === 2) return 'संतुलित प्रभाव; कोई एक स्वाभाविक रूप से दूसरे पर हावी नहीं।'
    if (raw.points === 0) return 'प्रभाव में तीव्र असंतुलन (जैसे वन्य पर जल); समान अधिकार की जगह बनाना सहायक।'
    return 'आंशिक संतुलन; एक साथी अधिक अगुवाई कर सकता है।'
  }
  if (key === 'tara') {
    if (raw.points >= 3) return 'दोनों तारा-दिशाएँ शुभ — भाग्य और प्रयास एक-दूसरे का सहारा बन सकते हैं।'
    if (raw.points === 0) return 'दोनों दिशाएँ अशुभ (विपत्/प्रत्यरि/वध) — सचेत प्रयास के बिना थका दे सकता है।'
    return 'एक दिशा में तारा-सहारा — भाग्य और प्रयास का मिश्रित संतुलन।'
  }
  if (key === 'maitri') {
    if (raw.points >= 4) return 'चंद्र-राशि स्वामी मित्र हैं — भावनात्मक मेल स्वाभाविक आता है।'
    if (raw.points <= 1) return 'चंद्र-स्वामी स्वाभाविक मित्र नहीं — मित्रता सचेत प्रयास से बढ़ती है।'
    return 'भावनात्मक मित्रता तटस्थ — साझा लक्ष्यों पर अच्छी चलती है।'
  }
  if (key === 'bhakoot') {
    if (raw.points === 7) return 'जीवन-दिशा और भाग्य-पथ समरेखित (भकूट स्पष्ट)।'
    return 'भकूट दोष: जीवन-दिशाएँ सचेत संरेखण चाह सकती हैं। कई मामलों में अपवाद; चरण 2 आगे देखता है।'
  }
  if (key === 'nadi') {
    const sameNadi = raw.p1 === raw.p2
    if (sameNadi) {
      if (raw.points === 8) {
        return 'समान नाड़ी तथा शास्त्रीय निरस्तीकरण: अंक बहाल, फिर भी कई परंपराएँ बच्चों से पहले सावधानी और सामान्य स्वास्थ्य जाँच सुझाती हैं।'
      }
      return 'समान नाड़ी (नाड़ी दोष): जीवन-ऊर्जा समान, पूरक नहीं। सावधानी, निरस्तीकरण और स्वास्थ्य जाँच पर विचार करें।'
    }
    return 'भिन्न नाड़ी: जीवन-ऊर्जाएँ पूरक हैं — अनुकूल।'
  }
  return raw.insight
}

function localizeKoota(key: KootaKey, k: KootaScore): KootaScore {
  const notes = k.notes?.map(translateNote)
  const p1En = k.p1
  const p2En = k.p2
  const base = { ...k, p1: trTerm(k.p1), p2: trTerm(k.p2), meaning: KOOTA_MEANINGS_HI[key], notes }
  const insight = buildInsightHi(key, { ...k, p1: p1En, p2: p2En })
  return { ...base, insight }
}

function localizeEligibility(e: AshtakootResult['eligibility']): AshtakootResult['eligibility'] {
  if (e.band === 'below_minimum') {
    return {
      ...e,
      label: 'पारंपरिक न्यूनतम से नीचे',
      detail:
        '18 से कम गुण पारंपरिक आराम-सीमा से नीचे हैं, पर गुण केवल एक परत हैं — मजबूत चार्ट-संबंध वाले अनेक जोड़े अच्छा करते हैं (चरण 2–3 वहीं देखते हैं)।',
    }
  }
  if (e.band === 'above_ideal') {
    const label = e.label.startsWith('36/36') ? '36/36 गुण (सावधानी)' : 'अत्यधिक उच्च गुण (सावधानी)'
    const detail =
      e.label.startsWith('36/36')
        ? 'पूर्ण 36 अधिकतम है; 32 से ऊपर कई परंपराएँ बहुत समान पढ़ती हैं। नाड़ी भिन्न हो पुष्टि करें — समान नाड़ी सबसे भारी कूट-चिंता रहती है भले अपवाद अंक दे।'
        : '32 से ऊपर: कुछ परंपराएँ इसे बहुत समान मानती हैं। नाड़ी भिन्न पुष्टि करें; D1/D9 और शुक्र–मंगल (चरण 3) देखें।'
    return { ...e, label, detail }
  }
  return {
    ...e,
    label: 'अनुकूल पात्रता-बैंड (18–32)',
    detail: 'सामान्य 18–32 सीमा में। D1/D9 और शुक्र–मंगल (चरण 3) और विवरण देते हैं।',
  }
}

/** Overlay Hindi on a freshly built English AshtakootResult. */
export function localizeAshtakootResult(en: AshtakootResult): AshtakootResult {
  const keys: KootaKey[] = ['varna', 'vashya', 'tara', 'yoni', 'maitri', 'gana', 'bhakoot', 'nadi']
  const kootas = Object.fromEntries(keys.map((k) => [k, localizeKoota(k, en[k])])) as Pick<
    AshtakootResult,
    KootaKey
  >

  const v = kootas.varna
  const g = kootas.gana
  const y = kootas.yoni

  return {
    ...en,
    ...kootas,
    eligibility: localizeEligibility(en.eligibility),
    layers: {
      psychology: fill('वर्ण ({v1}/{v2}), गण ({g1}/{g2}) और ग्रह मैत्री दिखाते हैं कि मन और स्वभाव कितना मेल खाते हैं।', {
        v1: v.p1,
        v2: v.p2,
        g1: g.p1,
        g2: g.p2,
      }),
      energy: fill('तारा, योनि ({y1}/{y2}), वश्य और नाड़ी जीवन-शक्ति, निकटता और परस्पर प्रभाव बताते हैं।', {
        y1: y.p1,
        y2: y.p2,
      }),
      karma:
        'भकूट और समग्र गुण-बैंड साझा जीवन-पथ दर्शाते हैं। कम गुण योग भी चल सकता है जब व्यापक चार्ट-संबंध मजबूत हों (चरण 2–3)।',
    },
    disclaimer:
      'अष्टकूट केवल चंद्र और नक्षत्र (चरण 1) देखता है। 32 से ऊपर (36 सहित) कभी-कभी बहुत समान पढ़ा जाता है; समान नाड़ी सबसे भारी कूट-चिंता रहती है भले अपवाद अंक दे। D1/D9 और शुक्र–मंगल संदर्भ देते हैं; यह संबंध की भविष्यवाणी नहीं है।',
  }
}
