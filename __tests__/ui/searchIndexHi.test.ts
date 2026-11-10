import { describe, expect, it } from 'vitest'
import { getSearchCorpus, searchSite } from '@/lib/seo/search-index'

const DEVA = /[\u0900-\u097F]/

function toolsAndPages(locale: 'en' | 'hi') {
  return getSearchCorpus(locale).filter((doc) => doc.type !== 'guide')
}

describe('search tool and page docs', () => {
  const en = toolsAndPages('en')
  const hi = toolsAndPages('hi')

  it('keeps English copy as the source', () => {
    expect(en.length).toBeGreaterThan(0)
    for (const doc of en) {
      expect(doc.title).not.toMatch(DEVA)
      expect(doc.description).not.toMatch(DEVA)
    }
    expect(searchSite('kundali', 5, 'en').some((doc) => doc.url === '/' && doc.title.includes('Kundali'))).toBe(true)
  })

  it('overlays Hindi title, description, and Devanagari keywords without dropping Latin keywords', () => {
    expect(hi.map((doc) => doc.url)).toEqual(en.map((doc) => doc.url))
    for (let i = 0; i < en.length; i++) {
      expect(hi[i].type).toBe(en[i].type)
      expect(hi[i].title).not.toBe(en[i].title)
      expect(hi[i].description).not.toBe(en[i].description)
      expect(hi[i].title).toMatch(DEVA)
      expect(hi[i].description).toMatch(DEVA)
      for (const keyword of en[i].keywords) expect(hi[i].keywords).toContain(keyword)
      expect(hi[i].keywords.some((keyword) => DEVA.test(keyword))).toBe(true)
    }
  })

  it('matches कुंडली and kundali on the Hindi corpus', () => {
    const devanagari = searchSite('कुंडली', 5, 'hi')
    expect(devanagari.length).toBeGreaterThan(0)
    expect(devanagari.every((doc) => DEVA.test(doc.title))).toBe(true)

    const kundali = searchSite('कुंडली', 24, 'hi')
    const chart = kundali.find((doc) => doc.url === '/')
    expect(chart?.title).toContain('कुंडली')
    expect(chart?.keywords).toContain('kundali')

    const latin = searchSite('kundali', 5, 'hi')
    const latinChart = latin.find((doc) => doc.url === '/')
    expect(latinChart?.title).toContain('कुंडली')
    expect(latinChart?.keywords).toContain('kundali')

    const panchang = searchSite('राहु काल', 5, 'hi')
    expect(panchang.some((doc) => doc.url === '/panchang' && doc.title.includes('पंचांग'))).toBe(true)
  })
})
