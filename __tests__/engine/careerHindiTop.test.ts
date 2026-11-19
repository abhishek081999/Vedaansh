// The first screen of the career desk in Hindi (headline, summary, verdict,
// track) must be Hindi for every lagna — no half-English fragments.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeCareerProfession } from '@/lib/engine/careerProfession'
import { polishCareerHindi } from '@/lib/engine/locale/careerHindiPolish'

const ALLOWED = new Set(['BPHS', 'KP', 'SAV', 'AmK', 'AK', 'D1', 'D9', 'D10', 'A10'])
const englishWords = (s: string) => (s.match(/[A-Za-z][A-Za-z'’-]{2,}/g) ?? []).filter(w => !ALLOWED.has(w))

const HOURS = ['01:10', '03:20', '05:30', '07:40', '09:50', '12:00', '14:10', '16:20', '18:30', '20:40', '22:50', '23:55']
const charts: ChartOutput[] = []

beforeAll(async () => {
  for (const h of HOURS) {
    // IST = UTC + 5:30
    const [hh, mm] = h.split(':').map(Number)
    const utcMin = ((hh * 60 + mm - 330) + 1440) % 1440
    const utcDate = hh * 60 + mm < 330 ? '1992-08-22' : '1992-08-23'
    const utcTime = `${String(Math.floor(utcMin / 60)).padStart(2, '0')}:${String(utcMin % 60).padStart(2, '0')}:00`
    charts.push(await calculateChart({
      name: 'X', birthDate: '1992-08-23', birthTime: h, utcDate, utcTime, birthPlace: 'New Delhi',
      latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
    } as never))
  }
}, 60000)

describe('career desk Hindi — first screen', () => {
  it('covers most lagnas', () => {
    expect(new Set(charts.map(c => c.lagnas.ascRashi)).size).toBeGreaterThanOrEqual(10)
  })

  it('headline, summary, verdict and track carry no English words', () => {
    const leaks: string[] = []
    for (const c of charts) {
      const r = analyzeCareerProfession(c, new Date('2026-06-01'), 'hi')!
      const strings = [r.headline, r.summary, r.advanced.delivery.verdict, r.track.headline, r.track.prediction, r.track.doThis, ...r.track.factors]
      for (const s of strings) if (englishWords(s).length) leaks.push(s)
    }
    expect([...new Set(leaks)]).toEqual([])
  })
})

describe('polishCareerHindi', () => {
  it('rewrites recurring fragments into Hindi order', () => {
    expect(polishCareerHindi('सिंह on the 10th, सूर्य में 2.')).toBe('दशम भाव पर सिंह, सूर्य भाव 2 में।')
    expect(polishCareerHindi('सूर्य in धनु, of मिश्रित strength.')).toBe('सूर्य धनु में, मिश्रित बल का।')
    expect(polishCareerHindi('गुरु in मेष, in its own sign.')).toBe('गुरु मेष में, स्वराशि में।')
    expect(polishCareerHindi('शनि भाव 6 में — institutional profession')).toBe('शनि भाव 6 में — संस्थागत पेशा')
  })

  it('leaves English-only text alone', () => {
    expect(polishCareerHindi('Saturn on the 10th.')).toBe('Saturn on the 10th.')
  })
})
