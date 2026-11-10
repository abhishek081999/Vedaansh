// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/kalaBalaAnalysis.hi.ts
//  Hindi display text for Kaal Bala analysis. Ids, bands, tones
//  and graha codes stay English on the result.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_HI } from '@/i18n/jyotish'
import type {
  KalaBalaAnalysis,
  KalaCareerPath,
  KalaCurvature,
  KalaDashaCue,
  KalaDrainHint,
  KalaPrediction,
  KalaSoftBand,
  KalaTimeProfile,
} from '@/lib/engine/kalaBalaAnalysis'

type KalaGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

function g(id: string): string {
  return id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : id
}

const BAND: Record<KalaSoftBand | 'unscored', string> = {
  exceptional: 'असाधारण',
  very_high: 'अत्युच्च',
  strong: 'प्रबल',
  stable: 'स्थिर',
  baseline: 'आधार',
  weak: 'निर्बल',
  unscored: 'अज्ञात',
}

const BODY: Record<KalaGraha, string> = {
  Su: 'आत्मविश्वास और नेतृत्व की पकड़ पतली लग सकती है — यह चिकित्सकीय सलाह नहीं।',
  Mo: 'भोजन, जल या रहने के सुख की गुणवत्ता बिगड़ सकती है — यह चिकित्सकीय सलाह नहीं।',
  Ma: 'शारीरिक चाल / खनिज संतुलन पर ध्यान चाहिए — यह चिकित्सकीय सलाह नहीं।',
  Me: 'हार्मोन, एंज़ाइम या आँत की लय बिगड़ी लग सकती है — यह चिकित्सकीय सलाह नहीं।',
  Ju: 'भाग्य, संतोष या सीखने की भूख कम लग सकती है।',
  Ve: 'सामंजस्य, भक्ति या संबंधों की सहजता क्षीण लग सकती है।',
  Sa: 'हड्डी और ढाँचे की थकान तथा करियर का भार दिख सकता है — विटामिन D3 एक लोक-संकेत है, चिकित्सकीय सलाह नहीं।',
  Ra: 'काल बढ़ा हुआ और बेचैन लग सकता है।',
  Ke: 'काल टूटा या सिमटा लग सकता है।',
}

const REMEDY: Record<KalaGraha, string> = {
  Su: 'छोटे कार्य का नेतृत्व करें, वरिष्ठ/पिता/शासन का सम्मान करें, सूर्योदय से पहले उठें, निष्पक्षता और दैनिक अनुशासन ठीक करें।',
  Mo: 'बिना प्रतिफल सेवा करें, घर साफ रखें, अन्न/जल नष्ट न करें, अतिथि को खिलाएँ, दया, कृष्ण भोग/भक्ति।',
  Ma: 'बिना भेदभाव सहायता करें, स्वास्थ्य बचाएँ, पक्ष लें, जहाँ उचित हो खनिज/रक्त जाँचें।',
  Me: 'प्रमाणपत्र, साफ नोट/दस्तावेज़, समय-सारणी, अनुशासित संवाद और लेखा।',
  Ju: 'पढ़ाएँ/सलाह दें, दान, गीता/रामायण/अध्ययन, सत्संग, पाठ्यक्रम पूरे करें, ज्ञानी वरिष्ठों का संग।',
  Ve: 'जागरण/कीर्तन/पूजा/शृंगार, स्वच्छता, जीवनसाथी का सम्मान; स्त्री-कुल के अपमान का उपचार; दृष्टि भटकने से बचें।',
  Sa: 'वृद्धों और आश्रितों की सेवा, व्यावसायिक कौशल/प्रमाणपत्र बढ़ाएँ, ईमानदार परिश्रम।',
  Ra: 'महत्वाकांक्षा ईमानदार रखें; निर्बल खिड़कियों में वित्त अधिक न बताएँ।',
  Ke: 'विराम स्वीकार करें; सरल करें; जब केतु काटे तो निरंतरता जबरदस्ती न करें।',
}

const THEMES: Record<KalaGraha, string[]> = {
  Su: ['पिता', 'नेतृत्व', 'अनुशासन', 'शासन'],
  Mo: ['माता', 'सुख', 'जनसमूह', 'पोषण'],
  Ma: ['साहस', 'रक्षा', 'लक्ष्य', 'रक्त/स्वास्थ्य'],
  Me: ['कागज़', 'वेतन के अंक', 'संतान', 'संवाद'],
  Ju: ['धर्म', 'ज्ञान', 'भाग्य', 'जन-समर्थन'],
  Ve: ['भक्ति', 'विलास', 'जीवनसाथी', 'घरेलू सामंजस्य'],
  Sa: ['करियर', 'परिश्रम', 'असहायों की सेवा'],
  Ra: ['प्रवर्धन', 'लौकिक धक्का'],
  Ke: ['विराम', 'एकांत', 'वैराग्य'],
}

const DRAIN: Record<string, { label: string; meaning: string }> = {
  D3: { label: 'D3 द्रेष्काण', meaning: 'मानसिक थकान — विचार-प्रक्रिया स्वयं को विषैला कर सकती है।' },
  D27: { label: 'D27 भांश', meaning: 'आंतरिक/नक्षत्र ऊर्जा का क्षरण।' },
  D4: { label: 'D4 चतुर्थांश', meaning: 'घर / निजी स्थान पर क्षरण।' },
  D10: { label: 'D10 दशांश', meaning: 'कार्यालय / कर्म-क्षेत्र पर क्षरण।' },
  D7: { label: 'D7 सप्तांश', meaning: 'सामाजिक वृत्त से क्षरण।' },
  D9: { label: 'D9 नवांश', meaning: 'साथी (जीवनसाथी/व्यवसाय) आपको क्षीण कर सकता है।' },
}

function roleWord(role: KalaDashaCue['role']): string {
  if (role === 'previous') return 'पिछली'
  if (role === 'current') return 'वर्तमान'
  return 'आगामी'
}

function labelOf(cue: KalaDashaCue): string {
  const lord = g(cue.lord)
  if (cue.viaDispositor && cue.scoredId) return `${lord} (${g(cue.scoredId)} के माध्यम से)`
  return lord
}

function cueHi(cue: KalaDashaCue | null): KalaDashaCue | null {
  if (!cue) return null
  const lordName = g(cue.lord)
  const scoredName = cue.scoredId ? g(cue.scoredId) : null
  const role = roleWord(cue.role)
  const via = cue.viaDispositor && cue.scoredId ? ` (${g(cue.scoredId)} के माध्यम से)` : ''
  let note: string
  if (cue.virupas == null || !cue.scoredId || cue.softBand === 'unscored') {
    note = `${role} ${lordName} महादशा का सीधा काल बल नहीं है (राहु/केतु के लिए राशि के स्वामी का उपयोग करें)।`
  } else {
    const v = cue.virupas.toFixed(0)
    const band = BAND[cue.softBand]
    if (cue.softBand === 'exceptional' || cue.softBand === 'very_high' || cue.softBand === 'strong') {
      note = `${role} ${lordName}${via}: ${v} विरूप (${band}) — काल-भाग्य प्रबल है; अपने लिए काम करें और इस खिड़की का पूरा उपयोग करें।`
    } else if (cue.softBand === 'stable') {
      note = `${role} ${lordName}${via}: ${v} विरूप (स्थिर) — प्रयास और नौकरी की निरंतरता के लिए समान काल-सहारा।`
    } else if (cue.softBand === 'baseline') {
      note = `${role} ${lordName}${via}: ${v} विरूप (आधार) — उपयोगी, पर स्वर्णिम काल नहीं; बचत करें और विनम्र रहें।`
    } else {
      note = `${role} ${lordName}${via}: ${v} विरूप (निर्बल) — काल भारी है; बचत करें, जोखिम घटाएँ, संभव हो तो बेहतर काल वाले लोगों को साथ लें या नियुक्त करें।`
    }
  }
  return { ...cue, lordName, scoredName, note }
}

function profileNoteHi(profile: KalaTimeProfile): string {
  if (profile === 'stable') {
    return 'सातों काल मान ≥130 पर टिके हैं — स्थिर “शीर्ष ~1%” काल-कुंडली; निरंतर अच्छे कर्म का प्रयोग फलित होता है।'
  }
  if (profile === 'weak') {
    return 'कई निर्बल काल गिरावटें — काल-भाग्य असंगत है; वित्त बचाएँ और कठोर नौकरी से अधिक व्यवसाय की लचक चुनें।'
  }
  return 'ग्रहों में काल उतार-चढ़ाव वाला है — करियर और भाग्य दशा-परिवर्तन के साथ स्पष्ट उतार-चढ़ाव दिखाते हैं।'
}

function careerNoteHi(path: KalaCareerPath): string {
  if (path === 'job_ok') return 'समान काल वेतन/नौकरी मार्ग के अनुकूल है — अनुशासन रहे तो अचानक काल-गिरावट कम।'
  if (path === 'business_preferred') {
    return 'असंगत काल (चौड़ा फैलाव / गिरावट) — नियम: नौकरी से व्यवसाय बेहतर; नौकरी काल की घाटी में छँटनी और किस्त का झटका देती है।'
  }
  return 'मिश्रित काल-निरंतरता — स्थिर महादशा में नौकरी संभव; व्यवसाय उतार-चढ़ाव को कुल मिलाकर बेहतर सँभालता है।'
}

function summaryHi(a: KalaBalaAnalysis): string {
  const strong = g(a.strongestId)
  const weak = g(a.weakestId)
  const mean = a.meanVirupas.toFixed(0)
  if (a.profile === 'stable') return `स्थिर काल (माध्य ${mean} विरूप)। सबसे प्रबल ${strong}, सबसे निर्बल ${weak}।`
  if (a.profile === 'weak') return `निर्बल काल रूप (माध्य ${mean}, ${a.dipCount} गिरावटें)। उपाय ${weak} पर केंद्रित करें।`
  return `उतार-चढ़ाव वाला काल (माध्य ${mean}; फैलाव ${a.spreadVirupas.toFixed(0)})। सबसे प्रबल ${strong}, सबसे निर्बल ${weak}।`
}

function lordHiFromName(name: string, cues: Array<KalaDashaCue | null>): string {
  for (const c of cues) {
    if (c && c.lordName === name) return g(c.lord)
  }
  return name
}

function curveHi(c: KalaCurvature, cues: Array<KalaDashaCue | null>): { from: string; to: string; note: string } {
  const from = lordHiFromName(c.fromLord, cues)
  const to = lordHiFromName(c.toLord, cues)
  const av = c.fromVirupas.toFixed(0)
  const bv = c.toVirupas.toFixed(0)
  const pct = Math.abs(c.pctChange).toFixed(0)
  if (c.direction === 'up') {
    return { from, to, note: `वक्रता ${from} (${av}) → ${to} (${bv}): ऊपर की ओर ~${pct}%। कठिन चरण बाद में फलता है — आवेदन जारी रखें।` }
  }
  if (c.direction === 'down') {
    return { from, to, note: `वक्रता ${from} (${av}) → ${to} (${bv}): नीचे की ओर ~${pct}%। गिरावट से पहले 6+ माह बचत करें; जीवन-शैली न फुलाएँ।` }
  }
  return { from, to, note: `वक्रता ${from} → ${to} लगभग सपाट है (${av} → ${bv})।` }
}

function drainHi(d: KalaDrainHint, planetId: GrahaId): KalaDrainHint {
  const copy = DRAIN[d.varga] ?? { label: d.label, meaning: d.meaning }
  const planet = g(planetId)
  const sign = d.detail.match(/sign (\d+)/)?.[1] ?? ''
  let detail: string
  if (d.detail.startsWith('Add natal')) {
    detail = 'वर्ग क्षरण बिंदु देखने के लिए जन्म देशांतर जोड़ें।'
  } else if (d.active) {
    detail = `${planet} ${d.varga} में नीच है (राशि ${sign}) — इस जीवन-क्षेत्र को काल के रिसाव बिंदु की तरह लें।`
  } else {
    detail = `${planet} ${d.varga} में नीच नहीं है (राशि ${sign})।`
  }
  return { ...d, label: copy.label, meaning: copy.meaning, detail }
}

function careerText(timing: KalaDashaCue, upcoming: boolean): string {
  const label = labelOf(timing)
  const v = timing.virupas!.toFixed(0)
  const when = upcoming ? 'आगामी' : 'वर्तमान'
  if (timing.softBand === 'exceptional' || timing.softBand === 'very_high' || timing.softBand === 'strong') {
    return upcoming
      ? `जब ${label} चले (${v} विरूप), अपने लिए काम करें, व्यापक आवेदन दें (परीक्षा/पद), और अधिशेष जमा करें — स्वर्णिम काल का नियम।`
      : `${label} के चलते (${v} विरूप), अपने लिए काम करें, व्यापक आवेदन दें (परीक्षा/पद), और अधिशेष जमा करें — स्वर्णिम काल का नियम।`
  }
  if (timing.softBand === 'stable') {
    return `${when} ${label} (${v}) स्थिर नौकरी-निरंतरता और समान उत्पादन का साथ देता है।`
  }
  if (timing.lord === 'Sa' || timing.scoredId === 'Sa') {
    return `शनि-काल ${v} पर भारी है — छँटनी, रुकी पदोन्नति, प्रबंधक का दबाव या अकेला अतिरिक्त समय शास्त्रीय है। कोई रिश्तेदार नहीं बचाता; पहले बचत करें और धैर्य रखें।`
  }
  if (timing.softBand === 'weak') {
    return `निर्बल ${label} काल (${v}) — प्रतिष्ठा वाली नौकरी जबरदस्ती न करें; बेहतर काल-भाग्य वाले लोगों के साथ साझेदारी या नियुक्ति करें; जीवन-शैली का खर्च न बढ़ाएँ।`
  }
  return `${label} काल आधार है (${v}) — उपयोगी है, पर किसी दुर्बल अगले काल से पहले बचत शुरू करें।`
}

function predictionHi(
  p: KalaPrediction,
  a: KalaBalaAnalysis,
  rows: KalaBalaAnalysis['rows'],
  dasha: KalaBalaAnalysis['dasha'],
  drains: KalaDrainHint[],
  careerPathNote: string,
  curves: Map<string, { from: string; to: string; note: string }>,
): KalaPrediction {
  const timing = dasha.next ?? dasha.current
  const upcoming = Boolean(dasha.next)
  const label = timing ? labelOf(timing) : ''
  const v = timing?.virupas != null ? timing.virupas.toFixed(0) : ''

  if (p.id === 'time-quality') {
    const text = a.profile === 'stable'
      ? `काल लगातार ऊँचा है (माध्य ${a.meanVirupas.toFixed(0)}, न्यूनतम ~130 पार) — शीर्ष काल-भाग्य: साधारण परिस्थिति से भी प्रयास फलित होता है।`
      : a.profile === 'weak'
        ? `निर्बल / गिरावट-भारी काल (माध्य ${a.meanVirupas.toFixed(0)}, ${a.dipCount} निर्बल ग्रह) — अच्छे उद्यम भी धूल हो सकते हैं जब तक प्रबल महादशा न चले।`
        : `उतार-चढ़ाव वाला काल (माध्य ${a.meanVirupas.toFixed(0)}) — जीवन में स्पष्ट उतार-चढ़ाव; काल की गुणवत्ता महादशा के साथ बदलती है।`
    return { ...p, title: 'आपका काल कैसे चल रहा है', text }
  }
  if (p.id === 'job-vs-biz') return { ...p, title: 'नौकरी बनाम व्यवसाय', text: careerPathNote }
  if (p.id === 'career-no-dasha') {
    return { ...p, title: 'करियर का समय', text: 'काल की भविष्यवाणी के लिए विम्शोत्तरी महादशा लोड करें — पिछली → वर्तमान → अगली स्वामी।' }
  }
  if (p.id === 'career-md' && timing) {
    return {
      ...p,
      title: upcoming ? 'करियर का समय (अगली महादशा)' : 'करियर का समय (वर्तमान महादशा)',
      text: careerText(timing, upcoming),
      basedOn: label,
    }
  }
  if (p.id === 'exam-md') {
    return {
      ...p,
      title: 'परीक्षा / चयन खिड़की',
      text: `उठता/प्रबल ${label} काल (${v}) परीक्षा और चयन पास करने का साथ देता है — अच्छी खिड़की में “निचले” पदों पर भी आवेदन करें; बाद में बदल सकते हैं।`,
      basedOn: label,
    }
  }
  if (p.id === 'prosperity-md') {
    return {
      ...p,
      title: 'भाग्योदय संकेत',
      text: `${label} के अधीन कुल समय प्रबल है — आवश्यकताएँ पूरी होने की प्रवृत्ति; काल को कम उपयोग करने के बजाय पूरा लगाएँ।`,
      basedOn: label,
    }
  }
  if (p.id === 'moon-bhog') {
    return {
      ...p,
      title: 'प्रबल चंद्र काल की चेतावनी',
      text: `चंद्र का काल बहुत ऊँचा है (${v}) — “घर बैठो / पुण्य भोगो” की गति थोप सकता है: साक्षात्कार अंतिम चरण में रुकें, आय किराए/निवेश/माता/सामाजिक सहायता से अधिक, कठिन परिश्रम से कम।`,
      basedOn: label,
    }
  }
  if (p.topic === 'curvature') {
    const meta = curves.get(p.id)
    if (!meta) return p
    return { ...p, title: `वक्रता ${meta.from} → ${meta.to}`, text: meta.note, basedOn: `${meta.from}→${meta.to}` }
  }
  if (p.id === 'biz-name') {
    const me = rows.find((r) => r.id === 'Me')
    const mv = me ? me.virupas.toFixed(0) : ''
    let text: string
    if (p.text.includes('sits in a kendra')) {
      text = `बुध का काल प्रबल है (${mv}) और बुध केंद्र में है (कोण भाव: 1, 4, 7, 10) — व्यवसाय पर इस व्यक्ति का नाम रखने के लिए अनुकूल।`
    } else if (p.text.includes('further favor')) {
      text = `बुध का काल प्रबल है (${mv}) — व्यवसाय के कागज़ और लेखा के लिए अच्छा; केंद्र (कोण भाव: 1, 4, 7, 10) स्थिति नाम रखने को और अनुकूल करेगी।`
    } else {
      text = `बुध का काल केवल ${mv} है — संभव हो तो व्यवसाय का नाम ऐसे परिवारजन पर रखें जिनका बुध काल अधिक प्रबल हो।`
    }
    return { ...p, title: 'व्यवसाय का नाम / बुध', text, basedOn: 'बुध' }
  }
  if (p.id === 'health') {
    const text = rows.filter((r) => r.bodyCue).map((r) => `${r.name}: ${r.bodyCue}`).join(' ')
    return { ...p, title: 'देह / पोषण संकेत', text }
  }
  if (p.id === 'drain') {
    const text = drains.filter((d) => d.active).map((d) => `${d.label}: ${d.meaning}`).join(' ')
    return { ...p, title: 'काल क्षरण बिंदु (वर्ग)', text }
  }
  if (p.id === 'guidance-weak') {
    return {
      ...p,
      title: 'निर्बल काल का आचरण',
      text: 'निर्बल काल की खिड़कियों में: दूरी बनाएँ, वित्त अधिक न बताएँ, आक्रामक बचत करें, धैर्य रखें — “जितना नीचे गया है उतना ऊपर भी आता है।” ऐसे साथी चुनें जिनका काल अच्छा चल रहा हो।',
    }
  }
  return p
}

/** Replace display strings. Enums, ids and numbers stay as in the English result. */
export function applyKalaHi(a: KalaBalaAnalysis): KalaBalaAnalysis {
  const originalCues = [a.dasha.previous, a.dasha.current, a.dasha.next]
  const curves = new Map<string, { from: string; to: string; note: string }>()
  for (const c of a.curvature) {
    curves.set(`curve-${c.fromLord}-${c.toLord}`, curveHi(c, originalCues))
  }
  const rows = a.rows.map((r) => ({
    ...r,
    name: g(r.id),
    bodyCue: r.bodyCue ? BODY[r.id as KalaGraha] : null,
    remedy: REMEDY[r.id as KalaGraha],
    themes: THEMES[r.id as KalaGraha],
  }))
  const dasha = {
    previous: cueHi(a.dasha.previous),
    current: cueHi(a.dasha.current),
    next: cueHi(a.dasha.next),
  }
  const drainPlanet = a.dasha.current?.scoredId ?? a.dasha.next?.scoredId ?? a.weakestId
  const drains = a.drains.map((d) => drainHi(d, drainPlanet))
  const careerPathNote = careerNoteHi(a.careerPath)
  const curvature = a.curvature.map((c) => {
    const meta = curves.get(`curve-${c.fromLord}-${c.toLord}`)
    if (!meta) return c
    return { ...c, fromLord: meta.from, toLord: meta.to, note: meta.note }
  })
  return {
    ...a,
    profileNote: profileNoteHi(a.profile),
    summary: summaryHi(a),
    careerPathNote,
    rows,
    dasha,
    curvature,
    drains,
    predictions: a.predictions.map((p) => predictionHi(p, a, rows, dasha, drains, careerPathNote, curves)),
    goldenRule: 'काल प्रबल हो तो अपने लिए काम करें। काल निर्बल हो तो उन लोगों के साथ साझेदारी करें या उन्हें नियुक्त करें जिनका काल-भाग्य अच्छा चल रहा हो।',
  }
}
