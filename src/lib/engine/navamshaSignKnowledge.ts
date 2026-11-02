// ─────────────────────────────────────────────────────────────
//  src/lib/engine/navamshaSignKnowledge.ts
//  Knowledge base for the 12 Navamsha (D9) signs — planet-in-sign
//  readings, D1-source-sign flavours, atmakaraka themes, remedies.
//  Distilled from the Navamsha lecture series (Aries → Pisces).
//  Pure data — no React / DB imports.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

export type NavamshaElement = 'fire' | 'earth' | 'air' | 'water'

export interface NavamshaSignProfile {
  sign: Rashi
  /** Short title e.g. "The Battlefield" */
  title: string
  keywords: string[]
  /** Core nature of this navamsha — what any planet here is asked to do */
  essence: string
  /** What happens when the sign is weak / afflicted */
  shadow: string
  /** Deity / remedy flavour taught for planets in this navamsha */
  remedy: string
  /** One-line guidance for living this navamsha well */
  guidance: string
  /** Planet-specific readings in this navamsha */
  planets: Partial<Record<GrahaId, string>>
  /** Flavour by the D1 sign the planet comes from (specific overrides) */
  fromSign?: Partial<Record<Rashi, string>>
  /** Flavour by the element of the D1 sign (fallback) */
  fromElement?: Partial<Record<NavamshaElement, string>>
  /** Readings keyed by the D9 house this sign falls in (counted from D9 lagna) */
  inHouse?: Partial<Record<number, string>>
  /** Age milestones taught for this navamsha */
  ages?: { age: number; note: string }[]
}

export const SIGN_ELEMENT: Record<Rashi, NavamshaElement> = {
  1: 'fire', 2: 'earth', 3: 'air', 4: 'water',
  5: 'fire', 6: 'earth', 7: 'air', 8: 'water',
  9: 'fire', 10: 'earth', 11: 'air', 12: 'water',
}

/** Generic D1-source flavours shared by most navamshas. */
export const SOURCE_SIGN_GENERIC: Record<Rashi, string> = {
  1: 'Arrives from Aries — results come after initiative, fights and physical effort; you start it yourself.',
  2: 'Arrives from Taurus — carries family, food, speech and accumulated resources into this navamsha.',
  3: 'Arrives from Gemini — communication, siblings, neighbours, papers and skills colour the result.',
  4: 'Arrives from Cancer — mother, home, land and emotional comfort are the channel of results.',
  5: 'Arrives from Leo — authority, lineage, fame and the blessings of father/elders flow in.',
  6: 'Arrives from Virgo — brings roga-rina-shatru (disease, debt, disputes) of the lineage along with the result; handle health and loans carefully.',
  7: 'Arrives from Libra — partners, spouse and business associates deliver (or demand) the result.',
  8: 'Arrives from Scorpio — trauma, inheritance, hidden money and transformation are the route.',
  9: 'Arrives from Sagittarius — father, guru, dharma and reputation of the lineage open doors.',
  10: 'Arrives from Capricorn — hard work, industry and practical structures produce the result; heavy but lasting.',
  11: 'Arrives from Aquarius — networks, groups, social media; watch for cheating given or received.',
  12: 'Arrives from Pisces — blessings, charity, foreign lands, import-export and surrender bring the result.',
}

/** What each planet represents — used to build sentences. */
export const GRAHA_SIGNIFIES: Partial<Record<GrahaId, string>> = {
  Su: 'authority, father, status and self-confidence',
  Mo: 'mind, mother, food, comfort and emotional security',
  Ma: 'courage, land, siblings, body and execution',
  Me: 'speech, papers, trade, younger relatives and learning',
  Ju: 'guru, wisdom, children, ethics and grace',
  Ve: 'spouse, money, beauty, luxury and pleasures',
  Sa: 'work, servants, discipline, time and karma',
  Ra: 'obsession, technology, foreigners, social media and ambition',
  Ke: 'detachment, research, spirituality and release',
}

/** D9 house meanings (counted from D9 lagna). */
export const D9_HOUSE_THEME: Record<number, string> = {
  1: 'your own body, nature and how you live this energy',
  2: 'family, speech, food and resources',
  3: 'siblings, skills, courage, hands and the subconscious',
  4: 'mother, home, heart and inner comfort',
  5: 'children, students, intelligence and romance',
  6: 'service, workplace, debts, disease and competitors',
  7: 'spouse, partners and the people who judge you',
  8: 'in-laws, trauma, secrets and sudden turns',
  9: 'father, guru, fortune and dharma',
  10: 'career, authority and public work',
  11: 'gains, friends, groups and desires',
  12: 'expenses, sleep, bed-pleasures, foreign lands and liberation',
}

/** Classical exaltation / debilitation per sign, used for atmakaraka reading. */
export const EXALTED_IN: Partial<Record<Rashi, GrahaId>> = {
  1: 'Su', 2: 'Mo', 4: 'Ju', 6: 'Me', 7: 'Sa', 10: 'Ma', 12: 'Ve',
}
export const DEBILITATED_IN: Partial<Record<Rashi, GrahaId>> = {
  1: 'Sa', 4: 'Ma', 6: 'Ve', 7: 'Su', 8: 'Mo', 10: 'Ju', 12: 'Me',
}

/** Qualities that appear (if exalted) or go missing (if debilitated). */
export const GRAHA_QUALITIES: Partial<Record<GrahaId, string>> = {
  Su: 'leadership, decisive self-confidence, the courage to say no and to lead from the front',
  Mo: 'comfort, food, home, emotional nourishment and abundant resources',
  Ma: 'logic, crisis management, finishing targets on time and protecting land/siblings',
  Me: 'calculation, negotiation, profit-and-loss sense, paperwork and selling',
  Ju: 'faith, long vision, happiness from children and wisdom',
  Ve: 'self-worth, appreciation of beauty, joy in relationships and money sense',
  Sa: 'patience, stable work, slow steady rise and crisis endurance',
  Ra: 'unconventional ambition',
  Ke: 'detachment',
}

/** Atmakaraka themes per navamsha (Jaimini teaching from the lectures). */
export const ATMAKARAKA_IN_NAVAMSHA: Record<Rashi, string> = {
  1: 'Life starts from zero repeatedly; patience and slow sustained work are the lesson. Crises are met head-on rather than managed.',
  2: 'Resources, food, vehicles and comfort come easily — the soul came to enjoy and to share abundance.',
  3: 'Life purpose is often set by others; you spend energy responding to what others did (PR-like role). Miscommunication is the main test.',
  4: 'Faith, vision and social service are strong; logic, land and sibling matters are where trouble shows.',
  5: 'Initially suppressed, then rises like a lion. Pride can blind right and wrong — you make rules for others; keep counsellors.',
  6: 'Hard-working, negotiating, SOP-driven; joy, self-worth and appreciation of beauty need conscious work. Lifelong learner.',
  7: 'Slow, tortoise-like success through patience and profit sense; father/authority support and independent decisions are weak.',
  8: 'Mother\'s milk is "missing" — emotional nourishment is scarce, so the soul transforms through trauma into deep insight.',
  9: 'Great height with the risk of falling from it; morals must stay very high — one slip costs the position.',
  10: 'Practical, Mars-like drive and execution; happiness, children and wisdom feel scarce — learn to release control.',
  11: 'Strong social, network and group karma; the past-life merit (punya) shows through unexpected support.',
  12: 'Giving nature, cannot bargain or sell for profit; generosity is the soul\'s gift and also its lesson.',
}

export const NAVAMSHA_SIGNS: Record<Rashi, NavamshaSignProfile> = {
  1: {
    sign: 1,
    title: 'The Battlefield',
    keywords: ['initiation', 'unstable', 'sacrifice', 'physical', 'first-mover'],
    essence:
      'Aries navamsha starts things. Any planet here makes you the first person in the family to do that thing, but the energy comes in high-voltage packets — dynamic, unstable, always solving a problem. Results arrive through the body: injuries, fights, sports, defence. "Head may be cut but never bowed."',
    shadow:
      'When afflicted it gives fear of starting, anxiety, physical problems, fractures and violence. Weak planets here need constant external motivation.',
    remedy:
      'Mangala / Mangala-Gauri, Hanuman, aggressive Devi forms (Kali, Bagalamukhi, Aigiri Nandini stotra). Burn energy through sport, running, workouts; break a coconut instead of your head.',
    guidance: 'Channel the fire into sport, defence, start-ups or migration projects — never sit idle with this energy.',
    planets: {
      Su: 'Exalted Sun — leadership in seed-stage set-ups and start-ups; you build from zero, hire, stabilise… and then get pushed out once it runs smoothly. Your energy stays a steady flat line. You can give what others cannot.',
      Mo: 'Restless emotional energy that must start new things daily; a dynamic, demanding partner. Needs heavy physical activity to stay calm.',
      Ma: 'Kshatriya energy — sports, defence, police, pilots. Body carries scars; quick to fight. Lineage often linked to military or land.',
      Me: 'Speech hits like a bullet — debating, negotiating, anchoring, reporting on conflict. Good at migrations between systems; health watch on hearing, skin and nerves. Body-work skills (massage, yoga) come naturally.',
      Ju: 'Fierce about principles, religion and rules; cannot bear cheating or broken discipline. Drawn to warrior saints and fierce hill temples. Watch liver, spine, sinus.',
      Ve: 'Constant effort to keep finances and relationships alive; passionate, high-libido, sometimes multiple relationships. Often the first in family to marry outside convention.',
      Sa: '"Wrong person at the right place" — given big jobs with little experience; work under pressure, frequent job changes, impatient decisions (intraday-type). Vulnerable to fraud if Rahu is strong.',
      Ra: 'Wild ideas and manipulative drive to start new things; childhood habit of breaking gadgets to see inside. With Mars: aggressive, dacoit-like energy.',
      Ke: 'Trekking, heights, self-harm tendency, anxiety before anything new; sharp tools come naturally. Watch cholesterol/cortisol stress.',
    },
    fromSign: {
      6: 'From Virgo — Aries navamsha turns the Virgo disease karma physical; health issues in the body need attention.',
    },
    inHouse: {
      7: 'Partner should be lively, communicative and outgoing — a fiery, demanding home life.',
      3: 'Deity appears in girl-child (bala) form; worship a nearby Devi temple.',
    },
  },
  2: {
    sign: 2,
    title: 'The Treasury',
    keywords: ['resources', 'wealth', 'accumulation', 'punya', 'comfort'],
    essence:
      'Taurus navamsha is the navamsha of resources — given to those with many past-life good deeds. Every planet here delivers its own wealth in its dasha: Moon gives food, home, vehicles; Mars gives land; Mercury gives paper wealth, bonds and equity; Sun gives good lineage and status; Saturn gives servants and oil-type assets; Jupiter gives people who get your work done; Rahu gives followers and gadgets; Ketu gives elite brands and branches.',
    shadow:
      'Gossip, back-biting and abusive speech damage this navamsha. When money stops, regulate food and speech first.',
    remedy:
      'Lakshmi / Krishna (Moon exalted here). Program it slowly with happiness, donation and feeding others; never criticise others in this planet\'s dasha.',
    guidance: 'Accumulate, preserve and share — give food and money with joy.',
    planets: {
      Su: 'Born into good lineage; father, government and seniors give resources in proportion to punya. Worship Rama with tulsi and fruit to grow it.',
      Mo: 'No shortage of food, clothes, vehicles or home; mother stores things (sometimes secretly) and sends food wherever you are. Gift gold/gifts to mother to unlock blocked results.',
      Ma: 'Land, lineage and protective strength; from the 3rd/Gemini side often transport business.',
      Me: 'Books, papers, contacts, equity and fibre-rich foods; maternal family often wealthy. From Virgo it brings inherited thyroid/respiratory issues.',
      Ju: 'People support you; sweets and fruits in bulk at home. From Virgo it may also bring a family disease (diabetes) — and income from healing others.',
      Ve: 'Perfumes, luxury, gold and silk; marriage brings wealth (strongest when vargottama).',
      Sa: 'Servants, oils, old things never thrown away — everything is reused; cash flow through spouse/business.',
      Ra: 'Electronics, big monitors, latest phones; buys in bulk, eats without looking at the bill. From Aquarius: you may cheat or be cheated.',
      Ke: 'A "touch-stone" for others — your blessings work for them; clients rise. Never says "I have no money"; generous by nature.',
    },
    fromSign: {
      1: 'From Aries — you start something and funding/support follows; past-life violence is balanced by helping families.',
      2: 'Vargottama — the lineage\'s resources flow straight down to you.',
      3: 'From Gemini — papers, licences, LIC, books and research become inheritance; transport income possible.',
      4: 'From Cancer — land, home, parents and the name of a generous giver.',
      5: 'From Leo — fame with money, social recognition and positions to dominate.',
      6: 'From Virgo — resources arrive with the lineage\'s roga-rina-shatru; heal it, and you can earn from healing others.',
      7: 'From Libra — partners and business associates are resourceful and supportive.',
      8: 'From Scorpio — inheritance, insurance claims, unearned money; donate clothes worn in tough times.',
      9: 'From Sagittarius — father\'s/guru\'s name opens every door.',
      10: 'From Capricorn — industrialist combination; build your own business. Money comes but peace may not.',
      11: 'From Aquarius — earning through large networks and social media; caution about cheating.',
      12: 'From Pisces — blessings, independent work, import-export and transport.',
    },
  },
  3: {
    sign: 3,
    title: 'The Responder',
    keywords: ['reaction', 'subconscious', 'response', 'allegations', 'skills'],
    essence:
      'Gemini navamsha governs the subconscious — how you react and respond. Whatever happens here you cannot ignore; you are put on the spot. Jaimini links it to itching and heaviness: the itch of having to answer allegations, defend decisions and take a stand. It is also the navamsha of skills, medals, teaching and art beyond gender.',
    shadow:
      'Miscommunication, pre-formed notions ("all marriages are bad"), selective hearing and gossip. Saturn here reacts too late.',
    remedy:
      'Saraswati / Devi stotras, reading and teaching; immerse in art. Iodised salt if Saturn here (thyroid).',
    guidance: 'Pause before reacting; express through art, writing and teaching rather than quarrels.',
    planets: {
      Su: 'Reacts instantly to authority — a new rule from the boss triggers a strong response.',
      Mo: 'Emotional responses run the mind; easily stirred by what is said about you.',
      Ma: 'Draws boundaries and shows people their place; road rage and blunt words.',
      Me: 'Pre-formed notions, but always backed with many data points; good analyst.',
      Ju: 'Joy comes through music, poetry and acting; principled responses.',
      Ve: 'Pre-notions about prices and relationships; may misinterpret the partner — listen fully.',
      Sa: 'Responds too late; regrets the decision not taken in time. Thyroid caution.',
      Ra: 'Rumours and reaction-videos energy; may amplify gossip.',
      Ke: 'Silent treatment — cuts people off, writes in short codes, changes room-mates.',
    },
    fromSign: {
      1: 'From Aries — cousins, land, home and court cases become things you must react to.',
      2: 'From Taurus — you must defend family decisions, speech and resources.',
      3: 'From Gemini — critic/teacher; you live by reacting to the world (reviewer energy).',
      4: 'From Cancer — reacts when emotional space or the masses are disturbed; raises public issues.',
      5: 'From Leo — fights wrongs done by father, manager or authority.',
      6: 'From Virgo — workplace conflicts and court matters demand response.',
      7: 'From Libra — must react to partnership and business situations.',
      8: 'From Scorpio — speaks about trauma survived and inspires others.',
      9: 'From Sagittarius — speaks about vision and initiatives to guide society.',
      10: 'From Capricorn — explains why you drew boundaries and spoke harshly.',
      11: 'From Aquarius — talks about groups, unconventional choices, scams faced or money doubled.',
      12: 'From Pisces — speaks about what was given away or renounced.',
    },
    inHouse: {
      7: 'You keep trying to communicate how you feel in the relationship — but may hold back fearing hurt.',
      1: 'Constant inner urge to improve oneself; others may use you as a catalyst for their own profit.',
    },
  },
  4: {
    sign: 4,
    title: 'The Absorbent Heart',
    keywords: ['emotion', 'masses', 'programmable', 'association', 'rest'],
    essence:
      'Cancer navamsha is absorbent: planets here act like a mother towards their significations and affect you at the deepest emotional level. It is programmable like water — good company and a nurturing environment slowly refine it; toxic company ruins it. It represents the masses: planets here make you work for public welfare.',
    shadow:
      'No logic, no routine, cannot bear pressure — under pressure you abandon that area. Craves appreciation; heart breaks without recognition.',
    remedy: 'Stay away from negative people; serve the masses (food, water, temples). Moon/Parvati/Krishna worship.',
    guidance: 'Choose your company carefully — this navamsha becomes what it absorbs.',
    planets: {
      Su: 'Leads public-welfare initiatives; wants to be seen as good by people.',
      Mo: 'Rests here; gives emotional support to others but cannot sustain hard routine.',
      Ma: 'Debilitated — logic sought where none works; shallow breathing, blood caution. Daily pranayama/yoga keeps it healthy.',
      Me: 'Heart-connected to children and siblings; teaches and feeds children with motherly care; cries when siblings struggle.',
      Ju: 'Exalted — faith, counselling, guidance to the distressed; heals people through emotional understanding.',
      Ve: 'Spouse treats you like a child (or you them); relationships run purely on emotion.',
      Sa: 'Builds big houses and temples, yet emotional dryness remains.',
      Ra: 'Obsessive emotional trauma; sleeplessness when things are unresolved; credit often taken by others.',
      Ke: 'Spirituality that heals emotional wiring; isolation and meditation repair the heart.',
    },
    fromElement: {
      fire: 'From a fire sign — you take initiatives to bring peace to the masses.',
      earth: 'From an earth sign — you give resources, jobs, medical aid and hard work to common people.',
      water: 'From a water sign — rest, emotional support, healing medicines and liberating others.',
      air: 'From an air sign — you communicate and network on behalf of the people.',
    },
    fromSign: {
      2: 'From Taurus — gives livelihood and jobs to many.',
      6: 'From Virgo — medical/legal relief to the public.',
      8: 'From Scorpio — research or Ayurvedic medicines that relieve people.',
      10: 'From Capricorn — your designation and hard work are spent for common people.',
      12: 'From Pisces — liberates many; donates books, food and comfort freely.',
    },
    inHouse: {
      7: 'You cannot refuse anyone who appeals emotionally; partner and judging others is from the heart.',
      9: 'Very emotional bond with father, guru and seniors.',
      5: 'Teaches with full emotion but with gaps; drops studies under pressure.',
      8: 'Emotional longing for one\'s own home; helps the traumatised.',
    },
  },
  5: {
    sign: 5,
    title: 'The Royal Court',
    keywords: ['authority', 'territory', 'ego', 'boundaries', 'purification'],
    essence:
      'Leo navamsha is the heart of the zodiac and the king\'s court. Planets here mark territory and establish their own regime — after much struggle, purification and "burning". It gives position, name, fame and the power to make rules for others; promises given here are kept.',
    shadow:
      'Ego blinds right from wrong; decisions taken out of pride. Once insulted publicly, ties are cut. Keep advisers.',
    remedy: 'Rama, Surya-Narayana (arghya, Aditya Hridayam), 21 dandavats to guru/deity images; give like a king.',
    guidance: 'Earn the throne slowly; keep a counsel and never decide from bruised ego.',
    planets: {
      Su: 'Leadership and authority; father may be strict — leads to building your own seat.',
      Mo: 'Royal tastes in food, home and places; never the small lane.',
      Ma: 'Gets things quickly; land and siblings at a high level. If afflicted, cheating/destructive tendencies.',
      Me: 'Depends on others in business; difficulties in studies; makes relations everywhere; authoritative speech, skin care needed.',
      Ju: 'Knowledge used for power; may serve elites/politicians; good education but must remember knowledge is for liberation.',
      Ve: 'Spouse purifies you through fault-finding; one public insult cuts the bond; dominates in relationships.',
      Sa: 'Prefers the back bench; inferiority complex; heavy chastisement from bosses — career shake-ups until purified.',
      Ra: 'Powerful in the shadows; the moment of limelight brings a fall. Obsessed with position; hates public humiliation.',
      Ke: 'Headless warrior — works hard to gain a position but cannot hold it; impulsive "mad sultan" decisions. Caution with dogs.',
    },
    inHouse: {
      1: 'Fights ego wars; wants to establish authority in every new place.',
      2: 'Takes responsibility for family and finances; speaks only to people of standing.',
      3: 'Works hard for medals and recognition; siblings/neighbours of good standing.',
      4: 'Fights for and builds one\'s own home.',
      5: 'Children, education and romance show status issues; partner must be of the same "class".',
      6: 'Ego clashes at work; past-life curse of father — serve elders to dissolve it.',
      7: 'Business is to be ruled — partner from a good family.',
    },
  },
  6: {
    sign: 6,
    title: 'The Workshop',
    keywords: ['service', 'correction', 'debts', 'daily grind', 'hard work'],
    essence:
      'Virgo navamsha is the dressing room between the king\'s court (Leo) and the queen\'s palace (Libra) — the place of cleaning and correction. Daily, repeating work; problem solving; learning that never stops; kingmakers who seat others on the throne. It shows past-life debts to be repaid through service.',
    shadow:
      'Venus qualities suffer — joy, self-worth, beauty and relationship happiness. The body part of the planet works below its potential; disputes, court and jail risks with Saturn.',
    remedy: 'Daily service, fasting/cleansing, Durga in Navaratri; health check-ups, gut care and repaying debts.',
    guidance: 'Treat every day as maintenance — clean, correct and repay; never stop learning.',
    planets: {
      Su: 'Keeps trying to correct father/boss until you accept them; lifelong study.',
      Mo: 'Mother cleans obsessively; home is never neat enough; joint/leg care if 9th lord.',
      Ma: 'Mechanical and repair skills; inner battles at work.',
      Me: 'Exalted — negotiation, SOPs, deal-making, data; can be a strict administrator.',
      Ju: 'Obesity, fatty liver; family illnesses carry forward.',
      Ve: 'Debilitated — values relationships by money/brands, early relationships with lessons, self-worth low.',
      Sa: 'Hard labour; disputes can lead to legal trouble; hiring/HR-type work.',
      Ra: 'Mental restlessness; allegations; anger stored inside.',
      Ke: 'Complains about being made to work; wants retirement and pilgrimage.',
    },
    fromSign: {
      2: 'From Taurus — a large share of money goes into interest and debts; keep borrowing minimal.',
      4: 'From Cancer — emotional conflicts at home; mother\'s health and land need care, and happiness is hard to feel.',
    },
    ages: [
      { age: 24, note: 'Gain through this navamsha\'s significations.' },
      { age: 30, note: 'Final decision on the dilemma this planet creates.' },
      { age: 36, note: 'Reversal — separation or shutting down in that area.' },
      { age: 48, note: 'Major cleansing of pending karma.' },
    ],
  },
  7: {
    sign: 7,
    title: 'The Heaven',
    keywords: ['partnership', 'money', 'pleasure', 'adornment', 'what you become'],
    essence:
      'Libra navamsha is heaven — money, pleasure, partnership and adornment (shringara). The 7th is what you become, so planets here show the self you are moving towards. It needs two people to complete; it is the navamsha of finances and brand-building.',
    shadow:
      'Ego, heat, unfocused energy and cheating spoil it; affairs of business owners show here as financial collapse.',
    remedy: 'Shringara (adorning) the deity of the planet here — Rama for Sun, Krishna for Moon, Nrisimha/Hanuman for Mars, Devi for Mercury, Vamana for Jupiter, Radha/Lakshmi for Venus, Kurma for Saturn, Varaha for Rahu, a saint\'s image for Ketu.',
    guidance: 'Stay loyal in partnerships — honesty in love keeps the money flowing.',
    planets: {
      Su: 'Uses status and authority to enter relationships; spends on display.',
      Mo: 'The mind keeps returning to relationships; mother struggles for resources. Likes white flowers/soft fragrances.',
      Ma: 'Passionate, adventurous intimacy; spends on friends and travel; can earn a bad name.',
      Me: 'Delighted in heaven — entertains the partner, sings/dances; can mean multiple relationships.',
      Ju: 'Sees every partner as spouse — wants a fully Vedic wedding; principles block side income; charitable.',
      Ve: 'Graceful, attractive, refined; learns money matters easily.',
      Sa: 'Underpaid work, hard-earned money; cheating on partner brings job losses.',
      Ra: 'Love at first sight with no filters; obsessed with doubling money — beware scams if Saturn is afflicted.',
      Ke: 'Many filters; cannot handle money or negotiation well; only works with people it likes.',
    },
    fromSign: {
      3: 'From Gemini — fame and money through passion for a skill (grandfather\'s pattern).',
    },
  },
  8: {
    sign: 8,
    title: 'The Transformation',
    keywords: ['trauma', 'research', 'intuition', 'release', 'rebirth'],
    essence:
      'Scorpio navamsha takes a planet to its end point — every stage (desire, betrayal, renunciation) is lived. Significations used excessively in past lives come incompletely; what you fear in this area tends to happen, and then you are freed of the fear. It is the navamsha of research, intuition and investigation, and of letting go.',
    shadow: 'Anxiety, depression, isolation and losing that area; emotional nourishment of mother is missing for the atmakaraka here.',
    remedy: 'Forgive, forget, move on. Study scriptures (Gita, Ramayana), research the signification, donate clothes worn in tough times. Astrologers: do sadhana and limit intuitive readings.',
    guidance: 'Let go of what is leaving; the decay is what produces the medicine.',
    planets: {
      Su: 'No emotional support from father; self-doubt; lost positions turn into research.',
      Mo: 'Moon debilitated — emotional comfort scarce; deep healer of others.',
      Ma: 'Land/sibling losses; heavy conflicts that eventually transform you.',
      Me: 'Business and communication break and rebuild; gut health suffers.',
      Ju: 'Faith shaken and rebuilt; guru appears after crisis.',
      Ve: 'Relationships transform through pain; once burnt, trust is hard; healing comes through research and astrology.',
      Sa: 'Career breaks; good for research, data, machine learning and investigation.',
      Ra: 'Cannot let go — clings to people and things even when they hurt; obsession continues.',
      Ke: 'Lets go easily — donates and walks away.',
    },
    fromElement: {
      fire: 'From a fire sign — extreme fear; must work alone; what you start gets stuck later (Leo: defamation; Aries: physical trouble; Sagittarius: trouble through bosses/principles).',
      water: 'From a water sign — sudden changes that are good in the long run, but memories keep triggering emotional pain.',
      air: 'From an air sign — sibling/friend conflicts and speech blocks; Aquarius here is heavily karmic (fraud risk).',
      earth: 'From an earth sign — money stuck, given and not returned; unrecognised work.',
    },
    ages: [
      { age: 18, note: 'Formative trauma/transformation point.' },
      { age: 25, note: 'Second transformation; release begins.' },
    ],
  },
  9: {
    sign: 9,
    title: 'The Summit',
    keywords: ['dharma', 'principles', 'height', 'fall', 'guru'],
    essence:
      'Sagittarius navamsha is the backbone of D9 (the chart of fortune) — a narrow ridge between Scorpio\'s pit and Capricorn\'s prison. Planets here demand principles; you will be tested repeatedly, and gurus protect you from falling. It is a silent (mute) sign — results are hidden help from father and guru.',
    shadow: 'Fall from position, allegations, betrayal by subordinates; knee/thigh/back problems signal broken principles.',
    remedy: 'Read Ramayana and Gita; serve the guru; worship the deity of the planet here.',
    guidance: 'Build principles and never break them — the ridge forgives no slip.',
    planets: {
      Su: 'Strong principles in administration; will not listen to others; resignation always ready.',
      Mo: 'Always explaining rules; fooled emotionally; keep emotions in check while performing duty.',
      Ma: 'Help without expectation; treat friends as family.',
      Me: 'Learns in chunks quickly; treats everyone as a younger sibling.',
      Ju: 'Gurus\' grace; fights for moral principles at work; wins trust as a mentor.',
      Ve: 'Commitment matters more than pleasure; avoids casual relationships.',
      Sa: 'Cheated by bosses and servants; back-stabbing — serve but do not over-trust.',
      Ra: 'Twists rules; picks the wrong authorities.',
      Ke: 'Fault-finding; needs a guru to keep direction.',
    },
    ages: [
      { age: 26, note: 'Planets here start giving results.' },
      { age: 35, note: 'Partnerships and marriage become fruitful.' },
      { age: 38, note: 'Testing point — career/trust issues; avoid blind trust.' },
    ],
  },
  10: {
    sign: 10,
    title: 'The Prison of Karma',
    keywords: ['bondage', 'over-use', 'hard labour', 'mines', 'storage'],
    essence:
      'Capricorn navamsha shows what was over-used in past lives — you now become its servant. The signification controls you like bonded labour; you are valued only while you give, then discarded. It is also a mine: grains, silver, gold and seasonal goods are stored in bulk; warehouses, HR firms and jewellers show here.',
    shadow: 'Toxic, controlling relationships; slow, grinding pain (Saturn style); humiliation after years of effort.',
    remedy: 'No quick remedy works — burn the karma through work. Physical service to the masses (food, water, temples, dharamshalas). Lead balls for violence.',
    guidance: 'Do not trade your freedom for luxury; serve, burn the karma, and it releases you.',
    planets: {
      Su: 'Father/bosses controlling; choose fame over freedom; do not involve government power in business.',
      Mo: 'Silver and stored food at home; build water sources; emotional support scarce.',
      Ma: 'Very responsible, enormous effort; warehouses, mechanical work; serves selflessly — deserves liberation.',
      Me: 'HR, data analysis, password/account sharing; children\'s welfare work.',
      Ju: 'Little happiness from children; unclear instructions; liver/back issues; build dharamshalas.',
      Ve: 'Controlling partner; luxury traps; after 32–33 build a nuclear family.',
      Sa: 'Stable but dry work; vast labour for others.',
      Ra: 'Joins messy businesses; moves once things stabilise.',
      Ke: 'Builds businesses for others and hands them over when they scale.',
    },
  },
  11: {
    sign: 11,
    title: 'The Merit Bank',
    keywords: ['punya', 'networks', 'irregular', 'shortcuts', 'social media'],
    essence:
      'Aquarius navamsha stores past-life good deeds (punya). Planets here bypass rules — work gets done without paperwork, help arrives from unknown people. Results are irregular: the planet\'s area first stops, then delivers suddenly (ten years\' result in two). It behaves like Rahu — back-door, network-driven.',
    shadow: 'Rule-breaking, nicknames, abuse at work, property disputes after marriage; collapses if you come into the limelight.',
    remedy: 'Keep doing charity and social service; use good lights/studio lights at home; stay low-profile.',
    guidance: 'Spend the merit wisely — keep refilling it with service.',
    planets: {
      Su: 'Respected by masses and groups; authority may help from the shadows.',
      Mo: 'Sudden support and money from mother and unexpected sources; food-blogger energy.',
      Ma: 'Land without paperwork, friends who protect; compulsive driving and routines broken.',
      Me: 'No paperwork, incomplete sentences, shortcuts; coders and traders; speaking without explaining.',
      Ju: 'Gurus and seniors help unexpectedly; rules bent for you.',
      Ve: 'Live-in tendencies, unconventional relationships; sudden money, lotteries, premium brands; donates clothes.',
      Sa: 'Ignores office rules; servants may cheat.',
      Ra: 'Social-media influence, wild ideas; irregular gains.',
      Ke: 'Chooses one\'s own birth; desires manifest quickly.',
    },
  },
  12: {
    sign: 12,
    title: 'The Release',
    keywords: ['liberation', 'charity', 'surrender', 'sleep', 'divine help'],
    essence:
      'Pisces navamsha exists to free you from the cycle. Planets here keep you torn between enjoying and renouncing their significations. They show how nature sees you: those who gave receive unexpected help; those who took face consequences. Mercury is debilitated here — calculating givers suffer, generous givers prosper.',
    shadow: 'Cannot let go (especially Rahu); disturbed sleep; isolation in sorrow; ancestral debts.',
    remedy: 'Daily charity (Ekadashi, Purnima, Amavasya, Sankranti); water-based offerings; ragas before sleep; mental offerings; Shiva-linga worship; pilgrimages.',
    guidance: 'Give daily — physically or mentally — and nature will carry you.',
    planets: {
      Su: 'Temple service and donation by lineage; avoid selfish acts in isolation.',
      Mo: 'Alone in sorrow; Shiva-linga worship and letting go heal the mind.',
      Ma: 'Shram-daan — carry palanquins, manage festivals; donate blood; respect Bhu-devi.',
      Me: 'Argument and calculation block grace; donate stationery and books to children.',
      Ju: 'Pilgrimages, give to gurus/teachers; deeply protected.',
      Ve: 'Torn between pleasure and renunciation; give expensive/refined gifts; spouse supports in illness.',
      Sa: 'Free labour in temples; offer oils and ghee.',
      Ra: 'Cannot donate easily — must give electronics, incense; ancestors need offerings.',
      Ke: 'Liberation comes easily; meditation and silence.',
    },
    inHouse: {
      8: 'Weeps in private (bathroom/rooftop); release through tears.',
      2: 'Family karma resolved by giving to siblings and children.',
    },
  },
}

/** Dasha-time reading per navamsha — what the period of a planet placed here tends to bring. */
export const NAVAMSHA_DASHA_NOTE: Record<Rashi, string> = {
  1: 'In this dasha life demands that you start something new; physical fights, injuries or sports and do-or-die situations are likely. Burn the energy through exercise.',
  2: 'In this dasha the planet delivers its own wealth — resources, food, comfort and support arrive. Avoid gossip and harsh speech.',
  3: 'In this dasha you are put on the spot — you must respond to allegations, defend decisions and speak up; skills and medals also come.',
  4: 'In this dasha emotions run the show — company you keep shapes results; serving people brings peace, pressure makes you quit.',
  5: 'In this dasha you struggle first, then establish your territory — authority, recognition and ego tests arrive together.',
  6: 'In this dasha the daily grind, health check-ups, debts and disputes come up; hard correction work pays later.',
  7: 'In this dasha money, partnership and pleasures are active; loyalty decides whether wealth grows or leaks.',
  8: 'In this dasha what you fear in this area tends to happen — loss, trauma, then deep transformation and freedom from that fear.',
  9: 'In this dasha your principles are tested; keep morals high to rise — a slip can cost the position.',
  10: 'In this dasha you serve the planet\'s area like bonded labour; burn the karma through work and you are released.',
  11: 'In this dasha the area first stalls, then delivers suddenly through past merit, networks or unconventional routes.',
  12: 'In this dasha expenses, charity, travel and letting go dominate; giving brings unexpected help from nature.',
}

/** Deity whose names suit a child named after the strongest planet (Cancer lecture). */
export const NAMING_DEITY: Partial<Record<GrahaId, string>> = {
  Su: 'Rama and the Suryavanshi kings (e.g. Raghunath, Raghav)',
  Mo: 'Krishna or Parvati/Sati',
  Ma: 'Nrisimha, Hanuman or Kartikeya',
  Me: 'Vishnu (Narayana) or Devi names',
  Ju: 'Vamana, Brihaspati or Guru names',
  Ve: 'Lakshmi, Radha or Parashurama',
  Sa: 'Kurma or Shani-Hanuman names',
  Ra: 'Varaha',
  Ke: 'Ganesha or Matsya',
}

/** What Mercury becomes known for when it shares a D9 sign with another planet (Gemini lecture). */
export const MERCURY_FAME: Partial<Record<GrahaId, string>> = {
  Ke: 'Mercury with Ketu — gives secretly and does not want the name on the donation slip.',
  Su: 'Mercury with the Sun — wants the biggest name-plate; recognition through authority.',
  Ma: 'Mercury with Mars — name on the gate, on land, roads built in your name.',
  Sa: 'Mercury with Saturn — remembered for generations for one big lasting work.',
  Ra: 'Mercury with Rahu — known for coding, trading or schemes; guard against a scam label.',
  Ve: 'Mercury with Venus — known for art, singing, dancing, conversation and love life.',
}
