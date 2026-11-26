// Icons for App Guide sections and topics. Keys match src/lib/help/topics.ts.
import type { LucideIcon } from 'lucide-react'
import {
  BookMarked, BookOpen, Briefcase, CalendarCheck, CalendarDays, Clock, Gem, Hash, Heart,
  HeartHandshake, Hourglass, Layers, LayoutDashboard, Library, Map, Moon, Orbit, PenLine,
  Rocket, Settings2, Share2, ShieldAlert, Sparkles, Table2, Target, UserCog, UserPlus,
  UsersRound, Waypoints, Compass, PanelsTopLeft,
} from 'lucide-react'
import type { HelpCategory } from '@/lib/help/topics'

export const CATEGORY_ICONS: Record<HelpCategory, LucideIcon> = {
  start: Rocket,
  workspace: LayoutDashboard,
  chart: BookOpen,
  life: Heart,
  timing: CalendarDays,
  advanced: Orbit,
  account: UserCog,
}

const TOPIC_ICONS: Record<string, LucideIcon> = {
  'getting-started': Rocket,
  'birth-details': PenLine,
  navigation: Compass,
  'account-signup': UserPlus,
  workspace: LayoutDashboard,
  'workspace-charts': Sparkles,
  'chart-settings': Settings2,
  'transit-overlay': Layers,
  'planet-table': Table2,
  timeline: Hourglass,
  'workspace-panels': PanelsTopLeft,
  analysis: BookOpen,
  today: CalendarCheck,
  relationship: Heart,
  career: Briefcase,
  dosha: ShieldAlert,
  matching: HeartHandshake,
  transit: Orbit,
  panchang: CalendarDays,
  muhurta: Clock,
  nakshatra: Moon,
  advanced: Waypoints,
  'lal-kitab': BookMarked,
  prashna: Target,
  numerology: Hash,
  'my-charts': Library,
  'sharing-export': Share2,
  clients: UsersRound,
  settings: UserCog,
  plans: Gem,
}

/** Icon for a guide topic, or a map icon for unknown ids. */
export function TopicIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = TOPIC_ICONS[id] ?? Map
  return <Icon size={size} aria-hidden />
}

/** Icon for an App Guide section. */
export function CategoryIcon({ category, size = 18 }: { category: HelpCategory; size?: number }) {
  const Icon = CATEGORY_ICONS[category]
  return <Icon size={size} aria-hidden />
}

