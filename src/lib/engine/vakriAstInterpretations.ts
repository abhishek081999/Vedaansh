// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vakriAstInterpretations.ts
//  Vakri (retrograde) & Asta (combust) teaching notes
//  Educational study-series paraphrases — not medical advice.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { ClassicalNote, ClassicalSource } from './classicalInterpretations'
import type { ClassicalGrahaId } from './houseInterpretations'

function note(source: ClassicalSource, text: string, ref?: string): ClassicalNote {
  return ref ? { source, ref, text } : { source, text }
}

const RETROGRADE_CAPABLE = new Set<ClassicalGrahaId>(['Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
const COMBUST_CAPABLE = new Set<ClassicalGrahaId>(['Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'])

/** Activation windows for natal vakri (≠ planetary maturity ages). */
export const VAKRI_ACTIVATION_AGE: Partial<Record<ClassicalGrahaId, string>> = {
  Me: '18–22',
  Ve: '23–28',
  Ma: '27–32',
  Ju: '32–38',
  Sa: '36–42',
}

// ── Shared principles ────────────────────────────────────────

const VAKRI_CORE: ClassicalNote[] = [
  note(
    'BPHS',
    'Vakri (retrograde): the planet appears to move backward from Earth—an optical effect, not literal reverse motion. Sun and Moon never go vakri; Mercury–Saturn can; Rahu/Ketu are nearly always vakri.',
    'Vakri',
  ),
  note(
    'Teaching',
    'Natal vakri marks incomplete karmas and a chance to re-examine that graha’s themes—like a supplementary exam. It is not inherently malefic; almost every chart has at least one vakri planet. In own sign, exaltation, or a clean nakshatra, classics allow auspicious results through a longer process.',
    'Vakri',
  ),
  note(
    'Teaching',
    'Common pattern: overthinking and dual expression (outer calm vs inner intensity), repeating life themes, flashback memories, and delayed—but eventually solid—results. Ego (ahankāra) attached to a vakri planet imbalances it; check how the Sun joins or aspects that graha.',
    'Vakri',
  ),
]

const ASTA_CORE: ClassicalNote[] = [
  note(
    'BPHS',
    'Asta (combust): the planet is so near the Sun that its own light is hidden in solar brilliance. Significations are veiled, not destroyed—results still come, often slowly and through process.',
    'Asta',
  ),
  note(
    'Teaching',
    'Psychological signature of combustion: reduced free self-expression, confidence that looks strong outside but feels weak inside, decisions made more for others, and late recognition of one’s own capability. Immature Sun tends to suppress a combust graha; mature Sun tends to refine it.',
    'Asta',
  ),
]

const VAKRI_ASTA_COMBO: ClassicalNote[] = [
  note(
    'Teaching',
    'Vakri + Asta together: immense internal processing power with muted external aura—plans brilliantly inside, but self and others may miss the true potential (Hanumān forgetting his śakti). Early life often feels slow; clarity and delivery typically accelerate after the mid-30s to mid-40s.',
    'Vakri+Asta',
  ),
]

// ── Planet-wise vakri ────────────────────────────────────────

const VAKRI_BY_GRAHA: Partial<Record<ClassicalGrahaId, ClassicalNote[]>> = {
  Me: [
    note(
      'Teaching',
      'Vakri Budha: sharp memory and silent strategic intelligence—brain shows in work more than speech. Challenges: promise-breaking under overload, decision paralysis, social anxiety, internal monologue, and mild OCD/ADHD-like information overload. Journal, filter inputs, and practice mental stillness. Activation ~18–22.',
      'Vakri Me',
    ),
    note(
      'Teaching',
      'With ego: becomes manipulative or plays both sides. Healing: write to organize thought; block unnecessary intake.',
      'Vakri Me',
    ),
  ],
  Ve: [
    note(
      'Teaching',
      'Vakri Śukra: deep capacity for love with unfinished past-life love themes. Pattern of intense attraction then sudden detachment, returning old bonds, validation-seeking, pleasure guilt, and self-worth doubt. Art/music outlets, boundaries, and self-love before bonding. Activation ~23–28.',
      'Vakri Ve',
    ),
  ],
  Ma: [
    note(
      'Teaching',
      'Vakri Mangala: calm exterior, boiling interior drive; passive aggression, late explosive anger, and strong revenge impulse if suppressed. Must channel energy through body (walk, gym, sport)—without outlets, verbal violence can be as damaging as physical. Activation ~27–32.',
      'Vakri Ma',
    ),
  ],
  Ju: [
    note(
      'Teaching',
      'Vakri Guru: inner voice becomes the teacher—self-taught, independent, philosophical. Hard to accept an outer guru; moral conflicts and superiority about knowledge if imbalanced; may commercialize dharma. Prefers a sadguru beyond mere form. Activation ~32–38.',
      'Vakri Ju',
    ),
  ],
  Sa: [
    note(
      'Teaching',
      'Vakri Śani: accountability and eventual transformation—visionary long-term mind, vairāgya, sevā, silent tapas. Cycle of break→rebuild; high-functioning depression, emotional numbness, work-as-escape, existential loneliness, and inability to ask for help. Needs karuṇā (compassion), rest, and travel—not more harsh discipline. Read emotions through Saturn first, then Moon. Activation ~36–42.',
      'Vakri Sa',
    ),
  ],
  Ra: [
    note(
      'Teaching',
      'Rahu is vakri in virtually every chart (stationary Rahu is rare). Insatiable future hunger, illusion/deception skill, ambition that can sacrifice balance, comparison anxiety, and modern obsessions (screens, fame, tech). Core message: the obsession itself is the bondage to escape.',
      'Vakri Ra',
    ),
  ],
  Ke: [
    note(
      'Teaching',
      'Ketu is characteristically vakri: incomplete memory seeking mokṣa, detached intelligence, and spiritual counterbalance to Rahu’s material pull—“you are already free; remember it.”',
      'Vakri Ke',
    ),
  ],
}

// ── Planet-wise asta ─────────────────────────────────────────

const ASTA_BY_GRAHA: Partial<Record<ClassicalGrahaId, ClassicalNote[]>> = {
  Mo: [
    note(
      'BPHS',
      'Combust Moon: mind and emotional clarity are overpowered by solar heat—mood and maternal/comfort themes need careful support.',
      'Asta Mo',
    ),
  ],
  Me: [
    note(
      'Teaching',
      'Asta Budha is extremely common (Mercury stays near the Sun)—do not read it as weak intelligence. Mercury governs thinking speed, speech, and information exchange. Classify results by the Sun: mature/well-supported Sun refines a silent strategic mind and writing skill; immature/afflicted Sun yields scattered speech, validation-seeking, and delayed expression.',
      'Asta Me',
    ),
    note(
      'Teaching',
      'Isolated combust Mercury (Sun alone nearby) clears thoughts faster; clustered with other grahas adds mental noise and recognition lag. Person often debates internally many times before speaking.',
      'Asta Me',
    ),
  ],
  Ve: [
    note(
      'Phaladeepika',
      'Asta Śukra: comfort, relationships, and appearance themes are veiled—classically linked to strained sukha.',
      'Asta Ve',
    ),
    note(
      'Teaching',
      'Pattern: give love/care abundantly, receive less than expected; validation deficit; emotional dependency is the biggest risk—recovery comes, but the imprint remains. Life often gives more than it receives in money, care, and attention.',
      'Asta Ve',
    ),
  ],
  Ma: [
    note(
      'Teaching',
      'Asta Mangala: courage and energy are present but suppressed—surface as irritation, passive aggression, or misplaced fights. Strong in operations/execution roles; watch health when anger has no clean outlet.',
      'Asta Ma',
    ),
  ],
  Ju: [
    note(
      'Teaching',
      'Asta Guru: knowledge and dharma clarity get veiled—ethical confusion, mentor dependency (unlike vakri Jupiter, mentors do appear), suppressed inner truth, and fluctuating faith. Knows the right counsel but struggles to express it confidently.',
      'Asta Ju',
    ),
  ],
  Sa: [
    note(
      'Teaching',
      'Asta Śani: karmas feel heavier—self-punishment, over-responsibility, permanent guilt about unfinished duties, and avoidance of authoritative seats.',
      'Asta Sa',
    ),
  ],
}

// ── Combined planet notes ────────────────────────────────────

const VAKRI_ASTA_BY_GRAHA: Partial<Record<ClassicalGrahaId, ClassicalNote[]>> = {
  Me: [
    note(
      'Teaching',
      'Vakri + Asta Budha: extremely sharp multi-angle mind, yet timing of speech often off; intelligence may be underestimated. Primary friction is anxiety/overthinking—unless dignity (e.g. exaltation) and house support lift expression.',
      'Vakri+Asta Me',
    ),
    note(
      'Teaching',
      'Blind spot: feels “I can’t think properly” while actually thinking very well. Writing/handwriting quality is a useful Mercury check.',
      'Vakri+Asta Me',
    ),
  ],
  Ve: [
    note(
      'Teaching',
      'Vakri + Asta Śukra: deep artistic sensitivity and soul-level bonding (“deewānā” immersion) with relationships that still feel unfulfilled despite giving excessively. Blind spot: feels unworthy of love while love is actually present.',
      'Vakri+Asta Ve',
    ),
  ],
  Ma: [
    note(
      'Teaching',
      'Vakri + Asta Mangala: strategic timing of reaction with warrior consciousness inside; suppressed energy often shows on the body—physical outlets remain essential.',
      'Vakri+Asta Ma',
    ),
  ],
  Ju: [
    note(
      'Teaching',
      'Vakri + Asta Guru: systemic suppression—teacher-level knowledge kept in a student role; receives less than capacity. Blind spot: feels “I don’t know enough” while knowing plenty.',
      'Vakri+Asta Ju',
    ),
  ],
  Sa: [
    note(
      'Teaching',
      'Vakri + Asta Śani: internal endurance with outer invisibility of effort—guilt and over-duty intensify until mid-life maturation softens the load with compassion.',
      'Vakri+Asta Sa',
    ),
  ],
}

const VAKRI_DIGNITY_BOOST = note(
  'BPHS',
  'Classical support: a vakri planet in own sign (svakṣetra), exaltation (ucca), or a pure/benefic nakshatra tends toward auspicious—though still process-oriented—results.',
  'Vakri',
)

const ASTA_GENERAL_PSYCH = note(
  'Teaching',
  'Shared combust psychology: “what’s the point of speaking/acting?”, preemptive withdrawal, backing out before trying, blaming the environment in that planet’s daśā, suppressed desire → low mood, and suppressed anger → anxiety.',
  'Asta',
)

function asClassical(id: string): ClassicalGrahaId | null {
  const g = id as ClassicalGrahaId
  if (RETROGRADE_CAPABLE.has(g) || COMBUST_CAPABLE.has(g) || g === 'Su') return g
  return null
}

function dignitySupportsVakri(dignity?: string): boolean {
  return dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona'
}

export type VakriAstDetail = 'summary' | 'full'

/**
 * Classical + teaching notes for natal vakri / asta status of one graha.
 * Pass chart flags as computed by the engine (isRetro / isCombust).
 * `summary` = card/PDF teaser set; `full` = guide-panel depth.
 */
export function getVakriAstNotes(
  grahaId: string,
  isRetro?: boolean,
  isCombust?: boolean,
  dignity?: string,
  detail: VakriAstDetail = 'full',
): ClassicalNote[] {
  const g = asClassical(grahaId)
  if (!g) return []
  const retro = Boolean(isRetro) && RETROGRADE_CAPABLE.has(g)
  const combust = Boolean(isCombust) && COMBUST_CAPABLE.has(g)
  if (!retro && !combust) return []

  const out: ClassicalNote[] = []
  const summary = detail === 'summary'

  if (retro) {
    out.push(summary ? VAKRI_CORE[1]! : VAKRI_CORE[0]!)
    if (!summary) out.push(...VAKRI_CORE.slice(1))
    const planet = VAKRI_BY_GRAHA[g]
    if (planet?.length) out.push(planet[0]!)
    if (!summary && planet && planet.length > 1) out.push(...planet.slice(1))
    if (dignitySupportsVakri(dignity)) out.push(VAKRI_DIGNITY_BOOST)
    const age = VAKRI_ACTIVATION_AGE[g]
    if (age && !summary) {
      out.push(
        note(
          'Teaching',
          `Natal vakri activation window ~${age}: first 1–2 years often bring maximum confusion; clarity consolidates later. (Activation ≠ planetary maturity age.)`,
          'Vakri age',
        ),
      )
    } else if (age && summary) {
      out.push(
        note('Teaching', `Natal vakri activation ~${age} (early phase is often the most confusing).`, 'Vakri age'),
      )
    }
  }

  if (combust) {
    out.push(ASTA_CORE[0]!)
    if (!summary) out.push(...ASTA_CORE.slice(1))
    const planet = ASTA_BY_GRAHA[g]
    if (planet?.length) out.push(planet[0]!)
    if (!summary && planet && planet.length > 1) out.push(...planet.slice(1))
    if (!summary) out.push(ASTA_GENERAL_PSYCH)
  }

  if (retro && combust) {
    out.push(VAKRI_ASTA_COMBO[0]!)
    const combo = VAKRI_ASTA_BY_GRAHA[g]
    if (combo?.length) out.push(combo[0]!)
    if (!summary && combo && combo.length > 1) out.push(...combo.slice(1))
  }

  return out
}

/** Short one-line teaser for cards / PDF meta. Prefers combined vakri+asta when both apply. */
export function getVakriAstSummary(
  grahaId: string,
  isRetro?: boolean,
  isCombust?: boolean,
): string | null {
  const notes = getVakriAstNotes(grahaId, isRetro, isCombust, undefined, 'summary')
  if (!notes.length) return null
  const preferRefs = [
    `Vakri+Asta ${grahaId}`,
    `Vakri ${grahaId}`,
    `Asta ${grahaId}`,
  ]
  for (const ref of preferRefs) {
    const hit = notes.find((n) => n.ref === ref)
    if (hit) return hit.text
  }
  return (notes[notes.length - 1] ?? notes[0]).text
}

/** Chart-level sensitivity when multiple true planets (excl. Ra/Ke) are vakri. */
export function getMultiVakriNotes(
  grahas: Array<{ id: GrahaId; isRetro?: boolean }>,
): ClassicalNote[] {
  const count = grahas.filter(
    (g) => g.isRetro && RETROGRADE_CAPABLE.has(g.id as ClassicalGrahaId) && g.id !== 'Ra' && g.id !== 'Ke',
  ).length
  if (count < 2) return []

  const scale: Record<number, string> = {
    2: 'Moderate sensitivity: emotional depth, overthinking moments, occasional solitude need—mentoring smooths direction.',
    3: 'High sensitivity: inner world dominates; decision delay; needs awareness plus a structured framework.',
    4: 'Very high sensitivity: extreme empathy; nervous system overwhelms easily; choose lifestyle and relationships carefully.',
    5: 'Ultra-sensitive (rare): multi-layer processing, deep karmic memory, life under constant subtle pressure.',
  }
  const level = scale[Math.min(count, 5)] ?? scale[5]

  return [
    note(
      'Teaching',
      `${count} vakri planets (excluding nodes): ${level} Shared traits—dislike loud crowds, need self-validation, clarity often mid-life, start late but root deeply; every turning point carries a story.`,
      'Multi-Vakri',
    ),
    note(
      'Teaching',
      'Parenting / lifestyle: avoid harsh public criticism, loud overload, exhibition pressure, and moral lectures in the teen years. Match nakshatra element needs—water: emotional safety; air: freedom + grounding; earth: appreciation; fire: ego soothing.',
      'Multi-Vakri',
    ),
  ]
}

/** Transit vs natal teaching blurbs (for dasha/transit panels). */
export function getNatalVsTransitVakriNotes(): ClassicalNote[] {
  return [
    note(
      'Teaching',
      'Natal vakri: lifelong karmic pattern—self-purification, hits personality, delayed but stabilizing results, deep past-life memory work (“who you are”).',
      'Vakri transit',
    ),
    note(
      'Teaching',
      'Transit vakri: timed trigger—reminder/re-analysis of situations, temporary stalls, reopening of old files (ex-partners, unfinished tasks). Thumb rule: Review → Revise → Realign. When natal vakri also goes transit vakri: double activation on the house axis.',
      'Vakri transit',
    ),
  ]
}
