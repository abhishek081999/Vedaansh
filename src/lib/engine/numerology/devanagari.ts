// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/devanagari.ts
//  Devanagari names — akshara parsing, Katapayadi (Sankhya)
//  numbering and Indian-convention Latin transliteration for
//  Chaldean scoring.
// ─────────────────────────────────────────────────────────────

import { reduceToCore } from './core'
import type { CoreNumber } from './data'

const VIRAMA = '्'
const NUKTA = '़'

/**
 * Katapayadi values (Sadratnamala): ka-varga 1–5, ca-varga 6–0,
 * ṭa-varga 1–5, ta-varga 6–0, pa-varga 1–5, ya…ḷa 1–9.
 */
const KATAPAYADI: Record<string, number> = {
  'क': 1, 'ख': 2, 'ग': 3, 'घ': 4, 'ङ': 5,
  'च': 6, 'छ': 7, 'ज': 8, 'झ': 9, 'ञ': 0,
  'ट': 1, 'ठ': 2, 'ड': 3, 'ढ': 4, 'ण': 5,
  'त': 6, 'थ': 7, 'द': 8, 'ध': 9, 'न': 0,
  'प': 1, 'फ': 2, 'ब': 3, 'भ': 4, 'म': 5,
  'य': 1, 'र': 2, 'ल': 3, 'व': 4, 'श': 5, 'ष': 6, 'स': 7, 'ह': 8, 'ळ': 9,
}

/** Consonant → common Indian English spelling. */
const CONSONANT_LATIN: Record<string, string> = {
  'क': 'K', 'ख': 'KH', 'ग': 'G', 'घ': 'GH', 'ङ': 'N',
  'च': 'CH', 'छ': 'CHH', 'ज': 'J', 'झ': 'JH', 'ञ': 'N',
  'ट': 'T', 'ठ': 'TH', 'ड': 'D', 'ढ': 'DH', 'ण': 'N',
  'त': 'T', 'थ': 'TH', 'द': 'D', 'ध': 'DH', 'न': 'N',
  'प': 'P', 'फ': 'PH', 'ब': 'B', 'भ': 'BH', 'म': 'M',
  'य': 'Y', 'र': 'R', 'ल': 'L', 'व': 'V', 'श': 'SH', 'ष': 'SH', 'स': 'S', 'ह': 'H', 'ळ': 'L',
}

/** Nukta forms (क़ ख़ ग़ ज़ ड़ ढ़ फ़). */
const NUKTA_LATIN: Record<string, string> = {
  'क': 'Q', 'ख': 'KH', 'ग': 'GH', 'ज': 'Z', 'ड': 'R', 'ढ': 'RH', 'फ': 'F',
}

const INDEPENDENT_VOWEL: Record<string, string> = {
  'अ': 'A', 'आ': 'A', 'इ': 'I', 'ई': 'I', 'उ': 'U', 'ऊ': 'U', 'ऋ': 'RI',
  'ए': 'E', 'ऐ': 'AI', 'ओ': 'O', 'औ': 'AU', 'ऑ': 'O', 'ॲ': 'E',
}

/** Matra → [medial spelling, word-final spelling]. */
const MATRA: Record<string, [string, string]> = {
  'ा': ['A', 'A'], 'ि': ['I', 'I'], 'ी': ['EE', 'I'], 'ु': ['U', 'U'], 'ू': ['OO', 'U'],
  'ृ': ['RI', 'RI'], 'े': ['E', 'E'], 'ै': ['AI', 'AI'], 'ो': ['O', 'O'], 'ौ': ['AU', 'AU'],
  'ॉ': ['O', 'O'], 'ॅ': ['E', 'E'],
}

const isConsonant = (ch: string) => ch in KATAPAYADI || ch in CONSONANT_LATIN

export function hasDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text)
}

interface Akshara {
  /** Consonant cluster (without viramas); empty for a bare vowel. */
  consonants: { ch: string; nukta: boolean }[]
  /** Matra char, independent vowel char, or null for the inherent 'a'. */
  vowel: string | null
  /** True when the cluster ends in a virama (no vowel at all). */
  dead: boolean
  /** Trailing anusvara / visarga / chandrabindu. */
  nasal: 'ं' | 'ः' | 'ँ' | null
}

function parseWord(word: string): Akshara[] {
  const chars = [...word]
  const out: Akshara[] = []
  let i = 0
  while (i < chars.length) {
    const ch = chars[i]!
    if (ch in INDEPENDENT_VOWEL) {
      const a: Akshara = { consonants: [], vowel: ch, dead: false, nasal: null }
      i++
      if (chars[i] === 'ं' || chars[i] === 'ः' || chars[i] === 'ँ') a.nasal = chars[i++] as Akshara['nasal']
      out.push(a)
      continue
    }
    if (!isConsonant(ch)) { i++; continue }

    const a: Akshara = { consonants: [], vowel: null, dead: false, nasal: null }
    while (i < chars.length && isConsonant(chars[i]!)) {
      const c = chars[i++]!
      const nukta = chars[i] === NUKTA
      if (nukta) i++
      a.consonants.push({ ch: c, nukta })
      if (chars[i] === VIRAMA) {
        i++
        if (i < chars.length && isConsonant(chars[i]!)) continue // conjunct
        a.dead = true
      }
      break
    }
    if (!a.dead && chars[i] && chars[i]! in MATRA) a.vowel = chars[i++]!
    if (chars[i] === 'ं' || chars[i] === 'ः' || chars[i] === 'ँ') a.nasal = chars[i++] as Akshara['nasal']
    out.push(a)
  }
  return out
}

// ── Katapayadi ────────────────────────────────────────────────

export interface KatapayadiResult {
  /** Per-akshara digits in written order. */
  aksharas: { akshara: string; digit: number }[]
  /** The Katapayadi number — digits read right to left (aṅkānāṃ vāmato gatiḥ). */
  number: string
  digitSum: number
  root: CoreNumber | 0
}

/**
 * Only the last consonant of a cluster that carries a vowel counts;
 * bare vowels count 0 and dead (virama-final) consonants are skipped.
 */
export function getKatapayadi(text: string): KatapayadiResult | null {
  const aksharas: KatapayadiResult['aksharas'] = []
  for (const word of text.trim().split(/\s+/)) {
    for (const a of parseWord(word)) {
      const label = a.consonants.map(c => c.ch).join(VIRAMA) + (a.vowel ?? '')
      if (a.dead) continue
      if (a.consonants.length === 0) {
        aksharas.push({ akshara: label, digit: 0 })
        continue
      }
      const last = a.consonants[a.consonants.length - 1]!
      aksharas.push({ akshara: label, digit: KATAPAYADI[last.ch] ?? 0 })
    }
  }
  if (aksharas.length === 0) return null
  const digits = aksharas.map(a => a.digit)
  const digitSum = digits.reduce((s, d) => s + d, 0)
  return {
    aksharas,
    number: [...digits].reverse().join(''),
    digitSum,
    root: reduceToCore(digitSum),
  }
}

// ── Transliteration ───────────────────────────────────────────

/**
 * Hindi schwa deletion (after Ohala): the final inherent 'a' drops in
 * multi-akshara words unless it follows a conjunct (कृष्ण → KRISHNA);
 * a medial one drops in a VC_CV context (कमला → KAMLA, फ़रहान → FARHAN).
 * Scanned right to left so each decision sees the one after it.
 */
function inherentSchwaKept(aks: Akshara[]): boolean[] {
  const hasInherent = (a: Akshara) => a.consonants.length > 0 && !a.vowel && !a.dead
  const keep = aks.map(hasInherent)
  const last = aks.length - 1
  if (last > 0 && hasInherent(aks[last]!) && aks[last]!.consonants.length === 1 && !aks[last]!.nasal) keep[last] = false
  for (let i = last - 1; i >= 1; i--) {
    const a = aks[i]!, prev = aks[i - 1]!, next = aks[i + 1]!
    if (!hasInherent(a) || a.consonants.length !== 1 || a.nasal) continue
    const prevVoiced = !prev.dead && (prev.vowel !== null || hasInherent(prev))
    const nextVoiced = next.consonants.length === 1 && (next.vowel !== null || keep[i + 1]!)
    if (prevVoiced && nextVoiced) keep[i] = false
  }
  return keep
}

/**
 * Devanagari → Latin as Indian names are usually spelt in English
 * (राम → RAM, दीपक → DEEPAK, लक्ष्मी → LAKSHMI, कमला → KAMLA).
 */
export function devanagariToLatin(text: string): string {
  const words: string[] = []
  for (const raw of text.trim().split(/\s+/)) {
    if (!hasDevanagari(raw)) {
      const latin = raw.toUpperCase().replace(/[^A-Z]/g, '')
      if (latin) words.push(latin)
      continue
    }
    const aks = parseWord(raw)
    const keep = inherentSchwaKept(aks)
    let out = ''
    aks.forEach((a, idx) => {
      for (const c of a.consonants) out += c.nukta ? NUKTA_LATIN[c.ch] ?? CONSONANT_LATIN[c.ch] : CONSONANT_LATIN[c.ch]
      if (a.consonants.length === 0 && a.vowel) out += INDEPENDENT_VOWEL[a.vowel] ?? ''
      else if (a.vowel) out += MATRA[a.vowel]![idx === aks.length - 1 ? 1 : 0]
      else if (keep[idx]) out += 'A'
      if (a.nasal === 'ं' || a.nasal === 'ँ') {
        const next = aks[idx + 1]?.consonants[0]?.ch
        out += next && 'पफबभम'.includes(next) ? 'M' : 'N'
      } else if (a.nasal === 'ः') out += 'H'
    })
    if (out) words.push(out)
  }
  return words.join(' ')
}
