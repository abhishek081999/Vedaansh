// Post/localize helpers for src/lib/engine/careerMethod.ts — Hindi display only.

import type { CareerMethodAnalysis, MethodCombo, MethodHouse, MethodQuestion } from '@/lib/engine/careerMethod'
import { CM_HI } from '@/lib/engine/locale/careerMethod.hi'
import { localizeCareerString } from '@/lib/engine/careerProfessionLocale'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'

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

function applyPhrases(text: string): string {
  let out = text
  const sorted = [...CM_HI.detailPhrases, ...CM_HI.titlePhrases].sort((a, b) => b[0].length - a[0].length)
  for (const [en, hi] of sorted) {
    if (en && out.includes(en)) out = out.split(en).join(hi)
  }
  return out
}

function loc(text: string): string {
  if (!text) return text
  return swapAstroTerms(applyPhrases(localizeCareerString(text)))
}

type ToneNote = { id: string; title: string; answer: string; reading: string; tone: CareerMethodAnalysis['d10']['tone'] }

function exactOrLoc(text: string): string {
  if (!text) return text
  const hit = CM_HI.exactAnswers[text as keyof typeof CM_HI.exactAnswers]
  return hit ?? loc(text)
}

function localizeToneNotes(notes: ToneNote[]): ToneNote[] {
  return notes.map(n => {
    const meta = CM_HI.notes[n.id as keyof typeof CM_HI.notes]
    const answerOverride = meta && 'answer' in meta ? meta.answer : undefined
    return {
      ...n,
      title: meta?.title ?? loc(n.title),
      answer: answerOverride ?? exactOrLoc(n.answer),
      reading: exactOrLoc(n.reading),
    }
  })
}

function localizeHouse(card: MethodHouse): MethodHouse {
  const role =
    card.group === 'structure'
      ? CM_HI.structure[card.house as keyof typeof CM_HI.structure] ?? loc(card.role)
      : CM_HI.support[card.house as keyof typeof CM_HI.support] ?? loc(card.role)
  return {
    ...card,
    role,
    signName: swapAstroTerms(card.signName),
    lordName: swapAstroTerms(card.lordName),
    occupants: card.occupants.map(swapAstroTerms),
    reading: loc(card.reading),
  }
}

function localizeQuestion(q: MethodQuestion): MethodQuestion {
  const meta = CM_HI.questions[q.id]
  return {
    ...q,
    title: meta?.title ?? loc(q.title),
    answer: exactOrLoc(q.answer),
    detail: loc(q.detail),
  }
}

function localizeCombo(c: MethodCombo): MethodCombo {
  return {
    ...c,
    title: loc(c.title),
    fields: c.fields.map(loc),
    reading: loc(c.reading),
  }
}

function localizeLayer(section: { title: string; reading: string }): { title: string; reading: string } {
  return { title: loc(section.title), reading: exactOrLoc(section.reading) }
}

export function localizeCareerMethod(raw: CareerMethodAnalysis): CareerMethodAnalysis {
  const dominantId = raw.dominant.planet
  const grahaId = GRAHA_ORDER.find(id => GRAHA_NAMES[id] === dominantId || gName(id, 'hi') === dominantId)
  const principle =
    grahaId && CM_HI.principle[grahaId]
      ? CM_HI.principle[grahaId]
      : raw.dominant.principle.includes('10th lord')
        ? CM_HI.dominantFallback
        : loc(raw.dominant.principle)

  return {
    headline: loc(raw.headline),
    dominant: {
      planet: swapAstroTerms(raw.dominant.planet),
      principle,
      reading: loc(raw.dominant.reading),
    },
    factors: raw.factors.map((f, i) => {
      const ids = ['mindset', 'decision', 'timing'] as const
      const meta = CM_HI.factors[ids[i]]
      return {
        ...f,
        title: meta?.title ?? loc(f.title),
        reading: loc(f.reading),
      }
    }),
    questions: raw.questions.map(localizeQuestion),
    structure: raw.structure.map(localizeHouse),
    support: raw.support.map(localizeHouse),
    combinations: raw.combinations.map(localizeCombo),
    medical: {
      ...raw.medical,
      headline: loc(raw.medical.headline),
      reading: exactOrLoc(raw.medical.reading),
      lines: raw.medical.lines.map(loc),
    },
    modern: raw.modern.map(localizeLayer),
    d10: {
      verdict: loc(raw.d10.verdict),
      reading: loc(raw.d10.reading),
      tone: raw.d10.tone,
    },
    steps: raw.steps.map((s, i) => ({
      ...s,
      title: CM_HI.steps[i]?.title ?? loc(s.title),
      reading: loc(s.reading),
    })),
    principle: CM_HI.principleLine,
    system: {
      style: raw.system.style.map(s => ({
        ...s,
        title: loc(s.title),
        answer: loc(s.answer),
        reading: exactOrLoc(s.reading),
      })),
      notes: localizeToneNotes(raw.system.notes),
      closing: CM_HI.sectionClosings.system,
    },
    kshetra: { notes: localizeToneNotes(raw.kshetra.notes), closing: CM_HI.sectionClosings.kshetra },
    profile: { notes: localizeToneNotes(raw.profile.notes), closing: CM_HI.sectionClosings.profile },
    sector: { notes: localizeToneNotes(raw.sector.notes), closing: CM_HI.sectionClosings.sector },
    disha: { notes: localizeToneNotes(raw.disha.notes), closing: CM_HI.sectionClosings.disha },
    pipeline: { notes: localizeToneNotes(raw.pipeline.notes), closing: CM_HI.sectionClosings.pipeline },
    counsel: { notes: localizeToneNotes(raw.counsel.notes), closing: CM_HI.sectionClosings.counsel },
    demand: { notes: localizeToneNotes(raw.demand.notes), closing: CM_HI.sectionClosings.demand },
    pillars: { notes: localizeToneNotes(raw.pillars.notes), closing: CM_HI.sectionClosings.pillars },
    calling: { notes: localizeToneNotes(raw.calling.notes), closing: CM_HI.sectionClosings.calling },
    streams: { notes: localizeToneNotes(raw.streams.notes), closing: CM_HI.sectionClosings.streams },
    gana: {
      notes: localizeToneNotes(raw.gana.notes),
      closing: CM_HI.ganaClosing,
    },
    study: { notes: localizeToneNotes(raw.study.notes), closing: CM_HI.sectionClosings.study },
    pattern: { notes: localizeToneNotes(raw.pattern.notes), closing: CM_HI.sectionClosings.pattern },
    practice: {
      notes: localizeToneNotes(raw.practice.notes),
      layers: raw.practice.layers.map(localizeLayer),
      formula: raw.practice.formula.map(f => ({ label: loc(f.label), finding: loc(f.finding) })),
      lessons: CM_HI.practiceLessons,
    },
  }
}
