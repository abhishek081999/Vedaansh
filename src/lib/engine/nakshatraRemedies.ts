// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraRemedies.ts
//  Monthly Best Days, Muhurta Activity Ratings, Nakshatra Remedies
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES } from '@/types/astrology'
import {
  NAKSHATRA_NATURE,
  TARA_NAMES,
  TARA_QUALITIES,
  TaraName,
  PanchakaType,
  isPanchaka,
} from './nakshatraAdvanced'

// ─────────────────────────────────────────────────────────────
//  Monthly Best Days
// ─────────────────────────────────────────────────────────────

export interface DayForecast {
  date:           Date
  dayOfMonth:     number
  dayName:        string
  nakshatra:      string
  nakshatraIndex: number
  tara:           TaraName
  taraNumber:     number
  quality:        'auspicious' | 'inauspicious' | 'neutral'
  score:          number
  panchaka:       PanchakaType
  recommendation: string
  activities:     string[]
}

const MOON_DEGREES_PER_DAY = 360 / 27.32

const QUALITY_SCORE: Record<'auspicious' | 'inauspicious' | 'neutral', number> = {
  auspicious: 85, neutral: 50, inauspicious: 20,
}

const AUSPICIOUS_ACTIVITIES: Record<TaraName, string[]> = {
  'Janma':    ['Spiritual practice','Meditation','Self-reflection'],
  'Sampat':   ['Business deals','Financial investments','Property purchase','Starting ventures'],
  'Vipat':    ['Rest only','Delay decisions','Spiritual retreat'],
  'Kshema':   ['Health matters','Family visits','Nurturing relationships','Medicine intake'],
  'Pratyari': ['Avoid enemies','Low profile','Spiritual protection'],
  'Sadhaka':  ['Skill development','Education','Creative projects','Career moves'],
  'Vadha':    ['Avoid all new activities','Prayer & fasting only'],
  'Mitra':    ['Meetings','Partnerships','Marriage negotiations','Social events'],
  'Ati-Mitra':['All auspicious activities','Ceremonies','Weddings','Business launches'],
}

export function getMonthlyForecast(
  birthNakIndex: number,
  moonLonSiderealAtBirth: number,
  year: number,
  month: number,
): DayForecast[] {
  const days: DayForecast[] = []
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000)
    const moonDegreesOnDay = (moonLonSiderealAtBirth + dayOfYear * MOON_DEGREES_PER_DAY) % 360
    const moonNakIndexOnDay = Math.floor(((moonDegreesOnDay % 360) + 360) % 360 / (360 / 27))

    const diff = (moonNakIndexOnDay - birthNakIndex + 27) % 27
    const taraIdx = diff % 9
    const taraName = TARA_NAMES[taraIdx]
    const q = TARA_QUALITIES[taraName]
    const panchaka = isPanchaka(moonNakIndexOnDay)
    let score = QUALITY_SCORE[q.quality]
    if (panchaka) score = Math.max(score - 30, 5)

    days.push({
      date,
      dayOfMonth: d,
      dayName: DAY_NAMES[date.getDay()],
      nakshatra: NAKSHATRA_NAMES[moonNakIndexOnDay],
      nakshatraIndex: moonNakIndexOnDay,
      tara: taraName,
      taraNumber: taraIdx + 1,
      quality: q.quality,
      score,
      panchaka,
      recommendation: q.recommendation,
      activities: AUSPICIOUS_ACTIVITIES[taraName],
    })
  }
  return days
}

// ─────────────────────────────────────────────────────────────
//  Activity Ratings
// ─────────────────────────────────────────────────────────────

export type ActivityType = 'marriage' | 'travel' | 'business' | 'education' | 'medical' | 'spiritual' | 'property' | 'career' | 'finance'

export interface ActivityRating {
  rating: 'Excellent' | 'Good' | 'Neutral' | 'Avoid'
  note:   string
}

const ACTIVITY_NAK_RATINGS: Partial<Record<ActivityType, Record<number, ActivityRating>>> = {
  marriage: {
    3:{ rating:'Excellent', note:'Rohini — Brahma favourite, auspicious for marriage'},
    6:{ rating:'Excellent', note:'Punarvasu — joyful & prosperous union'},
    7:{ rating:'Excellent', note:'Pushya — nourishing, stable marriage'},
    11:{ rating:'Good', note:'Purva Phalguni — love & romance'},
    12:{ rating:'Excellent', note:'Uttara Phalguni — long-lasting union'},
    15:{ rating:'Good', note:'Swati — balanced partnership'},
    20:{ rating:'Excellent', note:'Uttara Ashadha — victory & stability'},
  },
  travel: {
    0:{ rating:'Excellent', note:'Ashwini — swift & safe travel'},
    4:{ rating:'Good', note:'Mrigashira — exploration favoured'},
    15:{ rating:'Excellent', note:'Swati — ideal for all distance travel'},
    21:{ rating:'Excellent', note:'Shravana — auspicious for travel'},
  },
  business: {
    3:{ rating:'Excellent', note:'Rohini — wealth & material gains'},
    13:{ rating:'Excellent', note:'Chitra — new projects & creativity'},
    22:{ rating:'Excellent', note:'Dhanishtha — wealth accumulation'},
  },
  education: {
    5:{ rating:'Excellent', note:'Ardra — profound research'},
    7:{ rating:'Excellent', note:'Pushya — best for starting education'},
    23:{ rating:'Excellent', note:'Shatabhisha — hidden sciences & healing arts'},
  },
  medical: {
    0:{ rating:'Excellent', note:'Ashwini — healing & medicine'},
    7:{ rating:'Good', note:'Pushya — nurturing & recovery'},
    23:{ rating:'Excellent', note:'Shatabhisha — alternative medicine'},
  },
  spiritual: {
    7:{ rating:'Excellent', note:'Pushya — highest for spiritual practices'},
    9:{ rating:'Excellent', note:'Magha — ancestral worship'},
    17:{ rating:'Excellent', note:'Jyeshtha — tapas & mantra'},
    26:{ rating:'Excellent', note:'Revati — auspicious completion & Vishnu worship'},
  },
  property: {
    3:{ rating:'Excellent', note:'Rohini — real estate & fixed assets'},
    7:{ rating:'Good', note:'Pushya — stable acquisition'},
    25:{ rating:'Excellent', note:'Uttara Bhadra — beautiful home'},
  },
  career: {
    13:{ rating:'Excellent', note:'Chitra — creative career breakthroughs'},
    20:{ rating:'Excellent', note:'Uttara Ashadha — lasting professional success'},
    21:{ rating:'Good', note:'Shravana — communication careers'},
  },
  finance: {
    3:{ rating:'Excellent', note:'Rohini — wealth accumulation'},
    22:{ rating:'Excellent', note:'Dhanishtha — financial growth'},
  },
}

export function getNakshatraMuhurtaRating(nakIndex: number, activity: ActivityType): ActivityRating {
  const specific = ACTIVITY_NAK_RATINGS[activity]?.[nakIndex]
  if (specific) return specific
  const nature = NAKSHATRA_NATURE[nakIndex] as string
  if (nature === 'Sthira')      return { rating:'Good',    note:'Sthira (fixed) — stable for long-term matters' }
  if (nature === 'Mridu')       return { rating:'Good',    note:'Mridu (soft) — auspicious for gentle activities' }
  if (nature === 'Tikshna')     return { rating:'Neutral', note:'Tikshna (sharp) — mixed results' }
  if (nature.includes('Mixed')) return { rating:'Neutral', note:'Misra (mixed) — moderate results' }
  if (nature === 'Ugra')        return { rating:'Avoid',   note:'Ugra (fierce) — not recommended' }
  return { rating:'Neutral', note:'General nakshatra energy' }
}

// ─────────────────────────────────────────────────────────────
//  Nakshatra Remedies
// ─────────────────────────────────────────────────────────────

export interface NakshatraRemedies {
  mantra:    string
  beej:      string
  gemstone:  string
  metal:     string
  color:     string
  flower:    string
  tree:      string
  deity:     string
  upasana:   string
  dosha:     string
  charity:   string
  fasting:   string
}

export const NAKSHATRA_REMEDIES: NakshatraRemedies[] = [
  { mantra:'Om Ashwinikumarebhyo Namah', beej:'Om Keem', gemstone:"Cat's Eye", metal:'Gold', color:'Red', flower:'Red Rose', tree:'Kuchala', deity:'Ashwini Kumars', upasana:'Chant mantra 108x on Sundays', dosha:'Head & brain', charity:'Donate medicines', fasting:'Sunday fast' },
  { mantra:'Om Yamaya Namah', beej:'Om Lim', gemstone:'Diamond', metal:'Silver', color:'Red', flower:'Red Lotus', tree:'Amla', deity:'Yama', upasana:'Offer water to ancestors', dosha:'Blood & reproduction', charity:'Donate food to priests', fasting:'Friday fast' },
  { mantra:'Om Agni Devaya Namah', beej:'Om Aim', gemstone:'Ruby', metal:'Copper', color:'White', flower:'Red Hibiscus', tree:'Fig', deity:'Agni', upasana:'Light ghee lamp daily', dosha:'Eyes & skin', charity:'Feed fire workers', fasting:'Sunday fast' },
  { mantra:'Om Brahma Devaya Namah', beej:'Om Kleem', gemstone:'Pearl', metal:'Silver', color:'White', flower:'White Jasmine', tree:'Jackfruit', deity:'Brahma', upasana:'Chant on Mondays at sunrise', dosha:'Throat & neck', charity:'Donate milk', fasting:'Monday fast' },
  { mantra:'Om Chandraya Namah', beej:'Om Heem', gemstone:'Emerald', metal:'Silver', color:'Green', flower:'White flower', tree:'Khadira', deity:'Chandra', upasana:'Worship on Mondays', dosha:'Nose & blood vessels', charity:'Donate clothes', fasting:'Monday fast' },
  { mantra:'Om Rudraya Namah', beej:'Om Aim Hreem', gemstone:'Gomedh', metal:'Lead', color:'Grey', flower:'Blue flower', tree:'Shishama', deity:'Rudra/Shiva', upasana:'Shiva abhishek on Mondays', dosha:'Shoulders & arms', charity:'Donate to Shiva temples', fasting:'Monday fast' },
  { mantra:'Om Aditya Devaya Namah', beej:'Om Dum', gemstone:'Yellow Sapphire', metal:'Gold', color:'Yellow', flower:'Yellow Flower', tree:'Bamboo', deity:'Aditi', upasana:'Worship Aditi on Thursdays', dosha:'Ears & breath', charity:'Donate food to the needy', fasting:'Thursday fast' },
  { mantra:'Om Brijaspataye Namah', beej:'Om Hreem Shreem', gemstone:'Yellow Sapphire', metal:'Gold', color:'Red', flower:'Yellow Jasmine', tree:'Peepal', deity:'Brihaspati', upasana:'Jupiter worship on Thursdays', dosha:'Mouth & ribs', charity:'Donate to educational institutions', fasting:'Thursday fast' },
  { mantra:'Om Sarpebhyo Namah', beej:'Om Aim Kleem', gemstone:"Cat's Eye", metal:'Lead', color:'Black', flower:'White Flower', tree:'Nagkesar', deity:'Sarpas (Nagas)', upasana:'Visit Naga temples on Saturdays', dosha:'Stomach & joints', charity:'Donate Nag Panchami offerings', fasting:'Saturday fast' },
  { mantra:'Om Pitribhyo Namah', beej:'Om Aim Hreem', gemstone:'Ruby', metal:'Gold', color:'Cream', flower:'Red Lotus', tree:'Banyan', deity:'Pitrs (Ancestors)', upasana:'Perform Shradha on new moon', dosha:'Nose & lips', charity:'Donate to ancestor rituals', fasting:'Amavasya fast' },
  { mantra:'Om Bhagaya Namah', beej:'Om Hreem', gemstone:'Diamond', metal:'Silver', color:'Pink', flower:'Pink Flower', tree:'Palash', deity:'Bhaga', upasana:'Lakshmi worship on Fridays', dosha:'Right arm', charity:'Donate sweets', fasting:'Friday fast' },
  { mantra:'Om Aryamanaya Namah', beej:'Om Bhreem', gemstone:'Ruby', metal:'Gold', color:'Bright Red', flower:'Marigold', tree:'Fig', deity:'Aryama', upasana:'Sun worship at sunrise', dosha:'Left arm', charity:'Donate cow', fasting:'Sunday fast' },
  { mantra:'Om Savitra Devaya Namah', beej:'Om Aim Hreem', gemstone:'Emerald', metal:'Mix metals', color:'Green', flower:'Green Leaf', tree:'Henna', deity:'Savitar', upasana:'Surya Arghya daily', dosha:'Hands & fingers', charity:'Donate to craftsmen', fasting:'Sunday fast' },
  { mantra:'Om Vishvakarmane Namah', beej:'Om Peem', gemstone:'Red Coral', metal:'Copper', color:'Black', flower:'Red Flower', tree:'Bel', deity:'Vishwakarma', upasana:'Vishwakarma puja on Thursdays', dosha:'Neck & forehead', charity:'Donate tools to craftsmen', fasting:'Thursday fast' },
  { mantra:'Om Vayave Namah', beej:'Om Reem', gemstone:'Blue Sapphire', metal:'Iron', color:'Black', flower:'Blue flower', tree:'Arjuna', deity:'Vayu', upasana:'Hanuman worship on Tuesdays', dosha:'Chest & skin', charity:'Donate blankets', fasting:'Tuesday fast' },
  { mantra:'Om Indra-Agni Devabhyam Namah', beej:'Om Aim Hreem', gemstone:'Yellow Sapphire', metal:'Gold', color:'Yellow-Red', flower:'Marigold', tree:'Vikankta', deity:'Indra-Agni', upasana:'Chant on Thursdays', dosha:'Stomach & lower torso', charity:'Donate to fire purohit', fasting:'Thursday fast' },
  { mantra:'Om Mitraya Namah', beej:'Om Hreem Hreem', gemstone:'Blue Sapphire', metal:'Lead', color:'Brown', flower:'Red Lotus', tree:'Nagkesar', deity:'Mitra', upasana:'Friendship prayers on Saturdays', dosha:'Stomach & womb', charity:'Feed friends & guests', fasting:'Saturday fast' },
  { mantra:'Om Indraya Namah', beej:'Om Vreem', gemstone:'Red Coral', metal:'Copper', color:'Red', flower:'Red', tree:'Shamilee', deity:'Indra', upasana:'Indra worship on Thursdays', dosha:'Neck & right side', charity:'Donate to leaders', fasting:'Thursday fast' },
  { mantra:'Om Nrittaye Namah', beej:'Om Aim Hreem', gemstone:"Cat's Eye", metal:'Lead', color:'Yellow', flower:'Yellow', tree:'Sarjaka', deity:'Nirrti', upasana:'Kali/Chamunda worship', dosha:'Hips & feet', charity:'Donate to the destitute', fasting:'New Moon fast' },
  { mantra:'Om Adbhyo Namah', beej:'Om Phrem', gemstone:'Diamond', metal:'Silver', color:'Golden', flower:'Water Lily', tree:'Ashoka', deity:'Apas', upasana:'Water body worship on Fridays', dosha:'Back & thighs', charity:'Donate water containers', fasting:'Friday fast' },
  { mantra:'Om Vishvedevaya Namah', beej:'Om Aim', gemstone:'Blue Sapphire', metal:'Gold', color:'Copper', flower:'Champak', tree:'Jackfruit', deity:'Vishvedevas', upasana:'Universal prayers on Sundays', dosha:'Thighs & knees', charity:'Donate to all causes', fasting:'Sunday fast' },
  { mantra:'Om Vishnave Namah', beej:'Om Shreem', gemstone:'Moonstone', metal:'Silver', color:'Blue', flower:'Blue Lotus', tree:'Arka', deity:'Vishnu', upasana:'Vishnu Sahasranama on Thursdays', dosha:'Ears & knees', charity:'Donate Vishnu pooja items', fasting:'Thursday fast' },
  { mantra:'Om Vasu Devaya Namah', beej:'Om Hreem Shreem', gemstone:'Red Coral', metal:'Iron', color:'Silver', flower:'Champak', tree:'Shami', deity:'Asta Vasus', upasana:'Shiva mantra on Saturdays', dosha:'Ankles & back', charity:'Donate to musicians', fasting:'Saturday fast' },
  { mantra:'Om Varunaya Namah', beej:'Om Aim Hreem', gemstone:'Gomedh', metal:'Lead', color:'Green-Blue', flower:'Blue Flower', tree:'Kadamba', deity:'Varuna', upasana:'Water purification rituals', dosha:'Lower legs & ankles', charity:'Donate water purification', fasting:'Saturday fast' },
  { mantra:'Om Aja Ekapadaya Namah', beej:'Om Hreem Aim', gemstone:'Yellow Sapphire', metal:'Gold', color:'Silver-White', flower:'White Flower', tree:'Mango', deity:'Aja Ekapada', upasana:'Shiva worship at midnight', dosha:'Left thigh & abdomen', charity:'Donate to Shiva temples', fasting:'Monday & Saturday fast' },
  { mantra:'Om Ahirbudhnyaya Namah', beej:'Om Phreem', gemstone:'Blue Sapphire', metal:'Iron', color:'Purple', flower:'Blue Lotus', tree:'Neem', deity:'Ahirbudhnya', upasana:'Serpent worship on Saturdays', dosha:'Ribs & sides', charity:'Donate to orphanages', fasting:'Saturday fast' },
  { mantra:'Om Pushne Namah', beej:'Om Hreem Aim Shreem', gemstone:'Yellow Sapphire', metal:'Gold', color:'Brown', flower:'Jasmine', tree:'Mahua', deity:'Pusha', upasana:'Vishnu worship on Thursdays', dosha:'Feet & abdomen', charity:'Donate footwear to poor', fasting:'Thursday fast' },
]
