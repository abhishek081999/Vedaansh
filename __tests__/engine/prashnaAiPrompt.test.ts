// __tests__/engine/prashnaAiPrompt.test.ts
// Prashna M1 AI prompt: sections, question handling and length. Engine only.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { buildPrashnaAiPrompt, type PrashnaAiPromptOptions } from '@/lib/engine/prashnaAiPrompt'

let chart: ChartOutput
const AT = new Date('2026-11-22T16:00:00Z') // 21:30 IST
let base: PrashnaAiPromptOptions

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Prashna',
    birthDate: '2026-11-22',
    birthTime: '21:30:00',
    utcDate: '2026-11-22',
    utcTime: '16:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
  base = { at: AT, place: 'New Delhi, India', lat: 28.61, lng: 77.21, tz: 'Asia/Kolkata', hora: { lord: 'Sa', start: new Date('2026-11-22T15:40:00Z'), end: new Date('2026-11-22T16:45:00Z') } }
})

describe('buildPrashnaAiPrompt', () => {
  it('carries the question, the moment and every reading section', () => {
    const p = buildPrashnaAiPrompt(chart, { ...base, question: 'Will I get the job?' })
    expect(p).toContain('**Question:** Will I get the job?')
    expect(p).toContain('asked at night')
    expect(p).toContain('**Hora lord:** Saturn')
    for (const h of ['## 1. Question and moment', '## 2. Panchang', '## 3. Lagna', '## 4. Planets', '## 5. Houses', '## 6. Key connections', '## 8. Reference']) {
      expect(p, h).toContain(h)
    }
    expect(p).toContain('Avasthas')
    expect(p).toContain('Dhatu / mula / jeeva')
    expect(p).toContain('Now answer the question above')
    expect(p).not.toMatch(/undefined|NaN|\[object/)
  })

  it('withholds the question when asked, and asks for it when missing', () => {
    const hidden = buildPrashnaAiPrompt(chart, { ...base, question: 'Secret', hideQuestion: true })
    expect(hidden).not.toContain('Secret')
    expect(hidden).toContain('(withheld by the querent)')
    const none = buildPrashnaAiPrompt(chart, base)
    expect(none).toContain('(not stated)')
    expect(none).toContain('Ask the querent what the question is')
  })

  it('short drops the house reference and asks for Hindi when lang=hi', () => {
    const full = buildPrashnaAiPrompt(chart, base)
    const short = buildPrashnaAiPrompt(chart, { ...base, detail: 'short', lang: 'hi' })
    expect(short).not.toContain('## 8. Reference')
    expect(short.length).toBeLessThan(full.length)
    expect(short).toContain('Answer in Hindi')
  })
})
