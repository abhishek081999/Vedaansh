// __tests__/engine/muhurtaHiLeak.test.ts
// Hindi Muhurta engines / PDF must not leak long English prose when lang=hi.

import { describe, it, expect } from 'vitest'
import {
  analyzeMuhurta,
  MUHURTA_ACTIVITIES,
  type MuhurtaActivity,
} from '@/lib/engine/muhurtaAnalysis'
import { applyMuhurtaAdvanced, scoreMuhurtaFull } from '@/lib/engine/muhurtaElection'
import { plainMuhurtaVerdict } from '@/lib/engine/muhurtaVerdict'
import { assembleMuhurtaWindows } from '@/lib/engine/muhurtaWindows'
import { getMuhurtaIntents } from '@/lib/engine/muhurtaIntents'
import { calcTaraBala, calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import { generateMuhurtaHTML } from '@/lib/pdf/muhurtaHtml'
import type {
  KaranaResult,
  NakshatraResult,
  TithiResult,
  VaraResult,
  YogaResult,
} from '@/lib/engine/nakshatra'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collectStrings(v, out))
  return out
}

const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const DIV_CODE = /^(D\d{1,2}|DK|UL|AK|AmK|PK|GK|BK)$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/
const NUMERIC = /^[\d./\s:%+×\-—,R]+$/

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/
const DASHA_ID = /^(maha|antar|pratyantar|sookshma)/i

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (ISO_DATE.test(t)) return true
  if (NUMERIC.test(t)) return true
  if (DASHA_ID.test(t) || /dasha-[A-Za-z]{2}-\d+/.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every((w) => GRAHA_CODE.test(w) || DIV_CODE.test(w) || /^R\d+$/.test(w))) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

function stripHtmlText(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
  return text.split(/\s+/).filter((w) => w.length > 0)
}

function basePanchang(overrides: Partial<Parameters<typeof analyzeMuhurta>[1]> = {}) {
  const tithi: TithiResult = {
    number: 5,
    name: 'Panchami',
    paksha: 'shukla',
    lord: 'Naga',
    percent: 50,
  }
  const nakshatra: NakshatraResult = {
    index: 7,
    name: 'Pushya',
    shortName: 'Pus',
    pada: 1,
    lord: 'Sa',
    degreeInNak: 1,
    exactDegree: 93.5,
  }
  const yoga: YogaResult = {
    number: 3,
    name: 'Ayushman',
    quality: 'auspicious',
    percent: 40,
  }
  const karana: KaranaResult = {
    number: 10,
    name: 'Bava',
    type: 'movable',
    isBhadra: false,
  }
  const vara: VaraResult = {
    number: 4,
    name: 'Thursday',
    sanskrit: 'Guruvara',
    lord: 'Ju',
  }

  return {
    tithi,
    nakshatra,
    yoga,
    karana,
    vara,
    isRahuKalam: true,
    isGulikaKalam: false,
    isYamaganda: true,
    isAbhijit: true,
    choghadiya: { type: 'Amrit' as const, quality: 'Good' as const },
    panchaka: { isAuspicious: false, label: 'Mrityu Panchaka (Take extra care)', remainder: 1 },
    horaLord: 'Ju' as const,
    ...overrides,
  }
}

const natal = { moonNak: 0, moonSign: 1 }

function collectMuhurtaHiBlobs(): unknown[] {
  const lang = 'hi' as const
  const panchang = basePanchang()
  const out: unknown[] = []

  for (const act of MUHURTA_ACTIVITIES) {
    const base = analyzeMuhurta(act, panchang, natal, lang)
    out.push(base)
    out.push(
      applyMuhurtaAdvanced(act, base, {
        lagnaRashi: 2,
        moonLonSidereal: 93.5,
        sunLonSidereal: 270,
        dasha: { maha: 'Ve', antar: 'Sa' },
        savBindusByRashi: [25, 32, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
      }, lang),
    )
    out.push(
      scoreMuhurtaFull(act, panchang, natal, {
        lagnaRashi: 5,
        moonLonSidereal: 120,
        sunLonSidereal: 300,
      }, lang),
    )
    out.push(plainMuhurtaVerdict(act, base, { timeLabel: '10:30', avoidNow: ['राहु काल'], lang }))
  }

  const sunrise = new Date('2026-03-15T06:00:00Z')
  const sunset = new Date('2026-03-15T18:00:00Z')
  out.push(
    assembleMuhurtaWindows(
      {
        sunrise,
        sunset,
        rahuKalam: { start: sunrise, end: sunset },
        gulikaKalam: { start: sunrise, end: sunset },
        yamaganda: { start: sunrise, end: sunset },
        abhijitMuhurta: { start: sunrise, end: sunset },
      },
      lang,
    ),
  )
  out.push(getMuhurtaIntents(lang))
  out.push(calcTaraBala(0, 7, lang))
  out.push(calcChandraBala(1, 4, lang))

  return out
}

describe('Muhurta Hindi leak smoke', () => {
  it('major engines (lang=hi) avoid English sentence leaks', () => {
    const strings = collectStrings(collectMuhurtaHiBlobs())
    const leaks = findEnglishLeaks(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('generateMuhurtaHTML (lang=hi) avoids English sentence leaks in visible text', () => {
    const peak = analyzeMuhurta('MARRIAGE', basePanchang(), natal, 'hi')
    const html = generateMuhurtaHTML({
      activity: 'MARRIAGE',
      locationName: 'नई दिल्ली',
      generatedAt: new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' }),
      lang: 'hi',
      peak: { time: new Date().toISOString(), score: peak },
      dayResults: [
        {
          date: '2026-03-15',
          score: peak.score,
          grade: 'A',
          windows: ['अभिजित: 12:00 - 12:48'],
          avoid: ['राहु काल: 10:30 - 12:00'],
          reasons: peak.factors.slice(0, 5),
        },
      ],
    })
    const words = stripHtmlText(html)
    const longTokens = words.filter((w) => w.length > 40)
    const leaks = findEnglishLeaks(longTokens)
    expect(leaks, `HTML text leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })
})
