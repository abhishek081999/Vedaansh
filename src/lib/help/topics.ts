// ─────────────────────────────────────────────────────────────
//  src/lib/help/topics.ts
//  Help Center registry: which topics exist, their order, category,
//  screenshots and the app page each one links to.
//  All visible text lives in messages/{en,hi}/help.json under
//  help.topics.<id> (title, summary, sections, tips, shots).
//  Screenshots live in public/help/ — re-capture them when the UI changes.
// ─────────────────────────────────────────────────────────────

import shotSizes from './shotSizes.json'

export const HELP_CATEGORIES = ['start', 'workspace', 'chart', 'life', 'timing', 'advanced', 'account'] as const
export type HelpCategory = (typeof HELP_CATEGORIES)[number]

/** Lowest plan that unlocks the whole topic. 'mixed' = free core with paid depth. */
export type HelpPlan = 'free' | 'mixed' | 'gold' | 'platinum'

export interface HelpTopic {
  id: string
  category: HelpCategory
  /** Files in public/help/. Alt text comes from help.topics.<id>.shots[i]. */
  shots: string[]
  /** App page the topic's "Open" button goes to. */
  href: string
  plan: HelpPlan
}

export const HELP_TOPICS: HelpTopic[] = [
  // Getting started
  { id: 'getting-started', category: 'start', shots: ['workspace.jpg', 'header-controls.jpg', 'mobile.jpg'], href: '/', plan: 'free' },
  { id: 'birth-details', category: 'start', shots: ['birth-form.jpg'], href: '/?new=true', plan: 'free' },
  { id: 'navigation', category: 'start', shots: ['sidenav.jpg', 'menu-astrology.jpg'], href: '/', plan: 'free' },
  { id: 'account-signup', category: 'start', shots: ['sign-up.jpg'], href: '/signup', plan: 'free' },

  // The Workspace, where users spend most of their time — one topic per area of the screen
  { id: 'workspace', category: 'workspace', shots: ['workspace.jpg', 'ws-mobile.jpg'], href: '/', plan: 'free' },
  { id: 'workspace-charts', category: 'workspace', shots: ['ws-chara.jpg', 'ws-tooltip.jpg', 'ws-style-south.jpg', 'ws-style-circle.jpg', 'ws-style-sbc.jpg'], href: '/', plan: 'mixed' },
  { id: 'chart-settings', category: 'workspace', shots: ['ws-settings.jpg'], href: '/', plan: 'free' },
  { id: 'transit-overlay', category: 'workspace', shots: ['ws-transit-overlay.jpg'], href: '/', plan: 'free' },
  { id: 'planet-table', category: 'workspace', shots: ['ws-planets-wide.jpg', 'ws-more.jpg', 'ws-planets-dasha.jpg'], href: '/', plan: 'mixed' },
  { id: 'timeline', category: 'workspace', shots: ['ws-timeline.jpg', 'ws-dasha-drill.jpg'], href: '/', plan: 'mixed' },
  { id: 'workspace-panels', category: 'workspace', shots: ['ws-astro.jpg', 'ws-cosmic.jpg', 'ws-strength.jpg', 'ws-doshas.jpg', 'ws-transits.jpg', 'ws-remedies.jpg'], href: '/', plan: 'mixed' },

  // Your chart
  { id: 'analysis', category: 'chart', shots: ['sidenav.jpg'], href: '/', plan: 'mixed' },
  { id: 'today', category: 'chart', shots: ['today.jpg'], href: '/today', plan: 'mixed' },

  // Life areas
  { id: 'relationship', category: 'life', shots: ['relationship.jpg'], href: '/relationship', plan: 'mixed' },
  { id: 'career', category: 'life', shots: ['career.jpg'], href: '/career', plan: 'mixed' },
  { id: 'dosha', category: 'life', shots: ['dosha.jpg'], href: '/dosha', plan: 'mixed' },
  { id: 'matching', category: 'life', shots: ['compare.jpg'], href: '/compare', plan: 'mixed' },

  // Timing and calendars
  { id: 'transit', category: 'timing', shots: ['transit.jpg'], href: '/transit/scrubber', plan: 'mixed' },
  { id: 'panchang', category: 'timing', shots: ['panchang.jpg', 'panchang-calendar.jpg'], href: '/panchang', plan: 'free' },
  { id: 'muhurta', category: 'timing', shots: [], href: '/muhurta', plan: 'gold' },
  { id: 'nakshatra', category: 'timing', shots: ['nakshatra.jpg'], href: '/nakshatra/overview', plan: 'mixed' },

  // Advanced tools
  { id: 'advanced', category: 'advanced', shots: ['jaimini.jpg', 'nadi.jpg', 'vastu.jpg', 'acg.jpg', 'sbc.jpg'], href: '/jaimini', plan: 'mixed' },
  { id: 'prashna', category: 'advanced', shots: ['prashna.jpg'], href: '/prashna', plan: 'mixed' },
  { id: 'numerology', category: 'advanced', shots: ['numerology.jpg'], href: '/numerology', plan: 'mixed' },

  // Account, saving and plans
  { id: 'my-charts', category: 'account', shots: [], href: '/my/charts', plan: 'free' },
  { id: 'sharing-export', category: 'account', shots: ['workspace.jpg'], href: '/', plan: 'mixed' },
  { id: 'clients', category: 'account', shots: [], href: '/clients', plan: 'platinum' },
  { id: 'settings', category: 'account', shots: [], href: '/account', plan: 'free' },
  { id: 'plans', category: 'account', shots: ['pricing.jpg'], href: '/pricing', plan: 'free' },
]

export function getHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.id === id)
}

export function helpTopicsIn(category: HelpCategory): HelpTopic[] {
  return HELP_TOPICS.filter((t) => t.category === category)
}

/** Previous and next topic in reading order, for the article footer. */
export function helpNeighbours(id: string): { prev?: HelpTopic; next?: HelpTopic } {
  const i = HELP_TOPICS.findIndex((t) => t.id === id)
  if (i < 0) return {}
  return { prev: HELP_TOPICS[i - 1], next: HELP_TOPICS[i + 1] }
}

/** Pixel size of a screenshot in public/help/, from shotSizes.json (regenerate it when you re-capture). */
export function helpShotSize(file: string): { width: number; height: number } {
  return (shotSizes as Record<string, { width: number; height: number }>)[file] ?? { width: 1440, height: 900 }
}
