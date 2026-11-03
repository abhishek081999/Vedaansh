// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogaMeta.ts
//  Classical Nitya Yoga (Sun+Moon) meanings for the 27 yogas.
//  Qualities align with YOGA_QUALITY in nakshatra.ts.
// ─────────────────────────────────────────────────────────────

export type YogaQuality = 'auspicious' | 'inauspicious' | 'neutral'

export type YogaId =
  | 'Vishkambha' | 'Priti' | 'Ayushman' | 'Saubhagya' | 'Shobhana'
  | 'Atiganda' | 'Sukarma' | 'Dhriti' | 'Shula' | 'Ganda'
  | 'Vriddhi' | 'Dhruva' | 'Vyaghata' | 'Harshana' | 'Vajra'
  | 'Siddhi' | 'Vyatipata' | 'Variyan' | 'Parigha' | 'Shiva'
  | 'Siddha' | 'Sadhya' | 'Shubha' | 'Shukla' | 'Brahma'
  | 'Indra' | 'Vaidhriti'

export interface YogaMeta {
  id:             YogaId
  name:           string
  number:         number // 1–27
  meaning:        string
  quality:        YogaQuality
  nature:         string
  positiveTraits: string
  challenge:      string
  bestFor:        string
  dayGuidance:    string
}

const YOGAS: Record<YogaId, YogaMeta> = {
  Vishkambha: {
    id: 'Vishkambha', name: 'Vishkambha', number: 1,
    meaning: 'Pillar / door-bolt',
    quality: 'inauspicious',
    nature: 'Obstacles present, but strength to push through them',
    positiveTraits: 'Determination, ability to overcome rivals, supporting others',
    challenge: 'Friction, delays, and competitive pressure',
    bestFor: 'Clearing obstacles, assertive problem-solving (not soft launches)',
    dayGuidance: 'Expect resistance — use grit; postpone delicate agreements.',
  },
  Priti: {
    id: 'Priti', name: 'Priti', number: 2,
    meaning: 'Love / affection',
    quality: 'auspicious',
    nature: 'Warmth, friendship, and mutual liking',
    positiveTraits: 'Charm, popularity, harmonious relationships',
    challenge: 'Over-attachment or people-pleasing',
    bestFor: 'Meetings, romance, hospitality, alliance-building',
    dayGuidance: 'Favour social warmth, reconciliation, and pleasant collaborations.',
  },
  Ayushman: {
    id: 'Ayushman', name: 'Ayushman', number: 3,
    meaning: 'Long-lived',
    quality: 'auspicious',
    nature: 'Vitality and longevity-supporting energy',
    positiveTraits: 'Health focus, endurance, protective instincts',
    challenge: 'Neglecting rest while chasing longevity goals',
    bestFor: 'Health starts, recovery, long-term commitments',
    dayGuidance: 'Support health, stamina, and sustainable routines.',
  },
  Saubhagya: {
    id: 'Saubhagya', name: 'Saubhagya', number: 4,
    meaning: 'Good fortune',
    quality: 'auspicious',
    nature: 'Luck, prosperity, and favourable outcomes',
    positiveTraits: 'Optimism, grace, attraction of opportunity',
    challenge: 'Complacency if fortune comes too easily',
    bestFor: 'Auspicious beginnings, prosperity rites, celebrations',
    dayGuidance: 'Lean into fortunate openings; begin what you want to prosper.',
  },
  Shobhana: {
    id: 'Shobhana', name: 'Shobhana', number: 5,
    meaning: 'Splendor / beauty',
    quality: 'auspicious',
    nature: 'Brilliance, aesthetics, and refined presentation',
    positiveTraits: 'Creativity, elegance, impressive presence',
    challenge: 'Vanity or surface over substance',
    bestFor: 'Arts, design, image work, festive decoration',
    dayGuidance: 'Favour beauty, presentation, and creative polish.',
  },
  Atiganda: {
    id: 'Atiganda', name: 'Atiganda', number: 6,
    meaning: 'Extra caution',
    quality: 'inauspicious',
    nature: 'A day to be more careful, with a higher chance of mishaps or disputes',
    positiveTraits: 'Caution awareness; good for careful review',
    challenge: 'Sudden setbacks, injury risk, sharp conflict',
    bestFor: 'Audits, safety checks, avoiding travel and surgery',
    dayGuidance: 'Classical caution — avoid risky travel, surgery, and confrontations.',
  },
  Sukarma: {
    id: 'Sukarma', name: 'Sukarma', number: 7,
    meaning: 'Good deeds',
    quality: 'auspicious',
    nature: 'Virtuous action and meritorious work',
    positiveTraits: 'Integrity, helpfulness, reputation through service',
    challenge: 'Overextending in duty at personal cost',
    bestFor: 'Charity, ethical work, reputation-building projects',
    dayGuidance: 'Do constructive, dharmic work that builds lasting goodwill.',
  },
  Dhriti: {
    id: 'Dhriti', name: 'Dhriti', number: 8,
    meaning: 'Firmness / steadfastness',
    quality: 'auspicious',
    nature: 'Steady resolve and holding course',
    positiveTraits: 'Patience, wealth retention, emotional steadiness',
    challenge: 'Stubbornness when flexibility is needed',
    bestFor: 'Saving, long projects, commitments that need grit',
    dayGuidance: 'Hold steady — reinforce what you want to last.',
  },
  Shula: {
    id: 'Shula', name: 'Shula', number: 9,
    meaning: 'Spear / pain',
    quality: 'inauspicious',
    nature: 'Piercing difficulty, quarrels, and sharp pressure',
    positiveTraits: 'Courage under fire; cutting through denial',
    challenge: 'Arguments, pain points, harsh speech',
    bestFor: 'Ending toxic patterns carefully; not new partnerships',
    dayGuidance: 'Avoid disputes and sharp decisions; keep speech soft.',
  },
  Ganda: {
    id: 'Ganda', name: 'Ganda', number: 10,
    meaning: 'Knot; a tricky point',
    quality: 'inauspicious',
    nature: 'Knotted obstacles and vulnerable junctions',
    positiveTraits: 'Alertness at critical junctures',
    challenge: 'Complications, health sensitivity, awkward timing',
    bestFor: 'Untangling problems; avoid major starts',
    dayGuidance: 'Untie loose ends; postpone major launches.',
  },
  Vriddhi: {
    id: 'Vriddhi', name: 'Vriddhi', number: 11,
    meaning: 'Growth / increase',
    quality: 'auspicious',
    nature: 'Expansion and progressive increase',
    positiveTraits: 'Growth mindset, learning, progressive gains',
    challenge: 'Over-expansion without foundation',
    bestFor: 'Business growth, learning, investments, scaling',
    dayGuidance: 'Push growth initiatives and skill expansion.',
  },
  Dhruva: {
    id: 'Dhruva', name: 'Dhruva', number: 12,
    meaning: 'Fixed / constant',
    quality: 'auspicious',
    nature: 'Stability, permanence, and reliability',
    positiveTraits: 'Consistency, loyalty, durable results',
    challenge: 'Rigidity; resistance to needed change',
    bestFor: 'Foundations, permanent agreements, long-term plans',
    dayGuidance: 'Build what should last — contracts, foundations, routines.',
  },
  Vyaghata: {
    id: 'Vyaghata', name: 'Vyaghata', number: 13,
    meaning: 'Striking down / obstruction',
    quality: 'inauspicious',
    nature: 'Sudden hits to plans; forceful interruption',
    positiveTraits: 'Ability to break stale patterns when needed',
    challenge: 'Breakage, injury risk, abrupt cancellation',
    bestFor: 'Demolition of bad habits — not new construction',
    dayGuidance: 'Expect disruptions; protect people and plans from sudden hits.',
  },
  Harshana: {
    id: 'Harshana', name: 'Harshana', number: 14,
    meaning: 'Joy / delight',
    quality: 'auspicious',
    nature: 'Cheerfulness and celebratory energy',
    positiveTraits: 'Optimism, humour, morale boost',
    challenge: 'Excess celebration over discipline',
    bestFor: 'Festivals, announcements, morale-building events',
    dayGuidance: 'Celebrate wins and lift spirits — keep excess in check.',
  },
  Vajra: {
    id: 'Vajra', name: 'Vajra', number: 15,
    meaning: 'Thunderbolt',
    quality: 'inauspicious',
    nature: 'Hard, forceful, sudden power',
    positiveTraits: 'Decisive force, cutting clarity',
    challenge: 'Harshness, conflict, brittle outcomes',
    bestFor: 'Decisive cuts after careful thought; avoid soft diplomacy',
    dayGuidance: 'Power is sharp today — avoid forceful confrontations.',
  },
  Siddhi: {
    id: 'Siddhi', name: 'Siddhi', number: 16,
    meaning: 'Accomplishment / success',
    quality: 'auspicious',
    nature: 'Attainment and successful completion',
    positiveTraits: 'Competence, goal closure, skill manifestation',
    challenge: 'Resting on success without next aim',
    bestFor: 'Completing projects, exams, skill demonstrations',
    dayGuidance: 'Push for completion and tangible results.',
  },
  Vyatipata: {
    id: 'Vyatipata', name: 'Vyatipata', number: 17,
    meaning: 'Sudden upset',
    quality: 'inauspicious',
    nature: 'An unsettled day when things may not go as expected',
    positiveTraits: 'Humility; deep spiritual introspection',
    challenge: 'Mishaps and plans that turn around',
    bestFor: 'Prayer, restraint, avoiding high-stakes starts',
    dayGuidance: 'Classical texts advise caution. Choose quiet or spiritual activity over launching something new.',
  },
  Variyan: {
    id: 'Variyan', name: 'Variyan', number: 18,
    meaning: 'Excellent / best',
    quality: 'neutral',
    nature: 'Comfort, luxury, and refined preference',
    positiveTraits: 'Taste, comfort-seeking, quality standards',
    challenge: 'Indulgence or laziness',
    bestFor: 'Comfort purchases, hospitality, quality upgrades',
    dayGuidance: 'Improve quality and comfort; avoid pure laziness.',
  },
  Parigha: {
    id: 'Parigha', name: 'Parigha', number: 19,
    meaning: 'Iron bar / obstacle',
    quality: 'inauspicious',
    nature: 'Blocked pathways and barred progress',
    positiveTraits: 'Boundary-setting, protective barriers',
    challenge: 'Stuckness, opposition, closed doors',
    bestFor: 'Defense and boundaries — not expansion',
    dayGuidance: 'Do not force locked doors; reinforce boundaries instead.',
  },
  Shiva: {
    id: 'Shiva', name: 'Shiva', number: 20,
    meaning: 'Auspicious / benevolent',
    quality: 'auspicious',
    nature: 'Welfare, knowledge, and gracious outcomes',
    positiveTraits: 'Wisdom, calm authority, blessing energy',
    challenge: 'Detachment that neglects worldly duties',
    bestFor: 'Learning, worship, wise counsel, auspicious rites',
    dayGuidance: 'Study, worship, and seek wise counsel.',
  },
  Siddha: {
    id: 'Siddha', name: 'Siddha', number: 21,
    meaning: 'Perfected / accomplished',
    quality: 'auspicious',
    nature: 'Mastery and refined competence',
    positiveTraits: 'Skill, expertise, reliable delivery',
    challenge: 'Perfectionism delaying action',
    bestFor: 'Skilled work, teaching craft, polishing deliverables',
    dayGuidance: 'Apply mastered skills; refine and deliver with precision.',
  },
  Sadhya: {
    id: 'Sadhya', name: 'Sadhya', number: 22,
    meaning: 'Achievable',
    quality: 'auspicious',
    nature: 'Goals within reach; workable effort pays off',
    positiveTraits: 'Practical ambition, doable planning',
    challenge: 'Under-ambitious aims if comfort wins',
    bestFor: 'Realistic goals, negotiations, stepwise progress',
    dayGuidance: 'Set achievable targets and advance them steadily.',
  },
  Shubha: {
    id: 'Shubha', name: 'Shubha', number: 23,
    meaning: 'Auspicious / beautiful',
    quality: 'auspicious',
    nature: 'Favourable, pleasant, and purifying tone',
    positiveTraits: 'Grace, positivity, aesthetic sense',
    challenge: 'Avoiding hard truths to keep things “nice”',
    bestFor: 'Auspicious ceremonies, beautification, goodwill acts',
    dayGuidance: 'Favour auspicious rites and harmonious presentation.',
  },
  Shukla: {
    id: 'Shukla', name: 'Shukla', number: 24,
    meaning: 'Bright / pure',
    quality: 'auspicious',
    nature: 'Clarity, purity, and illuminated mind',
    positiveTraits: 'Clear thinking, honesty, clean intent',
    challenge: 'Harsh purity standards toward self or others',
    bestFor: 'Study, cleansing, transparent communication',
    dayGuidance: 'Clarify, purify, and communicate with transparency.',
  },
  Brahma: {
    id: 'Brahma', name: 'Brahma', number: 25,
    meaning: 'Creator',
    quality: 'auspicious',
    nature: 'Creative genesis and knowledge birth',
    positiveTraits: 'Originality, teaching, generative ideas',
    challenge: 'Starting many things without finishing',
    bestFor: 'New creative work, writing, education, ideation',
    dayGuidance: 'Begin creative and educational ventures.',
  },
  Indra: {
    id: 'Indra', name: 'Indra', number: 26,
    meaning: 'Lord of gods / authority',
    quality: 'auspicious',
    nature: 'Leadership, sovereignty, and commanding presence',
    positiveTraits: 'Authority, courage, executive power',
    challenge: 'Ego inflation or dominance conflicts',
    bestFor: 'Leadership acts, governance, high-visibility roles',
    dayGuidance: 'Lead decisively; temper ego with fairness.',
  },
  Vaidhriti: {
    id: 'Vaidhriti', name: 'Vaidhriti', number: 27,
    meaning: 'Separation / disharmony',
    quality: 'inauspicious',
    nature: 'Disconnect, reversal, and unsettled outcomes',
    positiveTraits: 'Capacity for deep release and spiritual surrender',
    challenge: 'Separation, discord, failed coordination',
    bestFor: 'Letting go, spiritual practice — not alliances',
    dayGuidance: 'Classical caution — avoid partnerships and high-stakes starts.',
  },
}

const BY_NAME: Record<string, YogaId> = Object.fromEntries(
  (Object.keys(YOGAS) as YogaId[]).map((id) => [id.toLowerCase(), id]),
)

export function getYogaMeta(nameOrNumber: string | number): YogaMeta | null {
  if (typeof nameOrNumber === 'number') {
    const n = Math.min(27, Math.max(1, Math.floor(nameOrNumber)))
    const found = (Object.values(YOGAS) as YogaMeta[]).find((y) => y.number === n)
    return found ?? null
  }
  const key = nameOrNumber.trim().toLowerCase()
  const id = BY_NAME[key]
  return id ? YOGAS[id] : null
}

export function formatYogaWeatherLine(meta: YogaMeta): string {
  const q =
    meta.quality === 'auspicious' ? 'Shubh'
      : meta.quality === 'inauspicious' ? 'Ashubh'
        : 'Neutral'
  return `${q} · ${meta.meaning} — ${meta.dayGuidance}`
}

export function listYogaMeta(): YogaMeta[] {
  return (Object.values(YOGAS) as YogaMeta[]).sort((a, b) => a.number - b.number)
}

// ── Birth-yoga reading (deity + natal tendency + remedy) ─────

export interface YogaBirthNote {
  deity:        string
  birthReading: string
  remedy:       string
}

const YOGA_BIRTH_NOTES: Record<YogaId, YogaBirthNote> = {
  Vishkambha: { deity: 'Yama', birthReading: 'Carries many responsibilities; only part of the effort gets rewarded or noticed. Strongest in the first half (0–6°40′) of the yoga.', remedy: 'Devotion and limitless effort — never lose heart; rewards arrive late but arrive.' },
  Priti:      { deity: 'Vishnu', birthReading: 'Gentle and loving at work and home; others hand over their work and they cannot refuse.', remedy: 'Guard against ego, stubbornness and over-attachment.' },
  Ayushman:   { deity: 'Purna Chandra', birthReading: 'Does work that lasts and is remembered; listens to the heart more than the head.', remedy: 'Avoid short-term gains; music and kirtan steady the mind.' },
  Saubhagya:  { deity: 'Brahma', birthReading: 'Lucky; shines in production, manufacturing and industry — stands out among peers there.', remedy: 'Prefer industry over small shopkeeping; do not exaggerate skills.' },
  Shobhana:   { deity: 'Brihaspati', birthReading: 'Growth comes with a clean, orderly workspace and neat presentation.', remedy: 'Clear clutter at home and office — unused things, files and old furniture.' },
  Atiganda:   { deity: 'Amavasya Chandra', birthReading: 'Repeated speed-breakers and opposition in work; worse in the first half of the yoga.', remedy: 'Do not broadcast failures; keep relationships clean and avoid back-biting.' },
  Sukarma:    { deity: 'Indra', birthReading: 'Born to act; wants to be first everywhere and juggles many tasks.', remedy: 'Stay down to earth, avoid showing off, and never slip into laziness.' },
  Dhriti:     { deity: 'Jala', birthReading: 'Traditional and slow to accept new methods, so often a step behind success; hidden attraction outside the partnership.', remedy: 'Move with the times and adopt modern techniques.' },
  Shula:      { deity: 'Sarpa', birthReading: 'Thorn-like pain; prone to addictions once exposed and slow to recover from them.', remedy: 'Exercise, pranayama and professional de-addiction support when needed.' },
  Ganda:      { deity: 'Agni', birthReading: 'Skewed perceptions; work is blocked mainly by health breaks.', remedy: 'Do Gandamula shanti where applicable; look for the positive in people.' },
  Vriddhi:    { deity: 'Surya', birthReading: 'Steady growth and promotion; emotional decisions are the weak spot. Effects drop sharply on Amavasya.', remedy: 'Be practical before deciding.' },
  Dhruva:     { deity: 'Prithvi', birthReading: 'Earth-like patience that forgives much — but when patience snaps, decades of goodwill can be lost.', remedy: 'Manage anger before it accumulates.' },
  Vyaghata:   { deity: 'Vayu', birthReading: 'Emotional hurt; betrayal from the most trusted person often becomes a turning point.', remedy: 'Stay alert; daily bathing and routine pull them out of low phases.' },
  Harshana:   { deity: 'Bhaga', birthReading: 'Royal taste — beautiful office, a fixed standard it will not go below; uses sama-dana-danda-bheda.', remedy: 'Keep the standard without letting ego block real opportunities.' },
  Vajra:      { deity: 'Varuna', birthReading: 'Sudden falls, losses, accidents, fire or theft; blunt one-liners end good discussions.', remedy: 'Never let insurance lapse (home, health, accident, loans); soften speech.' },
  Siddhi:     { deity: 'Ganesha', birthReading: 'Innovative and keeps upgrading skills, but struggles to show them.', remedy: 'Keep a Ganesha image nearby; learn to market your work.' },
  Vyatipata:  { deity: 'Rudra', birthReading: 'Blunt and critical; quickly irritated, so jobs and relationships change often.', remedy: 'Self-balance is the only remedy — practise restraint in speech.' },
  Variyan:    { deity: 'Kubera', birthReading: 'Loves praise and drops people over small slights; excellent at handling and saving others’ money, generous to a fault.', remedy: 'Avoid spending for false prestige.' },
  Parigha:    { deity: 'Vishwakarma', birthReading: 'Sudden good and bad turns; skill in construction and design; strong desire nature.', remedy: 'Keep character clean — inauspiciousness reduces over time.' },
  Shiva:      { deity: 'Surya (Mitra)', birthReading: 'Helps outsiders generously but gives family too little time, so is under-valued at home.', remedy: 'Spend real time with spouse and children.' },
  Siddha:     { deity: 'Kartikeya', birthReading: 'Hidden fire; walks away rather than argue; loves travel and observes deeply.', remedy: 'Do not take up several fronts at once.' },
  Sadhya:     { deity: 'Savitri', birthReading: 'Drive to do something different; creative and generative (strong fertility in women); work is valued later.', remedy: 'Keep body clean and fresh — daily shaving, perfume, hygiene.' },
  Shubha:     { deity: 'Lakshmi', birthReading: 'Earns money, honour and status; may cut corners to maintain status later.', remedy: 'Stay honest once established. Weaker if born on Amavasya.' },
  Shukla:     { deity: 'Parvati', birthReading: 'Guards reputation fiercely and can turn unprofessional to protect it.', remedy: 'Stay professional; achievements dim if born Amavasya to Krishna Panchami.' },
  Brahma:     { deity: 'Ashwini Kumaras', birthReading: 'Fast, active and well-groomed; never forgets a route; their remedies "work" for others — good in medicine.', remedy: 'Balance ego and avoid haste.' },
  Indra:      { deity: 'Pitri', birthReading: 'Proud of the family name and inherits family traits and skills; drops own work to help others.', remedy: 'Settle your own goals before taking on others’.' },
  Vaidhriti:  { deity: 'Diti', birthReading: 'Very patient in life’s storms, but loses all patience when women of the family are insulted.', remedy: 'Verify before reacting; avoid harsh criticism.' },
}

export function getYogaBirthNote(nameOrNumber: string | number): YogaBirthNote | null {
  const meta = getYogaMeta(nameOrNumber)
  return meta ? YOGA_BIRTH_NOTES[meta.id] : null
}
