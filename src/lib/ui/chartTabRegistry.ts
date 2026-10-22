// ─────────────────────────────────────────────────────────────
//  src/lib/ui/chartTabRegistry.ts
//  Chart dashboard tab metadata — layout rules & mobile nav
// ─────────────────────────────────────────────────────────────

export type ChartTabId =
  | 'dashboard'
  | 'astro-details'
  | 'planets'
  | 'navamsha'
  | 'dashamsa'
  | 'relationship'
  | 'dasha'
  | 'dasha-interpretation'
  | 'house'
  | 'yogas'
  | 'kp-stellar'
  | 'interpretation'
  | 'varshaphal'
  | 'ashtakavarga'
  | 'shadbala'
  | 'bhava-bala'
  | 'vimsopaka'
  | 'panchang'
  | 'arudhas'

/** Tabs that use a full-width workspace (no two-column chart grid). */
export const FULL_WIDTH_CHART_TABS: readonly ChartTabId[] = [
  'varshaphal',
  'planets',
  'navamsha',
  'dashamsa',
  'relationship',
  'house',
  'interpretation',
  'kp-stellar',
]

/** Tabs with flush padding (no panel wrapper padding). */
export const FLUSH_PADDING_CHART_TABS: readonly ChartTabId[] = [
  'planets',
  'navamsha',
  'dashamsa',
  'relationship',
  'house',
  'kp-stellar',
]

export const STRENGTH_ANALYTICS_TABS = [
  'ashtakavarga',
  'shadbala',
  'bhava-bala',
  'vimsopaka',
] as const

export type StrengthAnalyticsTabId = (typeof STRENGTH_ANALYTICS_TABS)[number]

export type MobileDashTabId =
  | 'overview'
  | 'astro'
  | 'planetary'
  | 'dashas'
  | 'today'
  | 'panchang'
  | 'strengths'
  | 'yogas'

export const MOBILE_DASHBOARD_CATEGORIES = [
  { id: 'astrology', label: 'Astrology' },
  { id: 'panchang', label: 'Panchang' },
  { id: 'nakshatra', label: 'Nakshatra' },
  { id: 'advanced', label: 'Advanced Astrology' },
] as const

export const MOBILE_DASHBOARD_OPTIONS = {
  astrology: [
    { id: 'astro', label: 'Astro Details' },
    { id: 'planetary', label: 'Planetary Details' },
    { id: 'dashas', label: 'Dashas' },
    { id: 'today', label: 'Today Glance' },
    { id: 'panchang', label: 'Natal Panchang' },
    { id: 'strengths', label: 'Strengths' },
    { id: 'yogas', label: 'Graha Yogas' },
  ],
  panchang: [
    { id: 'daily-panchang', label: 'Daily Panchang', path: '/panchang' },
    { id: 'monthly-panchang', label: 'Monthly Calendar', path: '/panchang/calendar' },
  ],
  nakshatra: [
    { id: 'nakshatra-overview', label: 'Overview', path: '/nakshatra/overview' },
    { id: 'nakshatra-navtara', label: 'Navtara', path: '/nakshatra/navtara' },
    { id: 'nakshatra-taramandal', label: 'Taramandal', path: '/nakshatra/taramandal' },
    { id: 'nakshatra-bestdays', label: 'Best Days', path: '/nakshatra/bestdays' },
    { id: 'nakshatra-muhurta', label: 'Muhurta', path: '/nakshatra/muhurta' },
    { id: 'nakshatra-panchaka', label: 'Panchaka', path: '/nakshatra/panchaka' },
    { id: 'nakshatra-planet', label: 'Planet', path: '/nakshatra/planet' },
    { id: 'nakshatra-compat', label: 'Compat', path: '/nakshatra/compat' },
    { id: 'nakshatra-remedies', label: 'Remedies', path: '/nakshatra/remedies' },
    { id: 'nakshatra-profession', label: 'Profession', path: '/nakshatra/profession' },
    { id: 'nakshatra-medical', label: 'Medical', path: '/nakshatra/medical' },
  ],
  advanced: [
    { id: 'jaimini', label: 'Jaimini Astrology', path: '/jaimini' },
    { id: 'astro-vastu', label: 'Astro Vastu', path: '/vastu' },
    { id: 'astro-carto', label: 'AstroCartography', path: '/acg' },
    { id: 'sbc', label: 'Sarvatobhadra Chakra', path: '/sbc' },
    { id: 'muhurta', label: 'Muhurta Finder', path: '/muhurta' },
    { id: 'prashna', label: 'Prashna', path: '/prashna' },
    { id: 'numerology', label: 'Vedic Numerology', path: '/numerology' },
    { id: 'compare', label: 'Kundali Matching', path: '/compare' },
    { id: 'transit-roadmap', label: 'Cosmic Roadmap', path: '/transit/roadmap' },
    { id: 'transit-scrubber', label: 'Live Transit', path: '/transit/scrubber' },
    { id: 'transit-sade-sati', label: 'Sade Sati', path: '/transit/sade-sati' },
    { id: 'transit-aspects', label: 'Aspects', path: '/transit/aspects' },
    { id: 'transit-biwheel', label: 'Bi-wheel', path: '/transit/biwheel' },
    { id: 'transit-calendar', label: 'Calendar', path: '/transit/calendar' },
  ],
} as const

export function isFullWidthChartTab(tab: string): tab is ChartTabId {
  return (FULL_WIDTH_CHART_TABS as readonly string[]).includes(tab)
}

export function isFlushPaddingChartTab(tab: string): boolean {
  return (FLUSH_PADDING_CHART_TABS as readonly string[]).includes(tab)
}

export function isStrengthAnalyticsTab(tab: string): tab is StrengthAnalyticsTabId {
  return (STRENGTH_ANALYTICS_TABS as readonly string[]).includes(tab)
}
