// ─────────────────────────────────────────────────────────────
//  src/lib/engine/interpretations.ts
//  Classical interpretations for planets in signs and nakshatras
// ─────────────────────────────────────────────────────────────

import { GrahaId, Rashi } from '@/types/astrology'

/**
 * Planetary dignity/strength general effect
 */
export const DIGNITY_INTERPRETATIONS: Record<string, string> = {
  exalted:      "The planet is at its peak strength, expressing its highest positive qualities. Results are effortless and superior.",
  moolatrikona: "Strong and purposeful. The planet behaves like a king in his office, highly effective and stable.",
  own:          "Comfortable and at home. The planet provides reliable support and steady growth in its areas of significations.",
  great_friend: "Supported and cooperative. The environment is highly conducive for the planet's success.",
  friend:       "General support and ease. Positive outcomes are expected with moderate effort.",
  neutral:      "Mixed or average results. The planet's expression depends heavily on other factors and aspects.",
  enemy:        "Struggling and restricted. The environment is challenging, requiring hard work to manifest results.",
  great_enemy:  "Highly frustrated and blocked. Significant obstacles and internal conflict in the planet's themes.",
  debilitated:  "Weak and misunderstood. The planet's energy is drained or misdirected, often leading to internal struggles or material lacks.",
}

/**
 * Planet in Sign (Rashi) Interpretations
 * Focused on core psychological and soul-level expressions
 */
export const SIGN_INTERPRETATIONS: Record<string, Record<number, string>> = {
  Su: {
    1:  "Leadership and pioneer spirit. Strong willpower and authoritative nature. High energy and initiative.",
    2:  "Values material security. Artistic and aesthetic personality. Persistent but can be stubborn.",
    3:  "Intellectual and communicative. Loves variety and information. Adaptable and restless mind.",
    4:  "Emotional and protective. Deeply connected to roots and family. Intuitive leadership.",
    5:  "Strongest self-expression. Magnetic and royal personality. Creative, noble, and dignified.",
    6:  "Detail-oriented and analytical. Service-minded and humble. Focused on health and daily rituals.",
    7:  "Seeks harmony and partnership. Socially graceful. May struggle with decision-making due to weighing options.",
    8:  "Intense and secretive. Research-oriented and transformative. Deep emotional resilience.",
    9:  "Philosophical and expansive. Loves wisdom and travel. Optimistic and righteous.",
    10: "Ambitious and disciplined. Focused on career and legacy. Patience and organizational skill.",
    11: "Humanitarian and idealistic. Values friendship and networks. Unique and progressive thinking.",
    12: "Spiritual and imaginative. Intuitive and sacrificial. Deep connection to the subconscious.",
  },
  Mo: {
    1:  "Impulsive and brave emotions. Fast-moving mind. Quick to react and start new things.",
    2:  "Extremely stable and content mind. Loves comfort, luxury, and fine food. Emotional durability.",
    3:  "Witty and curious mind. Needs constant mental stimulation. Multi-tasker but may be anxious.",
    4:  "Deeply nurturing and sensitive. Extremely intuitive. Strong attachment to home and mother.",
    5:  "Generous and noble heart. Loves to be the center of attention. Creative and dramatic emotions.",
    6:  "Analytical and organized mind. Emotional security through order and cleanliness. Practical helper.",
    7:  "Emotional balance through relationships. Dislikes conflict. Aesthetic and peace-loving.",
    8:  "Deeply intense and psychic emotions. Secretive and prone to emotional shifts. Extreme resilience.",
    9:  "Philosophical and truth-seeking mind. Emotional joy through wisdom and expansion.",
    10: "Disciplined and reserved emotions. Realistic and cautious. Seeks security through achievement.",
    11: "Broad-minded and social emotions. Connected to groups. Unconventional emotional needs.",
    12: "Highly sensitive and psychic. Deep empathy and compassion. Needs solitude for emotional recharge.",
  },
  Ma: {
    1:  "Raw courage and physical strength. Competitive and independent. High drive for action.",
    2:  "Determination in financial matters. Protective of speech and values. Firm but slow to anger.",
    3:  "Courage in communication. Quick-witted and skillful with hands. Brave in short travels.",
    4:  "Protective of home and emotions. Internalized anger. Strong willpower to protect lineage.",
    5:  "Passionate and creative energy. High drive for romance and fun. Dynamic leadership in sports.",
    6:  "Service-oriented fighter. Skilled in health, healing, or technical logic. Conquers obstacles.",
    7:  "Diplomatic energy. Seeks justice in partnerships. Motivation for social balance.",
    8:  "Research and detective spirit. Deep stamina. Mastery over transformative energies.",
    9:  "Motivation for dharma and higher truth. Protective of beliefs. Courageous in exploration.",
    10: "Supreme ambition and discipline. Strategic and unstoppable career drive. Highest status.",
    11: "Drive for social gains and networks. Unconventional methods of achieving desires.",
    12: "Energy spent in spiritual or secluded pursuits. Hidden strength. Protective of the vulnerable.",
  },
  Me: {
    1:  "Quick and sharp thinking. Direct communication style. Decisive and inventive mind.",
    2:  "Logical in financial matters. Sweet and persuasive speech. Practical intellect.",
    3:  "Brilliant communicator. Loves writing, speaking, and learning. Highest mental dexterity.",
    4:  "Intellect focused on home and roots. Emotional intelligence. Strong memory.",
    5:  "Creative and playful intellect. High intelligence in arts or management. Eloquent speech.",
    6:  "Maximum analytical power. Master of details, logic, and health. Practical problem solver.",
    7:  "Diplomatic and refined speech. Intellectual focus on relationships and arts.",
    8:  "Profound research-oriented mind. Loves mystery and hidden knowledge. Sharp intuition.",
    9:  "Philosophical and higher learning intellect. Loves law, ethics, and truth.",
    10: "Pragmatic and career-oriented thinking. Organized and cautious communication.",
    11: "Progressive and networking mind. Intellectual focus on large gains and society.",
    12: "Intuitive and poetic mind. Imagination over logic. Spiritual thinking patterns.",
  },
  Ju: {
    1:  "Generous and noble leader. Wisdom through direct experience. Optimistic pioneer.",
    2:  "Wisdom in finance and speech. Values truth and lineage. Abundant resources.",
    3:  "Master of communication and local wisdom. Eloquent and optimistic in learning.",
    4:  "High emotional wisdom. Joy through home and inner peace. Blessings for property.",
    5:  "Supreme creativity and wisdom through children/education. High moral character.",
    6:  "Wisdom through service and health. Humanitarian approach to solving problems.",
    7:  "Wisdom through balanced partnerships. Values harmony and ethical relations.",
    8:  "Wisdom through mystery and transformation. Deep occult knowledge. Inherited gains.",
    9:  "Highest spiritual and philosophical wisdom. Master teacher and traveler. Optimistic.",
    10: "Wisdom applied to career and public reputation. Noble and respected professional.",
    11: "Wisdom through social networks. Great gains through humanitarian goals.",
    12: "Deepest spiritual wisdom and liberation. Universal compassion and inner peace.",
  },
  Ve: {
    1:  "Charming and attractive personality. Passionate and direct in love. Loves aesthetics.",
    2:  "Loves luxury, wealth, and fine food. Artistic speech. Stable and loyal in love.",
    3:  "Loves communication, writing, and short travels. Graceful and witty intellect.",
    4:  "Loves home, comfort, and inner peace. Artistic home environment. Devoted heart.",
    5:  "Passionate creativity. Loves romance, fun, and entertainment. Brilliant artistic talent.",
    6:  "Devoted service. Loves order and helping others. Critical approach to aesthetics.",
    7:  "Perfect diplomat. Loves harmony, partnerships, and social grace. High aesthetic sense.",
    8:  "Intense and transformative love. Secretive or deep artistic interests. Occult beauty.",
    9:  "Loves wisdom, philosophy, and travel. Ethical and truth-seeking in relationships.",
    10: "Graceful and balanced career. Professional success through magnetism and alliances.",
    11: "Loves social circles and large networks. Success in groups and humanitarianism.",
    12: "Highest spiritual love and devotion. Ultimate compassion. Joy through isolation.",
  },
  Sa: {
    1:  "Serious and disciplined self. Struggles for recognition early on. Deep resilience.",
    2:  "Structured and cautious approach to wealth and speech. Values lineage and truth.",
    3:  "Serious and disciplined communicator. High focus in learning. Practical skills.",
    4:  "Reserved emotions. Cautious about house and family. Inner discipline.",
    5:  "Patient approach to creativity and children. Serious mind focused on ethics.",
    6:  "Hardworking and disciplined in service. Overcomes enemies through perseverance.",
    7:  "Balanced and serious approach to justice and partnerships. Values commitment.",
    8:  "Disciplined research. Longevity through caution. Serious approach to transformation.",
    9:  "Structured beliefs. Philosophical discipline. Values traditional wisdom and law.",
    10: "Natural leader of the system. Supreme responsibility and status through hard work.",
    11: "Structured networks and social duties. Steady gains through systematic effort.",
    12: "Disciplined spiritual practice. Serious approach to isolation and liberation.",
  },
  Ra: {
    1:  "Unconventional and obsessed with identity. High drive for self-recognition.",
    2:  "Obsessed with wealth and resources. Unusual speech or dietary patterns.",
    3:  "Innovative and boundary-pushing communication. Genius or chaotic intellect.",
    4:  "Restless at home. Unusual roots or family dynamics. Seeks emotional highs.",
    5:  "Unconventional creativity and romance. Risk-taker in speculative ventures.",
    6:  "Genius in overcoming enemies or debt. Unusual approaches to health and service.",
    7:  "Unconventional partnerships. High magnetism. Obsessed with social status.",
    8:  "Deep occult obsession. Innovative approaches to transformation and longevity.",
    9:  "Unconventional philosophical or religious views. Loves foreign wisdom.",
    10: "Highest drive for power/status. Innovative and boundary-breaking career.",
    11: "Obsessed with large social circles and technological gains. Disruptive goals.",
    12: "Unusual spiritual experiences. High imagination or escaping from reality.",
  },
  Ke: {
    1:  "Detached from physical identity. Spiritual nature. May lack self-confidence.",
    2:  "Detached from wealth and family ties. Unique speech or silent wisdom.",
    3:  "Detached from local affairs. Skillful with technical or subtle logic.",
    4:  "Disconnected from physical home. Spiritual peace found within the self.",
    5:  "Detached from romance or standard creativity. Spiritual insight through past lives.",
    6:  "Internal struggle with service or enemies. Spiritual healing over physical cure.",
    7:  "Detached from worldy partnerships. Seeks a spiritual equal or prefers solitude.",
    8:  "Natural psychic ability. Profound interest in death and the afterlife.",
    9:  "Detached from organized religion. Unique spiritual path or pilgrim nature.",
    10: "Detached from public status. Prefers working behind the scenes or spiritual duty.",
    11: "Disconnected from large social groups. Solitary gains or spiritual networks.",
    12: "Natural state of moksha. Deepest spiritual detachment and void awareness.",
  }
}

/**
 * Nakshatra general interpretations
 */
export const NAKSHATRA_INTERPRETATIONS: string[] = [
  "Swift and healing energy. Naturally good at starting new ventures and bringing life and speed.",
  "Intense and disciplined. Capable of enduring great hardships to achieve transformation.",
  "Sharp and focused. Precision-oriented and determined to cut through obstacles for truth.",
  "Nurturing and creative. Natural magnetic beauty and ability to grow material success.",
  "Searching and curious. Loves exploration and harmony; excellent for communication.",
  "Transformative and intense. Focuses on research and overcoming profound struggles.",
  "Restoring and cyclic. High ability to return and succeed after initial failure.",
  "Nourishing and stable. The most auspicious for growth, spirituality, and protection.",
  "Deeply analytical and intense. Capable of destroying illusions but may cause separation.",
  "Noble and traditional. High pride and connection to ancestors and royal dignity.",
  "Enjoying and artistic. Focused on love, relationships, and social popularity.",
  "Righteous and shining. High integrity and commitment to excellence and dharma.",
  "Practical and skillful. Master of details and manual dexterity with a helping hand.",
  "Creative and artistic. Ability to create beauty and transform materials into gems.",
  "Independent and balanced. Focuses on friendship and social harmony with high adaptability.",
  "Spreading and pervasive. High energy for achieving multiple goals through coordination.",
  "Friendly and adhering. Success through partnerships and devotion to a higher cause.",
  "Powerful and victorious. High status and desire for control and accomplishment.",
  "Deeply transformative. Focuses on root causes and removing the old to make way for new.",
  "Refreshing and invigorating. High ability to refresh others and master the element of water.",
  "Victorious and expanding. High integrity and long-lasting success in all fields.",
  "Hearing and communicative. Values wisdom and oral traditions with a high listening ability.",
  "Brilliant and musical. Loves status and wealth through creative and rhythmic effort.",
  "Healing and mysterious. Focuses on alternative healing and hidden truths of the universe.",
  "Elevating and sacrificial. Capable of deep penance and intense spiritual focus.",
  "Cosmic and unifying. High wisdom and connection to the collective consciousness.",
  "Nourishing and complete. High compassion and ability to complete journeys successfully.",
]

export function getInterpretation(p: any): string {
  const planet = p.grahaId as GrahaId
  const rashi = (Math.floor(p.degree / 30) + 1) as Rashi
  const nakIdx = p.nakshatraIndex
  const dignity = p.dignity || 'neutral'

  const signNote = SIGN_INTERPRETATIONS[planet]?.[rashi] || ""
  const nakNote = NAKSHATRA_INTERPRETATIONS[nakIdx] || ""
  const dignityNote = DIGNITY_INTERPRETATIONS[dignity] || ""
  
  return signNote ? `${signNote} ${dignityNote}` : nakNote
}
