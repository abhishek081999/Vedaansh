// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/sthanaBalaAnalysis.hi.ts
//  Hindi display text for Sthana Bala analysis. Ids, bands, tones
//  and graha codes stay English on the result.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_HI } from '@/i18n/jyotish'
import type {
  SthanaBalaAnalysis,
  SthanaDashaCue,
  SthanaLifeProfile,
  SthanaPrediction,
  SthanaSoftBand,
} from '@/lib/engine/sthanaBalaAnalysis'

type SthanaGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

function g(id: string): string {
  return id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : id
}

const BAND: Record<SthanaSoftBand | 'unscored', string> = {
  exceptional: 'असाधारण',
  very_high: 'अत्युच्च',
  strong: 'प्रबल',
  above_average: 'औसत से ऊपर',
  usable: 'उपयोगी (शनि)',
  baseline: 'आधार',
  weak: 'निर्बल',
  unscored: 'अज्ञात',
}

const BODY: Record<SthanaGraha, string> = {
  Su: 'समग्र जीवन-शक्ति और नेतृत्व की पकड़ को सहारे की ज़रूरत हो सकती है।',
  Mo: 'सुख, भोजन और भावनात्मक सहजता असमान लग सकती है।',
  Ma: 'हृदय से जुड़ी जीवन-शक्ति और रक्षा की चाल तनावग्रस्त लग सकती है।',
  Me: 'चयापचय, सीखने की गति या हार्मोन की लय धीमी हो सकती है।',
  Ju: 'स्थिरता और ज्ञान-निर्माण अधूरा लग सकता है।',
  Ve: 'दृष्टि, परिष्कार या संबंधों की सुघड़ता को देखभाल चाहिए।',
  Sa: 'अव्यवस्था, बकाया और कार्यस्थल का क्षरण जमा होता है।',
  Ra: 'दृश्यता और सीमा का तनाव स्थान के चुनाव पर हावी हो सकता है।',
  Ke: 'सिमटना और कोना ढूँढना सहायक स्थानों को सीमित कर सकता है।',
}

const REMEDY: Record<SthanaGraha, string> = {
  Su: 'गायत्री, सूर्य नमस्कार, जल अर्पण, और निःस्वार्थ मंदिर या समाज सेवा।',
  Mo: 'अच्छा अन्न रखें, भोग लगाएँ, संकीर्तन, माता की सेवा, और जल तीर्थ।',
  Ma: 'पशु-पौधों की देखभाल, मिट्टी का काम, व्यायाम, हनुमान / नरसिंह / दुर्गा सेवा।',
  Me: 'बागवानी, उद्यान, अध्ययन, प्रातः भ्रमण, वनौषधि, और खेलते हुए कौशल।',
  Ju: 'खुली हवा, ऊँची छत, हरियाली, मंदिर, योग, और शुद्ध प्राण वाले स्थान।',
  Ve: 'स्वच्छता, सुगंध, देव शृंगार, गौ सेवा, मधुर वाणी, और लक्ष्मी पूजन।',
  Sa: 'अव्यवस्था हटाएँ; मेज़/कार्यस्थल का सम्मान करें; शनि के क्षेत्र साफ रखें।',
  Ra: 'जब राहु चले तो दृश्य, ऊँचे, परावर्तक स्थान चुनें — सावधानी से।',
  Ke: 'जब केतु चले तो शांत कोने और संयत आवरण चुनें — दर्पण का ध्यान घटाएँ।',
}

const THEMES: Record<SthanaGraha, string[]> = {
  Su: ['पद', 'नेतृत्व', 'मंदिर का दायित्व'],
  Mo: ['घर का सुख', 'अन्न भंडार', 'माता', 'जल स्थान'],
  Ma: ['पृथ्वी ऊर्जा', 'रक्षा', 'व्यायाम', 'भूमि की देखभाल'],
  Me: ['पौधे', 'उद्यान', 'विद्यालय', 'सीखने की गति'],
  Ju: ['प्राण', 'खुला स्थान', 'आध्यात्मिक संगति'],
  Ve: ['परिष्कार', 'स्वच्छता', 'शयन-सौंदर्य', 'पति-पत्नी का सुख'],
  Sa: ['कार्यस्थल', 'बकाया', 'सेवा क्षेत्र'],
  Ra: ['ऊँची मंज़िल', 'दृश्यता', 'दर्पण'],
  Ke: ['भूतल', 'कोने', 'कम संवाद'],
}

function roleWord(role: 'current' | 'next'): string {
  return role === 'current' ? 'वर्तमान' : 'आगामी'
}

function labelOf(cue: SthanaDashaCue): string {
  const lord = g(cue.lord)
  if (cue.viaDispositor && cue.scoredId) return `${lord} (${g(cue.scoredId)} के माध्यम से)`
  return lord
}

function cueHi(cue: SthanaDashaCue | null): SthanaDashaCue | null {
  if (!cue) return null
  const lordName = g(cue.lord)
  const scoredName = cue.scoredId ? g(cue.scoredId) : null
  const role = roleWord(cue.role)
  const via = cue.viaDispositor && cue.scoredId ? ` (${g(cue.scoredId)} राशि-स्वामी के माध्यम से)` : ''
  let note: string
  if (cue.virupas == null || !cue.scoredId || cue.softBand === 'unscored') {
    note = `${role} ${lordName} महादशा का सीधा स्थान बल नहीं है (राहु/केतु के लिए उस राशि के स्वामी की कुंडली में उपस्थिति चाहिए)।`
  } else {
    const v = cue.virupas.toFixed(0)
    const band = BAND[cue.softBand]
    if (cue.softBand === 'exceptional' || cue.softBand === 'very_high') {
      note = `${role} ${lordName}${via}: ${v} विरूप (${band}) — यह काल चलने पर बेहतर स्थान, निवास और संगति का प्रबल संकेत।`
    } else if (cue.softBand === 'strong' || cue.softBand === 'above_average' || (cue.scoredId === 'Sa' && cue.softBand === 'usable')) {
      note = `${role} ${lordName}${via}: ${v} विरूप (${band}) — इस दशा में स्थान और प्रतिष्ठा की सहायक क्षमता।`
    } else if (cue.softBand === 'baseline') {
      note = `${role} ${lordName}${via}: ${v} विरूप (आधार) — उपयोगी है, पर केवल इससे स्थान का बड़ा उन्नयन नहीं।`
    } else {
      note = `${role} ${lordName}${via}: ${v} विरूप (निर्बल) — स्थान का तनाव संभव; भाव स्वामी और उपाय साथ देखें।`
    }
  }
  return { ...cue, lordName, scoredName, note }
}

function profileNoteHi(profile: SthanaLifeProfile): string {
  if (profile === 'above_average') {
    return 'सातों ग्रह नरम औसत-से-ऊपर की सीमा पार करते हैं (शनि उपयोगी ≥110) — जीवन भर बेहतर स्थान तक पहुँच का संकेत।'
  }
  if (profile === 'struggling') {
    return 'कई स्थान गिरावटें — कुंडली स्थान-संघर्ष, वास्तु तनाव या सुख में देर की ओर झुकी है, जब तक प्रबल दशा न चले।'
  }
  return 'मिश्रित स्थान रूप — कुछ ग्रह स्थान सँभालते हैं, कुछ गिरते हैं।'
}

function summaryHi(a: SthanaBalaAnalysis): string {
  const strong = g(a.strongestId)
  const weak = g(a.weakestId)
  const mean = a.meanVirupas.toFixed(0)
  if (a.profile === 'above_average') {
    return `औसत से ऊपर स्थान (माध्य ${mean} विरूप)। सबसे प्रबल ${strong}, सबसे निर्बल ${weak}।`
  }
  if (a.profile === 'struggling') {
    return `संघर्ष वाला स्थान रूप (माध्य ${mean}, ${a.dipCount} निर्बल गिरावटें)। उपाय ${weak} पर केंद्रित करें।`
  }
  return `मिश्रित स्थान (माध्य ${mean} विरूप; सीमा ${a.minVirupas.toFixed(0)}–${a.maxVirupas.toFixed(0)})। सबसे प्रबल ${strong}, सबसे निर्बल ${weak}।`
}

function vastuHi(a: SthanaBalaAnalysis): string | null {
  if (!a.vastuCue) return null
  if (a.profile === 'above_average') return 'कुल स्थान प्रबल हो तो दीर्घ वास्तु-शैली की स्थान समस्याएँ आमतौर पर कम होती हैं।'
  return 'कम या असमान स्थान अक्सर वास्तु असुविधा के साथ जाता है — भूखंड को अकेला दोष देने से पहले दुर्बल ग्रह के क्षेत्र साफ और सक्रिय करें।'
}

const APPLICATIONS = [
  'वर्तमान या आगामी महादशा स्वामी का स्थान बल नौकरी, गृह और विवाह के समय-संकेत के लिए देखें।',
  'स्थान जन्म का और आजीवन है; काल और दशा तय करते हैं कि वह कब सक्रिय हो।',
  'राहु/केतु का अपना स्थान बल नहीं — जिस राशि में बैठे हों उसके स्वामी का बल गिनें।',
  'ये भविष्यवाणियाँ केवल स्थान बल की क्षमता हैं — भाव स्वामित्व, योग और पूर्ण षड्बल से पुष्टि करें।',
]

function predictionHi(
  p: SthanaPrediction,
  a: SthanaBalaAnalysis,
  dasha: SthanaBalaAnalysis['dasha'],
  vastu: string | null,
  rows: SthanaBalaAnalysis['rows'],
): SthanaPrediction {
  const timing = dasha.next ?? dasha.current
  const upcoming = Boolean(dasha.next)
  const when = upcoming ? 'आगामी' : 'वर्तमान'
  const label = timing ? labelOf(timing) : ''
  const v = timing?.virupas != null ? timing.virupas.toFixed(0) : ''

  if (p.id === 'life-above') {
    return {
      ...p,
      title: 'जीवन-गुण / स्थान की दिशा',
      text: 'सातों ग्रह नरम स्थान सीमा पार करते हैं — अस्थायी संघर्ष के बीच भी बेहतर घर, कार्यस्थल और संगति तक आजीवन पहुँच की अपेक्षा।',
    }
  }
  if (p.id === 'life-struggle') {
    return {
      ...p,
      title: 'जीवन-गुण / स्थान की दिशा',
      text: `${a.dipCount} निर्बल स्थान गिरावटें (माध्य ${a.meanVirupas.toFixed(0)} विरूप) संघर्ष वाली स्थान-कुंडली दिखाती हैं — उन्नयन मुख्यतः तब जब प्रबल महादशा स्वामी चले।`,
    }
  }
  if (p.id === 'life-mixed') {
    return {
      ...p,
      title: 'जीवन-गुण / स्थान की दिशा',
      text: `मिश्रित स्थान — ${g(a.strongestId)} स्थान अच्छी तरह सँभालता है, ${g(a.weakestId)} पीछे है। फल इस बात पर निर्भर है कि कौन सी महादशा सक्रिय है।`,
    }
  }
  if (p.id === 'career-no-dasha') {
    return {
      ...p,
      title: 'करियर / चयन का समय',
      text: 'विम्शोत्तरी महादशा का डेटा नहीं है — अगले महादशा स्वामी के स्थान से करियर और गृह की भविष्यवाणी के लिए दशाएँ लोड करें।',
    }
  }
  if (p.id === 'career-unscored') {
    return {
      ...p,
      title: 'करियर / चयन का समय',
      text: `${label} महादशा का स्थान अभी अंकित नहीं (राहु/केतु के लिए उस राशि के स्वामी की कुंडली में उपस्थिति चाहिए)। स्थान से करियर का समय अधूरा है।`,
      basedOn: label,
    }
  }
  if (p.id === 'career-md' && timing) {
    let text: string
    if (timing.softBand === 'exceptional' || timing.softBand === 'very_high') {
      text = upcoming
        ? `जब ${label} की महादशा चलेगी (${v} विरूप), चयन और प्रतिष्ठा की वृद्धि, बेहतर निवास तथा प्रबल कार्य-संगति स्पष्ट रूप से मिलती है।`
        : `${label} की महादशा चलते हुए (${v} विरूप), चयन और प्रतिष्ठा की वृद्धि, बेहतर निवास तथा प्रबल कार्य-संगति स्पष्ट रूप से मिलती है।`
    } else if (timing.softBand === 'strong' || timing.softBand === 'above_average') {
      text = `${when} ${label} काल (${v} विरूप) नौकरी की प्रगति और बेहतर स्थान का साथ देता है — दशम भाव स्वामी और अंतरदशा से पुष्टि करें।`
    } else if (timing.scoredId === 'Sa' && timing.softBand === 'usable') {
      text = `${label} ${v} विरूप पर शनि के लिए उपयोगी है — परिश्रम और कार्यालय-केंद्र से वृद्धि संभव; विलास नहीं, अलगाव का दबाव अपेक्षा करें।`
    } else if (timing.softBand === 'baseline') {
      text = `${when} ${label} का स्थान केवल आधार है (${v}) — करियर गति संभव है, पर केवल स्थान से प्रतिष्ठा का बड़ा उन्नयन नहीं।`
    } else {
      text = `${when} ${label} का स्थान निर्बल है (${v} विरूप) — नौकरी या पद-परिवर्तन स्थान तनाव ला सकता है; सफलता की आशा से पहले उस ग्रह का क्षेत्र सँभालें।`
    }
    return {
      ...p,
      title: upcoming ? 'करियर / चयन (अगली महादशा)' : 'करियर / स्थिति (वर्तमान महादशा)',
      text,
      basedOn: label,
    }
  }
  if (p.id === 'property-md' && timing) {
    let text: string
    if (p.tone === 'favorable' || p.tone === 'supportive') {
      text = `${label} का स्थान (${v}) इस ${when} काल में बेहतर घर खरीदने या शिफ्ट होने का साथ देता है।`
    } else if (p.tone === 'mixed') {
      text = `${label} का स्थान मध्यम है — गृह-परिवर्तन चल सकता है, पर सुख और फिट असमान; वास्तु और चतुर्थ स्वामी की शक्ति जाँचें।`
    } else {
      text = `निर्बल ${label} स्थान इस ${when} खिड़की में आरामदायक घर खरीद या निवास की आशा के विरुद्ध चेतावनी है — खरीद के बाद बेचैनी एक शास्त्रीय संकेत है।`
    }
    return { ...p, title: 'संपत्ति / गृह-परिवर्तन', text, basedOn: label }
  }
  if (p.id === 'marriage-md' && timing) {
    let text: string
    if (timing.scoredId === 'Sa' && (timing.softBand === 'usable' || timing.softBand === 'above_average' || timing.softBand === 'strong')) {
      text = `शनि-काल का स्थान ${v} पर विवाह में वृद्धि के लिए अभी भी काम का है, पर अलगाव और काम-भारी दांपत्य गति अपेक्षा करें।`
    } else if (timing.softBand === 'exceptional' || timing.softBand === 'very_high') {
      text = `${label} ${v} विरूप पर ${when} महादशा में दांपत्य स्थान और समृद्धि का स्पष्ट उन्नयन समर्थित है (बहुत बेहतर स्थान पर जाना एक शास्त्रीय पठन है)।`
    } else if (timing.softBand === 'strong' || timing.softBand === 'above_average') {
      text = `${label} का स्थान (${v}) ${when} काल में औसत से ऊपर दांपत्य स्थिति दिखाता है — फिर भी शुक्र, गुरु और सप्तम भाव की पुष्टि करें।`
    } else if (timing.softBand === 'weak') {
      text = `${when} काल में निर्बल ${label} स्थान चेताता है कि दांपत्य स्थान और सुख तब तक तनावग्रस्त रह सकते हैं जब तक प्रबल स्वामी न चले।`
    } else {
      text = `${when} काल में ${label} का स्थान आधार है — विवाह चलता है, पर केवल स्थान से बड़ा स्थान या प्रतिष्ठा उत्थान न अपेक्षा करें।`
    }
    return { ...p, title: 'विवाह / साझेदारी का स्थान', text, basedOn: label }
  }
  if (p.id === 'prosperity-md' && timing) {
    return {
      ...p,
      title: 'समृद्धि / भाग्योदय संकेत',
      text: `${label} ${v} विरूप पर (≥230) पुण्य और स्थान का प्रबल संकेत है — यह ${when} महादशा घर की समृद्धि और जीवन-स्तर को तेज़ी से उठा सकती है।`,
      basedOn: label,
    }
  }
  if (p.id === 'vastu') {
    return { ...p, title: 'वास्तु / रहने का सुख', text: vastu ?? p.text }
  }
  if (p.id === 'health-weak') {
    const text = rows.filter((r) => r.bodyCue).map((r) => `${r.name}: ${r.bodyCue}`).join(' ')
    return { ...p, title: 'देह / कारक तनाव संकेत', text }
  }
  return p
}

/** Replace display strings. Enums, ids and numbers stay as in the English result. */
export function applySthanaHi(a: SthanaBalaAnalysis): SthanaBalaAnalysis {
  const rows = a.rows.map((r) => ({
    ...r,
    name: g(r.id),
    bodyCue: r.bodyCue ? BODY[r.id as SthanaGraha] : null,
    remedy: REMEDY[r.id as SthanaGraha],
    spaceThemes: THEMES[r.id as SthanaGraha],
  }))
  const dasha = {
    current: cueHi(a.dasha.current),
    next: cueHi(a.dasha.next),
  }
  const vastuCue = vastuHi(a)
  const applications = [...APPLICATIONS]
  if (dasha.next) applications.unshift(dasha.next.note)
  else if (dasha.current) applications.unshift(dasha.current.note)

  return {
    ...a,
    profileNote: profileNoteHi(a.profile),
    summary: summaryHi(a),
    rows,
    dasha,
    vastuCue,
    applications,
    predictions: a.predictions.map((p) => predictionHi(p, a, dasha, vastuCue, rows)),
  }
}
