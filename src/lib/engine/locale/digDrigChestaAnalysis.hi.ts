// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/digDrigChestaAnalysis.hi.ts
//  Hindi display text for Dig / Drig / Cheshta analysis. Ids,
//  bands, tones and graha codes stay English on the result.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { SignModality } from '@/lib/engine/dashamsaClassical'
import type {
  ChestaPlanetRow,
  DigDrigChestaAnalysis,
  DigDrigChestaPrediction,
  DigPlanetRow,
  DrigPlanetRow,
  SoftBand,
} from '@/lib/engine/digDrigChestaAnalysis'

type ThemeGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

function g(id: string): string {
  return id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : id
}

const DIG_NOTE: Record<SoftBand, string> = {
  strong: 'दिशा की स्पष्ट चाल — कहाँ जाना है इस पर प्रतिबद्ध (हठी भी); यह प्रमाण नहीं कि मार्ग सही है।',
  baseline: 'मध्यम दिशा-बोध — उद्देश्य है, पर दबाव में धुंधला हो सकता है।',
  weak: 'दिशा को लेकर भ्रम — गुरुजन खोजें, तूफान थमने दें, कहें कि आपको सोचने का समय चाहिए।',
}

const DIG_REMEDY =
  'दिशा के लिए गुरुजन और परामर्शदाता से पूछें; गुरु का दिग् बल निर्बल हो तो गुरु को सम्मान और दान; भ्रम के तूफान में शरण लें; तैयारी न छोड़ें — स्पष्टता की प्रतीक्षा करें।'

const DRIG_NEG =
  'ग्रह का रत्न (संयम से), दान, गणेश और शिव अभिषेक, विनम्र और सात्त्विक रहें, विशेष अवसरों के लिए ही मुहूर्त देखें।'

const DRIG_POS =
  'सकारात्मक संगति रखें; प्रबल दिग् को काटने वाली संगति से बचें — दृग् दिखाता है कौन आपको बढ़ाता या रोकता है।'

const DRIG_NOTE = {
  positive: 'संगति आपको और करने को धकेलती है — प्रोत्साहन और बढ़ाने वाली संगति।',
  negative: 'संगति आपको रोकती है (“बैठ जाओ”) — रक्षक घर्षण, हमेशा नैतिक बुरा नहीं।',
  neutral: 'मिश्रित / हल्का दृष्ट्य-धक्का — न प्रबल प्रोत्साहन, न प्रबल रोक।',
}

const CHESTA_THEME: Record<ThemeGraha, string> = {
  Su: 'अधिकार की सेवा और प्रसन्नता',
  Mo: 'सुख, देखभाल और भावनात्मक श्रम की ओर प्रयास',
  Ma: 'संपर्क-जाल का प्रयास',
  Me: 'प्रबंधकों से संवाद और कागज़ का प्रयास',
  Ju: 'आध्यात्मिक और ज्ञान का प्रयास (साधु की प्रामाणिकता का संकेत)',
  Ve: 'संबंध में निवेश का प्रयास',
  Sa: 'निष्ठावान रक्षक कार्य का प्रयास (समर्पित कर्मचारी का संकेत)',
  Ra: 'अत्यधिक और बढ़ा हुआ प्रयास',
  Ke: 'सिमटा या कटा प्रयास',
}

const CHESTA_REMEDY =
  'हनुमान / नरसिंह पूजा, हनुमान चालीसा, एकादशी व्रत, मौन और सामाजिक माध्यम से दूरी प्रयास-क्षमता फिर बनाते हैं (तृतीय भाव / मंगल क्षेत्र)।'

function chestaNote(id: GrahaId, band: SoftBand): string {
  const theme = CHESTA_THEME[id as ThemeGraha]
  if (band === 'strong') return `${theme} में वास्तविक प्रयास लगा है।`
  if (band === 'weak') return `${theme} पर प्रयास का संकेत कम है — ध्यान फिर बनाएँ (विरक्ति, उपवास, हनुमान)।`
  return `${theme} पर मध्यम प्रयास।`
}

function modalityNote(dom: SignModality, movable: number, fixed: number, dual: number): string {
  if (dom === 'movable') {
    return `चर-प्रधान जन्म मानचित्र (${movable} चर, ${fixed} स्थिर / ${dual} द्विस्वभाव) — जीवन हर कुछ वर्षों में नया रूप लेता है; परिवर्तन के दबाव में दिग् अक्सर बेचैन या भ्रमित दिखता है।`
  }
  if (dom === 'fixed') {
    return `स्थिर-प्रधान मानचित्र (${fixed} स्थिर) — परिवर्तन का प्रतिरोध; व्यक्ति रुख न बदले तो दिग् कम दिख सकता है, भले किसी मार्ग पर दिग् प्रबल हो।`
  }
  return `द्विस्वभाव-प्रधान मानचित्र (${dual} द्विस्वभाव) — समझौते और सहायक-कार्य का मन; सबसे अधिक भ्रम-प्रवण, रहने और बदलने के बीच झूलता है।`
}

function seventhNote(mod: SignModality | null): string | null {
  if (!mod) return null
  if (mod === 'movable') return 'सप्तम चर है — साझेदारी के ढर्रे बार-बार बदल सकते हैं (मनोवैज्ञानिक प्रवृत्ति, नैतिक फैसला नहीं)।'
  if (mod === 'fixed') return 'सप्तम स्थिर है — साझेदारी में निष्ठा और चिपकन; तनाव में भी छोड़ना कठिन।'
  return 'सप्तम द्विस्वभाव है — साझेदारी का रुख पेश सौदे के साथ बदलता है; समझौते की ऊर्जा।'
}

function libraHi(en: string | null): string | null {
  if (!en) return null
  const parts: string[] = []
  const count = en.match(/^(\d+) planets occupy/)
  if (count) {
    parts.push(`${count[1]} ग्रह तुला नवांश में हैं — तुला अंश काल सक्रिय होने पर चौराहे और भ्रम की चरम प्रवृत्ति।`)
  }
  if (en.includes('Venus current')) {
    parts.push('शुक्र की वर्तमान महादशा तुला-जैसा चौराहा-भ्रम बढ़ा सकती है — बड़े मोड़ से पहले गुरुजन से पूछें।')
  } else if (en.includes('Venus upcoming')) {
    parts.push('शुक्र की आगामी महादशा तुला-जैसा चौराहा-भ्रम बढ़ा सकती है — बड़े मोड़ से पहले गुरुजन से पूछें।')
  }
  return parts.length ? parts.join(' ') : en
}

function digCueHi(
  cue: DigDrigChestaAnalysis['dashaDig']['current'],
): DigDrigChestaAnalysis['dashaDig']['current'] {
  if (!cue) return null
  const lordName = g(cue.lord)
  let note = `${lordName} का दिग् उपलब्ध नहीं (राहु/केतु के लिए राशि के स्वामी चाहिए)।`
  if (cue.scoredId && cue.virupas != null) {
    const v = cue.virupas.toFixed(0)
    const band: SoftBand = cue.virupas >= 40 ? 'strong' : cue.virupas >= 20 ? 'baseline' : 'weak'
    note = band === 'strong'
      ? `${lordName} का दिग् ${v} — इस महादशा में अटल अनुसरण; काल की वक्रता के साथ जोड़ें ताकि प्रयास ऊपर की ढलान पर चढ़े।`
      : band === 'weak'
        ? `${lordName} का दिग् ${v} — भ्रम की खिड़की; दिशा माँगें, तूफान रुकने दें।`
        : `${lordName} का दिग् ${v} — इस महादशा में मध्यम दिशात्मक चाल।`
  }
  return { ...cue, lordName, note }
}

function predictionHi(
  p: DigDrigChestaPrediction,
  src: DigDrigChestaAnalysis,
  digRows: DigPlanetRow[],
  drigRows: DrigPlanetRow[],
  chestaRows: ChestaPlanetRow[],
  modalityNoteText: string,
  relationshipNote: string | null,
  libra: string | null,
  dashaDig: DigDrigChestaAnalysis['dashaDig'],
): DigDrigChestaPrediction {
  const digStrong = digRows.reduce((a, b) => (b.virupas > a.virupas ? b : a))
  const digWeak = digRows.reduce((a, b) => (b.virupas < a.virupas ? b : a))
  const drigPos = drigRows.reduce((a, b) => (b.virupas > a.virupas ? b : a))
  const drigNeg = drigRows.reduce((a, b) => (b.virupas < a.virupas ? b : a))
  const ve = chestaRows.find((r) => r.id === 'Ve')
  const ju = chestaRows.find((r) => r.id === 'Ju')
  const sa = chestaRows.find((r) => r.id === 'Sa')

  if (p.id === 'dig-core') {
    return {
      ...p,
      title: 'दिशा की स्पष्टता (दिग्)',
      text: `माध्य दिग् ${src.dig.meanVirupas.toFixed(0)} विरूप। सबसे प्रबल ${digStrong.name} (${digStrong.virupas.toFixed(0)}) अटल दिशा दिखाता है; सबसे निर्बल ${digWeak.name} (${digWeak.virupas.toFixed(0)}) भ्रम दिखाता है। दिग् ≠ सही मार्ग।`,
      basedOn: digStrong.name,
    }
  }
  if (p.id === 'dig-wrong-path') {
    return {
      ...p,
      title: 'उच्च दिग् की सावधानी',
      text: `${digStrong.name} का दिग् बहुत ऊँचा है (${digStrong.virupas.toFixed(0)}) — रुककर देखें कि अहंकार गलत मोड़ पर ताला तो नहीं लगा रहा (जैसे हठी विवाह या करियर)। प्रबल दिग् हठ से नष्ट भी कर सकता है।`,
      basedOn: digStrong.name,
    }
  }
  if (p.id === 'drig-core') {
    return {
      ...p,
      title: 'संगति (दृग्)',
      text: `${drigPos.name} की दृष्टि वृद्धि को प्रोत्साहित करती है (${drigPos.virupas.toFixed(1)}); ${drigNeg.name} रोकता है (${drigNeg.virupas.toFixed(1)})। ऋणात्मक दृग् रक्षक स्नेह है — इसके बिना अति अनियंत्रित चलती है।`,
      basedOn: drigNeg.name,
    }
  }
  if (p.id === 'chesta-venus' && ve) {
    const v = ve.virupas.toFixed(0)
    const text = ve.softBand === 'weak'
      ? `शुक्र चेष्टा कम है (${v}) — साथी बंधन को निष्क्रिय संपत्ति की तरह ले सकता है; वास्तविक पीछा और प्रयास देखें।`
      : ve.softBand === 'strong'
        ? `शुक्र चेष्टा ऊँची है (${v}) — संबंध में वास्तविक निवेश (पूर्ण विरक्ति के दावे प्रयास से मेल न खाएँ)।`
        : `शुक्र चेष्टा मध्यम है (${v}) — कुछ निवेश, आसक्ति नहीं।`
    return { ...p, title: 'संबंध का प्रयास (शुक्र चेष्टा)', text, basedOn: 'शुक्र' }
  }
  if (p.id === 'chesta-jupiter' && ju) {
    const v = ju.virupas.toFixed(0)
    const text = ju.softBand === 'strong'
      ? `गुरु चेष्टा ${v} — वास्तविक साधना और ज्ञान का प्रयास (साधु की प्रामाणिकता का संकेत)।`
      : `गुरु चेष्टा ${v} — आध्यात्मिक प्रयास कुंडली का सबसे ऊँचा संकेत नहीं।`
    return { ...p, title: 'आध्यात्मिक प्रयास (गुरु चेष्टा)', text, basedOn: 'गुरु' }
  }
  if (p.id === 'chesta-saturn' && sa) {
    const v = sa.virupas.toFixed(0)
    const text = sa.softBand === 'strong'
      ? `शनि चेष्टा ${v} — समर्पित “मैं तुम्हारी रक्षा करूँगा” कार्य-नीति।`
      : `शनि चेष्टा ${v} — रक्षक कार्य-प्रयास औसत या कम है।`
    return { ...p, title: 'कर्मचारी निष्ठा का प्रयास (शनि चेष्टा)', text, basedOn: 'शनि' }
  }
  if (p.id === 'modality') {
    const seventh = src.modality.seventhRashi
      ? `सप्तम राशि: ${RASHI_HI[src.modality.seventhRashi as Rashi]}।`
      : null
    const text = [modalityNoteText, relationshipNote, seventh].filter(Boolean).join(' ')
    return { ...p, title: 'चर / स्थिर / द्विस्वभाव स्वभाव', text }
  }
  if (p.id === 'libra-confusion') {
    return { ...p, title: 'तुला / चौराहा भ्रम', text: libra ?? p.text }
  }
  if (p.id === 'dig-md-current' && dashaDig.current) {
    return { ...p, title: 'वर्तमान महादशा में दिग्', text: dashaDig.current.note, basedOn: dashaDig.current.lordName }
  }
  if (p.id === 'dig-md-next' && dashaDig.next) {
    return { ...p, title: 'अगली महादशा में दिग्', text: dashaDig.next.note, basedOn: dashaDig.next.lordName }
  }
  if (p.id === 'combo-dig-drig') {
    return {
      ...p,
      title: 'प्रबल दिग् को अच्छी संगति चाहिए',
      text: `प्रबल दिग् के साथ (${digStrong.name} ${digStrong.virupas.toFixed(0)}), सकारात्मक संगति रखें — ऋणात्मक दृग् दिशात्मक ऊर्जा काट सकता है। ${drigNeg.name} की रोक (${drigNeg.virupas.toFixed(1)}) देखें।`,
      basedOn: digStrong.name,
    }
  }
  if (p.id === 'naisargika') {
    return {
      ...p,
      title: 'नैसर्गिक (प्राकृतिक क्रम)',
      text: 'प्राकृतिक प्रकाश का स्थिर पदानुक्रम: सूर्य > चंद्र > शुक्र > गुरु > बुध > मंगल > शनि। केवल प्रदर्शन — उपाय से सुधार नहीं।',
    }
  }
  if (p.id === 'remedy-dig') {
    return { ...p, title: 'निर्बल दिग् के उपाय', text: DIG_REMEDY, basedOn: digWeak.name }
  }
  if (p.id === 'remedy-chesta') {
    const weak = chestaRows.reduce((x, y) => (y.virupas < x.virupas ? y : x))
    return { ...p, title: 'कम चेष्टा के उपाय', text: CHESTA_REMEDY, basedOn: weak.name }
  }
  return p
}

/** Replace display strings. Enums, ids and numbers stay as in the English result. */
export function applyDigDrigChestaHi(a: DigDrigChestaAnalysis): DigDrigChestaAnalysis {
  const digRows = a.dig.rows.map((r) => ({
    ...r,
    name: g(r.id),
    note: DIG_NOTE[r.softBand],
    remedy: DIG_REMEDY,
  }))
  const drigRows = a.drig.rows.map((r) => ({
    ...r,
    name: g(r.id),
    note: DRIG_NOTE[r.polarity],
    remedy: r.polarity === 'negative' ? DRIG_NEG : DRIG_POS,
  }))
  const chestaRows = a.chesta.rows.map((r) => ({
    ...r,
    name: g(r.id),
    effortTheme: CHESTA_THEME[r.id as ThemeGraha],
    note: chestaNote(r.id, r.softBand),
    remedy: CHESTA_REMEDY,
  }))
  const digStrong = digRows.reduce((x, y) => (y.virupas > x.virupas ? y : x))
  const digWeak = digRows.reduce((x, y) => (y.virupas < x.virupas ? y : x))
  const drigPos = drigRows.reduce((x, y) => (y.virupas > x.virupas ? y : x))
  const drigNeg = drigRows.reduce((x, y) => (y.virupas < x.virupas ? y : x))
  const chestaStrong = chestaRows.reduce((x, y) => (y.virupas > x.virupas ? y : x))
  const chestaWeak = chestaRows.reduce((x, y) => (y.virupas < x.virupas ? y : x))
  const note = modalityNote(a.modality.dominant, a.modality.movableCount, a.modality.fixedCount, a.modality.dualCount)
  const relationshipNote = seventhNote(a.modality.seventhModality)
  const libra = libraHi(a.libraConfusionCue)
  const dashaDig = {
    current: digCueHi(a.dashaDig.current),
    next: digCueHi(a.dashaDig.next),
  }
  const naisargikaRows = a.naisargika.rows.map((r) => ({ ...r, name: g(r.id) }))
  const next: DigDrigChestaAnalysis = {
    ...a,
    dig: {
      ...a.dig,
      rows: digRows,
      summary: `दिग् माध्य ${a.dig.meanVirupas.toFixed(0)} विरूप — सबसे प्रबल ${digStrong.name} (${digStrong.virupas.toFixed(0)}), सबसे निर्बल ${digWeak.name} (${digWeak.virupas.toFixed(0)})। दिग् दिशा की स्पष्टता और हठ है, सही होना नहीं।`,
    },
    drig: {
      ...a.drig,
      rows: drigRows,
      summary: `दृग् माध्य ${a.drig.meanVirupas.toFixed(1)} — सबसे प्रोत्साहक ${drigPos.name} (${drigPos.virupas.toFixed(1)}), सबसे रोकने वाला ${drigNeg.name} (${drigNeg.virupas.toFixed(1)})।`,
    },
    chesta: {
      ...a.chesta,
      rows: chestaRows,
      summary: `चेष्टा माध्य ${a.chesta.meanVirupas.toFixed(0)} — सबसे अधिक प्रयास ${chestaStrong.name} (${chestaStrong.virupas.toFixed(0)}), सबसे कम ${chestaWeak.name} (${chestaWeak.virupas.toFixed(0)})।`,
    },
    naisargika: {
      rows: naisargikaRows,
      note: 'नैसर्गिक स्थिर प्राकृतिक प्रकाश-क्रम है (सूर्य → … → शनि)। ठीक करने को कुछ नहीं — केवल आधार पदानुक्रम की तरह उपयोग करें।',
    },
    modality: { ...a.modality, note, relationshipNote },
    dashaDig,
    libraConfusionCue: libra,
    predictions: [],
  }
  next.predictions = a.predictions.map((p) => predictionHi(p, a, digRows, drigRows, chestaRows, note, relationshipNote, libra, dashaDig))
  return next
}
