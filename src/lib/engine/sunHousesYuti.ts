// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunHousesYuti.ts
//  Surya: house placements + yuti (Moon/Mars/Mercury/Jupiter/
//  Venus/Saturn/Rahu/Ketu) — class teaching notes, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export type SunYutiPartner = 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

export interface SunHouseTeaching {
  house: number
  /** Kaal Purush sign used in the teaching frame (not natal rashi) */
  kaalPurushSign: string
  title: string
  themes: string[]
  positives: string[]
  challenges: string[]
  notes: string[]
}

export interface SunYutiTeaching {
  partner: SunYutiPartner
  name: string
  sanskrit: string
  tagline: string
  elements: string
  core: string[]
  positives: string[]
  negatives: string[]
  technical: string[]
  careers: string[]
  byHouse: Partial<Record<number, string[]>>
  remedies: string[]
}

export interface AmavasyaAnalysis {
  active: boolean
  sepDeg: number
  band: 'full' | 'amavasya' | 'outside'
  label: string
  detail: string
  paksha: 'shukla' | 'krishna' | 'unknown'
}

export interface ActiveSunYuti {
  partner: SunYutiPartner
  name: string
  sepDeg: number
  sameSign: boolean
  combust: boolean
  deeplyCombust: boolean
  teaching: SunYutiTeaching
  houseNotes: string[]
  chartNotes: string[]
}

export interface SunHousesYutiResult {
  sun: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
  }
  houseTeaching: SunHouseTeaching
  allHouses: SunHouseTeaching[]
  activeYutis: ActiveSunYuti[]
  allYutis: SunYutiTeaching[]
  amavasya: AmavasyaAnalysis | null
  pitruNotes: string[]
  remedies: string[]
  caveats: string[]
  methodology: string[]
}

const KAAL_PURUSH: Record<number, string> = {
  1: 'Aries / Mesh',
  2: 'Taurus / Vrishabh',
  3: 'Gemini / Mithun',
  4: 'Cancer / Karka',
  5: 'Leo / Simha',
  6: 'Virgo / Kanya',
  7: 'Libra / Tula',
  8: 'Scorpio / Vrishchik',
  9: 'Sagittarius / Dhanu',
  10: 'Capricorn / Makar',
  11: 'Aquarius / Kumbh',
  12: 'Pisces / Meen',
}

/** Combustion orbs (BPHS-aligned) used for yuti technical flags */
const COMBUST_ORBS: Partial<Record<GrahaId, number>> = {
  Mo: 12,
  Ma: 17,
  Me: 14,
  Ju: 11,
  Ve: 10,
  Sa: 15,
}

const DEEP_COMBUST_ORB = 3

export const SUN_HOUSE_TEACHINGS: SunHouseTeaching[] = [
  {
    house: 1,
    kaalPurushSign: KAAL_PURUSH[1],
    title: 'Sun in 1st — identity & command',
    themes: ['Exaltation seat in Kaal Purush (Aries)', 'Commanding presence', 'Self-initiation'],
    positives: [
      'Impressive, commanding personality (दबंग without rowdy energy)',
      'Self-confident and independent; distinct glow on the skin',
      'Always energetic; initiates work with motivation',
      'In Aries: exalted — peak light near 0–10° (Ashwini zone toward 13°20′)',
    ],
    challenges: [
      'May show a childhood head scar / stitches mark (classical physical tell)',
    ],
    notes: [
      'Kaal Purush: Aries is Sun’s exaltation sign — identity radiates through the body-self.',
    ],
  },
  {
    house: 2,
    kaalPurushSign: KAAL_PURUSH[2],
    title: 'Sun in 2nd — self-respect & speech wealth',
    themes: ['Self-respect', 'Hidden skills', 'Wealth / fame drive'],
    positives: [
      'Will protect self-respect fiercely (even bend truth if threatened)',
      'Hidden skills often emerge in middle age',
      'Strong drive to accumulate money and recognition',
      'Usually connected to a spiritual personality (friend, mother, or acquaintance) without being highly spiritual themselves',
    ],
    challenges: [
      'Deep insecurity underneath the self-respect armour',
      'After ~50: turn toward spirituality, but mouth/throat health can obstruct sadhana',
    ],
    notes: ['Speech, family resources, and face/voice are Surya’s stage here.'],
  },
  {
    house: 3,
    kaalPurushSign: KAAL_PURUSH[3],
    title: 'Sun in 3rd — logic, courage, learning',
    themes: ['Scientific mind', 'Curiosity', 'Siblings / neighbours'],
    positives: [
      'Scientific/logical approach — needs justification for everything',
      'Never lacks knowledge; learns from everywhere',
      'Children often speak more maturely than their age',
      'Education is central and usually strong',
    ],
    challenges: [
      'Impatient, hurried handwriting',
      'Quick misunderstandings with relatives and neighbours',
      'Forms misconceptions about others easily',
    ],
    notes: ['Courage, communication, and short efforts carry solar heat.'],
  },
  {
    house: 4,
    kaalPurushSign: KAAL_PURUSH[4],
    title: 'Sun in 4th — inner seat & family',
    themes: ['Inner insecurity', 'Home corner', 'Father imprint'],
    positives: [
      'Strong drive to keep the family united',
      'Father is a major life reference — learns from father, then often takes a U-turn',
      'Gives examples from father’s experiences',
    ],
    challenges: [
      'Inner low/down mood; “will I be able to?” insecurity',
      'Struggle for self-identity; needs a separate corner room when stressed',
      'Good work under-recognised; even when recognised, feels it should have been more',
      'Family struggles while proving themselves',
    ],
    notes: ['Sukha bhava meets ego-light — home becomes both shelter and proving ground.'],
  },
  {
    house: 5,
    kaalPurushSign: KAAL_PURUSH[5],
    title: 'Sun in 5th — own sign seat (Kaal Purush)',
    themes: ['Intelligence', 'Creativity', 'Children', 'Risk until mid-20s'],
    positives: [
      'Own-sign flavour in Kaal Purush Leo — powerful, intelligent, creative',
      'Name, fame, centre of attraction; natural leadership',
      'Loves children but is strict with them',
      'Comfortable with sadhus/saints; life can flip toward spirituality',
    ],
    challenges: [
      'Monitor carefully until ~22–25: gambling tendencies and emotional traps',
      'King cannot retract his word — stuck in dilemmas; heart over head at key moments',
      '360° life changes possible (temple-avoider → saint-seeker arc)',
    ],
    notes: ['Putra / buddhi / mantra bhava — creativity and speculation both amplify.'],
  },
  {
    house: 6,
    kaalPurushSign: KAAL_PURUSH[6],
    title: 'Sun in 6th — service, body, debts',
    themes: ['Fatigue', 'Seva without return', 'Boss friction', 'Body discipline'],
    positives: [
      'Modest and compassionate despite impatience',
      'Helps readily (नेकी कर दरिया में डाल) — often without recognition',
      'If the body is disciplined, spiritual awakening tends to follow automatically',
      'Eventually can reach stability and high positions',
    ],
    challenges: [
      'Past-life body misuse indication; fatigues quickly',
      'Thinks about fitness but postpones gym (“from tomorrow”)',
      'Avoid lending/borrowing when possible — loan situations recur',
      'Good at jobs but often gets difficult bosses',
    ],
    notes: ['Best non-puja remedy here: improve physical existence first.'],
  },
  {
    house: 7,
    kaalPurushSign: KAAL_PURUSH[7],
    title: 'Sun in 7th — partnership mirror',
    themes: ['Partner expectations', 'Loyalty', 'Easy trust'],
    positives: [
      'Brotherly/friendly with everyone',
      'When expectations match partner qualities — excellent married / business life',
    ],
    challenges: [
      'Expects unconditional romance and highly ethical/loyal partner — mismatch = friction',
      'Partner may feel like mother/father from a past life (heavy expectation load)',
      'Trusts easily → deception risk; revolts quickly when wronged',
    ],
    notes: ['Kalatra bhava: Sun’s ego meets the other — balance is mandatory.'],
  },
  {
    house: 8,
    kaalPurushSign: KAAL_PURUSH[8],
    title: 'Sun in 8th — secrets & rebirth',
    themes: ['Commitment hunger', 'Hidden emotions', 'Occult pull'],
    positives: [
      'Intense, powerful combination (light in a dark house)',
      'Energy to earn; possible inheritance (often doubted)',
      'Constant transform cycle — multiple identity resets by 20–30',
      'Near-certain pull toward spirituality or occult for आत्मसंतुष्टि',
    ],
    challenges: [
      'Needs commitment in every bond; without it — deep loneliness',
      'Never shares true emotions; diverts with excuses',
      'Never fully satisfied with others’ efforts',
    ],
    notes: ['Randhra bhava: death–rebirth of identity under solar heat.'],
  },
  {
    house: 9,
    kaalPurushSign: KAAL_PURUSH[9],
    title: 'Sun in 9th — dharma & philosophy',
    themes: ['Philosophy', 'Guidance 24–30', 'Higher learning / travel'],
    positives: [
      'Sees philosophy in everything; seeks deep meaning',
      'Excellent spiritual guidance often arrives between 24–30',
      'Higher education strong; study abroad possible',
      'Travel includes cultural immersion, not only scenery',
      'Strong reading inclination',
    ],
    challenges: [
      'Deep-meaning habit can irritate practical people around them',
    ],
    notes: ['Bhagya / guru / dharma — Surya as inner and outer guide.'],
  },
  {
    house: 10,
    kaalPurushSign: KAAL_PURUSH[10],
    title: 'Sun in 10th — career peak drive',
    themes: ['Ultimate success', 'No flattery', 'Leader vs member'],
    positives: [
      'All effort toward career; wants to be #1 even as a trainee',
      'Very intelligent; high capability',
    ],
    challenges: [
      'Cannot do चापलूसी — falls behind despite merit',
      'Prefers team leader over team member — can lose opportunities',
      'If slightly afflicted: must learn to be a team member',
    ],
    notes: ['Karma bhava is a natural Surya seat — status with responsibility.'],
  },
  {
    house: 11,
    kaalPurushSign: KAAL_PURUSH[11],
    title: 'Sun in 11th — networks & awards',
    themes: ['Friends', 'Strategy', 'Gains / awards'],
    positives: [
      'Makes friends quickly; playful teasing / friendly bullying',
      'Accepts challenges and fulfills them; sharp strategic mind',
      'Balances heart and mind; high capabilities',
      'With good yogas (also 5th Sun): Padma-level award potential in classical teaching',
    ],
    challenges: [
      'Can spark fights between close people “as a joke” — social heat',
    ],
    notes: ['Labha bhava: gains through people, goals, and recognition.'],
  },
  {
    house: 12,
    kaalPurushSign: KAAL_PURUSH[12],
    title: 'Sun in 12th — withdraw & intuition',
    themes: ['Family vs solitude', 'Intuition', 'Healing vocations'],
    positives: [
      'Quick intuitive sensing; reads whether words match intent',
      'Apt for face-reading, nursing, surgery/medicine (with support), or hospital supply work',
      'High initial energy for learning new things',
    ],
    challenges: [
      'Contradiction: must serve family yet suddenly withdraw / need solitude',
      'Remains confused despite strong intuition',
      'At some stage surrenders: “enough — I’ve done what I could”',
    ],
    notes: ['Vyaya / moksha: light spends itself in solitude, seva, or foreign.'],
  },
]

export const SUN_YUTI_TEACHINGS: SunYutiTeaching[] = [
  {
    partner: 'Mo',
    name: 'Sun–Moon',
    sanskrit: 'सूर्य–चंद्र युति / Amavasya Yoga',
    tagline: 'Soul + mind together — intuition with inner contradiction',
    elements: 'Sun fire (soul/ego) + Moon water (mind/emotions)',
    core: [
      'Do not scare natives with this yoga alone — degrees, D-charts, and paksha decide intensity',
      'Full Amavasya: Moon within ~0–3° of Sun; general Amavasya yoga within ~12° (tithi changes after ~12°)',
      'Even exalted Moon with Sun becomes weak — degrees matter',
      'Anger rises like boiling water — burst, calm, then guilt',
      'Myth: Sun and Moon caught Swarbhanu’s deception at Samudra Manthan — natives spot छल-कपट quickly',
    ],
    positives: [
      'Very strong intuitive power; clear thought process',
      'Balances family and profession, outer and inner spheres',
      'Excellent counselors, social workers, actors, writers, artists',
      'Chase emotional security more than financial; deep self-analysis',
      'Emotionally intelligent — can guide others through depression with lived wisdom',
      'Impressive personality; can reach high positions; strong social-media presence if Moon not too weak',
      'Past-life themes appear in dreams; yoga/tantra/Nadi balance suit them',
      'If Moon exits Amavasya into Pratipada: strong startup / funding timing lore',
    ],
    negatives: [
      'When Moon is weak: indecisive; cannot judge right/wrong at crucial moments',
      'Suppress emotions → guilt; take all blame; confidence can drop to zero',
      'Negative imagination; entity/place sensitivity (do not dismiss lightly if chart confirms)',
      'Avoid loans especially on Amavasya; secret enemies surface; sudden accidents possible',
      'Depression risk if life collapses; propaganda/scandal risk on social media if Moon weak',
      'Full Amavasya: mental unrest / home finance strain initially possible',
    ],
    technical: [
      'Always check: degree gap, D-charts, full vs general Amavasya, paksha bal (Shukla/Krishna)',
      'Sun ≈ right-brain / left-body; Moon ≈ left-brain / right-body (medical teaching frame)',
      'In 6/8/12: classical warning for severe neurological/edema-type vulnerability — judge whole chart',
      'Ashwini or Magha placement: future track becomes unusually clear',
    ],
    careers: ['Counseling', 'Social work', 'Acting / writing / arts', 'CEO/CFO potential', 'Creative engineering'],
    byHouse: {
      1: ['Attractive personality; engineering/technical tilt; professional yet parental tension'],
      2: ['Early financial strain; later career height; family property/money themes persist'],
      3: ['Art inclination; selfishness if Moon very weak'],
      4: ['Prefer birth country; single-parent upbringing common; psychological sensitivity'],
      5: ['Strong desire for children (often late); miscarriage risk lore; NGO/admin power; tension with mother nearly constant in this teaching'],
      6: ['NGO / administrative themes; mother issues; health vigilance'],
      7: ['Marriage issues depend on Moon; business alone — avoid partnership'],
      8: ['Handles opaque money skillfully; if Moon weak: intimate-health caution; learn swimming but avoid open rivers/seas (teaching)'],
      9: ['Settling abroad likely; strong impact of spiritual authority'],
      10: ['Career focus from childhood; politics or own NGO; sleep latency 2–4 hrs; weak money management'],
      11: ['Supportive spouse; earning capacity; later friction with first child (5th-aspect lore)'],
      12: ['Public ethics vs private indulgence contradiction; living relationships possible'],
    },
    remedies: [
      'Primary: cultivate emotional independence (hard but central)',
      'Rudri Path; Somnath darshan (Moon); Tarkeshwar Shiv tantric jaap (Sun)',
      'Shri Vidya — nine āvaraṇas practice (not full system necessarily)',
      'Diksha only from a Shankaracharya lineage when seeking initiation (class note)',
      'Rigveda “द्व सुपर्ण” — two birds on one tree competing for one fruit (body/consciousness)',
    ],
  },
  {
    partner: 'Ma',
    name: 'Sun–Mars',
    sanskrit: 'सूर्य–मंगल युति',
    tagline: 'King + commander — underwater volcano of fire',
    elements: 'Sun fire (soul/authority) + Mars fire (energy/courage/land)',
    core: [
      'Purpose-driven energy; never idle — can form a type of Rajyoga',
      'Divine consciousness + vital action force',
      'Intensity decides: high positive → achievements; high negative → dictatorship; medium negative → aggressive boss',
      'Mars combust orb ~17°; deeply combust within ~3° of Sun',
    ],
    positives: [
      'Leadership, data filtering/analysis, digital platforms, startups, industrial drive',
      'Hard competitor; do-or-die completion; calm exterior with inner steel',
      'Fitness/sports (esp. 3rd); Vedic/spiritual content creation (Sun–Mars Veda guardianship lore)',
    ],
    negatives: [
      'Cannot digest insults; long memory; weak forgiveness',
      'Narcissistic “I am right” complex; controlling, impatient, perfectionist',
      'Relationships suffer; revolt against rules; anger mismanagement',
      'Negative: accidents (ankle fractures, ligaments), circulation/heart themes in key houses',
    ],
    technical: [
      'Prefer Mars not combust for best results; degrees decide influence level',
      'Heart-sensitive houses in teaching: 2, 5, 7, 8, 12 when combination turns negative',
      'Sun = bones; Mars = blood/connective tissue; 3rd = support (ankle)',
    ],
    careers: ['Data science', 'Digital platforms', 'Startups', 'Industry', 'Sports/fitness', 'YouTube / Vedic content', 'Surgery (12th)', 'Forensics (8th)', 'CEO (10th)'],
    byHouse: {
      1: ['Identity obsession; impatient for recognition; digital influencer / online leadership'],
      2: ['All energy on earning; finance/real estate; blunt speech harms family; crypto tilt; if negative — earn by any means'],
      3: ['Courage up; bitter truth speech; influencer/adventure/content; siblings in authority; protective bonding'],
      4: ['Interior design / property skill; distance from mother; home = temple; hard to leave homeland/city'],
      5: ['Dominating love style; PhD/scholarly; airtech/gaming; intelligent talkative children'],
      6: ['Never accepts defeat — fights to Supreme Court; competitive exams easy; swelling/inflammation'],
      7: ['Teaching warning: generally inauspicious for marriage even when “positive”; ego damage precedes learning; Jupiter’s 9th aspect can soften'],
      8: ['Research/forensics/spy logic; inheritance hard; sudden job resignations; fraud detection'],
      9: ['Rigid philosopher/fundamentalist streak; revolutionary + high morals; father ideological fights yet mutual loyalty'],
      10: ['Corporate general/CEO energy; instant decisions; over-ambition can step on others'],
      11: ['Crowdfunding/startup funding; online communities; foreign expansion; aggression for targets'],
      12: ['Foreign settlement if 3/4/9 support; excellent surgeons'],
    },
    remedies: [
      'Channel fire into disciplined action and sports rather than ego wars',
      'If 7th: seek Jupiter’s protective aspect / guidance before partnership decisions',
      'Temple-building lore when Jupiter aspects from 9th onto 3rd-house placement',
    ],
  },
  {
    partner: 'Me',
    name: 'Sun–Mercury',
    sanskrit: 'सूर्य–बुध युति / Budh Aditya Yoga',
    tagline: 'Soul expression through speech — common Rajyoga',
    elements: 'Sun (soul) + Mercury (intelligence, speech, media)',
    core: [
      'Very common (Mercury always near Sun) — found in roughly every 2nd–3rd chart',
      'Budh Aditya Yoga: good/rajyoga class with past-life interconnection flavour',
      'Mercury combustion is usually NOT harmful — normal for this pair',
      'Sun–Moon counselors heal emotions; Sun–Mercury counselors guide career/growth',
    ],
    positives: [
      'Diplomatic politics, marketing, impressive communication, peace-seeking',
      'Sharp mind; gets work done; filters others’ perspectives',
      'Counselor/consultant abilities in professional domains',
    ],
    negatives: [
      'Rejects others’ perceptions quietly — no argument, no acceptance',
      'If negative: victim of politics — realises too late',
      '“I know everything” tendency',
    ],
    technical: [
      'Modern caution: exalted planets alone do not guarantee results without house/dasha support',
      'Investment map (class): shares 5+8; insurance 8; property 4+6; FD 2+11; SIP secured 6 / unsecured 5; education/travel/donation 12 (non-cash returns)',
    ],
    careers: ['Diplomacy', 'Journalism', 'Oratory', 'Marketing', 'CA / consultancy', 'Government', 'Medical store / travel (12th)', 'Trading (11th)'],
    byHouse: {
      1: ['Impressive looks; sparkle in eyes; funny if Mercury strong; loud laughter; over-intelligence embarrassment risk'],
      2: ['Debate/diplomat skills; language command; multiple incomes; family unity intent but weak responsibility follow-through'],
      3: ['Journalist/orator; neighbourhood respect; RWA leadership; writers/poets; quality siblings/neighbours'],
      4: ['Home as temple; mama’s boy/girl; educated wise mother; farmhouse/garden/fruit plants even in balcony'],
      5: ['Sharp intellect; smart children; diplomatic give-take in romance; if Mercury weakens — brain-health vigilance'],
      6: ['Strong job performance if Mercury ok; serial loan→property building pattern'],
      7: ['Best for partnership communication; if negative — cheque bounce / payment issues'],
      8: ['Research, psychology, occult interest; auditing/fraud catch; hard to express fully'],
      9: ['Foreign travel / higher education; philosophical strength; fighting skill if luck weak'],
      10: ['Government/tenders/leadership; CA/consultancy; if negative — career strikes, job gaps from ego'],
      11: ['Networking gold; multi-income plans; smart trading'],
      12: ['Medical/travel/abroad; Maun sadhana connection; if negative — confinement/wrong spending patterns'],
    },
    remedies: [
      'Keep speech ethical — past-life speech misuse themes appear in some 8th-house variants',
      'Do not over-fear Mercury combustion; refine expression instead',
    ],
  },
  {
    partner: 'Ju',
    name: 'Sun–Jupiter',
    sanskrit: 'सूर्य–गुरु युति',
    tagline: '“Aham Brahmasmi” — knowledge with ego risk',
    elements: 'Sun (self/divine spark) + Jupiter (dharma/wisdom)',
    core: [
      'Self-discipline, divine knowledge channel, Vedic/occult interest',
      'Educators, mentors, coaches, public-policy / government consultancy',
      'Money often arranges itself; good investors',
      'Hidden curse lore (all required): Sun+Jupiter in 8 or 12 AND Jupiter combust — false wisdom / father–guru harm themes',
    ],
    positives: [
      'Life-changing advice; motivates others; genuine knowledge hunger when positive',
      'Ethical earning and family tradition when Jupiter well-placed',
      '5th: top counselors/mentors; mantra skill; loyal in love',
      '9th: dharma propagation, PhD, institutions, foreign education',
      '11th: multi-circle networking; name/fame/money with spiritual appetite',
    ],
    negatives: [
      '“Only I know” ego; dismisses gurus; “pagla pandit” syndrome',
      'Internal Swadharma vs Adharma conflict with self-justification',
      '6th affliction: rare but severe illness; spiritual remedies may fail in that dasha',
      '10th: credit stolen by politics despite ethical work',
    ],
    technical: [
      'Close degrees (even across houses) exchange energy; dasha/antardasha activate',
      'Remedy mantra lore (Matsya Purana / Yajurveda): “Savita Shaurya Dharma Gurave Namah” with combined ahuti',
    ],
    careers: ['Teaching / coaching', 'Counseling', 'Law (6th)', 'Government / banking / admin (10th)', 'Religious leadership (9th)', 'Tax/occult research (8th)'],
    byHouse: {
      1: ['Confidence + leadership; or massive ego / father-blame if afflicted'],
      2: ['Family ethics & food/fragrance refinement; past speech karma to correct'],
      3: ['Advisor to siblings; gold/jewelry design; Tirupati-type short teerth; may dominate juniors'],
      4: ['Pooja room home; comforts; religious mother; may distribute scriptures if poor'],
      5: ['Best placement — mentors, children bond, mantra, investment'],
      6: ['Lawyers, govt service, diplomacy; debt payoff; severe hard-to-diagnose illness when sick'],
      7: ['Reasonable honest partner; ethical business partners'],
      8: ['Paternal inheritance; tantra/veda; reads secrets; tax “table money” savvy; ego/cult risk'],
      9: ['Sannyas desire; preacher/university builder; foreign education'],
      10: ['Govt consultant, banking, unpopular-but-correct decisions; politics inevitable'],
      11: ['Jugaadu networking across business/politics/spiritual circles'],
      12: ['Home havan / hospital seva / large medical donations; relatives’ hospitalisation cycles when negative'],
    },
    remedies: [
      'Combined Sun–Jupiter ahuti: Savita Shaurya Dharma Gurave Namah',
      'If Jupiter combust in 6/8: do not expect easy spiritual fix during affliction dasha',
    ],
  },
  {
    partner: 'Ve',
    name: 'Sun–Venus',
    sanskrit: 'सूर्य–शुक्र युति',
    tagline: 'Authority meets desire — comfort with ego heat',
    elements: 'Sun (ego/authority) + Venus (love/luxury/harmony)',
    core: [
      'Venus (like Mercury) habitually near Sun — combustion less dramatic than for outer planets',
      'Retrograde Venus (~every 18 months, ~40 days): digs DNA-level into relationships; revives past bonds; luxuries come and go',
    ],
    positives: [
      '4th: disciplined beautiful mother; aesthetic, systematic home; good vehicles',
      '8th: hidden talents; research/stock analysis; crime-thriller writing; many money ideas',
      'Initial sensual attraction in marriage with gradual transformation',
    ],
    negatives: [
      '6th: kidney/prostate/urinary themes (males); cervical/lower-intestine/kidney-stone themes (females, esp. with Saturn)',
      '8th: execution needs others; in-laws’ extreme rules; marital transform cycles',
      'Ego clashes with refined maternal standards possible in 4th',
    ],
    technical: [
      'Venus combustion zone often overlaps retrograde window (~0–8° from Sun for ~5 days)',
      'Enemies in 6th tend to be upfront/rajasic — king-vs-king, not dirty games',
    ],
    careers: ['Interior / aesthetics', 'Research & markets', 'Creative writing', 'Comfort industries'],
    byHouse: {
      4: ['Mother highly disciplined/beautiful; home envy-worthy; child mostly obeys refined rules'],
      6: ['Medical caution (kidney/prostate/urinary/cervical); ethical open rivalry; career-focused avoidance of conflict'],
      8: ['Hidden talent + weak solo execution; strict in-laws; problems come and dissolve'],
    },
    remedies: [
      'When Venus is retrograde: avoid obsessive root-cause digging that reopens old wounds',
      'Accept Venusian medical treatment even when it feels tough — resistance worsens outcomes',
    ],
  },
  {
    partner: 'Sa',
    name: 'Sun–Saturn',
    sanskrit: 'सूर्य–शनि युति',
    tagline: 'Light vs shadow — ego churned into patience',
    elements: 'Sun hot/fast/ego vs Saturn cold/slow/discipline',
    core: [
      'Extreme energies: potential balance or severe internal conflict',
      'Physical, mental, emotional challenges in sequence — native does not quit',
      'Saturn churns ego until surrender in necessary places',
    ],
    positives: [
      'Long-term resilience; confidence recovers after dips',
      'Can produce mature humility and durable discipline',
    ],
    negatives: [
      'One challenge after another; temporary self-confidence collapse',
      'Strong Pitru Dosh indicator when conjunct (house decides severity)',
    ],
    technical: [
      'Pitru patterns: Sun+Rahu/Ketu any house (partial); stronger in 5th; full flavour in 9th',
      'Saturn+Ketu in 5th partial / 9th full Pitru lore (parallel track)',
      '5th Pitru: repeating DNA-family problem patterns across generations',
      '9th Sun–Rahu: deep father bond but work fails at last 1%',
    ],
    careers: ['Long-horizon administration', 'Disciplined service careers', 'Roles requiring patience under pressure'],
    byHouse: {
      5: ['Partial Pitru / ancestral DNA-theme repetition when nodes also involved'],
      9: ['Full Pitru flavour with nodes; father karma central'],
    },
    remedies: [
      'Respect for father / pitru seva is repeatedly emphasised in class casework',
      'Accept slow Saturn timing — do not force Sun’s instant-result habit',
    ],
  },
  {
    partner: 'Ra',
    name: 'Sun–Rahu',
    sanskrit: 'सूर्य–राहु युति / Grahan Yoga',
    tagline: 'Eclipsed king — good dictator / extreme ambition',
    elements: 'Sun light eclipsed by Rahu’s shadow desire',
    core: [
      'Grahan yoga — “good dictator” leadership; politician/CEO potential',
      'Materialistic life orientation vs Sun–Ketu’s spiritual tilt',
      'Secrets eventually expose; Rahu brings defamation when hidden things surface',
    ],
    positives: [
      'Extreme ambition, unconventional rules, always presentable',
      'First in studies; surprises people by revealing plans only at execution',
      'Tech mastery — ethical hacking / digital / startup orientation',
    ],
    negatives: [
      'Lies cleverly to father for money while keeping him externally happy',
      'Wrong ambition + wrong confidence; may look illogical to others',
      '11th extreme: serious crime lore with polished public image — judge whole chart',
    ],
    technical: ['Same-sign or close conjunction = eclipse pattern; refine by house and nakshatra'],
    careers: ['Politics', 'CEO / leadership', 'Technology / ethical hacking', 'Startups'],
    byHouse: {
      2: ['Hook-or-crook earning for self/family benefit'],
      4: ['People fear visiting — “that person can do anything” aura'],
      5: ['Brilliant; multiple love affairs; fame'],
      6: ['Excellent workforce; few enemies'],
      10: ['Great leadership; ego clashes cause last-1% failures'],
      11: ['High-risk ambition; public image carefully managed'],
      12: ['Generous donations — even beyond capacity'],
    },
    remedies: [
      'Bring hidden plans into ethical daylight before Rahu exposes them',
      'Temper unconventional ambition with dharma checks',
    ],
  },
  {
    partner: 'Ke',
    name: 'Sun–Ketu',
    sanskrit: 'सूर्य–केतु युति',
    tagline: 'Separative light — hidden ego, quick realisation',
    elements: 'Sun identity + Ketu detachment',
    core: [
      'Generally better than Sun–Rahu for spiritual outcomes',
      'Sun–Rahu → materialistic; Sun–Ketu → spiritualism',
      'Hidden ego burns inside without display',
    ],
    positives: [
      'Quick realisation of hidden purposes',
      'Speaks as if knowing everything — and often does; hard to counter',
      'Many spiritual experiences',
    ],
    negatives: [
      'Separative from name/fame situations; clash can push detachment',
      'Internalised ego can still burn relationships quietly',
    ],
    technical: ['Separative like Rahu but toward detachment rather than amplification'],
    careers: ['Spiritual teaching', 'Research detachment roles', 'Occult / moksha-oriented paths'],
    byHouse: {},
    remedies: [
      'Own the hidden ego consciously — silence is not the same as humility',
      'Channel Ketu detachment into sadhana rather than running from responsibility',
    ],
  },
]

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs((((a - b) % 360) + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function houseTeachingFor(house: number): SunHouseTeaching {
  return SUN_HOUSE_TEACHINGS.find(h => h.house === house) ?? SUN_HOUSE_TEACHINGS[0]
}

function analyzeAmavasya(sun: GrahaData, moon: GrahaData | undefined): AmavasyaAnalysis | null {
  if (!moon) return null
  const sepDeg = angularSep(sun.lonSidereal, moon.lonSidereal)
  const band: AmavasyaAnalysis['band'] =
    sepDeg <= 3 ? 'full' : sepDeg <= 12 ? 'amavasya' : 'outside'

  const elong = (((moon.lonSidereal - sun.lonSidereal) % 360) + 360) % 360
  let paksha: AmavasyaAnalysis['paksha'] = elong < 180 ? 'shukla' : 'krishna'
  // Near new moon (end of Krishna / start of Shukla) — treat Amavasya band as Krishna closure
  if (band !== 'outside' && (elong <= 12 || elong >= 348)) paksha = 'krishna'

  const label =
    band === 'full'
      ? 'Full Amavasya (0–3°)'
      : band === 'amavasya'
        ? 'Amavasya Yoga (within 12°)'
        : 'Outside Amavasya orb'

  const detail =
    band === 'full'
      ? `Moon is ${sepDeg.toFixed(1)}° from Sun — full Amavasya band. Personality can be magnetic; mind peace and early home finances need care. Check D-charts and paksha bal.`
      : band === 'amavasya'
        ? `Moon is ${sepDeg.toFixed(1)}° from Sun — general Amavasya yoga (tithi changes after ~12°). Degrees and divisional charts decide how much of the teaching applies.`
        : `Moon is ${sepDeg.toFixed(1)}° from Sun — past the ~12° Amavasya window (Pratipada territory). Conjunction teaching applies only if same-sign / wider orb rules you use still count them together.`

  return {
    active: band !== 'outside' || sun.rashi === moon.rashi,
    sepDeg,
    band,
    label,
    detail,
    paksha,
  }
}

function buildChartNotes(
  teaching: SunYutiTeaching,
  sun: GrahaData,
  other: GrahaData,
  house: number,
  sepDeg: number,
  combust: boolean,
  deeplyCombust: boolean,
): string[] {
  const notes: string[] = [
    `${teaching.name} active — separation ${sepDeg.toFixed(1)}° · ${other.rashi === sun.rashi ? 'same sign' : 'close orb'} · Sun H${house}`,
  ]
  if (deeplyCombust) {
    notes.push(`${other.name} deeply combust (within ${DEEP_COMBUST_ORB}° of Sun) — significations heavily restricted.`)
  } else if (combust) {
    if (other.id === 'Me') {
      notes.push('Mercury combust — usually not harmful for Budh Aditya Yoga (class teaching).')
    } else {
      notes.push(`${other.name} combust within classical orb — reduce expected strength.`)
    }
  }
  if (teaching.partner === 'Ju' && combust && (house === 8 || house === 12)) {
    notes.push('Hidden-curse checklist match: Sun+Jupiter in 8/12 with combust Jupiter — verify before applying severe readings.')
  }
  if (teaching.partner === 'Ma' && house === 7) {
    notes.push('Class warning: Sun–Mars in 7th is rarely favourable for marriage — even “positive” cases carry ego damage.')
  }
  if (sun.nakshatraIndex === 0 || sun.nakshatraIndex === 9) {
    if (teaching.partner === 'Mo') {
      notes.push('Sun in Ashwini or Magha with Moon yuti — future track / strategy visibility lore applies.')
    }
  }
  return notes
}

/**
 * Natal Surya house + yuti teaching analysis (chart-aware highlights).
 */
export function analyzeSunHousesYuti(chart: ChartOutput): SunHousesYutiResult | null {
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!sun) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(sun.rashi, asc)
  const houseTeaching = houseTeachingFor(house)
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const amavasya = analyzeAmavasya(sun, moon)

  const activeYutis: ActiveSunYuti[] = []
  for (const teaching of SUN_YUTI_TEACHINGS) {
    const other = chart.grahas.find(g => g.id === teaching.partner)
    if (!other) continue
    const orb = teaching.partner === 'Mo' ? 12 : teaching.partner === 'Me' || teaching.partner === 'Ve' ? 10 : 8
    if (!sameSignOrConjunct(sun, other, orb)) continue

    const sepDeg = angularSep(sun.lonSidereal, other.lonSidereal)
    const combustOrb = COMBUST_ORBS[teaching.partner]
    const combust = combustOrb !== undefined ? sepDeg < combustOrb : false
    const deeplyCombust = sepDeg <= DEEP_COMBUST_ORB && teaching.partner !== 'Mo'
    const houseNotes = teaching.byHouse[house] ?? []

    activeYutis.push({
      partner: teaching.partner,
      name: teaching.name,
      sepDeg,
      sameSign: sun.rashi === other.rashi,
      combust,
      deeplyCombust,
      teaching,
      houseNotes,
      chartNotes: buildChartNotes(teaching, sun, other, house, sepDeg, combust, deeplyCombust),
    })
  }

  const pitruNotes: string[] = []
  const withRa = activeYutis.some(y => y.partner === 'Ra')
  const withKe = activeYutis.some(y => y.partner === 'Ke')
  const withSa = activeYutis.some(y => y.partner === 'Sa')
  if (withRa || withKe) {
    pitruNotes.push(
      house === 9
        ? 'Sun with Rahu/Ketu in 9th — full Pitru Dosha flavour in this teaching (father/dharma incomplete karmas).'
        : house === 5
          ? 'Sun with Rahu/Ketu in 5th — partial Pitru Dosha; generational DNA-pattern repetition.'
          : 'Sun with Rahu/Ketu — partial Pitru Dosha indication; refine by house and nakshatra.',
    )
  }
  if (withSa) {
    pitruNotes.push('Sun–Saturn conjunction is a classical Pitru stress marker; Saturn churns ego through necessary humiliation.')
  }
  if (!pitruNotes.length) {
    pitruNotes.push('No Sun–Rahu/Ketu/Saturn yuti flagged — Pitru Dosha from this module’s yuti rules not indicated.')
  }

  const remedySet = new Set<string>()
  for (const y of activeYutis) {
    for (const r of y.teaching.remedies) remedySet.add(r)
  }
  if (house === 6) {
    remedySet.add('Sun in 6th: improve physical discipline first — spiritual gains follow without forcing.')
  }
  if (!remedySet.size) {
    remedySet.add('No active close yuti — use house themes and general Surya discipline (truth, spine/prana, respectful pitru conduct).')
  }

  return {
    sun: {
      rashi: sun.rashi,
      rashiName: RASHI_NAMES[sun.rashi],
      nakshatraIndex: sun.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[sun.nakshatraIndex],
      pada: sun.pada,
      house,
      dignity: sun.dignity,
      degreeInSign: sun.degree,
    },
    houseTeaching,
    allHouses: SUN_HOUSE_TEACHINGS,
    activeYutis,
    allYutis: SUN_YUTI_TEACHINGS,
    amavasya,
    pitruNotes,
    remedies: [...remedySet],
    caveats: [
      'Never apply these general principles blindly — think carefully before matching any chart.',
      '70–80% of traits are practical-class notes, not always in standard textbooks.',
      'Degrees, divisional charts, aspects, and dasha timing decide what manifests.',
      'Same yuti behaves differently house to house and person to person.',
      'Jupiter’s aspect can modify many negative Sun combinations.',
    ],
    methodology: [
      'Layer: planet energy → house → sign → degree/nakshatra → yuti → D9 confirmation.',
      'For Amavasya: measure Moon–Sun degrees before prescribing heavy remedies.',
      'For Mars/Jupiter yuti: check combustion depth before promising Rajyoga.',
      'Multi-planet piles (3–6 grahas) need separate synthesis beyond pairwise notes.',
    ],
  }
}
