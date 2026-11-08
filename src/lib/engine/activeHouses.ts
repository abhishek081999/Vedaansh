import type { ChartOutput, GrahaId, GrahaData, LagnaData, DashaNode } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'

const HOUSE_TOPICS_HI: Record<number, string> = {
  1: 'स्वयं, ओज, आरंभ',
  2: 'मूल्य, धन, वाणी',
  3: 'प्रयास, भाई-बहन, कौशल',
  4: 'सुख, घर, माता',
  5: 'सृजन, संतान, आनंद',
  6: 'सेवा, स्वास्थ्य, दिनचर्या',
  7: 'साझेदारी, व्यापार, अन्य लोग',
  8: 'रूपांतरण, गहराई, आयु',
  9: 'भाग्य, धर्म, ज्ञान',
  10: 'कर्म, करियर, प्रतिष्ठा',
  11: 'लाभ, समुदाय, आकांक्षाएँ',
  12: 'अध्यात्म, मुक्ति, हानि',
}

// Simplified lordship mapping
const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

/**
 * Houses where the current Vimshottari Mahadasha and Antardasha lords sit (physical placement only).
 * Used to tint chart cells — no sign-lordship, transit moon, or age progression.
 */
export function getDashaLordPlacementHouses(
  chart: ChartOutput,
  grahas: GrahaData[],
  ascRashi: number,
): number[] {
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return []

  const path: DashaNode[] = []
  let cur: DashaNode | undefined = nodes.find(n => n.isCurrent)
  while (cur) {
    path.push(cur)
    cur = cur.children?.find(c => c.isCurrent)
  }

  const lords = path.slice(0, 2).map(n => n.lord)
  const getHouseOfRashi = (r: number) => ((r - ascRashi + 12) % 12) + 1
  const houses = new Set<number>()
  for (const lord of lords) {
    const g = grahas.find(p => p.id === lord)
    if (g) houses.add(getHouseOfRashi(g.rashi))
  }
  return Array.from(houses).sort((a, b) => a - b)
}

export function getActiveHouses(
  chart: ChartOutput, 
  transitMoonLon?: number, 
  customGrahas?: GrahaData[],
  customLagnas?: LagnaData
): number[] {
  const { lagnas: natalLagnas, grahas: natalGrahas, dashas } = chart
  const grahas = customGrahas || natalGrahas
  const lagnas = customLagnas || natalLagnas
  const ascRashi = lagnas.ascRashi
  const activeHousesSet = new Set<number>()

  const getHouseOfRashi = (r: number) => ((r - ascRashi + 12) % 12) + 1
  
  // 1. Dasha Logic
  const findCurrentLords = (nodes: any[]): string[] => {
    let lords: string[] = []
    const current = nodes.find(n => n.isCurrent)
    if (current) {
      lords.push(current.lord)
      if (current.children) {
        lords = [...lords, ...findCurrentLords(current.children)]
      }
    }
    return lords
  }

  const activeLords = findCurrentLords(dashas.vimshottari || [])
  
  // Check MD and AD
  activeLords.slice(0, 2).forEach(lord => {
    // Placement
    const g = grahas.find(p => p.id === lord)
    if (g) activeHousesSet.add(getHouseOfRashi(g.rashi))
    
    // Ownership
    for (let i = 1; i <= 12; i++) {
      const rashiOfHouse = ((ascRashi + i - 2) % 12) + 1
      if (RASHI_LORD[rashiOfHouse] === lord) {
        activeHousesSet.add(i)
      }
    }
  })

  // 2. Transit Logic
  if (transitMoonLon !== undefined) {
    const tMoonRashi = Math.floor(transitMoonLon / 30) + 1
    activeHousesSet.add(getHouseOfRashi(tMoonRashi))
  }

  // 3. Progression Logic (BCP - Bhrigu Chakra Paddhati)
  // House active = (Age at birthday % 12) + 1
  const birthDate = new Date(chart.meta.birthDate)
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--
  }
  const progressionHouse = (age % 12) + 1
  activeHousesSet.add(progressionHouse)

  return Array.from(activeHousesSet).sort((a, b) => a - b)
}

export function getProgressionHouse(birthDateStr: string): number {
    const birthDate = new Date(birthDateStr)
    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const m = now.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      age--
    }
    return (age % 12) + 1
}

export function getHouseTopics(lang: EngineLang = 'en'): Record<number, string> {
  if (lang === 'hi') return HOUSE_TOPICS_HI
  return {
    1:  'Self, vitality, beginning',
    2:  'Value, wealth, speech',
    3:  'Efforts, siblings, skills',
    4:  'Happiness, home, mother',
    5:  'Creativity, children, joy',
    6:  'Service, health, routine',
    7:  'Partnership, trade, others',
    8:  'Transformation, depth, longevity',
    9:  'Luck, dharma, wisdom',
    10: 'Action, career, status',
    11: 'Gains, community, dreams',
    12: 'Spirituality, release, loss',
  }
}
