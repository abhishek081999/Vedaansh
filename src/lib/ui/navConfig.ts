// ─────────────────────────────────────────────────────────────
//  src/lib/ui/navConfig.ts
//  App shell navigation — single source of truth for sidenav
// ─────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Anchor,
  CalendarHeart,
  Castle,
  Flame,
  Footprints,
  GitBranch,
  Type,
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  CloudMoon,
  Crosshair,
  Gem,
  Globe,
  Grid3x3,
  Hash,
  Heart,
  HeartHandshake,
  Hexagon,
  ShieldAlert,
  Building2,
  Home,
  Hourglass,
  Layers,
  LayoutDashboard,
  Library,
  Lightbulb,
  Compass,
  Moon,
  NotebookText,
  Orbit,
  Route,
  Scale,
  PenLine,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  UsersRound,
  Waves,
  Wind,
  Waypoints,
  Zap,
  Info,
  Download,
  TrendingUp,
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
  /** Optional group icon (Nakshatra groups use it in the page's group bar). */
  icon?: LucideIcon
  tabs: NavTab[]
}

export const TOP_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Workspace', icon: LayoutDashboard, path: ASTROLOGY_HOME_PATH },
  { id: 'today', label: 'Today', icon: CalendarCheck, path: '/today' },
  { id: 'my-charts', label: 'My Charts', icon: Library, path: '/my/charts' },
]

/** Sidenav entry: one link; the grouped tabs live on the page and in the header menu. */
export const NAKSHATRA_LINK: NavTab = {
  id: 'nakshatra',
  label: 'Nakshatra',
  icon: Moon,
  path: '/nakshatra',
  match: 'prefix',
}

/**
 * Nakshatra page tabs, grouped — the single source of truth for the page's
 * own group/tab bars and the header mega-menu.
 * The tab slug is the last path segment (/nakshatra/<slug>).
 */
export const NAKSHATRA_GROUPS: NavGroup[] = [
  {
    id: 'nakshatra-birth',
    label: 'Birth Star',
    icon: Moon,
    tabs: [
      { id: 'nakshatra-overview', label: 'Profile', icon: Info, path: '/nakshatra/overview' },
      { id: 'nakshatra-planet', label: 'Planets', icon: Star, path: '/nakshatra/planet' },
      { id: 'nakshatra-starlords', label: 'Star Lords', icon: GitBranch, path: '/nakshatra/starlords' },
      { id: 'nakshatra-degrees', label: 'Sensitive Degrees', icon: Crosshair, path: '/nakshatra/degrees' },
      { id: 'nakshatra-gandmool', label: 'Gandmool', icon: Anchor, path: '/nakshatra/gandmool' },
    ],
  },
  {
    id: 'nakshatra-chakras',
    label: 'Chakras',
    icon: Orbit,
    tabs: [
      { id: 'nakshatra-special', label: 'Nadi Nakshatras', icon: Sparkles, path: '/nakshatra/special' },
      { id: 'nakshatra-navtara', label: 'Navtara', icon: Compass, path: '/nakshatra/navtara' },
      { id: 'nakshatra-taramandal', label: 'Taramandal', icon: Orbit, path: '/nakshatra/taramandal' },
      { id: 'nakshatra-journey', label: 'Life Journey', icon: Route, path: '/nakshatra/journey' },
    ],
  },
  {
    id: 'nakshatra-transits',
    label: 'Transits',
    icon: Hourglass,
    tabs: [
      { id: 'nakshatra-slowtransits', label: 'Slow Transits', icon: Hourglass, path: '/nakshatra/slowtransits' },
      { id: 'nakshatra-kota', label: 'Kota Chakra', icon: Castle, path: '/nakshatra/kota' },
      { id: 'nakshatra-birthday', label: 'Star Birthday', icon: CalendarHeart, path: '/nakshatra/birthday' },
    ],
  },
  {
    id: 'nakshatra-timing',
    label: 'Timing',
    icon: CalendarDays,
    tabs: [
      { id: 'nakshatra-bestdays', label: 'Best Days', icon: CalendarDays, path: '/nakshatra/bestdays' },
      { id: 'nakshatra-muhurta', label: 'Muhurta', icon: Zap, path: '/nakshatra/muhurta' },
      { id: 'nakshatra-panchaka', label: 'Panchaka', icon: Flame, path: '/nakshatra/panchaka' },
      { id: 'nakshatra-latta', label: 'Latta', icon: Footprints, path: '/nakshatra/latta' },
      { id: 'nakshatra-ghatak', label: 'Ghatak', icon: ShieldAlert, path: '/nakshatra/ghatak' },
    ],
  },
  {
    id: 'nakshatra-guidance',
    label: 'Guidance',
    icon: Compass,
    tabs: [
      { id: 'nakshatra-compat', label: 'Compatibility', icon: HeartHandshake, path: '/nakshatra/compat' },
      { id: 'nakshatra-profession', label: 'Career', icon: Briefcase, path: '/nakshatra/profession' },
      { id: 'nakshatra-medical', label: 'Health', icon: Activity, path: '/nakshatra/medical' },
      { id: 'nakshatra-remedies', label: 'Remedies', icon: Heart, path: '/nakshatra/remedies' },
      { id: 'nakshatra-namakshar', label: 'Name Letters', icon: Type, path: '/nakshatra/namakshar' },
    ],
  },
]

export const NAKSHATRA_TABS: NavTab[] = NAKSHATRA_GROUPS.flatMap(g => g.tabs)

/** Slug of a Nakshatra tab (/nakshatra/<slug>). */
export const nakshatraSlug = (tab: NavTab) => (tab.path ?? '').split('/').pop() ?? ''

/**
 * Consultation-first astrology sections.
 * Primary path: Consult → Readings → Divisionals / Strength / Transit (progressive disclosure).
 */
export const ASTRO_GROUPS: NavGroup[] = [
  {
    id: 'consult',
    label: 'Consult',
    tabs: [
      { id: 'astro-details', label: 'Astro Details', icon: ClipboardList, path: ASTROLOGY_HOME_PATH },
      { id: 'planets', label: 'Planets', icon: Sparkles, path: ASTROLOGY_HOME_PATH },
      { id: 'dasha', label: 'Dasha', icon: Hourglass, path: ASTROLOGY_HOME_PATH },
      { id: 'dasha-interpretation', label: 'Dasha Interpretation', icon: NotebookText, path: ASTROLOGY_HOME_PATH },
      { id: 'house', label: 'House', icon: Home, path: ASTROLOGY_HOME_PATH },
      { id: 'yogas', label: 'Yogas', icon: Star, path: ASTROLOGY_HOME_PATH },
      { id: 'interpretation', label: 'Interpretation', icon: BookOpen, path: ASTROLOGY_HOME_PATH },
      { id: 'kp-stellar', label: 'Stellar (KP)', icon: Crosshair, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    id: 'readings',
    label: 'Readings',
    tabs: [
      { id: 'relationship', label: 'Relationship', icon: Heart, path: '/relationship' },
      { id: 'career', label: 'Career', icon: Briefcase, path: '/career' },
      { id: 'dosha', label: 'Dosha & Upay', icon: ShieldAlert, path: '/dosha' },
      { id: 'tattva', label: 'Tattva Prediction', icon: Wind, path: ASTROLOGY_HOME_PATH },
      { id: 'naamkaran', label: 'Naamkaran', icon: PenLine, path: ASTROLOGY_HOME_PATH },
      { id: 'varshaphal', label: 'Solar Return', icon: Sun, path: ASTROLOGY_HOME_PATH },
      { id: 'panchang', label: 'Natal Panchang', icon: Calendar, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    id: 'divisional-charts',
    label: 'Divisional Charts',
    tabs: [
      { id: 'navamsha', label: 'Navamsha (D9)', icon: Orbit, path: ASTROLOGY_HOME_PATH },
      { id: 'chaturthamsa', label: 'Chaturthamsha (D4)', icon: Building2, path: ASTROLOGY_HOME_PATH },
      { id: 'saptamsha', label: 'Saptamsha (D7)', icon: Heart, path: ASTROLOGY_HOME_PATH },
      { id: 'dashamsa', label: 'Dashamsha (D10)', icon: Briefcase, path: ASTROLOGY_HOME_PATH },
      { id: 'dwadashamsha', label: 'Dwadashamsha (D12)', icon: CloudMoon, path: ASTROLOGY_HOME_PATH },
      { id: 'drekkana', label: 'Drekkana (D3)', icon: Brain, path: ASTROLOGY_HOME_PATH },
      { id: 'nakshatramsha', label: 'Nakshatramsha (D27)', icon: Waves, path: ASTROLOGY_HOME_PATH },
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
  {
    id: 'transit',
    label: 'Transit',
    tabs: [
      { id: 'transit-scrubber', label: 'Live Transit', icon: Timer, path: '/transit/scrubber' },
      { id: 'transit-forecast', label: 'Forecast', icon: TrendingUp, path: '/transit/forecast' },
      { id: 'transit-moon', label: 'Moon Passages', icon: Moon, path: '/transit/moon' },
      { id: 'transit-roadmap', label: 'Cosmic Roadmap', icon: Route, path: '/transit/roadmap' },
      { id: 'transit-eclipses', label: 'Eclipses', icon: CloudMoon, path: '/transit/eclipses' },
      { id: 'transit-sade-sati', label: 'Sade Sati', icon: Hourglass, path: '/transit/sade-sati' },
      { id: 'transit-aspects', label: 'Aspects', icon: Crosshair, path: '/transit/aspects' },
      { id: 'transit-biwheel', label: 'Bi-wheel', icon: Orbit, path: '/transit/biwheel' },
      { id: 'transit-calendar', label: 'Calendar', icon: CalendarDays, path: '/transit/calendar' },
    ],
  },
]

/**
 * Legacy flat list of chart destinations that used to sit outside groups.
 * Kept for AppFramework external-path checks; all live under Readings now.
 */
export const ASTRO_DIRECT_TABS: NavTab[] = [
  { id: 'relationship', label: 'Relationship', icon: Heart, path: '/relationship' },
  { id: 'career', label: 'Career', icon: Briefcase, path: '/career' },
  { id: 'dosha', label: 'Dosha & Upay', icon: ShieldAlert, path: '/dosha' },
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

/** Sidenav order: consult path first, then progressive disclosure. */
export const ASTRO_NAV: AstroNavEntry[] = [
  { kind: 'group', group: astroGroup('consult') },
  { kind: 'group', group: astroGroup('readings') },
  { kind: 'group', group: astroGroup('divisional-charts') },
  { kind: 'group', group: astroGroup('strength-analytics') },
  { kind: 'group', group: astroGroup('transit') },
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
  { id: 'nadi', label: 'Nadi Astrology', icon: Waypoints, path: '/nadi' },
  { id: 'lal-kitab', label: 'Lal Kitab', icon: BookMarked, path: '/lal-kitab' },
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
  { id: 'help', label: 'App Guide', icon: Compass, path: '/help', match: 'prefix' },
  { id: 'clients', label: 'CRM / Clients', icon: UsersRound, path: '/clients' },
  { id: 'feature-requests', label: 'Request a Feature', icon: Lightbulb, path: '/feature-requests' },
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
