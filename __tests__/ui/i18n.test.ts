// Hindi translation guards: every English key has a Hindi value, the
// /hi URL helpers behave, and the Jyotish glossary stays complete.
import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import {
  isLocalizablePath,
  localizePath,
  splitLocalePath,
} from '@/i18n/config'
import { NAMESPACES, mergeMessages } from '@/i18n/messages'
import {
  GRAHA_HI,
  NAKSHATRA_HI,
  NAKSHATRA_SHORT_HI,
  RASHI_HI,
  SAMVATSARA_HI,
  glossaryEntries,
  masaHi,
  samvatsaraHi,
  termHi,
} from '@/i18n/jyotish'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { SAMVATSARA_NAMES } from '@/lib/panchang/hindu-calendar'
import { withDocumentCsp } from '@/lib/security/csp'

const MESSAGES_DIR = path.resolve(__dirname, '../../messages')

type Tree = { [key: string]: unknown }

function load(locale: string, ns: string): Tree {
  return JSON.parse(readFileSync(path.join(MESSAGES_DIR, locale, `${ns}.json`), 'utf8')) as Tree
}

/** Leaf paths with their value; arrays count as one leaf (compared by length). */
function leaves(tree: Tree, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>()
  for (const [key, value] of Object.entries(tree)) {
    const at = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of leaves(value as Tree, at)) out.set(k, v)
    } else {
      out.set(at, value)
    }
  }
  return out
}

/** ICU placeholders like {price} and rich tags like <b>. */
function placeholders(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return [...value.matchAll(/\{(\w+)\}|<(\w+)>/g)].map((m) => m[1] ?? `<${m[2]}>`).sort()
}

describe('message catalogues', () => {
  it('has a file for every namespace in both locales, and nothing extra', () => {
    for (const locale of ['en', 'hi']) {
      const files = readdirSync(path.join(MESSAGES_DIR, locale)).map((f) => f.replace(/\.json$/, '')).sort()
      expect(files).toEqual([...NAMESPACES].sort())
    }
  })

  for (const ns of NAMESPACES) {
    describe(ns, () => {
      const en = leaves(load('en', ns))
      const hi = leaves(load('hi', ns))

      it('Hindi has exactly the English keys', () => {
        const missing = [...en.keys()].filter((k) => !hi.has(k))
        const extra = [...hi.keys()].filter((k) => !en.has(k))
        expect({ missing, extra }).toEqual({ missing: [], extra: [] })
      })

      it('keeps the same placeholders and list lengths', () => {
        for (const [key, enValue] of en) {
          const hiValue = hi.get(key)
          if (Array.isArray(enValue)) {
            expect(Array.isArray(hiValue), key).toBe(true)
            expect((hiValue as unknown[]).length, key).toBe(enValue.length)
            continue
          }
          expect(placeholders(hiValue), key).toEqual(placeholders(enValue))
        }
      })

      it('has no empty Hindi strings', () => {
        const empty = [...hi].filter(([, v]) => typeof v === 'string' && v.trim() === '').map(([k]) => k)
        expect(empty).toEqual([])
      })
    })
  }

  it('falls back to English for keys a locale does not have', () => {
    const merged = mergeMessages({ a: { b: 'en-b', c: 'en-c' } }, { a: { b: 'hi-b' } })
    expect(merged).toEqual({ a: { b: 'hi-b', c: 'en-c' } })
  })
})

describe('locale paths', () => {
  it('splits the /hi prefix and leaves English unprefixed', () => {
    expect(splitLocalePath('/hi')).toEqual({ locale: 'hi', pathname: '/', prefixed: true })
    expect(splitLocalePath('/hi/panchang/calendar')).toEqual({ locale: 'hi', pathname: '/panchang/calendar', prefixed: true })
    expect(splitLocalePath('/panchang')).toEqual({ locale: 'en', pathname: '/panchang', prefixed: false })
    // Only a whole segment counts as a prefix.
    expect(splitLocalePath('/history')).toEqual({ locale: 'en', pathname: '/history', prefixed: false })
  })

  it('localizes paths', () => {
    expect(localizePath('/', 'hi')).toBe('/hi')
    expect(localizePath('/account?upgrade=gold', 'hi')).toBe('/hi/account?upgrade=gold')
    expect(localizePath('/chart', 'en')).toBe('/chart')
  })

  it('never localizes APIs, framework assets or files', () => {
    expect(isLocalizablePath('/api/chart/calculate')).toBe(false)
    expect(isLocalizablePath('/_next/static/x.js')).toBe(false)
    expect(isLocalizablePath('/sw.js')).toBe(false)
    expect(isLocalizablePath('/sitemap.xml')).toBe(false)
    expect(isLocalizablePath('/panchang')).toBe(true)
  })
})

describe('proxy locale headers', () => {
  const headers = { 'x-vedaansh-locale': 'hi', 'x-vedaansh-pathname': '/panchang' }

  it('rewrites a document request to the unprefixed page', () => {
    const req = new Request('http://localhost:3000/hi/panchang')
    const res = withDocumentCsp(req, '/panchang', {
      rewriteTo: new URL('http://localhost:3000/panchang'),
      requestHeaders: headers,
      documentHeaders: headers,
    })
    expect(res.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/panchang')
    expect(res.headers.get('x-middleware-request-x-vedaansh-locale')).toBe('hi')
    expect(res.headers.get('content-security-policy')).toBeTruthy()
  })

  it('leaves plain English RSC navigations untouched', () => {
    const req = new Request('http://localhost:3000/panchang', { headers: { RSC: '1' } })
    const res = withDocumentCsp(req, '/panchang', { documentHeaders: headers })
    expect(res.headers.get('x-middleware-override-headers')).toBeNull()
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('still rewrites Hindi RSC navigations and passes the locale', () => {
    const req = new Request('http://localhost:3000/hi/panchang', { headers: { RSC: '1' } })
    const res = withDocumentCsp(req, '/panchang', {
      rewriteTo: new URL('http://localhost:3000/panchang'),
      requestHeaders: headers,
      documentHeaders: headers,
    })
    expect(res.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/panchang')
    expect(res.headers.get('x-middleware-request-x-vedaansh-locale')).toBe('hi')
    expect(res.headers.get('content-security-policy')).toBeNull()
  })
})

describe('Jyotish glossary', () => {
  it('covers every graha, rashi, nakshatra and samvatsara', () => {
    for (const id of Object.keys(GRAHA_NAMES)) expect(GRAHA_HI[id as keyof typeof GRAHA_HI]).toBeTruthy()
    for (const r of Object.keys(RASHI_NAMES)) expect(RASHI_HI[Number(r) as keyof typeof RASHI_HI]).toBeTruthy()
    expect(NAKSHATRA_HI).toHaveLength(NAKSHATRA_NAMES.length)
    expect(NAKSHATRA_SHORT_HI).toHaveLength(NAKSHATRA_NAMES.length)
    expect(SAMVATSARA_HI).toHaveLength(SAMVATSARA_NAMES.length)
  })

  it('maps the English names the engine emits', () => {
    for (const name of [...Object.values(GRAHA_NAMES).slice(0, 9), ...Object.values(RASHI_NAMES), ...NAKSHATRA_NAMES]) {
      expect(termHi(name), name).toMatch(/[ऀ-ॿ]/)
    }
    expect(termHi('vishti')).toBe('विष्टि (भद्रा)')
    expect(termHi('Not a term')).toBe('Not a term')
  })

  it('keeps month names apart from nakshatras that share a spelling', () => {
    expect(termHi('Jyeshtha')).toBe('ज्येष्ठा')
    expect(masaHi('Jyeshtha')).toBe('ज्येष्ठ')
    expect(masaHi('Shravana')).toBe('श्रावण')
    expect(samvatsaraHi('Parabhava')).toBe('पराभव')
  })

  it('has only Devanagari values', () => {
    for (const [key, value] of glossaryEntries()) expect(value, key).toMatch(/^[ऀ-ॿ\s().,/\-]+$/)
  })
})

describe('engine text in Hindi', () => {
  it('translates panchang meta tables without changing ids', async () => {
    const { getTithiDayMeta } = await import('@/lib/engine/tithiMeta')
    const { getYogaMeta } = await import('@/lib/engine/yogaMeta')
    const { getKaranaMeta } = await import('@/lib/engine/karanaMeta')
    const { getVaarMeta } = await import('@/lib/engine/vaarMeta')
    const { getNakshatraMuhurtaMeta } = await import('@/lib/engine/nakshatraMuhurta')
    const deva = /[ऀ-ॿ]/
    for (let n = 1; n <= 30; n++) {
      const t = getTithiDayMeta(n, 'hi')
      expect(t.group.id).toBe(getTithiDayMeta(n).group.id)
      for (const v of [t.name, t.deity, t.significance, t.bestFor, t.temperament, t.group.label, t.group.dayGuidance]) expect(v).toMatch(deva)
    }
    for (let n = 1; n <= 27; n++) {
      const y = getYogaMeta(n, 'hi')!
      expect(y.id).toBe(getYogaMeta(n)!.id)
      for (const v of [y.name, y.meaning, y.dayGuidance, y.bestFor, y.challenge]) expect(v).toMatch(deva)
    }
    for (const k of ['Bava', 'Vishti', 'Kimstughna']) {
      const m = getKaranaMeta(k, 'hi')!
      expect(m.isBhadra).toBe(getKaranaMeta(k)!.isBhadra)
      expect(m.dayGuidance).toMatch(deva)
    }
    for (let v = 0; v < 7; v++) expect(getVaarMeta(v, 'hi').dayGuidance).toMatch(deva)
    for (let i = 0; i < 27; i++) {
      const m = getNakshatraMuhurtaMeta(i, 1, 'hi')
      expect(m.group.id).toBe(getNakshatraMuhurtaMeta(i).group.id)
      expect(m.fallEffect).toMatch(deva)
    }
  })

  it('builds the vishesh panchang in Hindi with the same yoga ids', async () => {
    const { analyzePanchangVishesh } = await import('@/lib/engine/panchangVishesh')
    const input = { tithiNumber: 29, varaNumber: 6, sunLon: 200, moonLon: 185, nakshatraIndex: 13 }
    const en = analyzePanchangVishesh(input)
    const hi = analyzePanchangVishesh({ ...input, lang: 'hi' })
    expect(hi.yogas.map(y => y.id)).toEqual(en.yogas.map(y => y.id))
    expect(hi.tithiStrength.score).toBe(en.tithiStrength.score)
    for (const y of hi.yogas) expect(`${y.label} ${y.detail}`).toMatch(/[ऀ-ॿ]/)
    expect(hi.tithiStrength.summary).toMatch(/[ऀ-ॿ]/)
    expect(hi.anandadi.name).toMatch(/[ऀ-ॿ]/)
  })
})

describe('chart workspace text in Hindi', () => {
  it('names yogas in Hindi and passes unknown names through', async () => {
    const { yogaNameHi } = await import('@/lib/engine/locale/yogas.hi')
    expect(yogaNameHi('Gajakesari Yoga')).toBe('गजकेसरी योग')
    expect(yogaNameHi('Shasha')).toBe('शश योग')
    expect(yogaNameHi('Maha Parivartana (H2 ⇄ H9)')).toBe('महा परिवर्तन (भाव 2 ⇄ भाव 9)')
    expect(yogaNameHi('Some New Yoga')).toBe('Some New Yoga')
  })

  it('gives every varga a Hindi name and topic without changing ids or tiers', async () => {
    const { VARGA_UI_LIST, vargaUiList, vargaText } = await import('@/lib/engine/vargas')
    const hi = vargaUiList('hi')
    expect(hi.map(v => [v.name, v.tier])).toEqual(VARGA_UI_LIST.map(v => [v.name, v.tier]))
    for (const v of hi) {
      expect(v.full, v.name).toMatch(/[ऀ-ॿ]/)
      expect(v.topic, v.name).toMatch(/[ऀ-ॿ]/)
    }
    expect(vargaUiList()).toBe(VARGA_UI_LIST)
    expect(vargaText('D9')?.full).toBe('Navamsha')
  })
})

describe('lagna house themes in Hindi', () => {
  it('has twelve Hindi themes for each of the twelve lagnas', async () => {
    const { getLagnaHouseReading } = await import('@/lib/engine/lagnaCharacter')
    for (let r = 1; r <= 12; r++) {
      for (let h = 1; h <= 12; h++) {
        const en = getLagnaHouseReading(r as 1, h as 1)!
        const hi = getLagnaHouseReading(r as 1, h as 1, 'hi')!
        expect(hi.house).toBe(en.house)
        expect(hi.theme, `${r}/${h}`).toMatch(/[ऀ-ॿ]/)
        expect(hi.signName).toMatch(/[ऀ-ॿ]/)
      }
    }
    expect(getLagnaHouseReading(1, 1)!.signName).toBe('Aries')
  })
})
