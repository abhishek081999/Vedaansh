/** Long-tail Jyotish guides — educational pages that link into product tools. */

export type GuideFaq = { q: string; a: string }

export type GuideSection = {
  heading: string
  paragraphs: string[]
}

export type Guide = {
  slug: string
  title: string
  description: string
  keywords: string[]
  publishedAt: string
  updatedAt: string
  toolCta: { href: string; label: string }
  /** Other guide slugs for internal linking. */
  relatedSlugs?: string[]
  intro: string[]
  sections: GuideSection[]
  faqs: GuideFaq[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'free-vedic-birth-chart-kundali',
    title: 'Free Vedic Birth Chart (Kundali) — What It Shows',
    description:
      'Learn what a Vedic birth chart (Kundali) contains: Lagna, Grahas, Bhavas, Nakshatra, and how to calculate yours free on Vedaansh with Swiss Ephemeris.',
    keywords: [
      'free kundali',
      'vedic birth chart',
      'free birth chart calculator',
      'kundali online',
      'jyotish chart',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Calculate free Kundali' },
    relatedSlugs: [
      'what-is-navamsha-d9-chart',
      'vimshottari-dasha-explained',
      'what-is-lagna-ascendant',
      'lahiri-ayanamsha-explained',
    ],
    intro: [
      'A Vedic birth chart (Kundali / Janma Kundali) maps the sky at your exact birth time from your birth place. Unlike tropical Western charts, Jyotish uses the sidereal zodiac — usually Lahiri (Chitrapaksha) ayanamsha — so planet signs match classical Indian texts.',
      'On Vedaansh you can generate a free Kundali with Lagna, planetary longitudes, houses, Nakshatra, Vimshottari Dasha, and divisional charts without creating an account.',
    ],
    sections: [
      {
        heading: 'Core parts of a Kundali',
        paragraphs: [
          'Lagna (Ascendant) is the sign rising on the eastern horizon at birth. It sets the first house and frames the entire chart. The Moon (Chandra) shows mind and timing through Nakshatra and dashas. The Sun shows soul direction and vitality.',
          'The nine Grahas (Sun through Ketu) sit in Rashis (signs) and Bhavas (houses). Classical analysis reads dignity, aspects, conjunctions, and house lordship together — not one planet in isolation.',
        ],
      },
      {
        heading: 'Why birth time and place matter',
        paragraphs: [
          'Even a few minutes can change Lagna or house cusps. Accurate latitude, longitude, and timezone (or IST offset for Indian births) are required for Swiss Ephemeris precision.',
          'If the birth time is uncertain, note that Lagna-sensitive techniques (houses, some yogas) are less reliable until the time is rectified.',
        ],
      },
      {
        heading: 'What to explore after the D1 chart',
        paragraphs: [
          'Most practitioners next open Navamsha (D9), Vimshottari Dasha, Shadbala, and Ashtakavarga. Vedaansh calculates these from the same ephemeris session so timings stay consistent.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is a free online Kundali accurate?',
        a: 'Accuracy depends on ephemeris quality and birth data. Vedaansh uses Swiss Ephemeris with Lahiri ayanamsha for arc-second sidereal positions when date, time, and place are correct.',
      },
      {
        q: 'Do I need to sign up to calculate my chart?',
        a: 'No. You can calculate instantly on the home page. A free account only helps if you want to save charts to My Charts.',
      },
    ],
  },
  {
    slug: 'what-is-navamsha-d9-chart',
    title: 'What Is Navamsha (D9)? Divisional Chart Explained',
    description:
      'Navamsha (D9) is the most important divisional chart in Vedic astrology for marriage, dharma, and planet strength. Learn how D9 works and how to read it with your D1.',
    keywords: [
      'navamsha',
      'D9 chart',
      'navamsa meaning',
      'divisional chart vedic',
      'd9 astrology',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Open chart & Navamsha' },
    relatedSlugs: [
      'free-vedic-birth-chart-kundali',
      'ashtakoot-guna-milan-explained',
      'mangal-dosha-explained',
      'jaimini-atmakaraka-explained',
    ],
    intro: [
      'Navamsha (D9 / Navamsa) divides each 30° Rashi into nine 3°20′ segments. It is the primary varga for marriage, spouse, dharma, and refining how strong a planet truly is in the birth chart.',
      'Parashari practice almost always reads D1 with D9: a planet that looks strong in D1 but weak in D9 often under-delivers; the reverse can show delayed but solid results.',
    ],
    sections: [
      {
        heading: 'How Navamsha is calculated',
        paragraphs: [
          'Each sign’s nine navamshas follow a fixed sequence from the sign’s start. Movable, fixed, and dual signs begin the count from different starting Rashis — the Swiss Ephemeris / standard Jyotish mapping Vedaansh uses matches classical tables.',
          'Your D9 Lagna is independent of D1 Lagna. That shift is why two people with similar D1 charts can have very different marriage and late-life patterns.',
        ],
      },
      {
        heading: 'What to look for in D9',
        paragraphs: [
          'Check the 7th house and its lord for marriage themes, Venus (and Jupiter for husbands in traditional texts) for relationship quality, and whether D1 yogas are confirmed or cancelled in D9.',
          'Atmakaraka and Karakamsha analysis (Jaimini) also lean heavily on Navamsha. Vedaansh’s Jaimini workspace uses the same chart foundation.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Navamsha only for marriage?',
        a: 'Marriage is the most popular use, but D9 also shows dharma, spiritual maturity, and how planetary promises fructify over time.',
      },
      {
        q: 'Should I read D9 without D1?',
        a: 'No. Treat D9 as a microscope on D1. Start from the birth chart, then confirm strength and relationship themes in Navamsha.',
      },
    ],
  },
  {
    slug: 'ashtakoot-guna-milan-explained',
    title: 'Ashtakoot Guna Milan Explained — Kundali Matching',
    description:
      'Understand 36-point Ashtakoot (Guna Milan) for Vedic marriage matching: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi — plus how to run a free match on Vedaansh.',
    keywords: [
      'ashtakoot',
      'guna milan',
      'kundali matching',
      '36 guna',
      'free kundali matching',
      'nadi dosha',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/compare', label: 'Free Kundali matching' },
    relatedSlugs: [
      'mangal-dosha-explained',
      'what-is-navamsha-d9-chart',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Ashtakoot Guna Milan scores compatibility between two Moon charts across eight kootas for a maximum of 36 points. Families in North India often treat ~18+ as a baseline, but classical advice never relies on the score alone.',
      'Vedaansh’s compare tool calculates Ashtakoot, highlights doshas such as Nadi and Mangal considerations, and shows both charts side by side — free, no login required.',
    ],
    sections: [
      {
        heading: 'The eight kootas (36 points)',
        paragraphs: [
          'Varna (1), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5), Gana (6), Bhakoot (7), and Nadi (8) total 36. Nadi and Bhakoot carry heavy weight; a zero there is traditionally scrutinised even if the total looks high.',
          'Moon Nakshatra and Rashi drive most of the table. Accurate birth data for both partners matters — wrong Moon longitudes change the entire Milan.',
        ],
      },
      {
        heading: 'Beyond the number',
        paragraphs: [
          'Good matching also reviews Mangal Dosha, overall chart harmony, dasha periods at marriage, and practical factors. A mid-20s score with clean Nadi can be healthier than a high score with severe afflictions elsewhere.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a good Ashtakoot score?',
        a: 'Many communities use 18 out of 36 as a soft minimum. Prefer interpreting Nadi, Bhakoot, and Gana carefully rather than chasing the highest total.',
      },
      {
        q: 'Can I match Kundalis online for free?',
        a: 'Yes. Use Vedaansh Compare to run Ashtakoot Guna Milan and related checks without creating an account.',
      },
    ],
  },
  {
    slug: 'vimshottari-dasha-explained',
    title: 'Vimshottari Dasha Explained — Timing in Vedic Astrology',
    description:
      'Vimshottari Dasha is the main 120-year planetary period system in Jyotish. Learn Mahadasha, Antardasha, and how to read your timeline on Vedaansh.',
    keywords: [
      'vimshottari dasha',
      'mahadasha',
      'antardasha',
      'vedic dasha',
      'dasha calculator',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'See your Dasha tree' },
    relatedSlugs: [
      'yogini-dasha-explained',
      'free-vedic-birth-chart-kundali',
      'shadbala-explained',
    ],
    intro: [
      'Vimshottari Dasha sequences planetary periods from the Moon’s Nakshatra at birth across a 120-year cycle. It is the default predictive clock for most Parashari practice in India.',
      'Each Mahadasha (major period) contains Antardashas (sub-periods) and finer levels. Results depend on the dasha lord’s strength, house ownership, and current transits — not the planet’s name alone.',
    ],
    sections: [
      {
        heading: 'How the starting dasha is fixed',
        paragraphs: [
          'The Moon’s Nakshatra determines which planet’s Mahadasha is running at birth and how much of that period remains. Accurate Moon longitude is therefore critical.',
          'Vedaansh computes the full tree from Swiss Ephemeris sidereal positions so Mahadasha and Antardasha dates stay aligned with your Kundali.',
        ],
      },
      {
        heading: 'How to use dashas practically',
        paragraphs: [
          'Note which houses the dasha lord rules and occupies, whether it is benefically or malefically placed, and which Antardasha is active for near-term events.',
          'Pair dashas with transits (especially Saturn and Jupiter) and with Navamsha confirmation for major life themes.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Vimshottari the only dasha system?',
        a: 'No. Yogini, Chara (Jaimini), and others exist. Vimshottari remains the most widely used for natal timing in mainstream Jyotish.',
      },
      {
        q: 'Can I see Antardasha dates free?',
        a: 'Yes. Generate your chart on Vedaansh and open the Dasha tree for Mahadasha and Antardasha timelines.',
      },
    ],
  },
  {
    slug: 'what-is-panchang-tithi-nakshatra',
    title: 'What Is Panchang? Tithi, Nakshatra, Yoga & Karana',
    description:
      'Panchang is the five-limb Vedic calendar: Tithi, Vara, Nakshatra, Yoga, and Karana. Learn each limb and how to use today’s Panchang on Vedaansh.',
    keywords: [
      'panchang',
      'what is tithi',
      'nakshatra today',
      'vedic calendar',
      'daily panchang',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/panchang', label: 'Open today’s Panchang' },
    relatedSlugs: [
      'rahu-kalam-explained',
      'muhurta-for-marriage',
      'chandra-bala-tara-bala',
    ],
    intro: [
      'Panchang (pañcāṅga) means “five limbs”: Tithi (lunar day), Vara (weekday), Nakshatra (Moon’s star), Yoga, and Karana. Together they describe the quality of a day for ritual, travel, and muhurta.',
      'Because Tithi and Nakshatra change with the Moon’s motion, a good Panchang is location-aware (sunrise/sunset) and ephemeris-based — not a static printed table for every city.',
    ],
    sections: [
      {
        heading: 'The five limbs in brief',
        paragraphs: [
          'Tithi is the angular distance between Sun and Moon in 12° steps (30 tithis a lunar month). Nakshatra is the Moon’s 13°20′ star mansion. Vara is the weekday lord. Yoga and Karana refine auspiciousness for electional work.',
          'Rahu Kalam, Gulika, and Yamaganda are popular weekday-based inauspicious windows often shown beside the Panchang even though they are not part of the classical five limbs.',
        ],
      },
      {
        heading: 'Using Panchang with your chart',
        paragraphs: [
          'Personal Tara Bala and Chandra Bala compare today’s Moon Nakshatra to your birth star. Vedaansh can factor birth Nakshatra when you have a chart loaded.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is online Panchang the same for all cities?',
        a: 'Tithi/Nakshatra end times are astronomical; sunrise-linked rituals and some listings change by location. Pick your city on Vedaansh for local sunrise and Rahu Kalam.',
      },
      {
        q: 'Where can I see a monthly Vedic calendar?',
        a: 'Use the Panchang Calendar on Vedaansh to scan Tithi and Nakshatra across the month.',
      },
    ],
  },
  {
    slug: 'rahu-kalam-explained',
    title: 'Rahu Kalam Explained — Inauspicious Time of Day',
    description:
      'Rahu Kalam is a weekday-based inauspicious period used across India for avoiding new beginnings. Learn how it is calculated and check today’s window on Vedaansh.',
    keywords: [
      'rahu kalam',
      'rahu kaalam',
      'inauspicious time',
      'rahu kalam today',
      'yamaganda gulika',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/panchang', label: 'Check Rahu Kalam today' },
    relatedSlugs: [
      'what-is-panchang-tithi-nakshatra',
      'muhurta-for-marriage',
    ],
    intro: [
      'Rahu Kalam (Rahu Kaal) is a 1½-hour-style segment of the daytime considered unfit for starting auspicious activities. It rotates by weekday and is measured between local sunrise and sunset.',
      'It is a folk-electional convention widely used in India, often listed with Yamaganda and Gulika. For formal muhurta, classical Panchang limbs still take priority.',
    ],
    sections: [
      {
        heading: 'How Rahu Kalam is timed',
        paragraphs: [
          'Daytime (sunrise to sunset) is divided into eight parts. Each weekday assigns Rahu to a different eighth. Because sunrise/sunset change by city and season, “Rahu Kalam today” must be local.',
          'Vedaansh computes Rahu Kalam, Gulika, and Yamaganda from astronomical sunrise/sunset for your selected location.',
        ],
      },
      {
        heading: 'When people avoid it',
        paragraphs: [
          'Commonly avoided: new business openings, weddings, travel starts, and property registrations. Routine work and emergencies are not usually paused for Rahu Kalam.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Rahu Kalam the same in every city?',
        a: 'No. It depends on local sunrise and sunset. Always use your city on a location-aware Panchang.',
      },
      {
        q: 'Is Rahu Kalam part of classical Panchang?',
        a: 'The five limbs are Tithi, Vara, Nakshatra, Yoga, and Karana. Rahu Kalam is a popular additional weekday window shown alongside Panchang in modern almanacs.',
      },
    ],
  },
  {
    slug: 'mangal-dosha-explained',
    title: 'Mangal Dosha Explained — Kuja Dosha in Kundali Matching',
    description:
      'What Mangal Dosha (Kuja Dosha) means in Vedic astrology, common cancellation rules, and how it is checked in free Kundali matching on Vedaansh.',
    keywords: [
      'mangal dosha',
      'kuja dosha',
      'manglik',
      'mars dosha marriage',
      'mangal dosha cancellation',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/compare', label: 'Check Mangal Dosha (free match)' },
    relatedSlugs: [
      'ashtakoot-guna-milan-explained',
      'what-is-navamsha-d9-chart',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Mangal Dosha (Kuja Dosha) is assessed mainly from Mars in certain houses from Lagna, Moon, or Venus — traditionally linked to friction in marriage if unmatched. Definitions vary by school; always read the full chart, not a checkbox alone.',
      'Vedaansh Compare highlights Mangal-related checks alongside Ashtakoot so you can see both partners’ charts together.',
    ],
    sections: [
      {
        heading: 'Where Mars is counted',
        paragraphs: [
          'Common lists include Mars in the 1st, 2nd, 4th, 7th, 8th, or 12th from Lagna (and often from Moon). Some traditions also check from Venus. Exact house sets differ by lineage.',
          'Because Lagna depends on birth time, uncertain times make Mangal rulings unreliable until the chart is rectified.',
        ],
      },
      {
        heading: 'Cancellations and pairing',
        paragraphs: [
          'Many texts describe cancellations — for example when both partners are Manglik, or when Mars is strong/benefically aspected in specific ways. Treat viral “exceptions” carefully; confirm with a classical source or qualified Jyotishi.',
          'Nadi, Bhakoot, and overall 7th-house / D9 strength often matter as much as a Mangal flag.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Mangal Dosha mean marriage is impossible?',
        a: 'No. It is one factor among many. Matching charts, dashas, and Navamsha often outweigh a single Mars placement.',
      },
      {
        q: 'Can I check Manglik status online free?',
        a: 'Yes. Run both birth details in Vedaansh Kundali Matching to review Mangal-related highlights with Ashtakoot.',
      },
    ],
  },
  {
    slug: 'what-is-lagna-ascendant',
    title: 'What Is Lagna (Ascendant) in Vedic Astrology?',
    description:
      'Lagna is the rising sign at birth and sets the house structure of your Kundali. Learn why birth time matters and how to see your Lagna free on Vedaansh.',
    keywords: [
      'lagna',
      'ascendant vedic',
      'rising sign kundali',
      'lagna calculator',
      'what is lagna',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Find your Lagna' },
    relatedSlugs: [
      'free-vedic-birth-chart-kundali',
      'lahiri-ayanamsha-explained',
      'what-is-navamsha-d9-chart',
    ],
    intro: [
      'Lagna (Ascendant) is the Rashi on the eastern horizon at your birth moment. It becomes Bhava 1 and orients every house in the chart — career, relationships, and health topics all count from Lagna unless you deliberately shift the reference (e.g. Chandra Lagna).',
      'A few minutes of birth-time error can flip Lagna at a cusp. Accurate place and timezone are as important as the clock time.',
    ],
    sections: [
      {
        heading: 'Lagna vs Moon vs Sun',
        paragraphs: [
          'Sun shows vitality and public role; Moon shows mind and dasha seed; Lagna shows the embodied life path and house lords. Classical Parashari reading weaves all three.',
          'When birth time is unknown, Moon chart techniques help, but house-based yogas from Lagna should be treated cautiously.',
        ],
      },
      {
        heading: 'Seeing Lagna on Vedaansh',
        paragraphs: [
          'Enter birth details on the home calculator. The D1 chart shows Lagna sign and degree with Swiss Ephemeris sidereal positions (Lahiri by default).',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Vedic Lagna the same as Western Ascendant?',
        a: 'Both are rising signs, but Vedic charts use the sidereal zodiac (ayanamsha), so the Lagna Rashi can differ from a tropical Ascendant.',
      },
      {
        q: 'Why does my Lagna change with a small time shift?',
        a: 'Near a sign cusp, Lagna can move into the next Rashi within minutes. Prefer hospital records or verified family timing.',
      },
    ],
  },
  {
    slug: 'shadbala-explained',
    title: 'Shadbala Explained — Sixfold Planetary Strength',
    description:
      'Shadbala measures graha strength through six balas (Sthana, Dig, Kala, Cheshta, Naisargika, Drik). Learn what the scores mean and where to read them on Vedaansh.',
    keywords: [
      'shadbala',
      'planetary strength',
      'sthana bala',
      'dig bala',
      'vedic strength table',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Open Shadbala on your chart' },
    relatedSlugs: [
      'ashtakavarga-explained',
      'vimshottari-dasha-explained',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Shadbala is a quantitative strength model from classical Jyotish: six component scores summed (often in Rupas/Virupas) to judge how well a planet can deliver its promises.',
      'High Shadbala does not guarantee good results if the planet owns dusthanas or is poorly placed for a topic — use it as capacity, then read house ownership and dashas.',
    ],
    sections: [
      {
        heading: 'The six balas',
        paragraphs: [
          'Sthana (positional), Dig (directional), Kala (temporal), Cheshta (motional), Naisargika (natural), and Drik (aspectual) each add a piece of the total. Software like Vedaansh tabulates them from ephemeris data.',
          'Compare planets relatively in the same chart rather than chasing a universal “good number” from the internet.',
        ],
      },
      {
        heading: 'Pair with Ashtakavarga and dashas',
        paragraphs: [
          'Ashtakavarga shows transit and sign support; Shadbala shows inherent muscle; dashas show when that muscle is activated.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Shadbala free on Vedaansh?',
        a: 'Core chart tools including strength tables are available from the free Kundali calculator after you generate a chart.',
      },
      {
        q: 'Can a malefic have high Shadbala?',
        a: 'Yes. Strength means capacity to act — for malefics that can mean strong challenging results as well as constructive ones, depending on houses.',
      },
    ],
  },
  {
    slug: 'ashtakavarga-explained',
    title: 'Ashtakavarga Explained — Bindus & Transit Strength',
    description:
      'Ashtakavarga scores signs with bindus from eight contributors. Learn Bhinnashtakavarga, Sarvashtakavarga, and how Vedaansh shows the grid on your chart.',
    keywords: [
      'ashtakavarga',
      'sarvashtakavarga',
      'bindu',
      'transit ashtakavarga',
      'sav astrology',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Open Ashtakavarga grid' },
    relatedSlugs: [
      'shadbala-explained',
      'vimshottari-dasha-explained',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Ashtakavarga assigns bindus (points) to Rashis from the Lagna and seven planets (classical eight contributors). Bhinnashtakavarga is per planet; Sarvashtakavarga (SAV) sums them for an overall sign score.',
      'Transits through high-bindu signs are often described as more supportive; low-bindu signs need more caution — always with dasha context.',
    ],
    sections: [
      {
        heading: 'Reading the grid',
        paragraphs: [
          'Look at SAV totals by sign for broad zones, then BAV of the dasha lord or transit planet for finer judgment. Rekhas (zero-point marks in some presentations) flag weak cells.',
          'Vedaansh renders Ashtakavarga from the same Swiss Ephemeris chart session as your D1.',
        ],
      },
      {
        heading: 'Not a standalone verdict',
        paragraphs: [
          'High SAV does not cancel a bad dasha lord placement. Use Ashtakavarga as a support layer for transit and timing questions.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a good Sarvashtakavarga score?',
        a: 'Relative comparison inside one chart matters more than a fixed public cutoff. Signs above your chart’s average are generally stronger transit zones.',
      },
      {
        q: 'Is Ashtakavarga only for transits?',
        a: 'Transits are the popular use, but bindus also inform house and planet evaluation in classical practice.',
      },
    ],
  },
  {
    slug: 'yogini-dasha-explained',
    title: 'Yogini Dasha Explained — 36-Year Timing System',
    description:
      'Yogini Dasha is a Nakshatra-based 36-year cycle used alongside Vimshottari. Learn the eight Yoginis and where to explore timing on Vedaansh.',
    keywords: [
      'yogini dasha',
      'yogini dasha calculator',
      'mangala pingala',
      'vedic dasha systems',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Explore dashas on your chart' },
    relatedSlugs: [
      'vimshottari-dasha-explained',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Yogini Dasha runs eight named Yoginis across a 36-year cycle, seeded from the Moon’s Nakshatra. Many North Indian practitioners cross-check it with Vimshottari for event timing.',
      'Like other dashas, results follow the Yogini’s planetary associations and how those grahas sit in your Kundali — not the name alone.',
    ],
    sections: [
      {
        heading: 'Eight Yoginis',
        paragraphs: [
          'Classical lists include Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, and Sankata, each linked to planets and fixed durations that sum to 36 years.',
          'Vedaansh chart tools expose Yogini alongside Vimshottari so you can compare periods on the same birth data.',
        ],
      },
      {
        heading: 'When to prefer Yogini',
        paragraphs: [
          'Use it as a second clock for health, travel, and short-cycle questions, while keeping Vimshottari as the primary life-timeline for most Parashari work.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Yogini Dasha more accurate than Vimshottari?',
        a: 'Neither replaces the other. Accuracy comes from correct birth data and disciplined interpretation of the planet behind the period.',
      },
      {
        q: 'Does Yogini use the same Moon Nakshatra as Vimshottari?',
        a: 'Yes — both are Nakshatra-based. Wrong Moon longitude breaks both systems.',
      },
    ],
  },
  {
    slug: 'muhurta-for-marriage',
    title: 'Muhurta for Marriage — Choosing an Auspicious Wedding Time',
    description:
      'How Vedic muhurta for marriage uses Tithi, Nakshatra, Yoga, and avoidance of Rahu Kalam. Find candidate windows with Vedaansh Muhurta Finder.',
    keywords: [
      'marriage muhurta',
      'wedding muhurat',
      'shubh muhurta vivah',
      'auspicious wedding date',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/muhurta', label: 'Open Muhurta Finder' },
    relatedSlugs: [
      'what-is-panchang-tithi-nakshatra',
      'rahu-kalam-explained',
      'ashtakoot-guna-milan-explained',
      'chandra-bala-tara-bala',
    ],
    intro: [
      'Marriage muhurta (vivaha muhurta) elects a clock time when Panchang factors favour beginnings: supportive Tithi and Nakshatra, acceptable Yoga/Karana, and avoidance of classical inauspicious windows such as Rahu Kalam.',
      'Matching (Ashtakoot) answers “who”; muhurta answers “when”. Both matter in traditional planning.',
    ],
    sections: [
      {
        heading: 'What muhurta software scores',
        paragraphs: [
          'Vedaansh Muhurta Finder scores date ranges by activity type (including marriage), blending Yoga quality, Tithi, Nakshatra, weekday lords, and filters for Rahu Kalam / Gulika.',
          'Personal Tara/Chandra Bala refine the day when a birth Nakshatra is available.',
        ],
      },
      {
        heading: 'Practical constraints',
        paragraphs: [
          'Venue bookings and family calendars often limit choices. Prefer the best available window that still respects hard filters (e.g. avoiding severe inauspicious limbs) over waiting forever for a “perfect” score.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Muhurta Finder free?',
        a: 'Muhurta is a Gold-tier tool on Vedaansh. Core Panchang and matching remain available on lower tiers — check Pricing for current gates.',
      },
      {
        q: 'Should muhurta ignore Ashtakoot?',
        a: 'No. Complete matching first, then elect a wedding time. A great muhurta does not fix a severely mismatched chart pair.',
      },
    ],
  },
  {
    slug: 'chandra-bala-tara-bala',
    title: 'Chandra Bala & Tara Bala — Personal Day Strength',
    description:
      'Chandra Bala and Tara Bala compare today’s Moon to your birth star for personal auspiciousness. Learn the idea and check days on Vedaansh Panchang.',
    keywords: [
      'chandra bala',
      'tara bala',
      'navtara',
      'personal panchang',
      'birth star today',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/panchang', label: 'Open Panchang' },
    relatedSlugs: [
      'what-is-panchang-tithi-nakshatra',
      'muhurta-for-marriage',
      'free-vedic-birth-chart-kundali',
    ],
    intro: [
      'Tara Bala groups the 27 Nakshatras into nine taras from your Janma Nakshatra (Navtara). Some taras are supportive for travel or beginnings; others counsel caution.',
      'Chandra Bala looks at the Moon’s condition/relation for the day relative to your chart. Together they personalise a generic Panchang.',
    ],
    sections: [
      {
        heading: 'Why birth Nakshatra is required',
        paragraphs: [
          'Without your Moon Nakshatra, a Panchang is only general. Load or enter birth details so Vedaansh can compute personal layers on top of city sunrise data.',
        ],
      },
      {
        heading: 'Use with muhurta',
        paragraphs: [
          'Electional work often prefers days where Tara and Chandra support the activity, then filters by Tithi/Nakshatra and Rahu Kalam.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Tara Bala the same as Ashtakoot Tara koota?',
        a: 'Related idea (Nakshatra counting) but different use: Ashtakoot Tara scores couple compatibility; daily Tara Bala rates today’s star for you.',
      },
      {
        q: 'Can I see Navtara on Vedaansh?',
        a: 'Yes — Nakshatra tools and Panchang personalisation use birth-star logic. Start from Nakshatra Analysis or a saved chart.',
      },
    ],
  },
  {
    slug: 'lahiri-ayanamsha-explained',
    title: 'Lahiri Ayanamsha Explained — Sidereal Zodiac in Jyotish',
    description:
      'Lahiri (Chitrapaksha) ayanamsha converts tropical longitudes to the sidereal zodiac used in most Indian Kundalis. Learn why Vedaansh defaults to Lahiri.',
    keywords: [
      'lahiri ayanamsha',
      'chitrapaksha',
      'sidereal zodiac',
      'ayanamsha meaning',
      'vedic vs western zodiac',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/', label: 'Calculate with Lahiri (default)' },
    relatedSlugs: [
      'free-vedic-birth-chart-kundali',
      'what-is-lagna-ascendant',
    ],
    intro: [
      'Ayanamsha is the offset between the tropical (season-based) and sidereal (star-based) zodiacs. Lahiri / Chitrapaksha is the standard used by the Indian Astronomical Ephemeris and most practising Jyotishis in India.',
      'Vedaansh defaults to Lahiri so charts match classical table expectations and Swiss Ephemeris sidereal modes commonly taught in India.',
    ],
    sections: [
      {
        heading: 'Why charts differ from Western sites',
        paragraphs: [
          'Tropical apps ignore ayanamsha; planets may appear in different signs. That is expected — not a calculation bug — when comparing Vedic vs Western software.',
        ],
      },
      {
        heading: 'Other ayanamshas',
        paragraphs: [
          'Raman, Krishnamurti, and others exist for specialised schools (e.g. KP). Stick to one ayanamsha for a chart life-cycle so dashas and vargas stay consistent.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Lahiri change every year?',
        a: 'The ayanamsha value drifts slowly with precession. Ephemeris libraries update the offset by date; you do not pick a new mode each year.',
      },
      {
        q: 'Should I switch ayanamsha to “fix” a yoga?',
        a: 'No. Changing ayanamsha to force a result breaks consistency. Prefer verifying birth data first.',
      },
    ],
  },
  {
    slug: 'jaimini-atmakaraka-explained',
    title: 'Atmakaraka Explained — Jaimini Charakarakas',
    description:
      'Atmakaraka is the planet with the highest longitude in Jaimini Charakaraka theory — a key to soul-significator reading. Explore Karakas on Vedaansh Jaimini tools.',
    keywords: [
      'atmakaraka',
      'charakaraka',
      'jaimini karaka',
      'amatyakaraka',
      'karakamsha',
    ],
    publishedAt: '2026-03-14',
    updatedAt: '2026-03-14',
    toolCta: { href: '/jaimini', label: 'Open Jaimini workspace' },
    relatedSlugs: [
      'what-is-navamsha-d9-chart',
      'free-vedic-birth-chart-kundali',
      'vimshottari-dasha-explained',
    ],
    intro: [
      'In Jaimini, Charakarakas are ranked by descending celestial longitude (excluding some schools’ treatment of nodes). The Atmakaraka (AK) is the “soul” significator; Amatyakaraka (AmK) often shows career/advisors.',
      'Karakamsha — AK’s Navamsha sign — is central for spiritual and vocation readings. Vedaansh’s Jaimini workspace computes Karakas on your Swiss Ephemeris chart.',
    ],
    sections: [
      {
        heading: 'Seven vs eight karaka schemes',
        paragraphs: [
          'Traditions differ on whether Rahu participates and how ties are broken. Know which scheme your software uses before comparing to a guru’s book.',
        ],
      },
      {
        heading: 'Read with Chara Dasha and Arudha',
        paragraphs: [
          'Jaimini timing (Chara Dasha) and Arudha Lagna complement Karakas. Vedaansh groups these tools so you are not mixing tropical plugins with sidereal D1.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Atmakaraka the same as the Sun?',
        a: 'No. The Sun can be AK if it has the highest degree, but any planet (per scheme) may hold that role.',
      },
      {
        q: 'Do I need Navamsha for AK work?',
        a: 'Yes for Karakamsha and much of Jaimini vocational/spiritual judgment. Generate D1 and D9 together on Vedaansh.',
      },
    ],
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export function getAllGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug)
}

export function getRelatedGuides(slug: string, limit = 4): Guide[] {
  const guide = getGuide(slug)
  if (!guide?.relatedSlugs?.length) return []
  const related: Guide[] = []
  for (const s of guide.relatedSlugs) {
    const g = getGuide(s)
    if (g && g.slug !== slug) related.push(g)
    if (related.length >= limit) break
  }
  return related
}
