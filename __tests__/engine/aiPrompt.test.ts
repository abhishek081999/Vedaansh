import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { buildAiPrompt } from '@/lib/engine/aiPrompt'
import { AI_TOPICS, renderReading } from '@/lib/engine/aiPromptTopics'

let chart: ChartOutput
const NOW = new Date('2026-11-19T00:00:00Z').getTime()

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Aarav',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('buildAiPrompt', () => {
  it('includes every core calculation section', () => {
    const p = buildAiPrompt(chart, { plan: 'gold', now: NOW })
    for (const h of ['## 1. Birth details', '## 2. Lagna', '## 3. Planets', '## 4. Houses', '## 5. Strength', '## 6. Divisional charts', '## 7. Dashas', '## 8. Jaimini', '## 13. Detailed interpretation notes']) {
      expect(p).toContain(h)
    }
    expect(p).toContain('Aarav')
    expect(p).toContain('**Current Vimshottari:** Mahadasha Rahu')
    expect(p).not.toMatch(/undefined|NaN|\[object Object\]/)
  })

  it('works on a chart that went through JSON (dates as strings)', () => {
    const roundTripped = JSON.parse(JSON.stringify(chart)) as ChartOutput
    expect(buildAiPrompt(roundTripped, { plan: 'gold', now: NOW })).toBe(buildAiPrompt(chart, { plan: 'gold', now: NOW }))
  })

  it('keeps Gold hub notes out of the Free prompt', () => {
    const p = buildAiPrompt(chart, { plan: 'free', now: NOW })
    expect(p).not.toContain('Detailed interpretation notes')
    expect(p).toContain('## 3. Planets')
  })

  it('hides the name on request and asks for Hindi answers when lang=hi', () => {
    const p = buildAiPrompt(chart, { plan: 'free', now: NOW, hideName: true, lang: 'hi' })
    expect(p).not.toContain('Aarav')
    expect(p).toContain('Answer in Hindi')
  })

  it('adds a focus study for each chosen topic, with method, houses, vargas and dasha activation', () => {
    const p = buildAiPrompt(chart, { plan: 'gold', now: NOW, topics: [...AI_TOPICS] })
    expect(p.match(/^## Focus study: /gm)).toHaveLength(AI_TOPICS.length)
    expect(p).toContain('**Focus of this consultation:**')
    expect(p).toContain('### Method to follow')
    expect(p).toContain('**D10** Lagna')
    expect(p).toContain('**Dasha activation')
    expect(p).toContain('### Vedaansh reading: Career and profession reading')
    expect(p).toContain('### Vedaansh reading: Jaimini marriage (UL, DK)')
    expect(p).not.toMatch(/undefined|NaN|\[object Object\]/)
    // Generic questions are replaced by topic questions.
    expect(p).not.toContain('## Questions you can ask')
  })

  it('keeps Gold topic readings out of the Free prompt but still gives method and data', () => {
    const p = buildAiPrompt(chart, { plan: 'free', now: NOW, topics: ['marriage'] })
    expect(p).toContain('## Focus study: Marriage and married life')
    expect(p).toContain('### Key houses for marriage')
    expect(p).not.toContain('### Vedaansh reading:')
  })

  it('renderReading turns nested engine objects into readable bullets', () => {
    const out = renderReading({ id: 'x', title: 'Seventh lord', sign: 7, lord: 'Ve', notes: [{ title: 'A', text: 'Strong' }], tags: ['a', 'b'] })
    expect(out).toContain('**Seventh lord**')
    expect(out).toContain('Sign: Libra')
    expect(out).toContain('Lord: Venus')
    expect(out).toContain('Tags: a, b')
    expect(out).not.toContain('Id:')
  })

  it('includes graha drishti on planets, houses and house lords', () => {
    const p = buildAiPrompt(chart, { plan: 'free', now: NOW, topics: ['career'] })
    expect(p).toContain('### Graha drishti (planetary aspects)')
    expect(p).toContain('| Lord aspected by |')
    expect(p).toContain('| House aspected by |')
    expect(p).toMatch(/Mutual aspects: /)
    expect(p).not.toContain('Rahu ↔ Ketu')
    // Saturn always aspects the 3rd, 7th and 10th from itself.
    const sat = chart.grahas.find((g) => g.id === 'Sa')!
    const from = ((sat.rashi - chart.lagnas.ascRashi + 12) % 12) + 1
    const expected = [3, 7, 10].map((o) => `H${((from - 1 + o - 1) % 12) + 1} `)
    const row = p.split('\n').find((l) => l.startsWith('| Saturn | H'))!
    for (const h of expected) expect(row).toContain(h)
  })

  it('quotes Shadbala in rupas against the BPHS minimum, not as a bare ratio', () => {
    const p = buildAiPrompt(chart, { plan: 'free', now: NOW, topics: ['career'] })
    expect(p).toContain('### Shadbala (all values in rupas)')
    expect(p).toContain('| Total rupas | Minimum rupas | % of minimum |')
    expect(p).not.toContain('Shadbala ratio')
    expect(p).toMatch(/By total rupas: strongest \w+, weakest \w+\. By % of minimum: strongest \w+, weakest \w+\./)
    const me = chart.shadbala.planets.Me
    expect(p).toContain(`${me.total.toFixed(2)} of ${me.required.toFixed(2)} rupas (${Math.round((me.total / me.required) * 100)}%`)
  })

  it('personality topic covers Lagna, the Moon as mind, Kemadruma and temperament balance', () => {
    const p = buildAiPrompt(chart, { plan: 'gold', now: NOW, topics: ['personality'] })
    expect(p).toContain('## Focus study: Personality and mind')
    expect(p).toContain('### Mind and temperament data')
    expect(p).toMatch(/\*\*Moon \(mind\):\*\* \w+ H\d+/)
    expect(p).toMatch(/\*\*Kemadruma yoga:\*\* (not present|present)/)
    expect(p).toMatch(/\*\*Element balance\*\* \(Lagna \+ 9 planets\): /)
    expect(p).toContain('### Vedaansh reading: Lagna character profile')
    expect(p).toContain('do not diagnose mental health conditions')
    expect(p).not.toMatch(/undefined|NaN|\[object Object\]/)
  })
})
