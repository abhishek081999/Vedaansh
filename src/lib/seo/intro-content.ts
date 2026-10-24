import type { SeoIntroProps, SeoRelatedLink } from '@/components/seo/SeoIntro.types'

function guideLink(slug: string, label: string): SeoRelatedLink {
  return { href: `/guides/${slug}`, label }
}

export const PANCHANG_SEO: SeoIntroProps = {
  ariaLabel: 'Daily Vedic Panchang — Vedaansh',
  h1: 'Free Daily Vedic Panchang — Tithi, Nakshatra, Yoga & Rahu Kalam',
  paragraphs: [
    'View today\'s Panchang with astronomical sunrise and sunset for your city. Vedaansh computes Tithi, Vara (weekday), Nakshatra, Yoga, Karana, Rahu Kalam, Gulika, Yamaganda, and Abhijit Muhurta using Swiss Ephemeris sidereal positions with Lahiri ayanamsha.',
    'Plan daily activities, temple visits, and spiritual practice with accurate Indian Standard Time transitions. Optional birth Nakshatra enables Tara Bala and Chandra Bala for personal auspiciousness.',
  ],
  h2: 'Panchang features on Vedaansh',
  bullets: [
    { label: 'Live Tithi & Nakshatra', desc: 'End times for each element based on true local sunrise' },
    { label: 'Rahu Kalam & Gulika', desc: 'Inauspicious windows to avoid for new beginnings' },
    { label: 'Hora table', desc: 'Planetary hour divisions for the day' },
    { label: 'Location-aware', desc: 'Atlas search for any city worldwide' },
  ],
  relatedLinks: [
    guideLink('what-is-panchang-tithi-nakshatra', 'What is Panchang?'),
    guideLink('rahu-kalam-explained', 'Rahu Kalam explained'),
    guideLink('chandra-bala-tara-bala', 'Chandra Bala & Tara Bala'),
    { href: '/guides', label: 'All guides' },
  ],
}

export const PANCHANG_CALENDAR_SEO: SeoIntroProps = {
  ariaLabel: 'Monthly Vedic Panchang Calendar — Vedaansh',
  h1: 'Monthly Panchang Calendar — Tithi & Nakshatra for Every Day',
  paragraphs: [
    'Browse a full month of Vedic Panchang at a glance. Each day shows Tithi, Nakshatra, Vara, Yoga, and Karana — ideal for planning weddings, travel, and festivals across the lunar month.',
    'Data is computed with Swiss Ephemeris for your chosen location and cached for fast loading.',
  ],
  h2: 'Calendar highlights',
  bullets: [
    { label: 'Month grid view', desc: 'Scan auspicious and inauspicious days quickly' },
    { label: 'Per-day detail', desc: 'Drill into transitions and timings' },
    { label: 'IST-aligned', desc: 'Built for Indian festival and muhurta planning' },
  ],
  relatedLinks: [
    guideLink('what-is-panchang-tithi-nakshatra', 'What is Panchang?'),
    guideLink('rahu-kalam-explained', 'Rahu Kalam explained'),
    { href: '/panchang', label: 'Daily Panchang' },
  ],

}

export const MUHURTA_SEO: SeoIntroProps = {
  ariaLabel: 'Vedic Muhurta Finder — Vedaansh',
  h1: 'Vedic Muhurta Finder — Auspicious Time Windows',
  paragraphs: [
    'Search auspicious Muhurta windows for marriage, travel, business, property, education, and more. Vedaansh scores each day by Yoga quality, Tithi, Nakshatra, weekday lord, and avoids Rahu Kalam and Gulika periods.',
    'Abhijit Muhurta and personalized Tara/Chandra Bala (with birth chart) help refine electional astrology decisions.',
  ],
  h2: 'Muhurta analysis includes',
  bullets: [
    { label: 'Activity-specific scoring', desc: 'Wedding, griha pravesh, travel, contracts, and more' },
    { label: 'Timeline view', desc: 'See favorable intervals across a date range' },
    { label: 'Classical rules', desc: 'Yoga, Tithi, and Nakshatra filters from Jyotish tradition' },
  ],
  relatedLinks: [
    guideLink('muhurta-for-marriage', 'Muhurta for marriage'),
    guideLink('what-is-panchang-tithi-nakshatra', 'Panchang basics'),
    guideLink('rahu-kalam-explained', 'Rahu Kalam'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const NAKSHATRA_SEO: SeoIntroProps = {
  ariaLabel: 'Nakshatra Analysis — Vedaansh',
  h1: 'Nakshatra Analysis — Birth Star, Compatibility & Remedies',
  paragraphs: [
    'Explore your birth Nakshatra (Janma Nakshatra) with Pada, ruling deity, planet, Gana, Nadi, and symbol. Vedaansh offers Navtara predictions (dasha decision windows, natal planet tara capacity), compatibility scoring, personalized remedies, transit activations, and Nakshatra-based Muhurta guidance.',
    'All calculations use Swiss Ephemeris sidereal longitudes with Lahiri ayanamsha for precision aligned with classical Jyotish.',
  ],
  h2: 'Nakshatra tools',
  bullets: [
    { label: 'Overview', desc: 'Birth star summary and introductory interpretation' },
    { label: 'Compatibility', desc: 'Navtara, Rajju, Vedha, and relationship scoring' },
    { label: 'Remedies', desc: 'Mantras, gemstones, colours, and deity worship' },
    { label: 'Transits & Muhurta', desc: 'Planetary activations and auspicious star timings' },
  ],
  relatedLinks: [
    guideLink('chandra-bala-tara-bala', 'Tara Bala & Chandra Bala'),
    guideLink('vimshottari-dasha-explained', 'Vimshottari Dasha'),
    guideLink('yogini-dasha-explained', 'Yogini Dasha'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const COMPARE_SEO: SeoIntroProps = {
  ariaLabel: 'Kundali Matching & Chart Comparison — Vedaansh',
  h1: 'Free Kundali Matching — Ashtakoot Guna Milan & Synastry',
  paragraphs: [
    'Compare two Vedic birth charts side by side with 36-point Ashtakoot (Guna Milan) scoring, Mangal Dosha and Nadi checks, and synastry overlays. Enter birth details for both partners — no saved chart required.',
    'Vedaansh uses Swiss Ephemeris sidereal positions with Lahiri ayanamsha for marriage compatibility analysis aligned with classical Jyotish matching traditions.',
  ],
  h2: 'Matching features',
  bullets: [
    { label: 'Ashtakoot Milan', desc: 'Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot & Nadi' },
    { label: 'Dosha analysis', desc: 'Mangal Dosha, Nadi, and Bhakoot conflict highlights' },
    { label: 'Dual charts', desc: 'Side-by-side D1, dasha, and panchang comparison' },
    { label: 'No login required', desc: 'Run compatibility checks instantly for free' },
  ],
  relatedLinks: [
    guideLink('ashtakoot-guna-milan-explained', 'Ashtakoot Guna Milan'),
    guideLink('mangal-dosha-explained', 'Mangal Dosha'),
    guideLink('what-is-navamsha-d9-chart', 'Navamsha (D9)'),
    guideLink('what-is-dashamsha-d10-chart', 'Dashamsha (D10)'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const JAIMINI_SEO: SeoIntroProps = {
  ariaLabel: 'Jaimini Astrology — Vedaansh',
  h1: 'Jaimini Jyotish — Chara Karakas, Chara Dasha & Arudha Padas',
  paragraphs: [
    'Dedicated Jaimini workspace on your Vedic chart: Atmakaraka, Chara Dasha tree, Jaimini aspects, Arudha Lagna, Karakamsha, and Argala analysis with interactive D1 and D9 views.',
    'Built for students and practitioners who use Jaimini techniques alongside Parashari Jyotish on the same Swiss Ephemeris chart foundation.',
  ],
  h2: 'Jaimini tools',
  bullets: [
    { label: 'Chara Karakas', desc: 'AK through DK with soul-architecture snapshot' },
    { label: 'Chara Dasha', desc: 'Sign-based dasha with forward and reverse sequences' },
    { label: 'Arudha Padas', desc: 'AL and house arudhas on chart overlays' },
    { label: 'Jaimini yogas', desc: 'Argala, gateways, and strength tables' },
  ],
  relatedLinks: [
    guideLink('jaimini-atmakaraka-explained', 'Atmakaraka explained'),
    guideLink('what-is-navamsha-d9-chart', 'Navamsha (D9)'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const PRASHNA_SEO: SeoIntroProps = {
  ariaLabel: 'Prashna Horary Astrology — Vedaansh',
  h1: 'Prashna Jyotish — Krishneeyam Kerala Horary Chart',
  paragraphs: [
    'Cast an instant Prashna (horary) chart for Yes/No, timing, lost articles, health, travel, and relationship questions. Vedaansh applies Krishneeyam rules from Sri Krishna Acharya with Aroodha-Udaya, Seershodaya, and classical Kerala horary logic.',
    'Freeze the chart at the moment of inquiry and receive structured verdicts, scorecards, and rule citations for transparent horary analysis.',
  ],
  h2: 'Prashna categories',
  bullets: [
    { label: 'Yes / No', desc: 'Sidhi Prashna verdicts with confidence scoring' },
    { label: 'Lost articles', desc: 'Nashta Prashna recovery direction and timing' },
    { label: 'When & Who', desc: 'Event timing and significator analysis' },
    { label: 'Health & travel', desc: 'Category-specific Krishneeyam chapters' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'What is a Kundali?'),
    guideLink('lahiri-ayanamsha-explained', 'Lahiri ayanamsha'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const VASTU_SEO: SeoIntroProps = {
  ariaLabel: 'Vastu Shastra from Birth Chart — Vedaansh',
  h1: 'Vedic Vastu — Planetary Directions & Dig Bala from Kundali',
  paragraphs: [
    'Map your birth chart to Vastu directions: planetary Dig Bala, directional strength, room recommendations, and Vastu Dosha indicators derived from graha placements and house lords.',
    'Personalized Astro-Vastu guidance connects Jyotish chart logic with practical space planning for home and workplace.',
  ],
  h2: 'Vastu analysis',
  bullets: [
    { label: 'Dig Bala map', desc: 'Directional strength of each graha' },
    { label: 'Room guidance', desc: 'Favorable zones for sleep, kitchen, study, and worship' },
    { label: 'Dosha alerts', desc: 'Directional imbalances tied to chart factors' },
    { label: 'Remedies', desc: 'Classical corrective suggestions per direction' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'Vedic birth chart'),
    guideLink('shadbala-explained', 'Shadbala strength'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const NUMEROLOGY_SEO: SeoIntroProps = {
  ariaLabel: 'Vedic Numerology — Vedaansh',
  h1: 'Vedic Numerology — Predictions, Remedies & Anka Jyotish Calculator',
  paragraphs: [
    'Calculate your Moolank, Bhagyank and Chaldean Namank with planetary rulers, then read life-area predictions, maturity number, pinnacles, challenges, number yogas and a full personalized remedy package from Anka Jyotish.',
    'Explore Vedic and Lo Shu grids, Kua directions, personal year and monthly forecasts, daily Anka muhurta, baby names, business matching, dasha↔number timing, marriage windows, brand/plate scores, nakshatra letter bridge, yantras, Vastu×Kua, and PDF export (Gold).',
  ],
  h2: 'Vedic numerology features',
  bullets: [
    { label: 'Predictions & dasha', desc: 'Life areas, pinnacles, yogas, and chart-linked Mahadasha number timing' },
    { label: 'Remedies & yantras', desc: 'Prioritized mantras, gemstones, colours, weekly plan and yantra packs' },
    { label: 'Advanced tools', desc: 'Baby names, business match, marriage timing, brand/plate, month calendar, Vastu×Kua' },
    { label: 'Core, grid & cycles', desc: 'Moolank, Bhagyank, Namank, Lo Shu, friendship modes, personal day and PDF report' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'Kundali basics'),
    { href: '/guides', label: 'All Jyotish guides' },
  ],

}

export const SBC_SEO: SeoIntroProps = {
  ariaLabel: 'Sarvatobhadra Chakra — Vedaansh',
  h1: 'Sarvatobhadra Chakra — 9×9 Vedic Transit Vedha Grid',
  paragraphs: [
    'Explore the classical Sarvatobhadra Chakra (SBC): a 9×9 nakshatra grid for transit Vedha analysis, life-area pulses, Muhurta assessment, and predictive timing used in traditional Jyotish.',
    'Track how transiting planets vedha your birth star, name star, and key life domains with row-column glow and category predictions.',
  ],
  h2: 'SBC features',
  bullets: [
    { label: 'Transit Vedha', desc: 'Live planetary vedha on the perimeter grid' },
    { label: 'Life areas', desc: 'Dhana, health, travel, and social network pulses' },
    { label: 'Muhurta tab', desc: 'Electional guidance from today\'s transit vedha' },
    { label: 'Prashna use cases', desc: 'Category predictions driven by grid interactions' },
  ],
  relatedLinks: [
    guideLink('vimshottari-dasha-explained', 'Vimshottari Dasha'),
    guideLink('what-is-panchang-tithi-nakshatra', 'Panchang'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const ACG_SEO: SeoIntroProps = {
  ariaLabel: 'Vedic Astrocartography — Vedaansh',
  h1: 'Vedic Astrocartography — Planetary Lines & Relocation Strength',
  paragraphs: [
    'Find power locations worldwide with Vedic Astrocartography (ACG): planetary angular lines, Parivartana zones, and relocation-chart strength derived from your birth Kundali.',
    'Vedaansh maps Swiss Ephemeris sidereal positions onto geography so you can compare cities for career, relationships, and spiritual growth with Jyotish locality logic.',
  ],
  h2: 'ACG tools',
  bullets: [
    { label: 'Planetary lines', desc: 'ASC, MC, DSC, and IC lines for each graha' },
    { label: 'Parivartana zones', desc: 'Mutual reception corridors between planets' },
    { label: 'Relocation strength', desc: 'How a city shifts house and digbala factors' },
    { label: 'Map exploration', desc: 'Compare candidate locations on an interactive map' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'Birth chart basics'),
    guideLink('lahiri-ayanamsha-explained', 'Lahiri ayanamsha'),
    { href: '/guides', label: 'All guides' },
  ],

}

export const ROADMAP_SEO: SeoIntroProps = {
  ariaLabel: 'Personal Transit Roadmap — Vedaansh',
  h1: 'Personal Vedic Transit Roadmap — Dasha & Graha Windows',
  paragraphs: [
    'Visualise upcoming planetary transits, Vimshottari Dasha periods, and key Jyotish timing windows on a personal timeline tied to your birth chart.',
    'Use the roadmap to plan decisions around Saturn, Jupiter, Rahu–Ketu, and dasha shifts with Swiss Ephemeris accuracy.',
  ],
  h2: 'Roadmap highlights',
  bullets: [
    { label: 'Transit timeline', desc: 'Major graha ingresses and aspects ahead' },
    { label: 'Dasha overlay', desc: 'Mahadasha and Antardasha on the same view' },
    { label: 'Sade Sati tracker', desc: 'Rising / peak / setting plus Kantaka and Ashtama from Moon' },
    { label: 'Aspects & multi-transit', desc: 'Ju/Sa/Ra/Ke gochara hits and double/triple windows' },
    { label: 'Bi-wheel + Moorthy + D9', desc: 'Natal/transit wheel, ingress moorthy, Navamsha gochar' },
    { label: 'Monthly calendar', desc: 'Personal gochar month grid with printable HTML (Gold+)' },
  ],
  relatedLinks: [
    guideLink('vimshottari-dasha-explained', 'Vimshottari Dasha'),
    guideLink('ashtakavarga-explained', 'Ashtakavarga'),
    { href: '/transit/sade-sati', label: 'Sade Sati tracker' },
    { href: '/transit/aspects', label: 'Aspects & multi-transit' },
    { href: '/transit/biwheel', label: 'Bi-wheel · Moorthy · D9' },
    { href: '/transit/calendar', label: 'Transit calendar' },
    { href: '/transit/scrubber', label: 'Live Transit scrubber' },
    { href: '/guides', label: 'All guides' },
  ],

}

export const ABOUT_SEO: SeoIntroProps = {
  ariaLabel: 'About Vedaansh',
  h1: 'About Vedaansh — Vedic Astrology Platform',
  paragraphs: [
    'Vedaansh is a free Vedic astrology (Jyotish) platform for birth charts, dashas, vargas, Panchang, muhurta, and professional tools — built with Swiss Ephemeris precision for students and practitioners.',
    'Our vision is accessible Jyotish education and community grounded in classical technique, guided by Guru Sameer Bhatnagar Acharya and created by Abhishek Kumar.',
  ],
  h2: 'What we stand for',
  bullets: [
    { label: 'Accuracy first', desc: 'Lahiri ayanamsha and arc-second Swiss Ephemeris' },
    { label: 'Free core tools', desc: 'Kundali, Panchang, and many calculators forever free' },
    { label: 'Classical lineage', desc: 'Parashari, Jaimini, KP, and Kerala Prashna methods' },
    { label: 'Community', desc: 'Platform for learning Vedic culture and Jyotish together' },
  ],
  relatedLinks: [
    { href: '/guides', label: 'Jyotish guides' },
    guideLink('lahiri-ayanamsha-explained', 'Our default ayanamsha'),
    { href: '/search', label: 'Search the site' },
  ],

}

export const SUPPORT_SEO: SeoIntroProps = {
  ariaLabel: 'Vedaansh Support',
  h1: 'Vedaansh Support — Billing, Account & Technical Help',
  paragraphs: [
    'Contact Vedaansh for billing questions, account access, chart library issues, and technical support. We respond to email requests during business hours India time.',
    'Include your account email and a short description of the issue so we can resolve subscription, export, or calculation problems quickly.',
  ],
  h2: 'How we can help',
  bullets: [
    { label: 'Billing & plans', desc: 'Gold/Platinum renewals, invoices, and upgrades' },
    { label: 'Account access', desc: 'Login, email verification, and password reset' },
    { label: 'Charts & exports', desc: 'Saved charts, PDF/HTML export, and sharing' },
    { label: 'Technical issues', desc: 'Calculation, Panchang location, or app bugs' },
  ],
  relatedLinks: [
    { href: '/guides', label: 'Guides' },
    { href: '/search', label: 'Search' },
    { href: '/pricing', label: 'Pricing' },
  ],

}

/** Homepage SSR section — HomeClient is ssr:false, so this is the crawlable body. */
export const HOME_SEO: SeoIntroProps = {
  ariaLabel: 'Vedaansh — Free Vedic Astrology Platform',
  titleAs: 'h1',
  h1: 'Vedaansh — Free Vedic Astrology & Jyotisha Calculator',
  paragraphs: [
    'Calculate your free Vedic birth chart (Kundali) instantly with arc-second accuracy via Swiss Ephemeris. No login required. Includes Vimshottari Dasha, all 41 varga charts, Navamsha (D9), Panchang, Arudha Lagna & Padas, Shadbala, Ashtakavarga and more.',
    'Vedaansh uses the Swiss Ephemeris library for planetary positions accurate to arc-seconds. Supports Lahiri (Chitrapaksha) ayanamsha. Trusted by astrologers and students across India and worldwide.',
  ],
  h2: 'What you get — completely free',
  bullets: [
    { label: 'Free Vedic Birth Chart (Kundali)', desc: 'Full Lagna, Moon & Sun charts with house lords' },
    { label: 'All 41 Varga (Divisional) Charts', desc: 'D1 through D60 via Swiss Ephemeris' },
    { label: 'Vimshottari & Yogini Dasha', desc: 'Antardasha & Pratyantardasha precision timelines' },
    { label: 'Daily Panchang', desc: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam' },
    { label: 'Ashtakavarga & Shadbala', desc: 'Bindus, Rekhas, planetary strength tables' },
    { label: 'Jaimini Astrology', desc: 'Atmakaraka, Chara Dasha, Arudha Lagna & Padas' },
    { label: 'KP Stellar Astrology', desc: 'Sub-lord system with cuspal interlinks' },
    { label: 'Kundali Matching (Synastry)', desc: '36-point Ashtakoot compatibility scoring' },
    { label: 'Today\'s Reading', desc: 'Personal daily reading from your Moon, running dasha, and live transits' },
    { label: 'Transits & Sade Sati', desc: 'Cosmic roadmap, aspects, bi-wheel, and transit calendar' },
    { label: 'Relationship & Marriage', desc: 'Marriage timing, Mars and Vivah readings, and Navamsha analysis (Gold)' },
    { label: 'Career & Profession', desc: 'Dashamsha-based career analysis with a step-by-step professional method (Gold)' },
  ],
  relatedLinks: [
    guideLink('free-vedic-birth-chart-kundali', 'Free Kundali guide'),
    guideLink('what-is-navamsha-d9-chart', 'Navamsha (D9)'),
    guideLink('what-is-dashamsha-d10-chart', 'Dashamsha (D10)'),
    guideLink('ashtakoot-guna-milan-explained', 'Kundali matching'),
    guideLink('vimshottari-dasha-explained', 'Vimshottari Dasha'),
    { href: '/guides', label: 'All guides' },
    { href: '/search', label: 'Search' },
  ],

}

/** FAQ copy shared between homepage JSON-LD and crawlable content. */
export const HOME_FAQ = [
  {
    q: 'Is Vedaansh birth chart calculator free?',
    a: 'Yes. Core Kundali calculation, Vimshottari Dasha, 16 Shodashavarga charts, Panchang, and many Jyotish tools are free forever with no credit card required.',
  },
  {
    q: 'How accurate is Vedaansh?',
    a: 'Vedaansh uses the Swiss Ephemeris library with Lahiri (Chitrapaksha) ayanamsha for arc-second accurate sidereal planetary positions.',
  },
  {
    q: 'Do I need an account to calculate my Kundali?',
    a: 'No. You can generate and explore a full Vedic birth chart instantly. A free account lets you save charts to your library.',
  },
  {
    q: 'What is included in Kundali matching on Vedaansh?',
    a: 'The compare tool offers 36-point Ashtakoot Guna Milan, dosha checks, and side-by-side chart views for two birth details.',
  },
  {
    q: 'Does Vedaansh cover marriage and career astrology?',
    a: 'Yes. The Relationship & Marriage and Career & Profession panels analyse your chart with divisional charts, dasha timing, and classical methods. Core scores are available on the free plan; the full readings are part of the Gold plan.',
  },
] as const

export const PRICING_FAQ = [
  {
    q: 'Is Free really free forever?',
    a: 'Yes. The Free tier is permanently free with no credit card required. We believe core Jyotish tools should be accessible to everyone.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. International cards also accepted.',
  },
  {
    q: 'Do you offer discounts?',
    a: 'Promotional and educational discounts may be offered occasionally. Contact support for current eligibility and terms.',
  },
] as const
