// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/yogas.ts
//  Jaimini rajayogas from chara karakas and rashi drishti.
//  PK is the fifth chara karaka in the 7-karaka scheme.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { rashiAspectsOrOccupies } from './aspects'
import { resolveSignLord } from './trinity'

export interface JaiminiYogaHit {
  id: string
  name: string
  strength: 'Exceptional' | 'Strong' | 'Present'
  desc: string
}

interface YogaGraha {
  id: GrahaId
  rashi: Rashi
  degree: number
}

interface YogaKarakas {
  AK: GrahaId
  AmK: GrahaId
  PK: GrahaId
  DK: GrahaId
}

export interface JaiminiYogaCharts {
  d9?: YogaGraha[]
  d9Lagna?: Rashi
  /** Atmakaraka's navamsha sign. Fifth-lord yogas are also read from here. */
  karakamsha?: Rashi
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
}

function placed(grahas: YogaGraha[], id: GrahaId): YogaGraha | undefined {
  return grahas.find(g => g.id === id)
}

function linked(a: YogaGraha, b: YogaGraha): boolean {
  return a.id === b.id || rashiAspectsOrOccupies(a.rashi, b.rashi)
}

function linkWord(a: YogaGraha, b: YogaGraha): 'conjunction' | 'rashi drishti' {
  return a.rashi === b.rashi ? 'conjunction' : 'rashi drishti'
}

function pairYoga(
  id: string,
  name: string,
  a: YogaGraha,
  aRole: string,
  b: YogaGraha,
  bRole: string,
  meaning: string,
): JaiminiYogaHit {
  const same = a.id === b.id || a.rashi === b.rashi
  return {
    id,
    name,
    strength: same ? 'Exceptional' : 'Strong',
    desc: a.id === b.id
      ? `${GRAHA_NAMES[a.id]} is both ${aRole} and ${bRole}. ${meaning}`
      : `${GRAHA_NAMES[a.id]} (${aRole}) and ${GRAHA_NAMES[b.id]} (${bRole}) are connected by ${linkWord(a, b)}. ${meaning}`,
  }
}

function fifthLordYoga(
  id: string,
  role: string,
  planet: YogaGraha | undefined,
  grahas: YogaGraha[],
  reference: Rashi,
  referenceName: string,
): JaiminiYogaHit | null {
  if (!planet) return null
  const fifth = houseFrom(reference, 5)
  const lord = placed(grahas, resolveSignLord(fifth, grahas))
  if (!lord || (lord.id !== planet.id && !linked(planet, lord))) return null
  return {
    id,
    name: `${role} and 5th lord from ${referenceName}`,
    strength: lord.id === planet.id || planet.rashi === lord.rashi ? 'Exceptional' : 'Strong',
    desc: lord.id === planet.id
      ? `${GRAHA_NAMES[planet.id]} is both ${role} and 5th lord from ${referenceName} (${RASHI_NAMES[fifth]}).`
      : `${GRAHA_NAMES[planet.id]} (${role}) and 5th lord ${GRAHA_NAMES[lord.id]} (${RASHI_NAMES[fifth]} from ${referenceName}) are connected by ${linkWord(planet, lord)}.`,
  }
}

/** Conjunction and rashi-drishti rajayogas for one chart. Fifth lord is taken from `lagna`. */
function collectPairYogas(grahas: YogaGraha[], lagna: Rashi, karakas: YogaKarakas): JaiminiYogaHit[] {
  const yogas: JaiminiYogaHit[] = []
  const ak = placed(grahas, karakas.AK)
  const amk = placed(grahas, karakas.AmK)
  const pk = placed(grahas, karakas.PK)
  const dk = placed(grahas, karakas.DK)
  const push = (hit: JaiminiYogaHit | null) => { if (hit) yogas.push(hit) }

  if (ak && amk && linked(ak, amk)) {
    push(pairYoga('ak-amk', 'Atmakaraka–Amatyakaraka Raja Yoga', ak, 'AK', amk, 'AmK', 'Soul aim and career move together.'))
  }
  if (ak && dk && linked(ak, dk)) {
    push(pairYoga('ak-dk', 'Atmakaraka–Darakaraka Yoga', ak, 'AK', dk, 'DK', 'Partnership participates in the soul\'s work.'))
  }
  if (ak && pk && linked(ak, pk)) {
    push(pairYoga('ak-pk', 'Atmakaraka–Pitrukaraka Yoga', ak, 'AK', pk, 'PK', 'Father and authority participate in the soul\'s work.'))
  }
  if (amk && dk && linked(amk, dk)) {
    push(pairYoga('amk-dk', 'Amatyakaraka–Darakaraka Yoga', amk, 'AmK', dk, 'DK', 'Career and partnership move together.'))
  }
  if (amk && pk && linked(amk, pk)) {
    push(pairYoga('amk-pk', 'Amatyakaraka–Pitrukaraka Yoga', amk, 'AmK', pk, 'PK', 'Career and the father significator move together.'))
  }
  push(fifthLordYoga('ak-fifth-lord', 'Atmakaraka', ak, grahas, lagna, 'Lagna'))
  push(fifthLordYoga('amk-fifth-lord', 'Amatyakaraka', amk, grahas, lagna, 'Lagna'))
  push(fifthLordYoga('dk-fifth-lord', 'Darakaraka', dk, grahas, lagna, 'Lagna'))
  push(fifthLordYoga('pk-fifth-lord', 'Pitrukaraka', pk, grahas, lagna, 'Lagna'))

  if (ak && amk && pk && linked(ak, amk) && linked(ak, pk)) {
    yogas.push({
      id: 'ak-amk-pk',
      name: 'Atmakaraka–Amatyakaraka–PK Raja Yoga',
      strength: ak.rashi === amk.rashi && ak.rashi === pk.rashi ? 'Exceptional' : 'Strong',
      desc: `${GRAHA_NAMES[ak.id]} (AK) is connected to both ${GRAHA_NAMES[amk.id]} (AmK) and ${GRAHA_NAMES[pk.id]} (PK). Career and the fifth karaka reinforce the soul aim.`,
    })
  }

  const moon = placed(grahas, 'Mo')
  const venus = placed(grahas, 'Ve')
  if (moon && venus && linked(moon, venus)) {
    push(pairYoga('moon-venus', 'Moon–Venus Raja Yoga', moon, 'Moon', venus, 'Venus', 'The mind and the partner significator support status.'))
  }
  if (moon) {
    const aspecting = grahas.filter(g => g.id !== 'Mo' && rashiAspectsOrOccupies(g.rashi, moon.rashi))
    if (aspecting.length >= 3) {
      yogas.push({
        id: 'moon-aspects',
        name: 'Planets aspecting the Moon',
        strength: 'Strong',
        desc: `${aspecting.map(g => GRAHA_NAMES[g.id]).join(', ')} aspect or join the Moon. Several planets on the Moon form a raja yoga.`,
      })
    }
  }

  return yogas
}

/**
 * Rajayogas for the birth chart.
 * When navamsha placements are passed, a link in both charts is marked stronger.
 * Fifth lord from Karakamsha is added when that sign is not the birth lagna.
 */
export function detectJaiminiRajayogas(
  grahas: YogaGraha[],
  lagna: Rashi,
  karakas: YogaKarakas,
  arudhaLagna?: Rashi,
  charts?: JaiminiYogaCharts,
): JaiminiYogaHit[] {
  const yogas = collectPairYogas(grahas, lagna, karakas)
  const d9 = charts?.d9
  if (d9 && d9.length) {
    const d9Hits = collectPairYogas(d9, charts.d9Lagna ?? lagna, karakas)
    const d9Ids = new Set(d9Hits.map(hit => hit.id))
    for (const hit of yogas) {
      if (d9Ids.has(hit.id)) {
        hit.desc += ' The same link is present in navamsha, so the yoga is stronger.'
        if (hit.strength === 'Strong') hit.strength = 'Exceptional'
      } else {
        hit.desc += ' Navamsha does not repeat this link.'
      }
    }
    for (const hit of d9Hits) {
      if (yogas.some(existing => existing.id === hit.id)) continue
      yogas.push({
        ...hit,
        id: `d9-${hit.id}`,
        name: `${hit.name} (Navamsha)`,
        desc: `${hit.desc} This link is in navamsha and not in the birth chart.`,
      })
    }
  }

  if (charts?.karakamsha && charts.karakamsha !== lagna) {
    const ak = placed(grahas, karakas.AK)
    const amk = placed(grahas, karakas.AmK)
    const pk = placed(grahas, karakas.PK)
    const dk = placed(grahas, karakas.DK)
    const fromKk = [
      fifthLordYoga('kk-ak-fifth', 'Atmakaraka', ak, grahas, charts.karakamsha, 'Karakamsha'),
      fifthLordYoga('kk-amk-fifth', 'Amatyakaraka', amk, grahas, charts.karakamsha, 'Karakamsha'),
      fifthLordYoga('kk-dk-fifth', 'Darakaraka', dk, grahas, charts.karakamsha, 'Karakamsha'),
      fifthLordYoga('kk-pk-fifth', 'Pitrukaraka', pk, grahas, charts.karakamsha, 'Karakamsha'),
    ]
    for (const hit of fromKk) {
      if (hit) yogas.push(hit)
    }
  }

  if (arudhaLagna) {
    const benefics: GrahaId[] = ['Ju', 'Ve', 'Me']
    const hitting = grahas.filter(g => benefics.includes(g.id) && rashiAspectsOrOccupies(arudhaLagna, g.rashi))
    if (hitting.length >= 2) {
      yogas.push({
        id: 'arudha-shubha',
        name: 'Arudha Shubha Yoga',
        strength: 'Present',
        desc: `${hitting.map(g => GRAHA_NAMES[g.id]).join(' and ')} influence Arudha Lagna (${RASHI_NAMES[arudhaLagna]}). The public image has benefic support.`,
      })
    }
  }

  return yogas
}
