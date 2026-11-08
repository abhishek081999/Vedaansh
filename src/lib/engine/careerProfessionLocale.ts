// Post/localize helpers for src/lib/engine/careerProfession.ts — Hindi display only.

import type {
  CareerAdvanced,
  CareerAdvancedNote,
  CareerField,
  CareerHouseCard,
  CareerNote,
  CareerProfessionAnalysis,
  CareerScore,
  CareerSignificator,
  CareerTrackId,
  CareerTransitReading,
} from '@/lib/engine/careerProfession'
import { LIVELIHOOD, OCCUPANT_PHALA, TENTH_LORD_PHALA } from '@/lib/engine/dashamsaClassical'
import { LIVELIHOOD_HI, OCCUPANT_PHALA_HI, TENTH_LORD_PHALA_HI } from '@/lib/engine/locale/dashamsaClassical.hi'
import { CP_HI } from '@/lib/engine/locale/careerProfession.hi'
import { CAREER_EXACT_HI } from '@/lib/engine/locale/careerExact.hi'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'

const VIMSOPAKA_HI: Record<string, string> = {
  weak: 'दुर्बल',
  moderate: 'मध्यम',
  strong: 'बलवान',
  'very strong': 'अति बलवान',
  very_strong: 'अति बलवान',
}

const SURVIVAL_PREFIX_HI: Record<string, string> = {
  'A substantial working income': 'ठोस कामकाजी आय',
  'A steady income that grows with the period': 'अवधि के साथ बढ़ने वाली स्थिर आय',
  'A modest income until the 2nd and 11th are strengthened': 'द्वितीय और एकादश मजबूत होने तक साधारण आय',
  'A large scale of gains': 'बड़े पैमाने के लाभ',
}

const SHAPE_LABEL_EN_HI: [string, string][] = [
  ['Job — under a structure', 'नौकरी — संरचना के तले'],
  ["Business — a market of one’s own", 'व्यापार — अपना बाज़ार'],
  ["Business — a market of one's own", 'व्यापार — अपना बाज़ार'],
  ['Partnership business', 'साझेदारी व्यापार'],
  ['Independent work', 'स्वतंत्र काम'],
  ['Family or lineage work', 'पारिवारिक या वंश का काम'],
]

const CLASSICAL_GRAHA_EN: Record<string, GrahaId> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
}

function applyCareerPatterns(text: string): string {
  let out = text
  for (const [en, hi] of SHAPE_LABEL_EN_HI) {
    if (out.includes(en)) out = out.split(en).join(hi)
  }
  out = out.replace(
    /Vimsopaka is (weak|moderate|strong|very strong|very weak|very_strong|very_weak) \(dashavarga ([\d.]+) of 20\)\.?/gi,
    (_m, strength: string, n: string) => {
      const key = strength.toLowerCase().replace(/\s+/g, ' ')
      const hi =
        VIMSOPAKA_HI[key] ??
        VIMSOPAKA_HI[key.replace(' ', '_')] ??
        (key === 'very weak' ? 'अति दुर्बल' : strength)
      return `विम्शोपक ${hi} (दशवर्ग ${n} में से 20)।`
    },
  )
  out = out.replace(
    /Houses 1 through 6 are the private half: ([^.]+)\. Houses 7 through 12 are the public half: ([^.]+)\.\s*(Saturn or Ketu on the private half can build the skill alone\.)?\s*(The Sun or Rahu on the public half wants the work to be seen\.)?\s*(Neither isolation nor a hunger to be seen is locked by this count\.)?/g,
    (_m, priv: string, pub: string, satLine?: string, sunLine?: string, neitherLine?: string) => {
      const tail = [
        satLine ? 'शनि या केतु निजी अर्ध पर अकेले कौशल बना सकते हैं।' : '',
        sunLine ? 'सूर्य या राहु सार्वजनिक अर्ध पर काम दिखना चाहते हैं।' : '',
        neitherLine ? 'न एकांत न दिखने की भूख इस गिनती से लॉक।' : '',
      ]
        .filter(Boolean)
        .join(' ')
      return `भाव 1 से 6 निजी अर्ध: ${priv.trim()}। भाव 7 से 12 सार्वजनिक अर्ध: ${pub.trim()}।${tail ? ` ${tail}` : ''}`
    },
  )
  out = out.replace(/^Mixed\. (.+) and (.+) are both live\.$/, 'मिश्रित। $1 और $2 दोनों जीवित हैं।')
  out = out.replace(
    /^(.+?) is whether the 2nd can carry the person and the family\. A title without the 2nd is not survival\.$/,
    (_m, prefix: string) => {
      const hiPrefix = SURVIVAL_PREFIX_HI[prefix] ?? prefix
      return `${hiPrefix} यह है कि द्वितीय व्यक्ति और परिवार उठा सके। द्वितीय के बिना शीर्षक जीवन नहीं।`
    },
  )
  out = out.replace(/(\d+)\s*bindus on the 10th/gi, 'दशम पर $1 बिन्दु')
  out = out.replace(
    /^([A-Za-z]+) is yoga karaka \(natural indicator\), and it is weak\.$/,
    (_m, planet: string) => {
      const id = CLASSICAL_GRAHA_EN[planet]
      const pn = id ? gName(id, 'hi') : planet
      return `${pn} योगकारक (स्वाभाविक संकेत) है, और दुर्बल है।`
    },
  )
  out = out.replace(/^([A-Za-z]+) is yoga karaka \(natural indicator\)\.$/, (_m, planet: string) => {
    const id = CLASSICAL_GRAHA_EN[planet]
    const pn = id ? gName(id, 'hi') : planet
    return `${pn} योगकारक (स्वाभाविक संकेत) है।`
  })
  out = out.replace(/^([A-Za-z]+) is strong enough to use the yoga\.$/, (_m, planet: string) => {
    const id = CLASSICAL_GRAHA_EN[planet]
    const pn = id ? gName(id, 'hi') : planet
    return `${pn} योग प्रयोग करने जितना बलवान है।`
  })
  out = out.replace(/\bDashamsha leaves it open\b/g, 'दशांश इसे खुला छोड़ता है')
  out = out.replace(/\bThe career chart strains it\b/g, 'करियर चार्ट इसे तनाव देता है')
  return out
}

function localizeCareerId(id: string): string {
  const hit = CAREER_EXACT_HI[id]
  if (hit) return hit
  const aspect = id.match(/^aspect-10th lord-(\w+)$/)
  if (aspect) {
    const gid = aspect[1] as GrahaId
    return `दशमेश-दृष्टि-${gName(gid, 'hi')}`
  }
  return id
}

const GRAHA_ORDER = Object.keys(GRAHA_NAMES) as GrahaId[]

function swapAstroTerms(text: string): string {
  let out = text
  for (let r = 12; r >= 1; r--) {
    const en = RASHI_NAMES[r as Rashi]
    const hi = rName(r as Rashi, 'hi')
    if (en && hi && en !== hi) out = out.split(en).join(hi)
  }
  for (const id of GRAHA_ORDER) {
    const en = GRAHA_NAMES[id]
    const hi = gName(id, 'hi')
    if (en && hi && en !== hi) out = out.split(en).join(hi)
  }
  return out
}

function replaceClassicalBlocks(text: string): string {
  let out = text
  for (let h = 12; h >= 1; h--) {
    const en = TENTH_LORD_PHALA[h]
    const hi = TENTH_LORD_PHALA_HI[h]
    if (en?.prediction && hi?.prediction) out = out.split(en.prediction).join(hi.prediction)
    if (en?.headline && hi?.headline) out = out.split(en.headline).join(hi.headline)
  }
  for (const id of GRAHA_ORDER) {
    const enOcc = OCCUPANT_PHALA[id]
    const hiOcc = OCCUPANT_PHALA_HI[id]
    if (enOcc && hiOcc) out = out.split(enOcc).join(hiOcc)
    const enLiv = LIVELIHOOD[id]?.nature
    const hiLiv = LIVELIHOOD_HI[id]?.nature
    if (enLiv && hiLiv) out = out.split(enLiv).join(hiLiv)
  }
  return out
}

function applyPhrases(text: string, pairs: [string, string][]): string {
  let out = text
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  for (const [en, hi] of sorted) {
    if (en && out.includes(en)) out = out.split(en).join(hi)
  }
  return out
}

export function localizeCareerString(text: string, lang: EngineLang = 'hi'): string {
  if (lang !== 'hi' || !text) return text
  const exact = CAREER_EXACT_HI[text]
  if (exact) return exact
  let out = applyCareerPatterns(text)
  if (CAREER_EXACT_HI[out]) return CAREER_EXACT_HI[out]
  out = replaceClassicalBlocks(out)
  out = applyPhrases(out, CP_HI.detailPhrases)
  out = applyPhrases(out, CP_HI.titlePhrases)
  // Second pass: exact fragments / full lines that appear after partial phrase replace
  if (CAREER_EXACT_HI[out]) return CAREER_EXACT_HI[out]
  out = applyCareerPatterns(out)
  // Replace any remaining known exact substrings (longest first already in object insertion)
  for (const [en, hi] of Object.entries(CAREER_EXACT_HI)) {
    if (en.length >= 20 && out.includes(en)) out = out.split(en).join(hi)
  }
  return swapAstroTerms(out)
}

function localizeTitle(title: string): string {
  if (CAREER_EXACT_HI[title]) return CAREER_EXACT_HI[title]
  return swapAstroTerms(applyPhrases(applyCareerPatterns(title), CP_HI.titlePhrases))
}

function localizeNote(note: CareerNote): CareerNote {
  const row = CP_HI.yogas[note.id as keyof typeof CP_HI.yogas]
  if (row && 'detail' in row && typeof row.detail === 'string') {
    const detail = row.detail.includes('{')
      ? localizeCareerString(fill(row.detail, { planets: note.detail.match(/[A-Za-z, ]+$/)?.[0] ?? '' }))
      : localizeCareerString(row.detail)
    return { ...note, id: localizeCareerId(note.id), title: row.title ?? localizeTitle(note.title), detail }
  }
  return {
    ...note,
    id: localizeCareerId(note.id),
    title: localizeTitle(note.title),
    detail: localizeCareerString(note.detail),
  }
}

function localizeTurnsNote(note: CareerAdvancedNote): CareerAdvancedNote {
  const bucket = CP_HI.turnsAnswers[note.id as keyof typeof CP_HI.turnsAnswers]
  const answer =
    bucket && note.answer in bucket
      ? bucket[note.answer as keyof typeof bucket]
      : localizeCareerString(note.answer)
  return {
    ...note,
    id: localizeCareerId(note.id),
    title: localizeTitle(note.title),
    answer,
    reading: localizeCareerString(note.reading),
  }
}

function localizeAdvancedNote(note: CareerAdvancedNote): CareerAdvancedNote {
  if (note.id === 'signature') {
    const answer =
      CP_HI.roomSignatureAnswers[note.answer as keyof typeof CP_HI.roomSignatureAnswers] ??
      localizeCareerString(note.answer)
    return {
      ...note,
      id: localizeCareerId(note.id),
      title: localizeTitle(note.title),
      answer,
      reading: localizeCareerString(note.reading),
    }
  }
  return {
    ...note,
    id: localizeCareerId(note.id),
    title: localizeTitle(note.title),
    answer: localizeCareerString(note.answer),
    reading: localizeCareerString(note.reading),
  }
}

function localizeNakshatraLine(label: string, line: string): string {
  const reveals = CP_HI.nakshatraReveals[label]
  if (!reveals) return localizeCareerString(line)
  if (!line.includes('Working style:')) return localizeCareerString(line)
  const tail = line.replace(/^[\s\S]*?Working style:\s*/, '')
  return `${reveals} कार्य शैली: ${localizeCareerString(tail)}`
}

function localizeHouse(card: CareerHouseCard): CareerHouseCard {
  const role = CP_HI.houseRole[card.house as keyof typeof CP_HI.houseRole] ?? localizeCareerString(card.role)
  return {
    ...card,
    role,
    signName: swapAstroTerms(card.signName),
    lordName: swapAstroTerms(card.lordName),
    occupants: card.occupants.map(swapAstroTerms),
    reading: localizeCareerString(card.reading),
  }
}

function localizeSignificator(sig: CareerSignificator): CareerSignificator {
  const meta = CP_HI.significators[sig.id as keyof typeof CP_HI.significators]
  return {
    ...sig,
    title: meta?.title ?? localizeTitle(sig.title),
    question: meta?.question ?? localizeCareerString(sig.question),
    placement: localizeCareerString(sig.placement),
    reading: localizeCareerString(sig.reading),
  }
}

function localizeScore(s: CareerScore): CareerScore {
  return {
    ...s,
    label: CP_HI.scoreLabels[s.id],
    planet: swapAstroTerms(s.planet),
    summary: localizeCareerString(s.summary),
  }
}

function localizeField(f: CareerField): CareerField {
  return { field: localizeCareerString(f.field), why: localizeCareerString(f.why) }
}

function localizeAdvanced(adv: CareerAdvanced): CareerAdvanced {
  return {
    delivery: {
      ...adv.delivery,
      verdict: localizeCareerString(adv.delivery.verdict),
      reading: localizeCareerString(adv.delivery.reading),
      votes: adv.delivery.votes.map(localizeAdvancedNote),
    },
    strength: {
      rows: adv.strength.rows.map(r => ({
        ...r,
        planet: swapAstroTerms(r.planet),
        role: localizeCareerString(r.role),
        dignity: localizeCareerString(r.dignity),
        shadbala: r.shadbala ? localizeCareerString(r.shadbala) : null,
        vimsopaka: r.vimsopaka ? localizeCareerString(r.vimsopaka) : null,
        reading: localizeCareerString(r.reading),
      })),
      houses: adv.strength.houses.map(h => ({
        ...h,
        label: localizeCareerString(h.label),
        bhava: h.bhava ? localizeCareerString(h.bhava) : null,
        reading: localizeCareerString(h.reading),
      })),
      closing: CP_HI.advanced.strengthClosing,
    },
    chain: {
      steps: adv.chain.steps.map(st => ({
        ...st,
        planet: swapAstroTerms(st.planet),
        signName: swapAstroTerms(st.signName),
        reading: localizeCareerString(st.reading),
      })),
      aspects: adv.chain.aspects.map(localizeAdvancedNote),
      conditions: adv.chain.conditions.map(localizeAdvancedNote),
      closing: CP_HI.advanced.chainClosing,
    },
    prosperity: {
      notes: adv.prosperity.notes.map(localizeAdvancedNote),
      closing: CP_HI.advanced.prosperityClosing,
    },
    turns: {
      headline: localizeCareerString(adv.turns.headline),
      notes: adv.turns.notes.map(n => ({
        ...localizeTurnsNote(n),
        title: localizeTitle(n.title),
      })),
      closing: CP_HI.advanced.turnsClosing,
    },
    ladder: {
      rows: adv.ladder.rows.map(r => ({
        ...r,
        varga: r.varga in CP_HI.ladder ? CP_HI.ladder[r.varga as keyof typeof CP_HI.ladder] : r.varga,
        signName: swapAstroTerms(r.signName),
        dignity: localizeCareerString(r.dignity),
        reading: localizeCareerString(r.reading),
      })),
      closing: CP_HI.advanced.ladderClosing,
    },
    support: {
      headline:
        CP_HI.supportHeadlines[adv.support.headline as keyof typeof CP_HI.supportHeadlines] ??
        (localizeCareerString(adv.support.headline) || CP_HI.advanced.supportHeadlineDefault),
      tone: adv.support.tone,
      argala: adv.support.argala.map(localizeAdvancedNote),
      room: adv.support.room.map(localizeAdvancedNote),
      closing: CP_HI.advanced.supportClosing,
    },
  }
}

function localizeTrack(id: CareerTrackId, headline: string, prediction: string, doThis: string) {
  const copy = CP_HI.trackCopy[id]
  return {
    id,
    headline: copy.headline,
    prediction: prediction.includes('No single livelihood track')
      ? CP_HI.hybridTrackPrediction
      : localizeCareerString(prediction),
    doThis: copy.doThis,
    factors: [] as string[],
  }
}

export function localizeCareerProfession(raw: CareerProfessionAnalysis): CareerProfessionAnalysis {
  const track = {
    ...localizeTrack(raw.track.id, raw.track.headline, raw.track.prediction, raw.track.doThis),
    factors: raw.track.factors.map(f => localizeCareerString(f)),
  }
  const foreign = {
    ...raw.foreign,
    headline: raw.foreign.active ? CP_HI.foreign.activeHeadline : CP_HI.foreign.inactiveHeadline,
    prediction: raw.foreign.active ? CP_HI.foreign.activePrediction : CP_HI.foreign.inactivePrediction,
    factors: raw.foreign.factors.map(f => localizeCareerString(f)),
  }
  const tracker = {
    ...raw.tracker,
    headline: raw.tracker.headline.includes('Vimshottari is not')
      ? CP_HI.tracker.emptyHeadline
      : localizeCareerString(raw.tracker.headline),
    nowLabel: raw.tracker.nowLabel === 'No period' ? CP_HI.tracker.nowLabelEmpty : localizeCareerString(raw.tracker.nowLabel),
    mahas: raw.tracker.mahas.map(s => ({
      ...s,
      lord: swapAstroTerms(s.lord),
      label: CP_HI.fitLabel[s.fit],
      reason: localizeCareerString(s.reason),
    })),
    antars: raw.tracker.antars.map(s => ({
      ...s,
      lord: swapAstroTerms(s.lord),
      label: CP_HI.fitLabel[s.fit],
      reason: localizeCareerString(s.reason),
    })),
    pratyantars: raw.tracker.pratyantars.map(s => ({
      ...s,
      lord: swapAstroTerms(s.lord),
      label: CP_HI.fitLabel[s.fit],
      reason: localizeCareerString(s.reason),
    })),
    sookshmas: raw.tracker.sookshmas.map(s => ({
      ...s,
      lord: swapAstroTerms(s.lord),
      label: CP_HI.fitLabel[s.fit],
      reason: localizeCareerString(s.reason),
    })),
    pratyantarWindow: localizeCareerString(raw.tracker.pratyantarWindow),
    sookshmaWindow: localizeCareerString(raw.tracker.sookshmaWindow),
  }
  const remedies = raw.remedies.map((r, i) => {
    const keys = ['visible', 'saturn', 'seat', 'mercury', 'reputation', 'foreign'] as const
    const key = keys[i]
    const row = key ? CP_HI.remedies[key] : undefined
    return row
      ? { ...r, title: row.title, detail: row.detail }
      : localizeNote(r)
  })
  const briefSections = raw.brief.sections.map(s => ({
    heading: CP_HI.briefHeadings[s.heading as keyof typeof CP_HI.briefHeadings] ?? localizeTitle(s.heading),
    body: localizeCareerString(s.body),
  }))
  return {
    ...raw,
    headline: localizeCareerString(raw.headline),
    summary: localizeCareerString(raw.summary),
    ethics: CP_HI.ethics,
    scores: raw.scores.map(localizeScore),
    significators: raw.significators.map(localizeSignificator),
    track,
    foreign,
    houses: raw.houses.map(localizeHouse),
    fromMoon: raw.fromMoon
      ? {
          ...raw.fromMoon,
          title: localizeCareerString(raw.fromMoon.title),
          signName: swapAstroTerms(raw.fromMoon.signName),
          occupants: raw.fromMoon.occupants.map(swapAstroTerms),
          reading: localizeCareerString(raw.fromMoon.reading),
        }
      : null,
    fromSun: raw.fromSun
      ? {
          ...raw.fromSun,
          title: localizeCareerString(raw.fromSun.title),
          signName: swapAstroTerms(raw.fromSun.signName),
          occupants: raw.fromSun.occupants.map(swapAstroTerms),
          reading: localizeCareerString(raw.fromSun.reading),
        }
      : null,
    fields: raw.fields.map(localizeField),
    nakshatra: {
      formula: localizeCareerString(raw.nakshatra.formula),
      rows: raw.nakshatra.rows.map(row => ({
        ...row,
        label: localizeCareerString(row.label),
        priority: localizeCareerString(row.priority),
        nakshatra: swapAstroTerms(row.nakshatra),
        line: localizeNakshatraLine(row.label, row.line),
        fields: row.fields.map(f => localizeCareerString(f)),
      })),
    },
    yogas: raw.yogas.map(localizeNote),
    planets: raw.planets.map(localizeNote),
    a10: raw.a10
      ? {
          ...raw.a10,
          signName: swapAstroTerms(raw.a10.signName),
          lordName: swapAstroTerms(raw.a10.lordName),
          occupants: raw.a10.occupants.map(swapAstroTerms),
          reading: localizeCareerString(raw.a10.reading),
        }
      : null,
    navamsha: raw.navamsha
      ? {
          ...raw.navamsha,
          signName: swapAstroTerms(raw.navamsha.signName),
          dignity: localizeCareerString(raw.navamsha.dignity),
          reading: localizeCareerString(raw.navamsha.reading),
        }
      : null,
    dashamsha: raw.dashamsha
      ? {
          ...raw.dashamsha,
          lagnaName: swapAstroTerms(raw.dashamsha.lagnaName),
          reading: localizeCareerString(raw.dashamsha.reading),
        }
      : null,
    timingHeadline: localizeCareerString(raw.timingHeadline),
    timing: raw.timing.map(w => ({
      ...w,
      title: localizeCareerString(w.title),
      note: localizeCareerString(w.note),
    })),
    tracker,
    remedies,
    brief: {
      plain: briefSections.map(s => `${s.heading}\n${s.body}`).join('\n\n'),
      sections: briefSections,
    },
    advanced: localizeAdvanced(raw.advanced),
  }
}

export function localizeCareerTransits(raw: CareerTransitReading): CareerTransitReading {
  if (!raw.available) {
    return {
      ...raw,
      headline: CP_HI.transit.unavailable,
    }
  }
  return {
    available: true,
    headline: raw.headline.includes('mixed')
      ? CP_HI.transit.mixedSky
      : localizeCareerString(raw.headline),
    hits: raw.hits.map(h => ({
      ...h,
      planet: swapAstroTerms(h.planet),
      signName: swapAstroTerms(h.signName),
      label: CP_HI.fitLabel[h.fit],
      reading: localizeCareerString(h.reading),
    })),
  }
}
