// ─────────────────────────────────────────────────────────────
//  src/lib/ui/navConfig.ts
//  App shell navigation — single source of truth for sidenav
// ─────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  Crosshair,
  Gem,
  Globe,
  Grid3x3,
  Hash,
  Heart,
  HeartHandshake,
  Hexagon,
  Home,
  Hourglass,
  Layers,
  LayoutDashboard,
  Library,
  Moon,
  NotebookText,
  Orbit,
  Route,
  Scale,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  UsersRound,
  Zap,
  Info,
  Download,
} from 'lucide-react'

export const SIDENAV_WIDTH_PX = 240
export const ASTROLOGY_HOME_PATH = '/'

export interface NavTab {
  id: string
  label: string
  icon: LucideIcon
  path?: string
  /** Active on this path and any route under it. */
  match?: 'exact' | 'prefix'
}

export interface NavGroup {
  id: string
  label: string
  tabs: NavTab[]
}

export const TOP_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ASTROLOGY_HOME_PATH },
  { id: 'my-charts', label: 'My Charts', icon: Library, path: '/my/charts' },
]

/** Sidenav entry. Navtara and the other tools live inside the Nakshatra page. */
export const NAKSHATRA_LINK: NavTab = {
  id: 'nakshatra',
  label: 'Nakshatra',
  icon: Moon,
  path: '/nakshatra',
  match: 'prefix',
}

export const NAKSHATRA_TABS: NavTab[] = [
  { id: 'nakshatra-overview', label: 'Overview', icon: Star, path: '/nakshatra/overview' },
  { id: 'nakshatra-navtara', label: 'Navtara', icon: Sparkles, path: '/nakshatra/navtara' },
  { id: 'nakshatra-taramandal', label: 'Taramandal', icon: Orbit, path: '/nakshatra/taramandal' },
  { id: 'nakshatra-bestdays', label: 'Best Days', icon: CalendarDays, path: '/nakshatra/bestdays' },
  { id: 'nakshatra-muhurta', label: 'Muhurta', icon: Zap, path: '/nakshatra/muhurta' },
  { id: 'nakshatra-panchaka', label: 'Panchaka', icon: Target, path: '/nakshatra/panchaka' },
  { id: 'nakshatra-planet', label: 'Planet', icon: Star, path: '/nakshatra/planet' },
  { id: 'nakshatra-compat', label: 'Compat', icon: HeartHandshake, path: '/nakshatra/compat' },
  { id: 'nakshatra-remedies', label: 'Remedies', icon: Sparkles, path: '/nakshatra/remedies' },
  { id: 'nakshatra-profession', label: 'Profession', icon: Briefcase, path: '/nakshatra/profession' },
  { id: 'nakshatra-medical', label: 'Medical', icon: Activity, path: '/nakshatra/medical' },
]

/** Multi-item astrology sections. Single destinations live in ASTRO_DIRECT_TABS. */
export const ASTRO_GROUPS: NavGroup[] = [
  {
    id: 'transit',
    label: 'Transit',
    tabs: [
      { id: 'transit-roadmap', label: 'Cosmic Roadmap', icon: Route, path: '/transit/roadmap' },
      { id: 'transit-scrubber', label: 'Live Transit', icon: Timer, path: '/transit/scrubber' },
      { id: 'transit-sade-sati', label: 'Sade Sati', icon: Hourglass, path: '/transit/sade-sati' },
      { id: 'transit-aspects', label: 'Aspects', icon: Crosshair, path: '/transit/aspects' },
      { id: 'transit-biwheel', label: 'Bi-wheel', icon: Orbit, path: '/transit/biwheel' },
      { id: 'transit-calendar', label: 'Calendar', icon: CalendarDays, path: '/transit/calendar' },
    ],
  },
  {
    id: 'core-analysis',
    label: 'Core Analysis',
    tabs: [
      { id: 'astro-details', label: 'Astro Details', icon: ClipboardList, path: ASTROLOGY_HOME_PATH },
      { id: 'planets', label: 'Planets', icon: Sparkles, path: ASTROLOGY_HOME_PATH },
      { id: 'navamsha', label: 'Navamsha (D9)', icon: Orbit, path: ASTROLOGY_HOME_PATH },
      { id: 'dasha', label: 'Dasha', icon: Hourglass, path: ASTROLOGY_HOME_PATH },
      { id: 'dasha-interpretation', label: 'Dasha Interpretation', icon: NotebookText, path: ASTROLOGY_HOME_PATH },
      { id: 'house', label: 'House', icon: Home, path: ASTROLOGY_HOME_PATH },
      { id: 'yogas', label: 'Yogas', icon: Star, path: ASTROLOGY_HOME_PATH },
      { id: 'kp-stellar', label: 'Stellar (KP)', icon: Crosshair, path: ASTROLOGY_HOME_PATH },
      { id: 'interpretation', label: 'Interpretation', icon: BookOpen, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    id: 'strength-analytics',
    label: 'Strength & Analytics',
    tabs: [
      { id: 'ashtakavarga', label: 'Ashtakavarga', icon: Hexagon, path: ASTROLOGY_HOME_PATH },
      { id: 'shadbala', label: 'Shadbala', icon: Scale, path: ASTROLOGY_HOME_PATH },
      { id: 'bhava-bala', label: 'Bhava Bala', icon: Grid3x3, path: ASTROLOGY_HOME_PATH },
      { id: 'vimsopaka', label: 'Vimsopaka', icon: BarChart3, path: ASTROLOGY_HOME_PATH },
    ],
  },
]

/** Chart destinations that do not need their own accordion. */
export const ASTRO_DIRECT_TABS: NavTab[] = [
  { id: 'relationship', label: 'Relationship', icon: Heart, path: ASTROLOGY_HOME_PATH },
  { id: 'varshaphal', label: 'Solar Return', icon: Sun, path: ASTROLOGY_HOME_PATH },
  { id: 'panchang', label: 'Natal Panchang', icon: Calendar, path: ASTROLOGY_HOME_PATH },
]

export type AstroNavEntry =
  | { kind: 'group'; group: NavGroup }
  | { kind: 'link'; tab: NavTab }

function astroGroup(id: string): NavGroup {
  const group = ASTRO_GROUPS.find((entry) => entry.id === id)
  if (!group) throw new Error(`Missing astrology nav group: ${id}`)
  return group
}

function astroDirectTab(id: string): NavTab {
  const tab = ASTRO_DIRECT_TABS.find((entry) => entry.id === id)
  if (!tab) throw new Error(`Missing astrology nav tab: ${id}`)
  return tab
}

/** Sidenav order inside Astrology: groups and direct links interleaved. */
export const ASTRO_NAV: AstroNavEntry[] = [
  { kind: 'group', group: astroGroup('transit') },
  { kind: 'group', group: astroGroup('core-analysis') },
  { kind: 'group', group: astroGroup('strength-analytics') },
  { kind: 'link', tab: astroDirectTab('relationship') },
  { kind: 'link', tab: astroDirectTab('varshaphal') },
  { kind: 'link', tab: astroDirectTab('panchang') },
]

export function astroNavTabs(): NavTab[] {
  return ASTRO_NAV.flatMap((entry) => (entry.kind === 'group' ? entry.group.tabs : [entry.tab]))
}

export const PANCHANG_TABS: NavTab[] = [
  { id: 'daily-panchang', label: 'Daily Panchang', icon: Calendar, path: '/panchang' },
  { id: 'monthly-panchang', label: 'Monthly Calendar', icon: CalendarDays, path: '/panchang/calendar' },
]

export const ADVANCED_ASTRO_TABS: NavTab[] = [
  { id: 'jaimini', label: 'Jaimini Astrology', icon: Zap, path: '/jaimini' },
  { id: 'astro-vastu', label: 'Astro Vastu', icon: Home, path: '/vastu' },
  { id: 'astro-carto', label: 'AstroCartography', icon: Globe, path: '/acg' },
  { id: 'sbc', label: 'Sarvatobhadra Chakra', icon: Layers, path: '/sbc' },
  { id: 'muhurta', label: 'Muhurta Finder', icon: Clock, path: '/muhurta' },
  { id: 'prashna', label: 'Prashna', icon: Target, path: '/prashna' },
  { id: 'numerology', label: 'Vedic Numerology', icon: Hash, path: '/numerology' },
  { id: 'compare', label: 'Kundali Matching', icon: HeartHandshake, path: '/compare' },
]

/** Working tools, separate from chart sections. */
export const TOOL_TABS: NavTab[] = [
  { id: 'guides', label: 'Guides', icon: BookOpen, path: '/guides' },
  { id: 'clients', label: 'CRM / Clients', icon: UsersRound, path: '/clients' },
]

/** App and account links. */
export const ACCOUNT_TABS: NavTab[] = [
  { id: 'install', label: 'Install App', icon: Download, path: '/install' },
  { id: 'about', label: 'About', icon: Info, path: '/about' },
  { id: 'pricing', label: 'Pricing', icon: Gem, path: '/pricing' },
]

export const MAIN_TABS: NavTab[] = [...TOOL_TABS, ...ACCOUNT_TABS]

export const SIDENAV_ACCORDIONS = {
  astrology: { label: 'Astrology', headerLabel: 'Astrology', icon: Sparkles },
  advanced: { label: 'Advanced Astrology', headerLabel: 'Advanced', icon: Orbit },
  nakshatra: { label: 'Nakshatra', headerLabel: 'Nakshatra', icon: Moon },
  panchang: { label: 'Panchang', headerLabel: 'Panchang', icon: Sunrise },
} as const
