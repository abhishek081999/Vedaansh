// ─────────────────────────────────────────────────────────────
//  src/lib/ui/navConfig.ts
//  App shell navigation — single source of truth for sidenav
// ─────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  Crosshair,
  Gem,
  Globe,
  Grid3x3,
  HeartHandshake,
  Hexagon,
  Home,
  Hourglass,
  Layers,
  LayoutDashboard,
  Library,
  Moon,
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
}

export interface NavGroup {
  label: string
  tabs: NavTab[]
}

export const TOP_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ASTROLOGY_HOME_PATH },
  { id: 'my-charts', label: 'My Charts', icon: Library, path: '/my/charts' },
]

export const NAKSHATRA_TABS: NavTab[] = [
  { id: 'nakshatra-overview', label: 'Overview', icon: Star, path: '/nakshatra/overview' },
  { id: 'nakshatra-navtara', label: 'Navtara', icon: Sparkles, path: '/nakshatra/navtara' },
  { id: 'nakshatra-bestdays', label: 'Best Days', icon: CalendarDays, path: '/nakshatra/bestdays' },
  { id: 'nakshatra-muhurta', label: 'Muhurta', icon: Zap, path: '/nakshatra/muhurta' },
  { id: 'nakshatra-panchaka', label: 'Panchaka', icon: Target, path: '/nakshatra/panchaka' },
  { id: 'nakshatra-planet', label: 'Planet', icon: Star, path: '/nakshatra/planet' },
  { id: 'nakshatra-compat', label: 'Compat', icon: HeartHandshake, path: '/nakshatra/compat' },
  { id: 'nakshatra-remedies', label: 'Remedies', icon: Sparkles, path: '/nakshatra/remedies' },
]

export const ASTRO_GROUPS: NavGroup[] = [
  {
    label: 'Core Analysis',
    tabs: [
      { id: 'astro-details', label: 'Astro Details', icon: ClipboardList, path: ASTROLOGY_HOME_PATH },
      { id: 'planets', label: 'Planets', icon: Sparkles, path: ASTROLOGY_HOME_PATH },
      { id: 'dasha', label: 'Dasha', icon: Hourglass, path: ASTROLOGY_HOME_PATH },
      { id: 'house', label: 'House', icon: Home, path: ASTROLOGY_HOME_PATH },
      { id: 'yogas', label: 'Yogas', icon: Star, path: ASTROLOGY_HOME_PATH },
      { id: 'kp-stellar', label: 'Stellar (KP)', icon: Crosshair, path: ASTROLOGY_HOME_PATH },
      { id: 'interpretation', label: 'Interpretation', icon: BookOpen, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    label: 'Predictive Timing',
    tabs: [
      { id: 'varshaphal', label: 'Solar Return (Varshfal)', icon: Sun, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    label: 'Strength & Analytics',
    tabs: [
      { id: 'ashtakavarga', label: 'Ashtakavarga', icon: Hexagon, path: ASTROLOGY_HOME_PATH },
      { id: 'shadbala', label: 'Shadbala', icon: Scale, path: ASTROLOGY_HOME_PATH },
      { id: 'bhava-bala', label: 'Bhava Bala', icon: Grid3x3, path: ASTROLOGY_HOME_PATH },
      { id: 'vimsopaka', label: 'Vimsopaka', icon: BarChart3, path: ASTROLOGY_HOME_PATH },
    ],
  },
  {
    label: 'Calculations',
    tabs: [
      { id: 'panchang', label: 'Natal Panchang', icon: Calendar, path: ASTROLOGY_HOME_PATH },
    ],
  },
]

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
  { id: 'compare', label: 'Kundali Matching', icon: HeartHandshake, path: '/compare' },
  { id: 'roadmap', label: 'Cosmic Roadmap', icon: Route, path: '/roadmap' },
  { id: 'transit-scrubber', label: 'Transit', icon: Timer, path: '/scrubber' },
]

export const MAIN_TABS: NavTab[] = [
  { id: 'install', label: 'Install App', icon: Download, path: '/install' },
  { id: 'about', label: 'About', icon: Info, path: '/about' },
  { id: 'clients', label: 'CRM / Clients', icon: UsersRound, path: '/clients' },
  { id: 'pricing', label: 'Pricing', icon: Gem, path: '/pricing' },
]

export const SIDENAV_ACCORDIONS = {
  astrology: { label: 'Astrology', icon: Sparkles },
  advanced: { label: 'Advanced Astrology', icon: Orbit },
  nakshatra: { label: 'Nakshatra', icon: Moon },
  panchang: { label: 'Panchang', icon: Sunrise },
} as const
