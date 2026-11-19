import { expect, it } from 'vitest'
import { writeFileSync } from 'fs'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeCareerProfession, readCareerTransits } from '@/lib/engine/careerProfession'
import { analyzeCareerMethod } from '@/lib/engine/careerMethod'
import type { GrahaId, Rashi } from '@/types/astrology'

/** Codes / tech labels allowed to remain Latin in Hindi output. */
const ALLOWED = new Set([
  'BPHS', 'KP', 'SAV', 'AmK', 'AK',
  'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke',
  'PRIMARY', 'SECONDARY', 'TERTIARY',
])
const isAllowed = (w: string) =>
  ALLOWED.has(w)
  || w.length === 1
  || /^D\d+$/.test(w)
  || /^A\d+$/.test(w)
  || /^D#$/.test(w)
  || /^A#$/.test(w)
const englishWords = (s: string) =>
  (s.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []).filter(w => !isAllowed(w))
const SKIP = new Set(['id', 'tone', 'fit', 'group', 'level', 'kind', 'start', 'end', 'answerId', 'varga', 'grahaId', 'key'])

function walk(x: unknown, path: string, out: [string, string][]) {
  if (typeof x === 'string') { out.push([path, x]); return }
  if (Array.isArray(x)) { x.forEach(v => walk(v, `${path}[]`, out)); return }
  if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (SKIP.has(k)) continue
      walk(v, `${path}.${k}`, out)
    }
  }
}

it('career Hindi leak scan: profession/transits clean; method tracked', async () => {
  const leaks = new Map<string, { path: string; n: number }>()
  const dates = ['1992-08-23', '1985-02-11', '2001-11-30']
  for (const d of dates) {
    for (let i = 0; i < 12; i++) {
      const hh = (i * 2 + 1) % 24
      const mm = (i * 7) % 60
      const tot = hh * 60 + mm - 330
      const utcDate = tot < 0
        ? new Date(new Date(d).getTime() - 86400000).toISOString().slice(0, 10)
        : d
      const um = (tot + 1440) % 1440
      const utcTime = `${String(Math.floor(um / 60)).padStart(2, '0')}:${String(um % 60).padStart(2, '0')}:00`
      const c = await calculateChart({
        name: 'X',
        birthDate: d,
        birthTime: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        utcDate,
        utcTime,
        birthPlace: 'Delhi',
        latitude: 28.61,
        longitude: 77.21,
        timezone: 'Asia/Kolkata',
        gender: 'male',
      } as never)
      const out: [string, string][] = []
      walk(analyzeCareerProfession(c, new Date('2026-06-01'), 'hi'), 'P', out)
      walk(analyzeCareerMethod(c, new Date('2026-06-01'), 'hi'), 'M', out)
      const pos = (['Ju', 'Sa', 'Ra', 'Ke', 'Su', 'Ma'] as GrahaId[]).map((id, k) => ({
        id,
        rashi: (((i + k * 3) % 12) + 1) as Rashi,
        isRetro: k % 2 === 0,
      }))
      walk(readCareerTransits(c, pos, 'hi'), 'T', out)
      for (const [p, s] of out) {
        for (const sent of s.split(/(?<=[.।!?])\s+|\n+/)) {
          if (!englishWords(sent).length) continue
          const tmpl = sent.replace(/\d+(\.\d+)?/g, '#')
          const e = leaks.get(tmpl)
          if (e) e.n++
          else leaks.set(tmpl, { path: p, n: 1 })
        }
      }
    }
  }
  const rows = [...leaks.entries()].sort((a, b) => a[1].path.localeCompare(b[1].path))
  writeFileSync(process.env.SCAN_OUT ?? '/tmp/career-hindi-scan.txt', rows.map(([t, v]) => `${v.path}\t${v.n}\t${t}`).join('\n'))
  const by = { P: 0, M: 0, T: 0 }
  for (const [, v] of rows) by[v.path[0] as 'P' | 'M' | 'T']++
  // Profession + transit Hindi-at-source should be clean; method still phrase-localizes.
  expect(by.P, `profession English templates still leaking: ${by.P}`).toBe(0)
  expect(by.T, `transit English templates still leaking: ${by.T}`).toBe(0)
  // Soft ceiling while careerMethod source Hindi continues — tighten as batches land.
  expect(by.M).toBeLessThan(600)
}, 300000)
