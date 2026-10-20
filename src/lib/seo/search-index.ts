/** Public site search corpus — tools, guides, and key pages. */
import { GUIDES } from '@/lib/seo/guides'

export type SearchDocType = 'tool' | 'guide' | 'page'

export type SearchDoc = {
  title: string
  description: string
  url: string
  type: SearchDocType
  keywords: string[]
}

const TOOL_DOCS: SearchDoc[] = [
  {
    title: 'Free Vedic Birth Chart (Kundali)',
    description: 'Calculate Kundali, Dasha, vargas, and strength tables with Swiss Ephemeris.',
    url: '/',
    type: 'tool',
    keywords: ['kundali', 'birth chart', 'horoscope', 'free chart', 'jyotish'],
  },
  {
    title: 'Daily Panchang',
    description: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and Hora for your city.',
    url: '/panchang',
    type: 'tool',
    keywords: ['panchang', 'tithi', 'rahu kalam', 'nakshatra today'],
  },
  {
    title: 'Panchang Calendar',
    description: 'Monthly Vedic calendar of Tithi and Nakshatra.',
    url: '/panchang/calendar',
    type: 'tool',
    keywords: ['vedic calendar', 'monthly panchang', 'ekadashi'],
  },
  {
    title: 'Muhurta Finder',
    description: 'Find auspicious time windows for weddings, travel, and events.',
    url: '/muhurta',
    type: 'tool',
    keywords: ['muhurta', 'shubh muhurat', 'auspicious time'],
  },
  {
    title: 'Kundali Matching',
    description: 'Ashtakoot Guna Milan plus married-life matching: Moon emotion, home, and the 7th lord.',
    url: '/compare',
    type: 'tool',
    keywords: ['kundali matching', 'ashtakoot', 'guna milan', 'marriage matching', 'kundali milan', 'married life'],
  },
  {
    title: 'Nakshatra Analysis',
    description: 'Birth star overview, compatibility, remedies, and muhurta.',
    url: '/nakshatra',
    type: 'tool',
    keywords: ['nakshatra', 'birth star', 'navtara'],
  },
  {
    title: 'Jaimini Astrology',
    description: 'Chara Karakas, Chara Dasha, Arudha, and Jaimini tools.',
    url: '/jaimini',
    type: 'tool',
    keywords: ['jaimini', 'chara dasha', 'atmakaraka', 'arudha'],
  },
  {
    title: 'Prashna (Horary)',
    description: 'Krishneeyam Kerala Prashna for yes/no and timing questions.',
    url: '/prashna',
    type: 'tool',
    keywords: ['prashna', 'horary', 'krishneeyam'],
  },
  {
    title: 'Vedic Numerology',
    description: 'Anka Jyotish predictions, remedies, and name numbers.',
    url: '/numerology',
    type: 'tool',
    keywords: ['numerology', 'moolank', 'bhagyank', 'anka'],
  },
  {
    title: 'Astrocartography',
    description: 'Vedic locality lines and relocation strength.',
    url: '/acg',
    type: 'tool',
    keywords: ['astrocartography', 'acg', 'relocation'],
  },
  {
    title: 'Sarvatobhadra Chakra',
    description: '9×9 transit Vedha grid for timing and muhurta.',
    url: '/sbc',
    type: 'tool',
    keywords: ['sarvatobhadra', 'sbc', 'vedha'],
  },
  {
    title: 'Astro Vastu',
    description: 'Directional strength and Vastu guidance from your Kundali.',
    url: '/vastu',
    type: 'tool',
    keywords: ['vastu', 'dig bala', 'astro vastu'],
  },
  {
    title: 'Transit Hub',
    description: 'Cosmic Roadmap with Vimshottari dasha overlay and live gochar scrubber.',
    url: '/transit/roadmap',
    type: 'tool',
    keywords: ['transit', 'roadmap', 'gochar', 'dasha', 'forecast'],
  },
  {
    title: 'Pricing',
    description: 'Free, Gold, and Platinum plans for Vedaansh.',
    url: '/pricing',
    type: 'page',
    keywords: ['pricing', 'subscription', 'gold', 'platinum'],
  },
  {
    title: 'About Vedaansh',
    description: 'Vision, team, and Guru behind the platform.',
    url: '/about',
    type: 'page',
    keywords: ['about', 'vedaansh', 'team'],
  },
  {
    title: 'Support',
    description: 'Billing, account, and technical help.',
    url: '/support',
    type: 'page',
    keywords: ['support', 'help', 'contact', 'billing'],
  },
  {
    title: 'Jyotish Guides',
    description: 'Educational articles on Kundali, Dasha, Panchang, and matching.',
    url: '/guides',
    type: 'page',
    keywords: ['guides', 'learn', 'blog', 'articles'],
  },
]

function guideDocs(): SearchDoc[] {
  return GUIDES.map((g) => ({
    title: g.title,
    description: g.description,
    url: `/guides/${g.slug}`,
    type: 'guide' as const,
    keywords: g.keywords,
  }))
}

export function getSearchCorpus(): SearchDoc[] {
  return [...TOOL_DOCS, ...guideDocs()]
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9\u0900-\u097f]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

/** Ranked search over the static corpus. Empty query → empty results. */
export function searchSite(query: string, limit = 24): SearchDoc[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const scored = getSearchCorpus().map((doc) => {
    const hay = `${doc.title} ${doc.description} ${doc.keywords.join(' ')}`.toLowerCase()
    let score = 0
    for (const t of tokens) {
      if (doc.title.toLowerCase().includes(t)) score += 8
      if (doc.keywords.some((k) => k.toLowerCase().includes(t))) score += 5
      if (hay.includes(t)) score += 2
    }
    return { doc, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit)
    .map((s) => s.doc)
}
