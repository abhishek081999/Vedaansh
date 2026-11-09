// Phrase-glossary translator for engines whose English is built by joining
// many short templates with planet, sign and number values (Krishneeyam,
// Satpanchasika). Each finished string is split at its separators; names and
// numbers become placeholders; the phrase is looked up whole in a glossary.
//
// Glossary keys use {P} planet name, {S} sign name, {G} planet code (Su…Ke),
// {O} ordinal ("5th"), {N} number. Values may say {P2}, {N1}… to pick the nth
// value of a kind; plain {P} takes the next one. An ordinal renders oblique
// ("पाँचवें भाव में") as {O}, direct masculine ("पाँचवाँ भाव") as {OD}, and
// direct feminine ("पाँचवीं होरा") as {OF}. `[Ch x]` refs are lifted out
// and rendered as `[अध्याय x]`. Unknown phrases keep their English with planet
// and sign names swapped to Hindi. Pure.

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'

const PLANET_ID: Record<string, GrahaId> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
}
const SIGN_ID: Record<string, Rashi> = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6, Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
}
/** Oblique ordinals: "पाँचवें भाव में". */
const ORD_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']
const ORD_HI_DIRECT = ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ', 'छठा', 'सातवाँ', 'आठवाँ', 'नौवाँ', 'दसवाँ', 'ग्यारहवाँ', 'बारहवाँ']
const ORD_HI_FEM = ['', 'पहली', 'दूसरी', 'तीसरी', 'चौथी', 'पाँचवीं', 'छठी', 'सातवीं', 'आठवीं', 'नौवीं', 'दसवीं', 'ग्यारहवीं', 'बारहवीं']

const PLANET_RE = new RegExp(`\\b(${Object.keys(PLANET_ID).join('|')})\\b`, 'g')
const SIGN_RE = new RegExp(`\\b(${Object.keys(SIGN_ID).join('|')})\\b`, 'g')
const CODE_RE = /\b(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)\b/g
const ORD_RE = /\b(\d+)(st|nd|rd|th)\b/g
const NUM_RE = /\d+(?:\.\d+)?/g
const CH_RE = /\[Ch([^\]]*)\]/g
const LATIN = /[A-Za-z]/

type Kind = 'L' | 'P' | 'S' | 'G' | 'O' | 'N'

const LIST_RE = new RegExp(`\\b(?:${Object.keys(PLANET_ID).join('|')})(?:, (?:${Object.keys(PLANET_ID).join('|')}))+\\b`, 'g')

function hiValue(kind: Kind, v: string): string {
  if (kind === 'L') return v.split(', ').map((p) => GRAHA_HI[PLANET_ID[p]]).join(', ')
  if (kind === 'P') return GRAHA_HI[PLANET_ID[v]]
  if (kind === 'S') return RASHI_HI[SIGN_ID[v]]
  if (kind === 'G') return GRAHA_HI[v as GrahaId]
  if (kind === 'O') return ORD_HI[Number.parseInt(v, 10)] ?? v
  return v
}

/** Swap planet and sign names in leftover English so they still read in Hindi. */
export function namesHi(s: string): string {
  return s.replace(PLANET_RE, (m) => GRAHA_HI[PLANET_ID[m]]).replace(SIGN_RE, (m) => RASHI_HI[SIGN_ID[m]])
}

export interface PhraseHiOptions {
  frag: Record<string, string>
  /** Where to split a string into phrases (one capturing group: the separator). */
  split: RegExp
  /** Frames around variable slots; each captured slot is translated on its own. */
  templates?: [RegExp, (...slots: string[]) => string][]
  /** Second chance for a key the glossary lacks. */
  fallback?: (key: string, frag: Record<string, string>) => string | undefined
  /** Clean-up on the joined Hindi string. */
  post?: (s: string) => string
  /** Paths (dot-joined object keys, arrays transparent) that are ids or enums. */
  keep?: (path: string) => boolean
  /** Read comma lists of planet names ("Mars, Saturn") as one {L} slot. */
  lists?: boolean
}

export interface PhraseHi {
  text: (s: string) => string
  toHi: <T>(value: T) => T
  /** Dev hook: called with each key the glossary lacks. */
  onMiss?: (key: string) => void
}

export function createPhraseHi(o: PhraseHiOptions): PhraseHi {
  const self: PhraseHi = { text, toHi: (v) => walk(v, '') }

  function framed(core: string): string | undefined {
    for (const [re, hi] of o.templates ?? []) {
      const m = core.match(re)
      if (m) return hi(...m.slice(1).map(piece))
    }
    return undefined
  }

  function piece(raw: string): string {
    if (!LATIN.test(raw)) return raw
    const lead = raw.match(/^\s*/)?.[0] ?? ''
    const trail = raw.match(/\s*$/)?.[0] ?? ''
    let core = raw.trim()
    const refs: string[] = []
    const refFirst = core.startsWith('[Ch')
    core = core.replace(CH_RE, (_, x: string) => { refs.push(`[अध्याय ${x.trim().replace(/\bCh/g, 'अध्याय ').replace('General', 'सामान्य').replace(' commentary', ' टीका')}]`); return '' }).trim()
    const dot = /\.$/.test(core)
    core = core.replace(/^[ .]+|[ .]+$/g, '')

    const vals: Record<Kind, string[]> = { L: [], P: [], S: [], G: [], O: [], N: [] }
    const key = (o.lists ? core.replace(LIST_RE, (m) => { vals.L.push(m); return '{L}' }) : core)
      .replace(PLANET_RE, (m) => { vals.P.push(m); return '{P}' })
      .replace(SIGN_RE, (m) => { vals.S.push(m); return '{S}' })
      .replace(CODE_RE, (m) => { vals.G.push(m); return '{G}' })
      .replace(ORD_RE, (m) => { vals.O.push(m); return '{O}' })
      .replace(NUM_RE, (m) => { vals.N.push(m); return '{N}' })

    const hit = o.frag[key] ?? o.fallback?.(key, o.frag)
    let out: string
    if (hit === undefined) {
      const f = framed(core)
      if (f === undefined) self.onMiss?.(key)
      out = f ?? namesHi(core)
    } else {
      const seen: Record<Kind, number> = { L: 0, P: 0, S: 0, G: 0, O: 0, N: 0 }
      out = hit.replace(/\{(OD|OF|[LPSGON])(\d*)\}/g, (_, tag: string, n: string) => {
        const k = tag[0] as Kind
        const v = vals[k][n ? Number(n) - 1 : seen[k]++]
        if (v === undefined) return ''
        if (tag === 'OD' || tag === 'OF') return (tag === 'OD' ? ORD_HI_DIRECT : ORD_HI_FEM)[Number.parseInt(v, 10)] ?? v
        return hiValue(k, v)
      })
    }
    if (dot) out += '।'
    if (refs.length) out = refFirst ? `${refs.join(' ')} ${out}` : `${out} ${refs.join(' ')}`
    return `${lead}${out.trim()}${trail}`
  }

  function text(s: string): string {
    if (!LATIN.test(s)) return s
    const joined = s
      .split(o.split)
      .map((part, i) => (i % 2 === 1 ? (part === '. ' ? '। ' : part) : piece(part)))
      .join('')
    return o.post ? o.post(joined) : joined
  }

  function walk<T>(value: T, path: string): T {
    if (typeof value === 'string') return (o.keep?.(path) ? value : text(value)) as T
    if (Array.isArray(value)) return value.map((v) => walk(v, path)) as T
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) out[k] = walk(v, path ? `${path}.${k}` : k)
      return out as T
    }
    return value
  }

  return self
}
