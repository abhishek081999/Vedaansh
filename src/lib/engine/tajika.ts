
import { type GrahaData, type Rashi, type GrahaId } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { TAJIKA_TEXT_HI, TAJIKA_TYPE_HI, TAJIKA_YOGA_NAME_HI } from '@/lib/engine/locale/tajika.hi'
import { GRAHA_HI } from '@/i18n/jyotish'

export interface TajikaYoga {
  name: string
  graha1: GrahaId
  graha2: GrahaId
  description: string
  type: 'auspicious' | 'inauspicious' | 'neutral'
}

/**
 * Muntha: Starts in natal ascendant rashi at birth (Age 0).
 * Moves 1 Rashi per year.
 */
export function getMunthaRashi(natalAscRashi: Rashi, completedAge: number): Rashi {
  const rIdx = ((natalAscRashi - 1 + completedAge) % 12) + 1
  return rIdx as Rashi
}

/**
 * Panchadhikari candidate selection for Lord of the Year (Varsheshwara).
 * 1. Muntha Lord (Ruler of Muntha Rashi in SR chart)
 * 2. Janma Lagna Lord (Natal Asc Lord)
 * 3. Varsha Lagna Lord (Solar Return Asc Lord)
 * 4. Dina/Ratri Pati (Sun if day, Moon if night)
 * 5. Thamthra Lord (Lord of Sun's rashi or Moon's rashi based on day/night)
 */
export function getYearLordCandidates(
  natalAscRashi: Rashi,
  srAscRashi: Rashi,
  munthaRashi: Rashi,
  srSunRashi: Rashi,
  srMoonRashi: Rashi,
  isDayBirth: boolean
) {
  // Simplified logic for now
  return {
    munthaLord: getRashiLord(munthaRashi),
    natalAscLord: getRashiLord(natalAscRashi),
    srAscLord: getRashiLord(srAscRashi),
    dinaRatriLord: isDayBirth ? 'Su' : 'Mo',
  }
}

/**
 * Simple Lord mapping (Classical)
 */
function getRashiLord(r: Rashi): GrahaId {
  const lords: Record<number, GrahaId> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
  }
  return lords[r] || 'Su'
}

/**
 * Tajika Aspects:
 * Friendly: 3, 5, 9, 11 (3/11 and 5/9)
 * Hostile: 1, 4, 7, 10
 * Neutral: 2, 6, 8, 12
 */
export function checkTajikaAspect(r1: Rashi, r2: Rashi) {
  const diff = ((r2 - r1 + 12) % 12) + 1
  if ([3, 5, 9, 11].includes(diff)) return 'friendly'
  if ([4, 7, 10].includes(diff)) return 'hostile'
  if (diff === 1) return 'hostile' // Conjunction
  return 'neutral'
}

// ── Links between two planets ──────────────────────────────────

/** Tajika deeptāṃśa (orb of light) in degrees. */
export const DEEPTAMSA: Partial<Record<GrahaId, number>> = { Su: 15, Mo: 12, Ma: 8, Me: 7, Ju: 9, Ve: 7, Sa: 9 }

export const TAJIKA_SEVEN: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

export type TajikaLinkType = 'ithasala' | 'ishrafa' | 'none'

export interface TajikaLink {
  type: TajikaLinkType
  fast: GrahaId
  slow: GrahaId
  aspect: 'friendly' | 'hostile' | 'none'
  gap: number
  orb: number
  /** Days to exact at current speeds, for an ithasala. */
  daysAtCurrentSpeed: number | null
}

const fastSlow = (a: GrahaData, b: GrahaData): [GrahaData, GrahaData] =>
  Math.abs(a.speed) >= Math.abs(b.speed) ? [a, b] : [b, a]

const meanOrb = (a: GrahaId, b: GrahaId) => ((DEEPTAMSA[a] ?? 0) + (DEEPTAMSA[b] ?? 0)) / 2

/** Reads actual signed speeds, so a retrograde planet applies or separates correctly. */
export function tajikaLink(a: GrahaData, b: GrahaData): TajikaLink {
  const [fast, slow] = fastSlow(a, b)
  const nature = checkTajikaAspect(fast.rashi, slow.rashi)
  const orb = meanOrb(fast.id, slow.id)
  const gap = slow.degree - fast.degree
  const base = { fast: fast.id, slow: slow.id, gap: Math.round(Math.abs(gap) * 100) / 100, orb }
  if (nature === 'neutral' || Math.abs(gap) > orb) {
    return { ...base, type: 'none', aspect: nature === 'neutral' ? 'none' : nature, daysAtCurrentSpeed: null }
  }
  const relative = fast.speed - slow.speed
  // Within 1° still counts as perfecting.
  const applying = Math.abs(gap) <= 1 || gap * relative > 0
  return {
    ...base,
    type: applying ? 'ithasala' : 'ishrafa',
    aspect: nature,
    daysAtCurrentSpeed: applying && relative !== 0 ? Math.max(0, Math.ceil(Math.abs(gap / relative))) : null,
  }
}

/**
 * Bhaviṣyat (future) ithasala: the faster planet, moving direct in the last
 * degrees of its sign, reaches an aspect with the slower planet once it
 * enters the next sign, and the distance across the cusp is inside the orb.
 */
export function futureIthasala(a: GrahaData, b: GrahaData): TajikaLink | null {
  const [fast, slow] = fastSlow(a, b)
  if (fast.speed <= 0 || tajikaLink(a, b).type === 'ithasala') return null
  const next = ((fast.rashi % 12) + 1) as Rashi
  const nature = checkTajikaAspect(next, slow.rashi)
  if (nature === 'neutral') return null
  const orb = meanOrb(fast.id, slow.id)
  const gap = slow.degree + 30 - fast.degree
  if (gap > orb) return null
  const relative = fast.speed - slow.speed
  if (relative <= 0) return null
  return {
    type: 'ithasala', fast: fast.id, slow: slow.id, aspect: nature, orb,
    gap: Math.round(gap * 100) / 100,
    daysAtCurrentSpeed: Math.max(0, Math.ceil(gap / relative)),
  }
}

// ── Strength as Tajika reads it ────────────────────────────────

const STRONG_DIGNITY = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY = ['debilitated', 'enemy', 'great_enemy']
export const TAJIKA_KENDRA_PANAPHARA = [1, 2, 4, 5, 7, 8, 10, 11]
export const TAJIKA_APOKLIMA = [3, 6, 9, 12]

/** Own, moolatrikona or exalted, and not combust. */
export const tajikaStrong = (g: GrahaData) => STRONG_DIGNITY.includes(g.dignity) && !g.isCombust
/** Debilitated or in an enemy sign, or in the 6th, 8th or 12th. Combustion is read by Radda. */
export const tajikaWeak = (g: GrahaData, house: number) => WEAK_DIGNITY.includes(g.dignity) || [6, 8, 12].includes(house)

// ── The sixteen yogas of Tājika Nīlakaṇṭhī, for two significators ───

export type TajikaYogaId =
  | 'ikkabala' | 'induvara' | 'ithasala' | 'bhavishyat-ithasala' | 'ishrafa'
  | 'nakta' | 'yamaya' | 'manau' | 'kamboola' | 'gairi-kamboola' | 'khallasara'
  | 'radda' | 'duphali-kuttha' | 'dutthottha-davira' | 'tambira' | 'kuttha' | 'durupha'

export interface TajikaYogaHit {
  id: TajikaYogaId
  /** Planets named in the yoga: the pair first, then any third planet. */
  planets: GrahaId[]
  link?: TajikaLink
  /** Kamboola grade, from the strength of the Moon and the planet it joins. */
  grade?: 'uttama' | 'madhyama' | 'adhama'
  /** Radda: why the named planet spoils the ithasala. */
  cause?: 'combust' | 'retrograde'
}

export interface TajikaChart {
  grahas: Record<string, GrahaData>
  house(id: GrahaId): number
  /**
   * Strength band, usually from Pañcavargīya bala. Without it, strength
   * falls back to dignity (own / moolatrikona / exalted vs debilitated / enemy).
   */
  band?(id: GrahaId): 'strong' | 'middling' | 'weak'
}

/**
 * Tajika yogas between two significators (in praśna, the lagna lord and the
 * lord of the matter). Definitions follow the Saṃjñā Tantra of Tājika
 * Nīlakaṇṭhī as usually rendered; authors differ in detail, so read these as
 * one consistent convention.
 */
export function findTajikaYogas(chart: TajikaChart, a: GrahaId, b: GrahaId): TajikaYogaHit[] {
  const G = chart.grahas
  const seven = TAJIKA_SEVEN.filter(id => G[id])
  const strongG = (g: GrahaData) => (chart.band ? chart.band(g.id) === 'strong' && !g.isCombust : tajikaStrong(g))
  const weakG = (g: GrahaData) => (chart.band ? chart.band(g.id) === 'weak' : WEAK_DIGNITY.includes(g.dignity)) || [6, 8, 12].includes(chart.house(g.id))
  const out: TajikaYogaHit[] = []

  // Ikkabāla / Induvāra: the whole chart in strong or in falling houses.
  const houses = seven.map(id => chart.house(id))
  if (houses.every(h => TAJIKA_KENDRA_PANAPHARA.includes(h))) out.push({ id: 'ikkabala', planets: seven })
  else if (houses.every(h => TAJIKA_APOKLIMA.includes(h))) out.push({ id: 'induvara', planets: seven })

  if (a === b || !G[a] || !G[b]) return out
  const ga = G[a], gb = G[b]
  const link = tajikaLink(ga, gb)
  const pair: GrahaId[] = [link.fast, link.slow]
  const others = seven.filter(id => id !== a && id !== b)
  const strongThird = (sig: GrahaId) => others.find(id => id !== 'Mo' && strongG(G[id]) && tajikaLink(G[sig], G[id]).type === 'ithasala')

  if (link.type === 'ithasala') {
    out.push({ id: 'ithasala', planets: pair, link })
    const fast = G[link.fast], slow = G[link.slow]

    // Manau: Mars or Saturn in hostile aspect, inside its orb, to a significator.
    const cutter = (['Ma', 'Sa'] as GrahaId[]).find(m => m !== a && m !== b && G[m] && [a, b].some(s => {
      const l = tajikaLink(G[m], G[s])
      return l.type !== 'none' && l.aspect === 'hostile'
    }))
    if (cutter) out.push({ id: 'manau', planets: [...pair, cutter] })

    // The Moon: Kamboola, Gairi-kamboola or Khallasara.
    if (a !== 'Mo' && b !== 'Mo' && G.Mo) {
      const moon = G.Mo
      const joined = [a, b].find(id => tajikaLink(moon, G[id]).type === 'ithasala')
      if (joined) {
        const strong = Number(strongG(moon)) + Number(strongG(G[joined]))
        out.push({ id: 'kamboola', planets: [...pair, 'Mo', joined], grade: strong === 2 ? 'uttama' : strong === 1 ? 'madhyama' : 'adhama' })
      } else if (seven.every(id => id === 'Mo' || tajikaLink(moon, G[id]).type === 'none')) {
        const later = seven.find(id => id !== 'Mo' && strongG(G[id]) && futureIthasala(moon, G[id]))
        out.push(later ? { id: 'gairi-kamboola', planets: [...pair, 'Mo', later] } : { id: 'khallasara', planets: [...pair, 'Mo'] })
      }
    }

    // Radda: a planet of the ithasala turns back or is burnt by the Sun.
    const spoiled = pair.find(id => G[id].isCombust || (G[id].isRetro && id !== 'Su' && id !== 'Mo'))
    if (spoiled) out.push({ id: 'radda', planets: [...pair, spoiled], cause: G[spoiled].isCombust ? 'combust' : 'retrograde' })

    const wf = weakG(fast), ws = weakG(slow)
    if (wf && ws) {
      out.push({ id: 'durupha', planets: pair })
      const helper = strongThird(a) ?? strongThird(b)
      if (helper) out.push({ id: 'dutthottha-davira', planets: [...pair, helper] })
    } else if (wf && strongG(slow)) {
      out.push({ id: 'duphali-kuttha', planets: pair })
    } else if (!wf && !ws && (strongG(fast) || strongG(slow))
      && pair.every(id => TAJIKA_KENDRA_PANAPHARA.includes(chart.house(id)))) {
      out.push({ id: 'kuttha', planets: pair })
    }
    return out
  }

  const future = futureIthasala(ga, gb)
  if (future) {
    out.push({ id: 'bhavishyat-ithasala', planets: [future.fast, future.slow], link: future })
    return out
  }

  if (link.type === 'ishrafa') out.push({ id: 'ishrafa', planets: pair, link })

  // Nakta / Yamaya: only when the significators themselves are not joined.
  if (link.type === 'none') {
    for (const id of others) {
      const la = tajikaLink(G[id], ga), lb = tajikaLink(G[id], gb)
      if (la.type !== 'ithasala' || lb.type !== 'ithasala') continue
      if (la.fast === id && lb.fast === id) out.push({ id: 'nakta', planets: [a, b, id] })
      else if (la.slow === id && lb.slow === id) out.push({ id: 'yamaya', planets: [a, b, id] })
    }
  }

  // Tambīra: a significator at the end of its sign will join a strong planet in the next.
  if (!out.some(y => y.id === 'nakta' || y.id === 'yamaya')) {
    for (const sig of [a, b]) {
      const t = others.find(id => strongG(G[id]) && futureIthasala(G[sig], G[id])?.fast === sig)
      if (t) { out.push({ id: 'tambira', planets: [a, b, t] }); break }
    }
  }
  return out
}

/** Varshaphal: Ithasala and Ishrafa between each pair of the seven, with the chart-wide yogas. */
export function getTajikaYogas(grahas: GrahaData[], ascRashi?: Rashi): TajikaYoga[] {
  const yogas: TajikaYoga[] = []
  const seven = grahas.filter(g => TAJIKA_SEVEN.includes(g.id))
  if (ascRashi && seven.length === 7) {
    const houses = seven.map(g => ((g.rashi - ascRashi + 12) % 12) + 1)
    if (houses.every(h => TAJIKA_KENDRA_PANAPHARA.includes(h))) {
      yogas.push({ name: 'Ikkabala', graha1: 'Su', graha2: 'Sa', type: 'auspicious', description: 'All seven planets are in kendras and panapharas: a strong year.' })
    } else if (houses.every(h => TAJIKA_APOKLIMA.includes(h))) {
      yogas.push({ name: 'Induvara', graha1: 'Su', graha2: 'Sa', type: 'inauspicious', description: 'All seven planets are in apoklimas: a weak year.' })
    }
  }
  for (let i = 0; i < seven.length; i++) {
    for (let j = i + 1; j < seven.length; j++) {
      const l = tajikaLink(seven[i], seven[j])
      if (l.type === 'ithasala') {
        yogas.push({
          name: 'Ithasala', graha1: l.fast, graha2: l.slow,
          type: l.aspect === 'friendly' ? 'auspicious' : 'inauspicious',
          description: `${l.fast} (fast) is applying to ${l.slow} (slow) — results indicated shortly.`,
        })
      } else if (l.type === 'ishrafa') {
        yogas.push({
          name: 'Ishrafa', graha1: l.fast, graha2: l.slow, type: 'inauspicious',
          description: `${l.fast} (fast) is separating from ${l.slow} (slow) — the moment has passed.`,
        })
      }
    }
  }
  return yogas
}

/**
 * Display text for a Tajika yoga in `lang`. English returns the stored
 * fields unchanged; Hindi rebuilds them from the graha ids and type.
 */
export function tajikaYogaText(
  yoga: TajikaYoga,
  lang: EngineLang = 'en',
): { name: string; typeLabel: string; aspecting: string; description: string } {
  const chartWide = yoga.name === 'Ikkabala' || yoga.name === 'Induvara'
  if (lang !== 'hi') {
    return {
      name: yoga.name,
      typeLabel: yoga.type.toUpperCase(),
      aspecting: chartWide ? '' : `${yoga.graha1} aspecting ${yoga.graha2}.`,
      description: yoga.description,
    }
  }
  const g = (id: GrahaId) => GRAHA_HI[id] ?? id
  return {
    name: TAJIKA_YOGA_NAME_HI[yoga.name] ?? yoga.name,
    typeLabel: TAJIKA_TYPE_HI[yoga.type] ?? yoga.type,
    aspecting: chartWide ? '' : fill(TAJIKA_TEXT_HI.aspecting, { a: g(yoga.graha1), b: g(yoga.graha2) }),
    description: TAJIKA_TEXT_HI.byName[yoga.name]
      ? fill(TAJIKA_TEXT_HI.byName[yoga.name]!, { fast: g(yoga.graha1), slow: g(yoga.graha2) })
      : yoga.description,
  }
}
