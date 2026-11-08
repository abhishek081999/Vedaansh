// Post/localize helpers for src/lib/engine/intimateLife.ts — Hindi display only.

import type { MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { IL_HI } from '@/lib/engine/locale/intimateLife.hi'
import type { DusthanaLink, IntimateLife } from '@/lib/engine/intimateLife'

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

function baseNoteId(id: string): string {
  const stripped = id.replace(/^(past-|open-)/, '')
  if (IL_HI.notes[stripped as keyof typeof IL_HI.notes]) return stripped
  const core = stripped.replace(/-\d+$/, '').replace(/^(entry|break|work|expose|d7-end)-/, '')
  if (IL_HI.notes[core as keyof typeof IL_HI.notes]) return core
  return stripped.split('-').slice(0, 2).join('-')
}

function localizeTitle(title: string): string {
  let t = title
  for (const [en, hi] of IL_HI.titlePhrases) {
    t = t.split(en).join(hi)
  }
  return t
}

function localizeDetail(detail: string): string {
  let d = detail
  for (const [en, hi] of IL_HI.detailPhrases) {
    d = d.split(en).join(hi)
  }
  return d
}

export function localizeIntimateNote(note: MarriedLifeNote): MarriedLifeNote {
  const row = IL_HI.notes[baseNoteId(note.id) as keyof typeof IL_HI.notes] as { title?: string; detail?: string } | undefined
  if (row?.title && row.detail) {
    return { ...note, title: swapAstroTerms(row.title), detail: swapAstroTerms(row.detail) }
  }
  if (row?.title && !row.detail) {
    return { ...note, title: swapAstroTerms(row.title), detail: swapAstroTerms(localizeDetail(note.detail)) }
  }
  if (row?.detail && !row.title) {
    return { ...note, title: swapAstroTerms(localizeTitle(note.title)), detail: swapAstroTerms(row.detail) }
  }
  return {
    ...note,
    title: swapAstroTerms(localizeTitle(note.title)),
    detail: swapAstroTerms(localizeDetail(note.detail)),
  }
}

export function localizeIntimateLife(raw: IntimateLife): IntimateLife {
  const map = (list: MarriedLifeNote[]) => list.map(localizeIntimateNote)
  const headline = raw.headline
    ? raw.headline.split(' · ').map(localizeTitle).join(' · ')
    : IL_HI.emptyHeadline
  return {
    headline,
    notes: map(raw.notes),
    inlaws: map(raw.inlaws),
    influence: map(raw.influence),
    timings: map(raw.timings),
    divisions: map(raw.divisions),
  }
}

export function approachDetail(asc: Rashi, lang: EngineLang): string | undefined {
  if (lang === 'en') return undefined
  return IL_HI.approach[asc]
}

export function approachTitle(asc: Rashi, lang: EngineLang): string {
  if (lang === 'en') return ''
  return fill(IL_HI.approachTitle, { sign: rName(asc, lang) })
}

export function dashaBondDetail(maha: GrahaId, english: string, lang: EngineLang): string {
  if (lang === 'en') return english
  return IL_HI.dashaBond[maha] ?? localizeDetail(english)
}

export function fifthHouseText(bitsEn: string, lang: EngineLang): string {
  if (lang === 'en' || !bitsEn) return bitsEn
  const bits = bitsEn.split(' ').length ? bitsEn.split(/(?<=\.)\s/) : []
  return bits.map(b => {
    for (const [en, hi] of IL_HI.fifthBits) {
      if (b.includes(en)) return hi
    }
    return localizeDetail(b)
  }).join(' ')
}

export function dusthanaDetail(
  helper: string,
  native: string,
  house: number,
  otherAsc: Rashi,
  lang: EngineLang,
): string {
  if (lang === 'en') {
    return `${helper}'s lagna sits in ${native}'s ${house}th. ${helper} can pull ${native} out of that crisis. As a spouse the same pair stays poor.`
  }
  return fill(IL_HI.dusthana, {
    helper,
    native,
    house,
    sign: rName(otherAsc, lang),
  })
}

export function dusthanaLinkLocalized(link: DusthanaLink, otherAsc: Rashi, lang: EngineLang): DusthanaLink {
  if (lang === 'en') return link
  return { ...link, detail: dusthanaDetail(link.helper, link.native, link.house, otherAsc, lang) }
}
