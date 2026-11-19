// Client-side shapes for astrocartography API data and page state.
import type { GrahaId, Rashi } from '@/types/astrology'

export interface ACGLineData {
  grahaId: GrahaId
  mcLine: number
  icLine: number
  /** Vedic special drishti of Mars, Jupiter and Saturn on the MC. */
  aspects: { type: 'Drishti'; house: number; lon: number }[]
  asCurve: [number, number][][]
  dsCurve: [number, number][][]
  zenith: [number, number]
  localSpaceBearing: number
}

export interface ACGParan {
  p1: GrahaId
  p2: GrahaId
  lat: number
  lon: number
  angle1: 'MC' | 'IC'
  angle2: 'AS' | 'DS'
  type: string
}

export interface ACGStarParan {
  grahaId: GrahaId
  nakshatraIndex: number
  star: string
  meridian: 'graha' | 'star'
  lat: number
  lon: number
  angle1: 'MC' | 'IC'
  angle2: 'AS' | 'DS'
  type: string
}

export interface ACGDataBundle {
  visible: Set<GrahaId>
  parans: ACGParan[]
  starParans: ACGStarParan[]
  natal: ACGLineData[]
}

/** A place on the compare shortlist. */
export interface ComparePoint {
  id: string
  label: string
  lat: number
  lng: number
}

/** The slice of the natal chart the map needs for relocation and solar returns. */
export interface ACGNatalInfo {
  name: string
  birthDate: string
  ayanamsha: number
  ascRashi: Rashi
  sunSidereal?: number
  settings: unknown
  gender?: string
  grahas: { id: GrahaId; totalDegree: number }[]
}

export interface ACGPartner {
  name: string
  lines: ACGLineData[]
  parans: ACGParan[]
}

export type MapLayerId = 'aspects' | 'localSpace' | 'paranBands' | 'stars' | 'heatmap' | 'partner'
