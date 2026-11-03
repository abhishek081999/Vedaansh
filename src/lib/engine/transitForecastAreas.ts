// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitForecastAreas.ts
//  Life-area definitions for the transit forecast — ephemeris-free
//  so client components can import them.
// ─────────────────────────────────────────────────────────────

export type ForecastAreaId = 'career' | 'wealth' | 'relationships' | 'home' | 'health' | 'growth'

export interface ForecastAreaDef {
  id: ForecastAreaId
  label: string
  /** Houses from Lagna — full weight. */
  primary: readonly number[]
  /** Houses from Lagna — partial weight. */
  secondary: readonly number[]
}

export const FORECAST_AREAS: readonly ForecastAreaDef[] = [
  { id: 'career', label: 'Career & Status', primary: [10], secondary: [6, 11] },
  { id: 'wealth', label: 'Wealth & Gains', primary: [2, 11], secondary: [9] },
  { id: 'relationships', label: 'Relationships', primary: [7], secondary: [5, 11] },
  { id: 'home', label: 'Home & Family', primary: [4], secondary: [2] },
  { id: 'health', label: 'Health & Vitality', primary: [1], secondary: [6, 8] },
  { id: 'growth', label: 'Learning & Spirit', primary: [9], secondary: [5, 12] },
]
