import type { SeoIntroProps } from '@/components/seo/SeoIntro'

export const PANCHANG_SEO: SeoIntroProps = {
  ariaLabel: 'Daily Vedic Panchang — Vedaansh',
  h1: 'Free Daily Vedic Panchang — Tithi, Nakshatra, Yoga & Rahu Kalam',
  paragraphs: [
    'View today\'s Panchang with astronomical sunrise and sunset for your city. Vedaansh computes Tithi, Vara (weekday), Nakshatra, Yoga, Karana, Rahu Kalam, Gulika, Yamaganda, and Abhijit Muhurta using Swiss Ephemeris sidereal positions with Lahiri ayanamsha.',
    'Plan daily activities, temple visits, and spiritual practice with accurate Indian Standard Time transitions. Optional birth Nakshatra enables Tārā Bala and Chandra Bala for personal auspiciousness.',
  ],
  h2: 'Panchang features on Vedaansh',
  bullets: [
    { label: 'Live Tithi & Nakshatra', desc: 'End times for each element based on true local sunrise' },
    { label: 'Rahu Kalam & Gulika', desc: 'Inauspicious windows to avoid for new beginnings' },
    { label: 'Hora table', desc: 'Planetary hour divisions for the day' },
    { label: 'Location-aware', desc: 'Atlas search for any city worldwide' },
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
}

export const MUHURTA_SEO: SeoIntroProps = {
  ariaLabel: 'Vedic Muhurta Finder — Vedaansh',
  h1: 'Vedic Muhurta Finder — Auspicious Time Windows',
  paragraphs: [
    'Search auspicious Muhurta windows for marriage, travel, business, property, education, and more. Vedaansh scores each day by Yoga quality, Tithi, Nakshatra, weekday lord, and avoids Rahu Kalam and Gulika periods.',
    'Abhijit Muhurta and personalized Tārā/Chandra Bala (with birth chart) help refine electional astrology decisions.',
  ],
  h2: 'Muhurta analysis includes',
  bullets: [
    { label: 'Activity-specific scoring', desc: 'Wedding, griha pravesh, travel, contracts, and more' },
    { label: 'Timeline view', desc: 'See favorable intervals across a date range' },
    { label: 'Classical rules', desc: 'Yoga, Tithi, and Nakshatra filters from Jyotish tradition' },
  ],
}

export const NAKSHATRA_SEO: SeoIntroProps = {
  ariaLabel: 'Nakshatra Analysis — Vedaansh',
  h1: 'Nakshatra Analysis — Birth Star, Compatibility & Remedies',
  paragraphs: [
    'Explore your birth Nakshatra (Janma Nakshatra) with Pada, ruling deity, planet, Gana, Nadi, and symbol. Vedaansh offers Navtara, compatibility scoring, personalized remedies, transit activations, and Nakshatra-based Muhurta guidance.',
    'All calculations use Swiss Ephemeris sidereal longitudes with Lahiri ayanamsha for precision aligned with classical Jyotish.',
  ],
  h2: 'Nakshatra tools',
  bullets: [
    { label: 'Overview', desc: 'Birth star summary and introductory interpretation' },
    { label: 'Compatibility', desc: 'Navtara, Rajju, Vedha, and relationship scoring' },
    { label: 'Remedies', desc: 'Mantras, gemstones, colours, and deity worship' },
    { label: 'Transits & Muhurta', desc: 'Planetary activations and auspicious star timings' },
  ],
}
