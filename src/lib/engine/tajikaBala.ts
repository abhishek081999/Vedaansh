// ─────────────────────────────────────────────────────────────
//  src/lib/engine/tajikaBala.ts
//  Pañcavargīya bala: the five-fold Tajika strength of Tājika Nīlakaṇṭhī.
//  Kṣetra (sign) 30, Ucca (exaltation) 20, Hadda (term) 15, Drekkāṇa 10,
//  Navāṃśa 5; the sum over four gives a strength out of 20.
//  Friendship uses the Parashari natural table. Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { EXALTATION_DEGREE, EXALTATION_SIGN, naturalRelationship } from './dignity'

export const TAJIKA_SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

/** Hadda (terms) per sign: [lord, width in degrees], adding up to 30. */
export const HADDA: Record<number, Array<[GrahaId, number]>> = {
  1: [['Ju', 6], ['Ve', 6], ['Me', 8], ['Ma', 5], ['Sa', 5]],
  2: [['Ve', 8], ['Me', 6], ['Ju', 8], ['Sa', 5], ['Ma', 3]],
  3: [['Me', 6], ['Ju', 6], ['Ve', 5], ['Ma', 7], ['Sa', 6]],
  4: [['Ma', 7], ['Ve', 6], ['Me', 6], ['Ju', 7], ['Sa', 4]],
  5: [['Ju', 6], ['Ve', 5], ['Sa', 7], ['Me', 6], ['Ma', 6]],
  6: [['Me', 7], ['Ve', 10], ['Ju', 4], ['Ma', 7], ['Sa', 2]],
  7: [['Sa', 6], ['Me', 8], ['Ju', 7], ['Ve', 7], ['Ma', 2]],
  8: [['Ma', 7], ['Ve', 4], ['Me', 8], ['Ju', 5], ['Sa', 6]],
  9: [['Ju', 12], ['Ve', 5], ['Me', 4], ['Sa', 5], ['Ma', 4]],
  10: [['Me', 7], ['Ju', 7], ['Ve', 8], ['Sa', 4], ['Ma', 4]],
  11: [['Me', 7], ['Ve', 6], ['Ju', 7], ['Ma', 5], ['Sa', 5]],
  12: [['Ve', 12], ['Ju', 4], ['Me', 3], ['Ma', 9], ['Sa', 2]],
}

export function haddaLord(rashi: Rashi, degree: number): GrahaId {
  let end = 0
  for (const [lord, width] of HADDA[rashi]) {
    end += width
    if (degree < end) return lord
  }
  return HADDA[rashi][4][0]
}

/** Parashari drekkāṇa: the sign itself, then the 5th, then the 9th. */
export function drekkanaLord(rashi: Rashi, degree: number): GrahaId {
  const part = Math.min(2, Math.floor(degree / 10))
  return TAJIKA_SIGN_LORD[((rashi - 1 + part * 4) % 12) + 1]
}

export function navamsaLord(rashi: Rashi, degree: number): GrahaId {
  const pada = Math.min(8, Math.floor(degree / (30 / 9)))
  return TAJIKA_SIGN_LORD[(((rashi - 1) * 9 + pada) % 12) + 1]
}

export type Relation = 'own' | 'friend' | 'neutral' | 'enemy'

function relation(planet: GrahaId, lord: GrahaId): Relation {
  if (planet === lord) return 'own'
  return naturalRelationship(planet, lord)
}

/** Points for own / friend / neutral / enemy, halving at each step. */
const score = (full: number, r: Relation) => full * { own: 1, friend: 0.5, neutral: 0.25, enemy: 0.125 }[r]

export type BalaBand = 'strong' | 'middling' | 'weak'

export interface PanchavargiyaBala {
  id: GrahaId
  kshetra: { lord: GrahaId; relation: Relation; points: number }
  ucca: { points: number }
  hadda: { lord: GrahaId; relation: Relation; points: number }
  drekkana: { lord: GrahaId; relation: Relation; points: number }
  navamsa: { lord: GrahaId; relation: Relation; points: number }
  /** Sum of the five over 4, out of 20. */
  total: number
  /** 10 and above is strong (sabala); below 5 is weak (nirbala). */
  band: BalaBand
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** Ucca bala: 20 at the deep-exaltation point, 0 at the deep-debilitation point. */
export function uccaBala(id: GrahaId, longitude: number): number {
  const sign = EXALTATION_SIGN[id], deg = EXALTATION_DEGREE[id]
  if (!sign || deg === undefined) return 0
  const deep = (sign - 1) * 30 + deg
  const d = Math.abs((((longitude - deep) % 360) + 540) % 360 - 180)
  return r2((180 - d) / 9)
}

export function panchavargiyaBala(g: GrahaData): PanchavargiyaBala {
  const part = (lord: GrahaId, full: number) => {
    const rel = relation(g.id, lord)
    return { lord, relation: rel, points: score(full, rel) }
  }
  const kshetra = part(TAJIKA_SIGN_LORD[g.rashi], 30)
  const ucca = { points: uccaBala(g.id, g.totalDegree) }
  const hadda = part(haddaLord(g.rashi, g.degree), 15)
  const drekkana = part(drekkanaLord(g.rashi, g.degree), 10)
  const navamsa = part(navamsaLord(g.rashi, g.degree), 5)
  const total = r2((kshetra.points + ucca.points + hadda.points + drekkana.points + navamsa.points) / 4)
  return { id: g.id, kshetra, ucca, hadda, drekkana, navamsa, total, band: total >= 10 ? 'strong' : total < 5 ? 'weak' : 'middling' }
}

export function panchavargiyaFor(grahas: Record<string, GrahaData>, ids: GrahaId[]): Record<string, PanchavargiyaBala> {
  const out: Record<string, PanchavargiyaBala> = {}
  for (const id of ids) if (grahas[id]) out[id] = panchavargiyaBala(grahas[id])
  return out
}
