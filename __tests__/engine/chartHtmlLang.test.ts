import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { applyChartHtmlChrome } from '@/lib/pdf/chartHtml.hi'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import { yogaNameHi } from '@/lib/engine/locale/yogas.hi'

let chart: ChartOutput

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

describe('chart HTML locale', () => {
  it('leaves English chrome unchanged', () => {
    const sample = '<h2>Janma Panchang</h2><td>Direct</td>'
    expect(applyChartHtmlChrome(sample, 'en')).toBe(sample)
    expect(applyChartHtmlChrome(sample)).toBe(sample)
  })

  it('translates Hindi chrome without touching the English generator path', () => {
    const en = generateChartHTML(chart)
    const enExplicit = generateChartHTML(chart, undefined, undefined, 'en')
    expect(enExplicit).toBe(en)
    expect(en).toContain('<html lang="en">')
    expect(en).toContain('Janma Panchang')
    expect(en).toContain('Shadbala calculations reveal the absolute computational power of your planets. Values are displayed in rupas.')
    expect(en).toContain('NORTH (Uttara)')
    const hi = generateChartHTML(chart, undefined, undefined, 'hi')
    expect(hi).toContain('<html lang="hi">')
    expect(hi).not.toContain('<html lang="en">')
    expect(hi).toContain('जन्म पंचांग')
    expect(hi).not.toContain('Janma Panchang')
    expect(hi).toContain('षड्बल गणना ग्रहों की पूर्ण गणनात्मक शक्ति दिखाती है।')
    expect(hi).not.toContain('Shadbala calculations reveal')
    expect(hi).not.toContain('Ashtakavarga helps in predicting')
    expect(hi).not.toContain('NORTH (Uttara)')
    expect(hi).toContain('उत्तर')
    expect(hi).not.toBe(en)
    const named = chart.yogas?.find((y) => yogaNameHi(y.name) !== y.name)
    if (named) expect(hi).not.toContain(named.name)
  })
})
