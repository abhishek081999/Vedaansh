// ─────────────────────────────────────────────────────────────
//  src/lib/engine/rashiInterpretations.ts
//  Aries–Pisces teaching notes: core, lord, planet-in-sign,
//  sign-in-house, remedies. Educational — not medical advice.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { ClassicalGrahaId, HouseNumber } from './houseInterpretations'
import { CLASSICAL_GRAHAS } from './houseInterpretations'

export type InterpDetail = 'full' | 'summary'

export interface PlanetInSignNote {
  full: string
  summary: string
}

export interface RashiProfile {
  rashi: Rashi
  english: string
  sanskrit: string
  lord: ClassicalGrahaId
  lordHindi: string
  coreSummary: string
  coreNature: string[]
  lordSummary: string
  lordNotes: string[]
  planetInSign: Record<ClassicalGrahaId, PlanetInSignNote>
  /** This rashi occupying house N from Lagna */
  inHouse: Record<HouseNumber, string>
  remedies: string[]
  specialRules: string[]
}

const H = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function pin(
  entries: Partial<Record<ClassicalGrahaId, PlanetInSignNote>> & {
    Su: PlanetInSignNote
    Mo: PlanetInSignNote
    Ma: PlanetInSignNote
    Me: PlanetInSignNote
    Ju: PlanetInSignNote
    Ve: PlanetInSignNote
    Sa: PlanetInSignNote
    Ra: PlanetInSignNote
    Ke: PlanetInSignNote
  },
): Record<ClassicalGrahaId, PlanetInSignNote> {
  return entries
}

function houses(map: Record<HouseNumber, string>): Record<HouseNumber, string> {
  for (const h of H) {
    if (!map[h]) throw new Error(`Missing inHouse ${h}`)
  }
  return map
}

export const RASHI_PROFILES: Record<Rashi, RashiProfile> = {
  1: {
    rashi: 1, english: 'Aries', sanskrit: 'Mesha', lord: 'Ma', lordHindi: 'Mangal',
    coreSummary: 'Initiator fire: sudden problem-solving, action bursts, needs guidance, and heat to create anything new.',
    coreNature: [
      'Logistics of sudden energy—solves problems logically, often without prior experience.',
      'Primary function is to initiate; overly strong Aries acts first and thinks later.',
      'Consistency comes in spikes, not steady burn.',
      'Wherever Aries sits, thrives under clear orders from mentor, guru, or manager.',
      'Provides heat of creation: startups, exams, childbirth, new cycles.',
    ],
    lordSummary: 'Mars is logical command energy—excellent under pressure, weaker where relationships need emotional nuance.',
    lordNotes: [
      'Army-commander archetype: tactical focus when healthy; afflicted Mars loses discipline/vision.',
      'Mars drives its own tasks; sustained team leadership still needs Sun.',
      'Saturn = road (friction), Mars = vehicle; weak Saturn + strong Mars can become reactive violence.',
      'Malefics grow assets but can isolate; benefics grow people/relationships.',
    ],
    planetInSign: pin({
      Su: { summary: 'Exalted—supplies the consistency Aries lacks.', full: 'Sun exalted in Aries provides the sustained consistency raw Aries initiation energy lacks.' },
      Mo: { summary: 'Volatile mind, sudden cancellations, psychic triggers.', full: 'Moon in Aries: volatile sentimental mind; book-then-cancel patterns; constant psychic triggers.' },
      Ma: { summary: 'Own sign—peak courage and initiator heat.', full: 'Mars in Aries: strongest initiator drive, courage, and tactical execution.' },
      Me: { summary: 'Debate skill and sarcasm; many unfinished hobbies.', full: 'Mercury in Aries: strong debate, humorous/sarcastic tone, incomplete hobbies/paperwork; afflicted may twist rules.' },
      Ju: { summary: 'Fanatic belief—aggressive counselor or strict religious lead.', full: 'Jupiter in Aries: fanatic about beliefs; aggressive counselor, temple president, or strict religious leader.' },
      Ve: { summary: 'Intense passionate love that may cool after boredom.', full: 'Venus in Aries: high passion; relationships start fiercely and may end once physical boredom sets in.' },
      Sa: { summary: 'Debilitated—pressure, delayed starts, sharp money moves.', full: 'Saturn debilitated in Aries: extreme pressure, delayed initiative, restlessness, sharp sudden financial decisions.' },
      Ra: { summary: 'Amplifies aggressive growth; watch blood/surgery stress.', full: 'Rahu in Aries amplifies growth in business/relationships aggressively; blood/clotting/surgery themes need cautious full-chart reading.' },
      Ke: { summary: 'Confused starts, anxiety, upends systems.', full: 'Ketu in Aries: distracted about when to start; anxiety; can upend systems.' },
    }),
    inHouse: houses({
      1: 'Unplanned trajectory, jack of all trades; finishing tasks is the practice.',
      2: 'Rapid speech, heavy family duty, hot/spicy food craving, quick personal assets.',
      3: 'Protective of younger siblings; erratic driving—too slow or aggressive.',
      4: 'Workaholic at home; constant renovations and car servicing.',
      5: 'Aggressive public tone; course-switching education; acid-reflux vigilance.',
      6: 'Sudden fights with enemies; high desire nature; salon/spend themes for spouse.',
      7: 'Quick into relationships; volatile marriage with regular fights if unmanaged.',
      8: 'Rapid research; sudden inheritances; won’t bow to in-laws; blood-health vigilance.',
      9: 'Multiple degrees/gurus; resists authority; strong physical drive.',
      10: 'Constant work pressure; always seeking new work domains.',
      11: 'Inventing ways to fulfill desires; multi-stock focus; gains-first talk.',
      12: 'Appearance spend; intense private life; night awakenings; sudden liberation urge.',
    }),
    remedies: [
      'Coconut breaking; Maa Bhagwati worship for new starts.',
      'Intense workouts/yoga or a strict trainer.',
      'Neem/Tulsi to cool overheated Pitta/blood.',
      'Do not waste water, electricity, or fuel.',
      'Time extreme action via Mangala Yogini + Mars in D3.',
    ],
    specialRules: [
      'Wherever Aries sits, install mentorship and clear orders.',
      'Balance Sun (orders) and Saturn (obedience).',
    ],
  },

  2: {
    rashi: 2, english: 'Taurus', sanskrit: 'Vrishabha', lord: 'Ve', lordHindi: 'Shukra',
    coreSummary: 'Field of sustained resources—wealth, lineage, hoarding, stubborn patience, fierce when threatened.',
    coreNature: [
      'Wealth, resources, family lineage, assets that fund what Aries starts.',
      'Parashurama protectiveness + Nandi patience; strong memory for insults.',
      'Wherever Taurus sits is where you hide/store/accumulate resources.',
    ],
    lordSummary: 'Venus is bhakti, grooming/self-worth, ojas/recovery—and natural family-vs-spouse friction (Taurus/Libra 6/8).',
    lordNotes: [
      'Devotion requires faith into the unknown (exaltation lore in Pisces).',
      'Afflicted Venus: poor grooming/self-worth look despite wealth.',
      'Shukravanshi lore: Venus in lagna or Venus–Saturn ~3°—elders’ chronic leg/foot pain theme.',
      'Polite speech protects wealth; harsh speech drains 2nd/8th/11th.',
    ],
    planetInSign: pin({
      Su: { summary: 'Proud resource authority; distribution/medicine lean.', full: 'Sun in Taurus: authoritative over resources; medicine/hot liquids/distribution themes.' },
      Mo: { summary: 'Sweet fluctuating speech and emotional promises.', full: 'Moon in Taurus: emotional sweet speech; fluctuating promises.' },
      Ma: { summary: 'Commander-tone speech—harsh, goal-oriented.', full: 'Mars in Taurus: authoritative, harsh, disciplined, goal-oriented speech.' },
      Me: { summary: 'Chatty business/math connective talk.', full: 'Mercury in Taurus: chatty, humorous, diplomatic; business/math/connecting people.' },
      Ju: { summary: 'Philosophical moral speech.', full: 'Jupiter in Taurus: philosophical speech on religion, morals, high concepts.' },
      Ve: { summary: 'Own sign—beauty/brand speech; strong resource magnetism.', full: 'Venus in Taurus: polite beauty/brand speech; strong resource magnetism.' },
      Sa: { summary: 'Slow past-focused speech; may conceal truths.', full: 'Saturn in Taurus: slow speech about the past; tendency to hide truths.' },
      Ra: { summary: 'Unconventional speech/sounds while talking/eating.', full: 'Rahu in Taurus: unconventional words; odd sounds; eyes-closed speech habits.' },
      Ke: { summary: 'Few words; stammering or incomplete sentences.', full: 'Ketu in Taurus: few words; stammering or unfinished sentences.' },
    }),
    inHouse: houses({
      1: 'Identity built on stability, comfort, and resource security.',
      2: 'Core vault—family assets and speech define the life theme.',
      3: 'Skills/siblings/short travel become the storehouse of pride.',
      4: 'Wealth hidden at home or with mother; property as vault.',
      5: 'Resources via children, education, romance, speculation.',
      6: 'Service/debt arena concentrates asset fights and repairs.',
      7: 'Spouse/partners are the vault—balance family vs marriage.',
      8: 'Hidden wealth, inheritance, in-law resources; slow money knots.',
      9: 'Fortune/father/guru channel long-term dharma funding.',
      10: 'Career as treasury—status through resource management.',
      11: 'Networks/gains are the accumulation field.',
      12: 'Expenses/foreign/isolation redirect or drain stored resources.',
    }),
    remedies: [
      'Spotless home and grooming—Venus hates filth.',
      'Speak politely to protect resources and inheritances.',
      'Natural water baths for 2nd-house Moon/Ketu speech blocks.',
      'Respect the feminine; practice devotion over hoarding.',
    ],
    specialRules: [
      '2nd-house planets color voice and conversation topics.',
      'Ascendant’s 2nd sign shows what you naturally talk about.',
    ],
  },

  3: {
    rashi: 3, english: 'Gemini', sanskrit: 'Mithuna', lord: 'Me', lordHindi: 'Budh',
    coreSummary: 'Communication circuits, hobbies, neighborhood CPU—copies the guru, then innovates; multiplies by three.',
    coreNature: [
      'Pre-set notions make listening hard—reply forms early.',
      'Hobbies, driving, subconscious processing, lifestyle, neighborhood.',
      'Self-focused sadhak energy unless personally interested.',
      'Copy → unique mastery pathway.',
    ],
    lordSummary: 'Mercury needs a base planet, rules ages 3–12, multiplies themes by three, and can mark grandparent upbringing.',
    lordNotes: [
      'Alone Mercury struggles for footing—pair with Sun/Venus etc.',
      'Enemy relative: house Mercury rules + malefics → critic from that relative.',
      'Mercury MD early years: austerity before mastery.',
      '3rd lord’s house shows fame/stripes arena.',
      'Malefics in 3rd/Gemini: avoid being the aggressive middleman.',
    ],
    planetInSign: pin({
      Su: { summary: 'Disciplined manager with authorities.', full: 'Sun in Gemini: disciplined work with higher authorities; managing skill.' },
      Mo: { summary: 'Dual mind; mother themes; hot-cold attachments.', full: 'Moon in Gemini: dual mind, calculation slips, mother health, hot-cold attachments.' },
      Ma: { summary: 'Sharp debater; afflicted may bend rules.', full: 'Mars in Gemini: sharp logic/debate; afflicted may mold rules for profit; skin stress.' },
      Me: { summary: 'Own sign—peak curiosity and multi-skill talk.', full: 'Mercury in Gemini: peak communicative curiosity and multi-hobby intellect.' },
      Ju: { summary: 'Chatter can unsettle Jupiter’s stillness.', full: 'Jupiter in Gemini: reactive chatter/boasting can reduce mental stillness.' },
      Ve: { summary: 'Art, writing, fashion; multiple partners possible.', full: 'Venus in Gemini: technical art, writing, singing, luxury; coded speech; multiple partners possible.' },
      Sa: { summary: 'Auditor/critic; old records; intimacy caution on 1/7.', full: 'Saturn in Gemini: fault-finding auditor energy; old books/records; 1/7 without Mars may strain intimacy.' },
      Ra: { summary: 'Hacker/coder/marketer systems energy.', full: 'Rahu in Gemini: hackers, coders, fraud analytics, marketing hype; open-source systems.' },
      Ke: { summary: 'Encrypted investigator; stammering possible.', full: 'Ketu in Gemini: encrypted investigation; stammering; deep observation.' },
    }),
    inHouse: houses({
      1: 'Curiosity, mediator role, questions illogical rituals; outsider-in-family feel.',
      2: 'Family connective speech; later docs/disputes possible; liquid investments.',
      3: 'Awards competitiveness; school/stationery neighborhood; selective listening; docs in threes.',
      4: 'Humorous creative mother; documentation anxiety; mood in clothes/wallpapers.',
      5: 'Color-coded notes; rule of three; Plan B mind; Ed-Tech/news fit.',
      6: 'Accounting/audit/coding creator-for-others; employment mentoring.',
      7: 'Early relating; chameleon mirroring; youthful spouse; partner keeps docs.',
      8: 'Secretive researcher; sibling delays; silent mentor; secret-keeper burden.',
      9: 'Eclectic faith; craft-master worship; multi-education; argumentative father themes.',
      10: 'Communication/sales/marketing/brokerage career; early earning; commissions.',
      11: 'Fluid friends; stock tips→caution; private workplace romances possible.',
      12: 'Lost travel paperwork; tech/gaming spend; loses keys/passwords; creative over rigid corp.',
    }),
    remedies: [
      'Give Mercury a solid “base” (mentor, brand, authority).',
      'Avoid escalating messenger roles under 3rd malefics.',
      'Use the 3rd lord’s house consciously for recognition.',
    ],
    specialRules: [
      'Neighborhood flavor follows planets in 3rd/Gemini.',
      'Mercury multiplies by three what it strongly influences.',
    ],
  },

  4: {
    rashi: 4, english: 'Cancer', sanskrit: 'Karka', lord: 'Mo', lordHindi: 'Chandra',
    coreSummary: 'Ocean of mother-mind and rasa—absorbs environment; logic fails; 10th-from-Moon shows true desire.',
    coreNature: [
      'Mother, emotional body, subconscious depth—fluid mechanics.',
      'Mars debilitates: emotion won’t obey rigid logic.',
      'If rasa is killed, emptiness despite material success.',
      'Passive water anger: deep grudges, not loud first strikes.',
      'Liberal multi-perspective mind—hard to take absolute sides.',
    ],
    lordSummary: 'Moon is a sponge; dashas run through the absorbing mind; protect childhood Moon and clean company.',
    lordNotes: [
      'Toxic company → depression/illness via absorption.',
      'Childhood nazar/illness lore for strong Moon/Cancer lagna.',
      'Remedy lore: silver half-moon, peacock feathers.',
      '10th from Moon = career the mind wants vs Lagna 10th = duty.',
    ],
    planetInSign: pin({
      Su: { summary: 'Care-authority; NGO/public-mass lean.', full: 'Sun in Cancer: authority through care; NGO/social-mass themes.' },
      Mo: { summary: 'Own sign—peak psychic mood and mother bond.', full: 'Moon in Cancer: strongest absorbent emotional mind; psychic mother bond.' },
      Ma: { summary: 'Debilitated heat—BP, impulsiveness, territory.', full: 'Mars debilitated in Cancer: BP, aggression, “want it now,” territorial when displeased.' },
      Me: { summary: 'Dual mind; mother health; hot-cold bonds.', full: 'Mercury in Cancer: dual mind, calculation slips, mother health themes.' },
      Ju: { summary: 'Gajakesari calm—counselor, people network.', full: 'Jupiter in Cancer (exalted lore): bounds the Moon; counselor; large network.' },
      Ve: { summary: 'Beauty/luxury/food; mother–spouse friction.', full: 'Venus in Cancer: beauty, luxury, food; mother–spouse emotional fights possible.' },
      Sa: { summary: 'Dry emotions, practical grind, monk lean.', full: 'Saturn in Cancer: crushed/dry emotions; practical organizers; traditional/monk lean.' },
      Ra: { summary: 'Illusions/obsession; strangers help more than family.', full: 'Rahu in Cancer: illusions/obsession; alone-in-crowd; strangers help more than exhausted family.' },
      Ke: { summary: 'Monk mind; choosy food; plain aesthetics.', full: 'Ketu in Cancer: introspective monk; choosy food; plain clothes; acoustic spiritual music.' },
    }),
    inHouse: houses({
      1: 'Glowing face, moody psychic; health drops when hurt; may distance later.',
      2: 'Psychic family waves—starts well, complex dynamics later.',
      3: 'Ears over eyes—rumors; hides docs; sibling vigilance; short travels.',
      4: 'Digbala themes; deep mother bond; public/NGO love; may hide address.',
      5: 'Emotional education/children struggles; eats while studying; course hops.',
      6: 'Anxiety, mother health, processed food→illness; home verbal fights.',
      7: 'Obsessive partner pursuit for peace; changing partners if uncontained.',
      8: 'Paces when stressed; inherited BP lore; food-industry career possible.',
      9: 'May hide highest degree; emotional father bond; tears at first meeting.',
      10: 'Moody/seasonal work; may hide an income; vulnerability to get roles.',
      11: 'Elder-sibling emotion; unending desires; hides true price tags.',
      12: 'Night zoning-out; grandmother intuition; strong premonitions.',
    }),
    remedies: [
      'Keep emotional company clean—Moon absorbs it.',
      'Honor mother and rasa (joy, herbs, nectar).',
      'Protective Moon practices (silver half-moon lore) as culturally fit.',
    ],
    specialRules: [
      'Always check 10th from Moon for true mental vocation.',
      'Water-sign anger is delayed and strategic.',
    ],
  },

  5: {
    rashi: 5, english: 'Leo', sanskrit: 'Simha', lord: 'Su', lordHindi: 'Surya',
    coreSummary: 'Throne of status, morality, lineage, and sacrifice—Sun the giver; envy is the fall.',
    coreNature: [
      'Position, power, fame, lineage—status the soul desires.',
      'Sun = soul, ego, morality, father, government, punya.',
      'Morality over pure logic; envy drops one from Surya-loka.',
      'Strong Sun gives endlessly and refuses bribery.',
    ],
    lordSummary: 'Suryavanshi patterns and Sun age cycles (16/28/40…; sacrifice 14/26/38…) shape results.',
    lordNotes: [
      'Suryavanshi: Sun in lagna, Leo lagna, Sun–Saturn conjunct, or AL with Sun.',
      'Age 38 (and 14/26/50/62): sacrifice demands from spouse/house of Sun.',
      'Favorable ages if clean: 16,28,40,52,64; stressful 36–42.',
      'Age 25 = 9th-from-Sun results.',
      'Take advice from the relative of the house where Sun sits.',
    ],
    planetInSign: pin({
      Su: { summary: 'Own sign—throne managers/politicians/leaders.', full: 'Sun in Leo: peak authority; managers, politicians, corporate leaders.' },
      Mo: { summary: 'Royal emotions needing warm recognition.', full: 'Moon in Leo: emotional pride and need for warm recognition.' },
      Ma: { summary: 'Warrior defense of status and dharma.', full: 'Mars in Leo: courageous leadership defending throne and dharma.' },
      Me: { summary: 'Proud intellect; combust lagna body lore possible.', full: 'Mercury in Leo: intelligent management; combust-in-lagna lore—square body, large forehead.' },
      Ju: { summary: 'Dharmic king-counselor.', full: 'Jupiter in Leo: wise authority and dharmic counsel from status.' },
      Ve: { summary: 'Pride in beauty/arts; status–relationship tradeoffs.', full: 'Venus in Leo: pride in beauty/arts; relationship sacrifices for status possible.' },
      Sa: { summary: 'Hard-won delayed authority.', full: 'Saturn in Leo: authority through grind; delayed serious status.' },
      Ra: { summary: 'Status obsession; backdoor methods risk.', full: 'Rahu in Leo: status obsession; backdoor problem-solving risk.' },
      Ke: { summary: 'Detached from throne games; leaves outcomes to God.', full: 'Ketu in Leo: detached from status games; blind-faith problem release.' },
    }),
    inHouse: houses({
      1: 'Self as moral achiever—talks own sacrifice and excellence.',
      2: 'Proud talk of lineage, truth, morality, fine food.',
      3: 'Boasts travel, siblings, hobbies, high-status neighbors.',
      4: 'Shows home, interiors, VIP guests, lineage.',
      5: 'Talks children, schools, mantras, maternal lineage.',
      6: 'Talks workplace fights, authorities, maternal uncle.',
      7: 'Obsessed talk of spouse, royal partnerships, image.',
      8: 'Talks inheritances, methods, helping spouse’s family.',
      9: 'Proud of guru, religion, managing sacred activity.',
      10: 'Boasts big orgs, workplace centrality, advising boss.',
      11: 'Talks earnings, desires fulfilled, influential friends.',
      12: 'Talks donations, spend on family, hard work with father.',
    }),
    remedies: [
      'Practice joy in others’ success—kill envy.',
      'Give without bribery; Sun is the giver.',
      'Take advice from the relative of Sun’s house.',
    ],
    specialRules: [
      'Wherever Leo sits is what you proudly talk about.',
      '5th-house planet shows problem-solving style.',
      'Rajyoga lore: 9–10 conjunct; 5↔10 exchange; Ju–Sa conjunct.',
    ],
  },

  6: {
    rashi: 6, english: 'Virgo', sanskrit: 'Kanya', lord: 'Me', lordHindi: 'Budh',
    coreSummary: 'Sevak SOP sign—zero intuition, nit-picking creates debt/disease/enemies; clean desk heals.',
    coreNature: [
      'Hands-on service, admin, law-and-order logistics.',
      'Opposite Pisces—intuition ≈ 0; everything is procedure.',
      'Exam success via syllabus obedience, not guessing.',
      'Criticism wherever Virgo sits creates roga/rina/shatru.',
      'Physical echo: intestines/digestion when chronically critical.',
    ],
    lordSummary: 'Analytical Mercury peak—serve silently; stop grammar-policing and partner price-tagging.',
    lordNotes: [
      'Golden rule: wherever Virgo sits—STOP JUDGING.',
      '6th-sign people help you; 12th/Pisces area = faith-only help.',
      'Messy study/dressing table afflicts Virgo; Japanese-clean desk helps.',
    ],
    planetInSign: pin({
      Su: { summary: 'Don’t nitpick father/boss—serve silently.', full: 'Sun in Virgo: judging father/manager damages position; silent service improves it.' },
      Mo: { summary: 'Don’t judge mother—protect comfort.', full: 'Moon in Virgo: fault-finding toward mother destroys emotional comfort.' },
      Ma: { summary: 'Avoid sibling fights—property conflict risk.', full: 'Mars in Virgo: abusing younger siblings leads to land/property fights.' },
      Me: { summary: 'Own/exalted analysis—drop constant corrections.', full: 'Mercury in Virgo: peak analysis; avoid constantly correcting others’ speech.' },
      Ju: { summary: 'Critical of gurus—needs practical teachers.', full: 'Jupiter in Virgo: finds faults in gurus/texts; needs practical teachers.' },
      Ve: { summary: 'Debilitated—stop price-tagging partners.', full: 'Venus debilitated in Virgo: judges partners by worth/brands; accept imperfections.' },
      Sa: { summary: 'Natural servant—respect elders and juniors.', full: 'Saturn in Virgo: good service placement; don’t disrespect elderly/workers.' },
      Ra: { summary: 'Obsessive fault/data loops in service.', full: 'Rahu in Virgo: obsessive nitpick/data loops around service and health.' },
      Ke: { summary: 'Detached critic or incomplete service.', full: 'Ketu in Virgo: detached criticism or incomplete follow-through in service.' },
    }),
    inHouse: houses({
      1: 'Critical self/others—drop inferiority judgments to avoid stagnation.',
      2: 'Critical of food/family money—soften speech to protect gut/throat.',
      3: 'Don’t fault siblings/neighbors; detailed SOPs; road-rage critique risk.',
      4: 'Nitpicking home/property; don’t judge mother/domestic space.',
      5: 'Criticism harms children/romance/education; dental echo lore for mother.',
      6: 'Classic seat—don’t fault workplace/mama/sick; clean diet for intestines.',
      7: 'Marriage nitpicking; practical spouse vs intuitive partner clash.',
      8: 'In-law fault-finding; obsessed with exact data/timelines.',
      9: 'Small grudges with father/gurus/belief systems.',
      10: 'Workplace grind with constant corrections from managers.',
      11: 'Faults friends → shrinking circle.',
      12: 'Isolation mind runs grudges/plans—practice letting go in sleep.',
    }),
    remedies: [
      'Stop judging in the Virgo house to shrink disease/debt/enemies.',
      'Keep workspace meticulously clean.',
      'Serve without superiority.',
    ],
    specialRules: [
      'Virgo criticism actively creates 6th-house problems.',
      'Sign in 6th = helpers; sign in 12th = no human help.',
    ],
  },

  7: {
    rashi: 7, english: 'Libra', sanskrit: 'Tula', lord: 'Ve', lordHindi: 'Shukra',
    coreSummary: 'Diplomacy and choice—win-win only; stubborn domination in Libra areas brings downfall; public image house.',
    coreNature: [
      'Creative Venus diplomacy vs Taurus material Venus.',
      'Movable choice sign—decisions by preference, not only survival/comfort.',
      'You cannot “win” Libra—compromise is mandatory.',
      'Natural 7th: public perception (e.g. Jupiter here → “saint” image).',
      'Balance Libra’s house with Venus’s house lifelong.',
    ],
    lordSummary: 'Venus diplomacy; debilitated Sun ego-clashes; exalted Saturn decides slowly; love marriage needs filters.',
    lordNotes: [
      'Stubbornness in Libra dasha/house → severe losses.',
      'Venus in 7th: own-choice love marriage often picks wrong partner—use family filter.',
      'Paribhraman year of Libra house = free-will choice year.',
      'Curd in morning lore for clearer decisions; perfume offerings to Radha-Krishna.',
      'Emerald lore when Sun kills couple communication.',
    ],
    planetInSign: pin({
      Su: { summary: 'Debilitated—ego vs equality; rarely gets demanded respect.', full: 'Sun debilitated in Libra: authority ego clashes with equality; donate to ancestors; Rama/Surya worship lore.' },
      Mo: { summary: 'Indecisive; boredom with partner; many romantic pulls.', full: 'Moon in Libra: decision struggles; boredom with partner; seeks peace through partnerships unstably.' },
      Ma: { summary: 'My-way Mars destroys diplomacy—fight/divorce risk.', full: 'Mars in Libra: aggression vs diplomacy; hasty relationship decisions; Lakshmi-Narasimha/sandalwood lore.' },
      Me: { summary: 'Networking love; early/multiple superficial bonds.', full: 'Mercury in Libra: relationships as trade/network; early bonds; intimacy dilution risk.' },
      Ju: { summary: 'Good image; leaves rocky marriage outcomes to God.', full: 'Jupiter in Libra: supportive spouse/image; ethical; leaves troubles to divine will.' },
      Ve: { summary: 'Own sign—refined diplomat; still filter love choices.', full: 'Venus in Libra: refined diplomacy; if in 7th, don’t marry on attraction alone.' },
      Sa: { summary: 'Exalted—slow, careful partnership decisions.', full: 'Saturn exalted in Libra: meticulous weighing before commitment; no rush.' },
      Ra: { summary: 'Material partnerships thrive; keep ethics clean.', full: 'Rahu in Libra: multiple partnerships/social activity; quick decisions; manipulation risk.' },
      Ke: { summary: 'Partnership dissatisfaction; fakir detachment; hard cutoffs.', full: 'Ketu in Libra: dissatisfaction in marriage/intimacy; ascetic lean; instant cutoffs when hurt.' },
    }),
    inHouse: houses({
      1: 'Diplomatic, hard to say no; image anxiety; relationships remake personality.',
      2: 'Polite speech, fine dining; family-vs-partner choice tension; partnership income.',
      3: 'Neighborhood romance lore; sweet talk/songs; luxury gadgets; partner calls.',
      4: 'Home displays status; beautiful mother; slow food/house choices; home office.',
      5: 'Diplomatic speech; early romance; love-marriage strength; branded living room.',
      6: 'Job–marriage conflict; friendly with juniors; deal-making work; post-marriage job shifts.',
      7: 'Win-win business; marriage is a choice—don’t dominate; multi-income father lore.',
      8: 'Affair risk = debt; in-laws decide marital happiness; occult after heartbreak; gut for secrets.',
      9: 'Indecisive higher studies; devoted to father/gurus; pair-deity worship; marriage lifts fortune.',
      10: 'Famous/opposite-gender workplaces; beauty/finance/oil deals; spouse steers career.',
      11: 'Gains via women; workplace romance; online shopping; elder sibling luck with friction.',
      12: 'Spend on partner; luxurious bedroom; post-marriage renovate; spiritual trips with mother.',
    }),
    remedies: [
      'Create win-win; never try to defeat the Libra-house person/area.',
      'Curd for cooler clearer decisions; perfume/dress deities beautifully.',
      'Balance Venus’s house with Libra’s house consciously.',
    ],
    specialRules: [
      'Libra year (Paribhraman) activates free-will choices.',
      'Public image ≠ private truth—read with full chart.',
    ],
  },

  8: {
    rashi: 8, english: 'Scorpio', sanskrit: 'Vrishchik', lord: 'Ma', lordHindi: 'Mangal',
    coreSummary: 'Deep memory and hidden roots—unsolvable-seeming problems, suppressed emotion, magnet for opposites, unearned wealth.',
    coreNature: [
      'Trauma/deep memory among water signs; fright in the dark.',
      'Problems from Scorpio often feel rootless/unsolvable for long.',
      'Suppression then burst; hard to judge planets here accurately.',
      'Magnet: attracts 7th-from-Scorpio significations.',
      'Opposite Taurus: unearned wealth (inheritance, insurance, windfalls).',
    ],
    lordSummary: 'Mars–Ketu co-rulership: action vs headless anxiety—lion vs barking dog friction; fakir principle for Ketu.',
    lordNotes: [
      'Rahu in Scorpio amplifies trauma/illusion—handle with care.',
      'Ketu = past conquest flag; denies easy redo; damages 12th-from-itself.',
      'Act as fakir wherever Ketu sits—don’t ego-attach.',
      'Health lore: piles/anal/immune themes when severely afflicted—medical care first.',
    ],
    planetInSign: pin({
      Su: { summary: 'Hard to judge father’s true status; hidden authority tests.', full: 'Sun in Scorpio: father’s status/wealth hard to judge; hidden authority transformations.' },
      Mo: { summary: 'Deep emotional suppression; psychic intensity.', full: 'Moon in Scorpio: deep suppressed emotion; intense psychic mood cycles.' },
      Ma: { summary: 'Own co-lord—surgical research drive; controlled fight.', full: 'Mars in Scorpio: research/occult drive; controlled intensity; fights underground.' },
      Me: { summary: 'Hidden communication; hard to read true intent.', full: 'Mercury in Scorpio: educational depth/intent hard to judge; secretive analysis.' },
      Ju: { summary: 'Hidden wisdom; expands occult/transformation themes.', full: 'Jupiter in Scorpio: expands occult wisdom and transformative teaching.' },
      Ve: { summary: 'Money/relationship knots take long to untangle.', full: 'Venus in Scorpio: financial/relationship issues take long to resolve; deep passion.' },
      Sa: { summary: 'Long grind through hidden fears; chronic slow tests.', full: 'Saturn in Scorpio: long endurance through hidden fears and slow chronic tests.' },
      Ra: { summary: 'Amplifies darkness/instability—needs strong remedies.', full: 'Rahu in Scorpio: amplifies trauma/illusion; instability and self-sabotage risk—read carefully.' },
      Ke: { summary: 'Co-lord anxiety vs Mars action—inner friction.', full: 'Ketu in Scorpio: anxiety/confusion vs Mars action; deep occult pull; fakir practice.' },
    }),
    inHouse: houses({
      1: 'Mysterious introvert; secret grudges; won by non-judgmental motherly care.',
      2: 'Family absorbs dark stress; blunt cold speech when done; fermented tastes; sudden wealth swings.',
      3: 'Unsolvable neighbor issues; deep questions; bullet-point writing; love/hate obsession.',
      4: 'Deep home/mother trauma; court/property lore; rented-home emptiness; odd vastu bathrooms.',
      5: 'Unexpressed first love regret; never-ready exams; problems shift form; strong failure intuition.',
      6: 'Long grudges/revenge; toxic workplace; slow exams; hidden DNA illness lore; land fights.',
      7: 'Toxic silent anger in marriage; secret love; happiness tied to in-laws; past-life partner feel.',
      8: 'Natural home—overthinking impossible fixes; in-law opacity; research drain; gut blockage vigilance.',
      9: 'Guide for stuck people; words manifest; incomplete higher ed pain; father trauma; Bhairav/Hanuman lore.',
      10: 'Unpredictable career; held frustration then quit; research/occult/data fields; credit theft risk.',
      11: 'Hidden income obsession; toxic friends; children’s emotional distance; partner’s past stays active.',
      12: 'Fear of dark; messy bed = messy psyche; toxic exits; secret charity; old-temple luck doors.',
    }),
    remedies: [
      'Act as fakir in Scorpio/Ketu houses—release ego ownership.',
      'Kaal Bhairav, Hanuman, Narasimha, Varaha for path clarity (cultural practice).',
      'Don’t eat guilt into secrecy—therapy + chart, not only occult.',
    ],
    specialRules: [
      'Scorpio problems often hide their root—patience + research.',
      'Ketu damages the house 12th from itself.',
    ],
  },

  9: {
    rashi: 9, english: 'Sagittarius', sanskrit: 'Dhanu', lord: 'Ju', lordHindi: 'Guru',
    coreSummary: 'Hidden fire of faith—layered learning, guru trust, Vamana expansion; vows matter; Midas touch for others.',
    coreNature: [
      'Internal fire of belief vs Aries survival fire / Leo status fire.',
      'Duality in layers (school→college→masters)—don’t scatter teachers.',
      '9th demands trust/surrender more than Virgo questioning.',
      'Long-term plans sit wherever Sagittarius falls.',
    ],
    lordSummary: 'Jupiter/Vamana: small ask → life takeover; unfulfilled vows freeze progress; Kapha/faith needs katha.',
    lordNotes: [
      'Jupiter–Venus dasha: comfort vs spiritual truth conflict.',
      'Debilitated in Capricorn: doubts teachers, learns from scratch—can become harsh critics/great teachers.',
      'Retrograde Jupiter: extreme guru doubt until surrender after suffering.',
      'Don’t hop astrologers—disturbs 9th; afflicted 9th astrologer can spill malaise.',
      '9th = bosses; dasha of 6/8 from 9th = boss conflicts.',
    ],
    planetInSign: pin({
      Su: { summary: 'Dharmic authority; temple/literature lead.', full: 'Sun in Sagittarius: religion/literature/temple authority themes.' },
      Mo: { summary: 'Faithful emotional mind; needs moral story/rasa.', full: 'Moon in Sagittarius: faith-seeking emotions; needs katha and moral meaning.' },
      Ma: { summary: 'Warrior dharma; practical protective religion.', full: 'Mars in Sagittarius: warrior dharma; protective practical faith.' },
      Me: { summary: 'Teaching/debate of belief; multi-learning risk.', full: 'Mercury in Sagittarius: teaches/debates belief; avoid scattering subjects.' },
      Ju: { summary: 'Own sign—receptive philosophical elephant walk.', full: 'Jupiter in Sagittarius: highly receptive, philosophical; unbothered elephant gait lore.' },
      Ve: { summary: 'Devotional aesthetics in faith; comfort–truth tension.', full: 'Venus in Sagittarius: aesthetic devotion; tension between comfort and truth.' },
      Sa: { summary: 'Orthodox hard-work faith; late fortune.', full: 'Saturn in Sagittarius: orthodox hard work; late fortune through endurance.' },
      Ra: { summary: 'Flashy guru trap; foreign/unorthodox belief hunger.', full: 'Rahu in Sagittarius: flashy/deceptive guru risk; foreign unorthodox belief hunger.' },
      Ke: { summary: 'Isolated sadhana; crowd anxiety; unique faith path.', full: 'Ketu in Sagittarius: isolated sadhana; unique path; crowd anxiety.' },
    }),
    inHouse: houses({
      1: 'Mental fragility without daily sadhana; vows bind hard; charity elevates lineage.',
      2: 'Dignified spiritual lineage; few words with fierce proof; elevate ancestors for wealth.',
      3: 'Long-form notes; hobbies as religion; temple/school neighborhood; sibling as lucky charm.',
      4: 'Prefer green near schools/temples; layered trust; home/mother as blessing-or-block.',
      5: 'High education focus; cheating destroys status; need lifelong guru; children as past sadhana.',
      6: 'Liver/back/breath vigilance; stuck in job despite business skill; debt-to-impress-guru trap.',
      7: 'Marriage needs guru/ancestor blessings; spouse loyal/simple/deep; badhak if morality breaks.',
      8: 'Insulting father/guru triggers crises; occult after in-law pain; old dark temples; isolated learning.',
      9: 'Natural seat—respect father/guru/ancestors or ventures fail; father mirrors lineage karma.',
      10: 'Counselor/strategist identity; middleman platforms; career needs grand vision + ancestral fix.',
      11: 'Network/org leadership; clean money only; flashy guru trap; corrupt income hits family later.',
      12: 'Spend on religion/foreign; pristine spiritual bedroom; dream guidance; Gaya/Vishnupad lore.',
    }),
    remedies: [
      'Fulfill vows to deities/gurus—broken promises freeze Jupiter.',
      'Listen to spiritual stories (katha) to keep Kapha/faith.',
      'Pind daan / ancestral rites when lineage pressure shows.',
      'Prefer one deep guru over hopping.',
    ],
    specialRules: [
      'Jupiter’s aspect is Midas—often gold for others first.',
      'Dasha of 6/8 from 9th = boss troubles.',
    ],
  },

  10: {
    rashi: 10, english: 'Capricorn', sanskrit: 'Makara', lord: 'Sa', lordHindi: 'Shani',
    coreSummary: 'Endurance and thankless foundation work—crocodile grip goals, slow permanent results, anti-comfort opposite Cancer.',
    coreNature: [
      'Discipline, duty, adversity, pressure training.',
      'Thankless structural work—rarely applauded.',
      'Opposite Cancer: strips privilege; merit only.',
      'Slow permanent results—no instant Saturn fixes.',
      'Crocodile grip: won’t release the Capricorn-house goal.',
    ],
    lordSummary: 'Saturn the taskmaster—don’t panic or shortcut in Sade Sati/Saturn dasha; sweat and order appease him.',
    lordNotes: [
      'Resistance to change wherever Saturn sits.',
      'Arrogance after demise of struggle invites Daksha-like cutdown—practice gratitude/karma yoga.',
      'Hair/shoes/hygiene lore: short disciplined hair; sweat labor; clean shoe rack.',
      'Pay workers fairly or Saturn hits health/peace/lineage.',
    ],
    planetInSign: pin({
      Su: { summary: 'High-government / heavy authority grind.', full: 'Sun in Capricorn: high-ranking government/authority through grind.' },
      Mo: { summary: 'Dry practical mind; emotional comfort scarce.', full: 'Moon in Capricorn: practical dry emotions; comfort scarce; duty mind.' },
      Ma: { summary: 'Ambitious grind engine; controlled aggression at work.', full: 'Mars in Capricorn (exalted lore): ambitious controlled drive; career engine.' },
      Me: { summary: 'Serious admin intellect; slow precise communication.', full: 'Mercury in Capricorn: serious administrative intellect; precise slow speech.' },
      Ju: { summary: 'Debilitated faith—learn from scratch; doubt teachers.', full: 'Jupiter debilitated in Capricorn: doubts teachers; learns basics the hard way; can become great but harsh teachers.' },
      Ve: { summary: 'Dutiful love; delayed pleasures; structured aesthetics.', full: 'Venus in Capricorn: dutiful delayed pleasures; structured aesthetics.' },
      Sa: { summary: 'Own sign—peak endurance empire builder.', full: 'Saturn in Capricorn: peak endurance; late unshakeable structures.' },
      Ra: { summary: 'Obsessive status climb with sudden swings.', full: 'Rahu in Capricorn: obsessive climb; sudden high/low career swings.' },
      Ke: { summary: 'Detached from worldly ladder; breaks under bosses.', full: 'Ketu in Capricorn: detached from ladder; hard to work under others.' },
    }),
    inHouse: houses({
      1: 'Fear of newness; resists change; feels old young; deep judging thinker.',
      2: 'Poverty fear; obsessive saving; pessimistic speech; old possessions.',
      3: 'Communication fear; critical of siblings/neighbors; elderly neighborhood.',
      4: 'Strict mother; home as judgment more than comfort.',
      5: 'Disciplined learning; fear of humiliation; gastric/constipation vigilance.',
      6: 'Ultimate grinder—over-prepares; slow exam success via brute routine.',
      7: 'Works tirelessly for partner without appreciation; partner as taskmaster.',
      8: 'Fear of dependency; critical in-laws; long life with lingering illness lore.',
      9: 'Conflicts with father/gurus/dogma; feels lack of luck support.',
      10: 'Delayed career then massive empire through endurance.',
      11: 'Slow steady income; small reliable older friend circle.',
      12: 'Job-loss fear; better in foreign/isolated work.',
    }),
    remedies: [
      'Do not panic or shortcut under Saturn—mule work wins.',
      'Sweat through physical labor; organize shoes and washroom.',
      'Gratitude and fair pay—drop Capricorn arrogance after success.',
    ],
    specialRules: [
      'Saturn watches long—results are slow and sticky.',
      'Wherever Capricorn sits, crocodile-grip that goal.',
    ],
  },

  11: {
    rashi: 11, english: 'Aquarius', sanskrit: 'Kumbha', lord: 'Sa', lordHindi: 'Shani',
    coreSummary: 'Obsession network sign—can’t say no, grey-area gains, occult/sudden results; Rahu as Varaha discovery-at-any-cost.',
    coreNature: [
      'Natural 11th: unending desires; addictive/repetitive loops.',
      'Spilling pot / “Arab syndrome”: can’t set boundaries / can’t say no.',
      'Opposite Leo: flat networks vs throne hierarchy; grey area.',
      'Sudden occult/unconventional manifestation.',
      'Activation ages lore: 14,26,38,50,62.',
    ],
    lordSummary: 'Classically Saturn; modern predictive layer emphasizes Rahu—spinning highs/lows, show-off, enlargement, 9th-from-Rahu heartbreak sacrifice.',
    lordNotes: [
      '9th from Rahu: obsessive unpaid sacrifice then insult.',
      'Rahu retribution on cheaters in its house—long arc.',
      'Tap/touch body part of Rahu/Aquarius house (excess energy lore).',
      'Balance with Leo discipline + Taurus food regulation; Varaha/Narasimha/Rudrashtakam lore.',
      'Fasting for 6th-Rahu gut toxin themes.',
    ],
    planetInSign: pin({
      Su: { summary: 'Networked authority; unstable throne.', full: 'Sun in Aquarius: authority via networks; unstable conventional throne.' },
      Mo: { summary: 'Obsessive emotional networks; mood crowds.', full: 'Moon in Aquarius: obsessive emotional networking; crowd moods.' },
      Ma: { summary: 'Aggressive network hustle; tech/fight drive.', full: 'Mars in Aquarius: aggressive hustle through networks and tech fights.' },
      Me: { summary: 'Coding/marketing genius; hype communication.', full: 'Mercury in Aquarius: coding/marketing/systems communication; hype skill.' },
      Ju: { summary: 'Philosophical networks; org/matha leadership.', full: 'Jupiter in Aquarius: philosophical networks; large org/matha leadership.' },
      Ve: { summary: 'Network romance/business; boundary lessons.', full: 'Venus in Aquarius: networked romance/business; learn boundaries.' },
      Sa: { summary: 'Own co-lord—structured networks, late solid gains.', full: 'Saturn in Aquarius: structured networks; late solid gains through groups.' },
      Ra: { summary: 'Peak obsession/show/hype—win at any cost.', full: 'Rahu in Aquarius: peak obsession, show-off, invention, win-at-any-cost; wild swings.' },
      Ke: { summary: 'Cuts networks; occult research isolation.', full: 'Ketu in Aquarius: cuts social networks; occult research isolation.' },
    }),
    inHouse: houses({
      1: 'No patience/boundaries; mad passion; tech/network magic careers; hates orders.',
      2: 'Family money cheat risk; food/speech addictions; hoarding; karmic thief ruin lore.',
      3: 'No-filter speech; social-media fame tricks; overpromising; free open-source learning.',
      4: 'Home extremes (bar vs research lab); obsessive love-bomb then lose interest; luxury craving.',
      5: 'Mad competitive study; sudden ideas; peer-pressure yes-trap; boastful mother lore.',
      6: 'Office-politics master; can’t say no to boss; project/temp work; AI/data fit; scam vigilance.',
      7: 'Zero control over spouse; high desire; friend-circle dating; beauty/spa/event business.',
      8: 'Rule-breaking in-laws; quick risky money; father secret cash; smoke/drink with cousins; boundary in-laws.',
      9: 'Used by bosses/teachers; boastful managers; fierce deities (Bhairav→Varaha); don’t trust empty promotions.',
      10: 'Get promises in writing; hype on LinkedIn; burst contract work; hardworking unstable father lore.',
      11: 'Income swings; never happy with salary; fake friends; multi-stream hustle; online scam vigilance.',
      12: 'Blind charity; can’t say no to beggars; wild dreams; night-walker habits; selfish friend losses.',
    }),
    remedies: [
      'Varaha/Narasimha names; Rudrashtakam; mud donation lore.',
      'Regulate food (Taurus) + daily moral discipline (Leo).',
      'Intermittent/Ekadashi fasting for 6th-Rahu gut themes.',
      'Practice saying no—Aquarius spills without boundaries.',
    ],
    specialRules: [
      'Watch 9th from Rahu for unpaid obsessive sacrifice.',
      'Rahu dispositor shows life purpose vector.',
    ],
  },

  12: {
    rashi: 12, english: 'Pisces', sanskrit: 'Meena', lord: 'Ju', lordHindi: 'Guru',
    coreSummary: 'Ocean of surrender—faith over logic, ego dissolution, sleep as barometer, 10% charity, leap-of-faith dashas.',
    coreNature: [
      'Final sign: let go of Sagittarius rules into humility.',
      'Black void—walk dark on God when nets vanish.',
      'Zero logic vs Virgo SOP.',
      'Dasha of Pisces/12th: isolation, self-reliance, status strip (8th from Leo).',
      'House of Pisces = where you give and receive little human help.',
    ],
    lordSummary: 'Jupiter’s ocean—exalted Venus thrives in bhakti dark; Mercury panics without answers; sleep quality grades the 12th.',
    lordNotes: [
      '10% of income belongs to the universe—or nature takes via bills/scams.',
      'Donate by 12th-house planet/sign; always give back for services taken.',
      'Insomnia/nightmares = cleanse via service/surrender (not fear alone).',
      'Sun uncomfortable in 12th (day vs bedroom dark) lore.',
    ],
    planetInSign: pin({
      Su: { summary: 'Ego uncomfortable in isolation; status strips in private.', full: 'Sun in Pisces/12th: uncomfortable; daytime-conception lore; status risks in isolation.' },
      Mo: { summary: 'Psychic dreams; emotional surrender; grandmother tides.', full: 'Moon in Pisces: psychic dreams; emotional surrender; deep tides.' },
      Ma: { summary: 'Aggression in private/isolation—cool the bedroom fire.', full: 'Mars in Pisces: aggression in isolation/bedroom; cool with sadhana/charity.' },
      Me: { summary: 'Debilitated logic panic—or gifted silent absorption.', full: 'Mercury debilitated in Pisces: logic panics; well-placed becomes deep listener of philosophy.' },
      Ju: { summary: 'Own ocean—peaceful isolated green home craving.', full: 'Jupiter in Pisces: peaceful isolation, greenery, faith without noise.' },
      Ve: { summary: 'Exalted bhakti—devotion without needing physical proof.', full: 'Venus exalted in Pisces: bhakti eyes; thrives in dark faith and grace.' },
      Sa: { summary: 'Ascetic isolation grind; sleep under duty fear.', full: 'Saturn in Pisces: ascetic isolation grind; sleep pressed by duty fears.' },
      Ra: { summary: 'Obsessive foreign/isolation fantasies; scam vigilance.', full: 'Rahu in Pisces: obsessive foreign/isolation fantasies; addiction/scam vigilance.' },
      Ke: { summary: 'Moksha lean; sleep/intimacy detachment; deep sixth sense.', full: 'Ketu in Pisces: moksha lean; sleep/intimacy detachment; strong sixth sense.' },
    }),
    inHouse: houses({
      1: 'Personality grows by faith/giving; dumpers seek you; forgive; resist rigid 9–5; avoid opportunists.',
      2: 'Spiritual lineage; liberating speech; never curse; build clean property; love may cost lineage.',
      3: 'Share with siblings/neighbors; solitude cures drain; stage blank fear; long passion projects.',
      4: 'Leave comfort/homeland for purpose; heart for divine; minimalist near spiritual centers.',
      5: 'Secret sponsorship of love/students; sacrifice romance for fame regret; Vedic shift liberates.',
      6: 'Solo workplace solving; faith quit lore; lending trauma; destiny strangers help.',
      7: 'Marriage/business only by divine will + total trust; zero practical partner reliance.',
      8: 'Occult spend; sudden scholarships; isolate to succeed; in-laws distance with Ketu.',
      9: 'Blind-faith teachers; self-fund education; luck via pilgrim camps; leave birthplace.',
      10: 'Build others’ wealth first—secure commission; career via devotion not over-analysis.',
      11: 'Help networks who hide secrets; spend on children’s weddings; independent income when active.',
      12: 'Natural seat—let people leave; donate for sleep peace; foreign/pilgrim spend; self-reliant losses.',
    }),
    remedies: [
      'Donate ~10% or nature extracts; target by 12th planet.',
      'Deep sleep practice + selfless service for nightmare/insomnia patterns.',
      'Read Ramayana/Gita; travel quiet sacred places; forgive and don’t keep ledgers of help.',
    ],
    specialRules: [
      'Sleep quality is the barometer of Pisces/12th.',
      'Pisces dasha strips ego and human help—trust the current.',
    ],
  },
}

// ── Helpers ──────────────────────────────────────────────────

export function getRashiProfile(rashi: number): RashiProfile | null {
  if (rashi < 1 || rashi > 12) return null
  return RASHI_PROFILES[rashi as Rashi]
}

export function getRashiCoreSummary(rashi: number): string | null {
  return getRashiProfile(rashi)?.coreSummary ?? null
}

export function getRashiInHouse(rashi: number, house: number): string | null {
  const p = getRashiProfile(rashi)
  if (!p || house < 1 || house > 12) return null
  return p.inHouse[house as HouseNumber] ?? null
}

export function getPlanetInSign(
  grahaId: string,
  rashi: number,
  detail: InterpDetail = 'summary',
): string | null {
  if (!(CLASSICAL_GRAHAS as string[]).includes(grahaId)) return null
  const p = getRashiProfile(rashi)
  if (!p) return null
  const note = p.planetInSign[grahaId as ClassicalGrahaId]
  if (!note) return null
  return detail === 'full' ? note.full : note.summary
}

export function rashiForHouseFromLagna(ascRashi: number, house: number): Rashi {
  return ((((ascRashi - 1 + house - 1) % 12) + 1) as Rashi)
}

export function listOccupiedRashis(grahas: { id: GrahaId; rashi: Rashi }[]): Rashi[] {
  const set = new Set<Rashi>()
  for (const g of grahas) {
    if ((CLASSICAL_GRAHAS as string[]).includes(g.id)) set.add(g.rashi)
  }
  return [...set].sort((a, b) => a - b)
}
