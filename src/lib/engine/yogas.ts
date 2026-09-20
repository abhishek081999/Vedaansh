// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogas.ts
//  Graha Yoga detection — classical combinations
//  Reference: BPHS, Phaladeepika, Saravali, Jataka Parijata
//
//  Houses are Whole Sign (rashi from Lagna), matching the chart
//  UI and Parashari yoga definitions. Equal-degree bhava cusps
//  must NOT be used here — they disagree with what users see.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData } from '@/types/astrology'

// ── Types ─────────────────────────────────────────────────────

export type YogaCategory =
  | 'raja'        // Power, authority, status
  | 'dhana'       // Wealth, prosperity
  | 'mahapurusha' // Five great personality yogas
  | 'viparita'    // Reversal yogas
  | 'special'     // Gajakesari, Budhaditya, etc.
  | 'lunar'       // Moon-based yogas (Sunapha, Anapha, etc.)
  | 'nabhasa'     // Geometric/Shape yogas
  | 'malefic'     // Negative combinations
  | 'parivartana' // Exchange of lords

export interface YogaResult {
  name:        string
  sanskrit:    string
  category:    YogaCategory
  strength:    'strong' | 'moderate' | 'weak'
  planets:     string[]    // planet IDs involved
  houses:      number[]    // houses involved
  description: string
  effect:      string
}

// ── Helpers ───────────────────────────────────────────────────

/** Whole-sign house of a planet from Lagna (1–12). */
function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function getHouse(g: GrahaData, ascRashi: number): number {
  return wholeSignHouse(g.rashi, ascRashi)
}

/** Sign-count from A to B: 1 = same sign, 7 = opposition, etc. */
function signCount(fromRashi: number, toRashi: number): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

function houseLord(house: number, ascRashi: number): string {
  const RASHI_LORD: Record<number, string> = {
    1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
    7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
  }
  const rashi = ((ascRashi - 1 + house - 1) % 12) + 1
  return RASHI_LORD[rashi] ?? 'Su'
}

function isKendra(house: number): boolean {
  return [1, 4, 7, 10].includes(house)
}

function isTrikon(house: number): boolean {
  return [1, 5, 9].includes(house)
}

function isDusthana(house: number): boolean {
  return [6, 8, 12].includes(house)
}

function inSameHouse(a: GrahaData, b: GrahaData, ascRashi: number): boolean {
  return getHouse(a, ascRashi) === getHouse(b, ascRashi)
}

/**
 * Vedic drishti by whole-sign count (Parashara).
 * All grahas aspect the 7th; Mars 4/8; Jupiter 5/9; Saturn 3/10.
 */
function hasAspect(source: GrahaData, target: GrahaData): boolean {
  if (source.id === target.id) return false
  const diff = signCount(source.rashi, target.rashi)

  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true

  return false
}

function areAssociated(a: GrahaData, b: GrahaData, ascRashi: number): boolean {
  if (inSameHouse(a, b, ascRashi)) return true
  if (hasAspect(a, b) || hasAspect(b, a)) return true
  return false
}

/** True parivartana: each planet occupies a house the other lords. */
function isParivartana(
  a: GrahaData,
  b: GrahaData,
  ascRashi: number,
): boolean {
  const aHouse = getHouse(a, ascRashi)
  const bHouse = getHouse(b, ascRashi)
  return houseLord(aHouse, ascRashi) === b.id && houseLord(bHouse, ascRashi) === a.id
}

const PLANET_LABEL: Record<string, string> = {
  Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn',
}

// ── Pancha Mahapurusha Yogas ──────────────────────────────────
// Occurs when Ma/Me/Ju/Ve/Sa is in own sign or exaltation AND in kendra

function checkMahapurusha(grahas: GrahaData[], ascRashi: number): YogaResult[] {
  const yogas: YogaResult[] = []

  const configs: { id: string; name: string; sanskrit: string; effect: string }[] = [
    { id: 'Ma', name: 'Ruchaka',    sanskrit: 'रुचक',    effect: 'Warrior nature, physical strength, courage, leadership in military or police' },
    { id: 'Me', name: 'Bhadra',     sanskrit: 'भद्र',    effect: 'Sharp intellect, eloquence, expertise in trade, commerce and mathematics' },
    { id: 'Ju', name: 'Hamsa',      sanskrit: 'हंस',     effect: 'Wisdom, spirituality, teaching ability, pure character, respected by all' },
    { id: 'Ve', name: 'Malavya',    sanskrit: 'मालव्य', effect: 'Artistic talent, sensual pleasures, beauty, vehicles, luxurious life' },
    { id: 'Sa', name: 'Shasha',     sanskrit: 'शश',      effect: 'Power over masses, politics, working with land or natural resources' },
  ]

  for (const cfg of configs) {
    const g = grahas.find(gr => gr.id === cfg.id)
    if (!g) continue
    const house = getHouse(g, ascRashi)
    const inKendra = isKendra(house)
    const inOwnOrExalt = g.dignity === 'own' || g.dignity === 'moolatrikona' || g.dignity === 'exalted'

    if (inKendra && inOwnOrExalt) {
      yogas.push({
        name:        `${cfg.name} Yoga`,
        sanskrit:    `${cfg.sanskrit} योग`,
        category:    'mahapurusha',
        strength:    g.dignity === 'exalted' ? 'strong' : 'moderate',
        planets:     [cfg.id],
        houses:      [house],
        description: `${PLANET_LABEL[cfg.id] ?? cfg.id} in ${g.dignity} in house ${house} (kendra)`,
        effect:      cfg.effect,
      })
    }
  }
  return yogas
}

// ── Raja Yogas ────────────────────────────────────────────────
// Lords of kendra and trikona houses conjunct, aspect, or exchange

function checkRajaYogas(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1

  const kendraHouses = [1, 4, 7, 10]
  const trikonHouses = [1, 5, 9]

  for (const kh of kendraHouses) {
    for (const th of trikonHouses) {
      const kl = houseLord(kh, ascRashi)
      const tl = houseLord(th, ascRashi)
      if (kl === tl) continue

      const kg = grahas.find(g => g.id === kl)
      const tg = grahas.find(g => g.id === tl)
      if (!kg || !tg) continue

      const kHouse = getHouse(kg, ascRashi)
      const tHouse = getHouse(tg, ascRashi)

      let formed = false
      let desc = ''

      if (inSameHouse(kg, tg, ascRashi)) {
        formed = true
        desc = `${kl} (lord H${kh}) conjunct ${tl} (lord H${th}) in H${kHouse}`
      } else if (isParivartana(kg, tg, ascRashi)) {
        formed = true
        desc = `${kl} (lord H${kh}) and ${tl} (lord H${th}) in Parivartana (H${kHouse} ⇄ H${tHouse})`
      } else if (areAssociated(kg, tg, ascRashi)) {
        formed = true
        desc = `${kl} (lord H${kh}) in H${kHouse} associated by aspect with ${tl} (lord H${th}) in H${tHouse}`
      }

      if (formed) {
        const strength = (isKendra(kHouse) || isTrikon(kHouse)) && (isKendra(tHouse) || isTrikon(tHouse))
          ? 'strong' : 'moderate'
        yogas.push({
          name:        'Raja Yoga',
          sanskrit:    'राज योग',
          category:    'raja',
          strength,
          planets:     [kl, tl],
          houses:      [kHouse, tHouse],
          description: desc,
          effect:      'Authority, power, rise in career and social status, leadership and recognition',
        })
      }
    }
  }

  return yogas.slice(0, 5)
}

// ── Dhana Yogas ───────────────────────────────────────────────

function checkDhanaYogas(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1

  const wealthHouses = [2, 5, 9, 11]
  const wealthLords = wealthHouses.map(h => houseLord(h, ascRashi))

  for (let i = 0; i < wealthLords.length; i++) {
    for (let j = i + 1; j < wealthLords.length; j++) {
      const l1 = wealthLords[i], l2 = wealthLords[j]
      if (l1 === l2) continue
      const g1 = grahas.find(g => g.id === l1)
      const g2 = grahas.find(g => g.id === l2)
      if (!g1 || !g2) continue

      if (inSameHouse(g1, g2, ascRashi)) {
        const h = getHouse(g1, ascRashi)
        yogas.push({
          name:        'Dhana Yoga',
          sanskrit:    'धन योग',
          category:    'dhana',
          strength:    [2, 5, 9, 11].includes(h) ? 'strong' : 'moderate',
          planets:     [l1, l2],
          houses:      [h],
          description: `Lords of H${wealthHouses[i]} (${l1}) and H${wealthHouses[j]} (${l2}) conjunct in H${h}`,
          effect:      'Wealth accumulation, financial prosperity, multiple income sources',
        })
      }
    }
  }

  return yogas.slice(0, 3)
}

// ── Special Yogas ─────────────────────────────────────────────

function checkSpecialYogas(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1

  const ju = grahas.find(g => g.id === 'Ju')
  const mo = grahas.find(g => g.id === 'Mo')
  const su = grahas.find(g => g.id === 'Su')
  const me = grahas.find(g => g.id === 'Me')
  const ve = grahas.find(g => g.id === 'Ve')
  const ma = grahas.find(g => g.id === 'Ma')

  // 1. Gajakesari — Jupiter in kendra from Moon (whole-sign)
  if (ju && mo) {
    const juH = getHouse(ju, ascRashi)
    const moH = getHouse(mo, ascRashi)
    const fromMoon = signCount(mo.rashi, ju.rashi)
    if ([1, 4, 7, 10].includes(fromMoon)) {
      const rel =
        fromMoon === 1 ? 'conjunct' :
        fromMoon === 4 ? 'in 4th from' :
        fromMoon === 7 ? 'opposite' :
        'in 10th from'
      yogas.push({
        name:        'Gajakesari Yoga',
        sanskrit:    'गजकेसरी योग',
        category:    'special',
        strength:    (ju.dignity === 'exalted' || ju.dignity === 'own' || ju.dignity === 'moolatrikona') ? 'strong' : 'moderate',
        planets:     ['Ju', 'Mo'],
        houses:      [juH, moH],
        description: `Jupiter (H${juH}) ${rel} Moon (H${moH}) — kendra from Moon`,
        effect:      'Intelligence, fame, prosperity, long life, respected position in society',
      })
    }
  }

  // 2. Budhaditya Yoga — Sun + Mercury in same house
  if (su && me && inSameHouse(su, me, ascRashi)) {
    const h = getHouse(su, ascRashi)
    yogas.push({
      name:        'Budhaditya Yoga',
      sanskrit:    'बुधादित्य योग',
      category:    'special',
      strength:    me.isRetro || me.isCombust ? 'weak' : 'strong',
      planets:     ['Su', 'Me'],
      houses:      [h],
      description: `Sun and Mercury conjunct in H${h}`,
      effect:      'Sharp intelligence, analytical mind, good communication, success through intellect',
    })
  }

  // 3. Saraswati Yoga — Jupiter, Venus, Mercury in kendras/trikonas
  if (ju && ve && me) {
    const juH = getHouse(ju, ascRashi)
    const veH = getHouse(ve, ascRashi)
    const meH = getHouse(me, ascRashi)
    if ((isKendra(juH) || isTrikon(juH)) &&
        (isKendra(veH) || isTrikon(veH)) &&
        (isKendra(meH) || isTrikon(meH))) {
      yogas.push({
        name:        'Sarasvati Yoga',
        sanskrit:    'सरस्वती योग',
        category:    'special',
        strength:    'strong',
        planets:     ['Ju', 'Ve', 'Me'],
        houses:      [juH, veH, meH],
        description: `Jupiter (H${juH}), Venus (H${veH}), Mercury (H${meH}) all in kendras/trikonas`,
        effect:      'Exceptional intelligence, artistic talent, eloquence, mastery of arts and sciences',
      })
    }
  }

  // 4. Chandra-Mangala Yoga — Moon + Mars conjunct
  if (mo && ma && inSameHouse(mo, ma, ascRashi)) {
    const h = getHouse(mo, ascRashi)
    yogas.push({
      name:        'Chandra-Mangala Yoga',
      sanskrit:    'चन्द्र-मङ्गल योग',
      category:    'dhana',
      strength:    'moderate',
      planets:     ['Mo', 'Ma'],
      houses:      [h],
      description: `Moon and Mars conjunct in H${h}`,
      effect:      'Wealth through bold action, business acumen, strong willpower, practical intelligence',
    })
  }

  // 5. Amala Yoga — 10th from Lagna has only benefics
  const BENEFICS = ['Mo', 'Me', 'Ju', 'Ve']
  const h10Planets = grahas.filter(g =>
    !['Ra', 'Ke', 'Ur', 'Ne', 'Pl'].includes(g.id) && getHouse(g, ascRashi) === 10
  )
  if (h10Planets.length > 0 && h10Planets.every(g => BENEFICS.includes(g.id))) {
    yogas.push({
      name:        'Amala Yoga',
      sanskrit:    'अमला योग',
      category:    'special',
      strength:    'strong',
      planets:     h10Planets.map(g => g.id),
      houses:      [10],
      description: `Only benefics (${h10Planets.map(g => g.id).join(', ')}) in H10`,
      effect:      'Spotless reputation, pure character, lasting fame through righteous deeds',
    })
  }

  // 6. Vesi / Vosi / Ubhayachari — planets in 2nd / 12th from Sun
  if (su) {
    const suH = getHouse(su, ascRashi)
    const in2ndFromSun = grahas.filter(g =>
      g.id !== 'Su' && g.id !== 'Mo' && g.id !== 'Ra' && g.id !== 'Ke' &&
      getHouse(g, ascRashi) === (suH % 12) + 1
    )
    const in12thFromSun = grahas.filter(g =>
      g.id !== 'Su' && g.id !== 'Mo' && g.id !== 'Ra' && g.id !== 'Ke' &&
      getHouse(g, ascRashi) === ((suH - 2 + 12) % 12) + 1
    )

    if (in2ndFromSun.length > 0 && in12thFromSun.length > 0) {
      yogas.push({
        name:        'Ubhayachari Yoga',
        sanskrit:    'उभयचारी योग',
        category:    'special',
        strength:    'strong',
        planets:     ['Su', ...in2ndFromSun.map(g => g.id), ...in12thFromSun.map(g => g.id)],
        houses:      [suH, (suH % 12) + 1, ((suH - 2 + 12) % 12) + 1],
        description: 'Planets in both 2nd and 12th from Sun.',
        effect:      'Well-proportioned body, eloquent speaker, wealthy, and stable mind.',
      })
    } else if (in2ndFromSun.length > 0) {
      yogas.push({
        name:        'Vesi Yoga',
        sanskrit:    'वेसी योग',
        category:    'special',
        strength:    in2ndFromSun.some(g => BENEFICS.includes(g.id)) ? 'strong' : 'moderate',
        planets:     ['Su', ...in2ndFromSun.map(g => g.id)],
        houses:      [suH, (suH % 12) + 1],
        description: `${in2ndFromSun.map(g => g.id).join(', ')} in 2nd house from Sun`,
        effect:      'Balanced personality, good memory, happiness, truthfulness.',
      })
    } else if (in12thFromSun.length > 0) {
      yogas.push({
        name:        'Vosi Yoga',
        sanskrit:    'वोसी योग',
        category:    'special',
        strength:    in12thFromSun.some(g => BENEFICS.includes(g.id)) ? 'strong' : 'moderate',
        planets:     ['Su', ...in12thFromSun.map(g => g.id)],
        houses:      [suH, ((suH - 2 + 12) % 12) + 1],
        description: `${in12thFromSun.map(g => g.id).join(', ')} in 12th house from Sun`,
        effect:      'Skillful, charitable, good orator, famous, and successful in undertakings.',
      })
    }
  }

  // 7. Adhi Yoga — Benefics in 6, 7, 8 from Moon
  if (mo) {
    const moH = getHouse(mo, ascRashi)
    const houses678 = [
      ((moH + 4) % 12) + 1,
      ((moH + 5) % 12) + 1,
      ((moH + 6) % 12) + 1,
    ]
    const beneficsIn678 = grahas.filter(g =>
      BENEFICS.includes(g.id) && g.id !== 'Mo' && houses678.includes(getHouse(g, ascRashi))
    )

    if (beneficsIn678.length >= 2) {
      yogas.push({
        name:        'Chandra Adhi Yoga',
        sanskrit:    'चन्द्र अधि योग',
        category:    'raja',
        strength:    beneficsIn678.length >= 3 ? 'strong' : 'moderate',
        planets:     ['Mo', ...beneficsIn678.map(g => g.id)],
        houses:      [moH, ...houses678],
        description: `Benefics (${beneficsIn678.map(g => g.id).join(', ')}) in 6th, 7th, or 8th from Moon`,
        effect:      'Leader of others, famous, stable wealth, victory over competitors.',
      })
    }
  }

  return yogas
}

// ── Viparita Raja Yogas ───────────────────────────────────────
// Lords of dusthana houses (6, 8, 12) in other dusthanas

function checkViparitaYogas(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1

  const dusthanaLords = [6, 8, 12].map(h => ({ house: h, lord: houseLord(h, ascRashi) }))

  const configs = [
    { h: 6,  name: 'Harsha Yoga',   sanskrit: 'हर्ष योग',   effect: 'Victory over enemies, good health, happiness despite obstacles' },
    { h: 8,  name: 'Sarala Yoga',   sanskrit: 'सरल योग',    effect: 'Longevity, fearlessness, scholarship, becomes renowned' },
    { h: 12, name: 'Vimala Yoga',   sanskrit: 'विमल योग',   effect: 'Independent nature, modest expenditure, liberation, pure character' },
  ]

  for (const cfg of configs) {
    const dl = dusthanaLords.find(d => d.house === cfg.h)
    if (!dl) continue
    const g = grahas.find(gr => gr.id === dl.lord)
    if (!g) continue
    const gHouse = getHouse(g, ascRashi)

    if (isDusthana(gHouse) && gHouse !== cfg.h) {
      yogas.push({
        name:        cfg.name,
        sanskrit:    cfg.sanskrit,
        category:    'viparita',
        strength:    'moderate',
        planets:     [dl.lord],
        houses:      [cfg.h, gHouse],
        description: `Lord of H${cfg.h} (${dl.lord}) placed in dusthana H${gHouse}`,
        effect:      cfg.effect,
      })
    }
  }

  return yogas
}

// ── Lunar Yogas ───────────────────────────────────────────────

function checkLunarYogas(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1
  const BENEFICS = ['Me', 'Ju', 'Ve']

  const mo = grahas.find(g => g.id === 'Mo')
  if (!mo) return []

  const moH = getHouse(mo, ascRashi)
  const in2ndFromMoon = grahas.filter(g =>
    g.id !== 'Mo' && g.id !== 'Su' && g.id !== 'Ra' && g.id !== 'Ke' &&
    getHouse(g, ascRashi) === (moH % 12) + 1
  )
  const in12thFromMoon = grahas.filter(g =>
    g.id !== 'Mo' && g.id !== 'Su' && g.id !== 'Ra' && g.id !== 'Ke' &&
    getHouse(g, ascRashi) === ((moH - 2 + 12) % 12) + 1
  )

  // Durudhara supersedes listing Sunapha + Anapha separately
  if (in2ndFromMoon.length > 0 && in12thFromMoon.length > 0) {
    yogas.push({
      name:        'Durudhara Yoga',
      sanskrit:    'दुरुधरा योग',
      category:    'lunar',
      strength:    'strong',
      planets:     ['Mo', ...in2ndFromMoon.map(g => g.id), ...in12thFromMoon.map(g => g.id)],
      houses:      [moH, (moH % 12) + 1, ((moH - 2 + 12) % 12) + 1],
      description: 'Planets in both 2nd and 12th from Moon',
      effect:      'Wealth, wisdom, fame, vehicles, and a happy life.',
    })
  } else if (in2ndFromMoon.length > 0) {
    yogas.push({
      name:        'Sunapha Yoga',
      sanskrit:    'सुनफ़ा योग',
      category:    'lunar',
      strength:    in2ndFromMoon.some(g => BENEFICS.includes(g.id)) ? 'strong' : 'moderate',
      planets:     ['Mo', ...in2ndFromMoon.map(g => g.id)],
      houses:      [moH, (moH % 12) + 1],
      description: `${in2ndFromMoon.map(g => g.id).join(', ')} in 2nd from Moon`,
      effect:      'Self-made wealth, intelligent, good reputation, kingly status',
    })
  } else if (in12thFromMoon.length > 0) {
    yogas.push({
      name:        'Anapha Yoga',
      sanskrit:    'अनफ़ा योग',
      category:    'lunar',
      strength:    in12thFromMoon.some(g => BENEFICS.includes(g.id)) ? 'strong' : 'moderate',
      planets:     ['Mo', ...in12thFromMoon.map(g => g.id)],
      houses:      [moH, ((moH - 2 + 12) % 12) + 1],
      description: `${in12thFromMoon.map(g => g.id).join(', ')} in 12th from Moon`,
      effect:      'Good health, renown, generous, happy, virtuous character',
    })
  } else {
    // Kemadruma — no planet in 2nd or 12th from Moon (Sun/nodes excluded)
    // Cancelled when Moon is in a kendra (common classical exception)
    if (!isKendra(moH)) {
      yogas.push({
        name:        'Kemadruma Yoga',
        sanskrit:    'केमद्रुम योग',
        category:    'malefic',
        strength:    'moderate',
        planets:     ['Mo'],
        houses:      [moH],
        description: `No planet in 2nd or 12th from Moon (H${moH})`,
        effect:      'Loneliness, struggle, fluctuating fortune — mitigated if Moon is strong or aspected by Jupiter.',
      })
    }
  }

  // Shakata Yoga — Moon in 6, 8, 12 from Jupiter (mutually exclusive with Gajakesari)
  const ju = grahas.find(g => g.id === 'Ju')
  if (mo && ju) {
    const juH = getHouse(ju, ascRashi)
    const fromJu = signCount(ju.rashi, mo.rashi)
    if ([6, 8, 12].includes(fromJu)) {
      yogas.push({
        name:        'Shakata Yoga',
        sanskrit:    'शकट योग',
        category:    'malefic',
        strength:    isKendra(moH) ? 'weak' : 'strong',
        planets:     ['Mo', 'Ju'],
        houses:      [moH, juH],
        description: `Moon in H${moH} is in ${fromJu}th from Jupiter in H${juH}`,
        effect:      'Fluctuating fortune, loss of wealth and position but regaining it through effort.',
      })
    }
  }

  return yogas
}

// ── Parivartana Yogas ─────────────────────────────────────────

function checkParivartana(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1

  for (let i = 1; i <= 12; i++) {
    for (let j = i + 1; j <= 12; j++) {
      const lordI = houseLord(i, ascRashi)
      const lordJ = houseLord(j, ascRashi)
      if (lordI === lordJ) continue

      const gI = grahas.find(g => g.id === lordI)
      const gJ = grahas.find(g => g.id === lordJ)
      if (!gI || !gJ) continue

      const hI = getHouse(gI, ascRashi)
      const hJ = getHouse(gJ, ascRashi)

      if (hI === j && hJ === i) {
        let name = 'Maha Parivartana'
        let effect = 'Success, power, and mutual support between life areas.'

        if (isDusthana(i) || isDusthana(j)) {
          name = 'Dainya Parivartana'
          effect = 'Obstacles, fluctuations, and growth through struggle.'
        } else if (i === 3 || j === 3) {
          name = 'Khala Parivartana'
          effect = 'Fluctuating fortunes, sometimes high, sometimes low.'
        }

        yogas.push({
          name:        `${name} (H${i} ⇄ H${j})`,
          sanskrit:    'परिवर्तन योग',
          category:    'parivartana',
          strength:    'strong',
          planets:     [lordI, lordJ],
          houses:      [i, j],
          description: `Lord of H${i} (${lordI}) in H${j} and Lord of H${j} (${lordJ}) in H${i}`,
          effect,
        })
      }
    }
  }
  return yogas
}

// ── Nabhasa Yogas (Geometric Patterns) ────────────────────────
// Sankhya yogas count distinct *signs* occupied by the 7 grahas

function checkNabhasaYogas(grahas: GrahaData[], _lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const mainGrahas = grahas.filter(g => !['Ra', 'Ke', 'Ur', 'Ne', 'Pl'].includes(g.id))
  const signsOccupied = new Set(mainGrahas.map(g => g.rashi))

  const nSigns = signsOccupied.size
  const SANKHYA: Record<number, { name: string; sk: string; eff: string }> = {
    1: { name: 'Gola',   sk: 'गोल',   eff: 'Short life, poverty, low status (unlikely in reality)' },
    2: { name: 'Yuga',   sk: 'युग',   eff: 'Financial struggle, unconventional path' },
    3: { name: 'Shula',  sk: 'शूल',   eff: 'Brave but potentially aggressive, strong willpower' },
    4: { name: 'Kedara', sk: 'केदार', eff: 'Agricultural success, truthfulness, wealth from land' },
    5: { name: 'Pasha',  sk: 'पाश',   eff: 'Binding nature, many followers, potentially talkative' },
    6: { name: 'Dama',   sk: 'दाम',   eff: 'Charitable, wealthy, helpful to others' },
    7: { name: 'Veena',  sk: 'वीणा',  eff: 'Love for music and arts, wisdom, leadership qualities' },
  }

  if (SANKHYA[nSigns]) {
    yogas.push({
      name:        `${SANKHYA[nSigns].name} Yoga`,
      sanskrit:    `${SANKHYA[nSigns].sk} योग`,
      category:    'nabhasa',
      strength:    'moderate',
      planets:     mainGrahas.map(g => g.id),
      houses:      Array.from(signsOccupied),
      description: `All main planets occupy exactly ${nSigns} signs.`,
      effect:      SANKHYA[nSigns].eff,
    })
  }

  return yogas
}

// ── Kartari Yogas ─────────────────────────────────────────────

function checkKartari(grahas: GrahaData[], lagnas: LagnaData): YogaResult[] {
  const yogas: YogaResult[] = []
  const ascRashi = lagnas.ascRashi ?? 1
  const BENEFICS = ['Mo', 'Me', 'Ju', 'Ve']
  const MALEFICS = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']

  const in2nd = grahas.filter(g => getHouse(g, ascRashi) === 2)
  const in12th = grahas.filter(g => getHouse(g, ascRashi) === 12)

  if (in2nd.length > 0 && in12th.length > 0) {
    const isShubha = in2nd.every(g => BENEFICS.includes(g.id)) && in12th.every(g => BENEFICS.includes(g.id))
    const isPapa = in2nd.every(g => MALEFICS.includes(g.id)) && in12th.every(g => MALEFICS.includes(g.id))

    if (isShubha) {
      yogas.push({
        name:        'Shubha Kartari Yoga',
        sanskrit:    'शुभ कर्तरी योग',
        category:    'special',
        strength:    'strong',
        planets:     [...in2nd.map(g => g.id), ...in12th.map(g => g.id)],
        houses:      [1, 2, 12],
        description: 'Lagna hemmed in by natural benefics.',
        effect:      'Protection, health, support from environment, obstacles are easily overcome.',
      })
    } else if (isPapa) {
      yogas.push({
        name:        'Papa Kartari Yoga',
        sanskrit:    'पाप कर्तरी योग',
        category:    'malefic',
        strength:    'strong',
        planets:     [...in2nd.map(g => g.id), ...in12th.map(g => g.id)],
        houses:      [1, 2, 12],
        description: 'Lagna hemmed in by natural malefics.',
        effect:      'Pressure, health issues, feeling restricted or trapped by circumstances.',
      })
    }
  }

  return yogas
}

// ── Main function ─────────────────────────────────────────────

export function detectYogas(
  grahas: GrahaData[],
  lagnas: LagnaData,
): YogaResult[] {
  const ascRashi = lagnas.ascRashi ?? 1
  const allYogas: YogaResult[] = [
    ...checkMahapurusha(grahas, ascRashi),
    ...checkRajaYogas(grahas, lagnas),
    ...checkDhanaYogas(grahas, lagnas),
    ...checkSpecialYogas(grahas, lagnas),
    ...checkViparitaYogas(grahas, lagnas),
    ...checkLunarYogas(grahas, lagnas),
    ...checkParivartana(grahas, lagnas),
    ...checkNabhasaYogas(grahas, lagnas),
    ...checkKartari(grahas, lagnas),
  ]

  const seen = new Set<string>()
  return allYogas.filter(y => {
    if (y.houses) y.houses = Array.from(new Set(y.houses))
    const key = `${y.name}-${[...y.planets].sort().join('-')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
