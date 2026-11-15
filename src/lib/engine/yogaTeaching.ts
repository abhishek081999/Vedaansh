// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogaTeaching.ts
//  Nitya yoga as the outcome: the class teaching on each Sun + Moon
//  yoga — life pattern, shadow, what to start or avoid on the day,
//  story and the class remedy.
//
//  Frame: yoga is where soul (Sun) and mind (Moon) agree — the final
//  outcome. Yoga point = Sun + Moon + 93°20′ (Pushya start); its
//  nakshatra lord is the yoga lord. Never read the nakshatra's own
//  energy into the yoga (Pushya is excellent, Vishkambha is not).
//  Only the yogas taught in class have entries. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { getYogaMeta, type YogaId } from '@/lib/engine/yogaMeta'
import { YOGA_PRINCIPLES_HI, YOGA_TEACHING_HI } from '@/lib/engine/locale/yogaTeaching.hi'

export interface YogaTeachingText {
  /** One-line outcome of the yoga */
  essence:  string
  /** Life pattern when born in this yoga */
  nature:   string
  /** What goes wrong if unworked */
  shadow:   string
  /** What to start on the day this yoga runs */
  goodFor:  string[]
  /** What not to start on the day */
  avoid:    string[]
  remedies: string[]
  /** Story or example from class */
  story:    string
}

export interface YogaTeaching extends YogaTeachingText {
  id:     YogaId
  number: number
  /** Nakshatra lord of the yoga point (Pushya = yoga 1) */
  lord:   GrahaId
}

/** Vimshottari lords from Ashwini. */
const NAK_LORDS: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']

/** Yoga 1 sits on Pushya (nakshatra 8); each yoga moves one nakshatra on. */
export function yogaLord(yogaNumber: number): GrahaId {
  const n = ((Math.floor(yogaNumber) - 1) % 27 + 27) % 27
  const nakIndex0 = (7 + n) % 27
  return NAK_LORDS[nakIndex0 % 9]
}

export const YOGA_TEACHING_EN: Partial<Record<YogaId, YogaTeachingText>> = {
  Vishkambha: {
    essence: 'A pot full of poison — pressure, duty and little joy.',
    nature: 'Extremely disciplined and hard-working, always carrying others. They are expected to be perfect and punished for small mistakes others are forgiven — and over time they do become near-perfect. Often marry out of pity and then carry the load.',
    shadow: 'Gets along with almost no one — parents, spouse, in-laws, siblings — and is above all troubled by themselves. Life turns dry from working for others without respect.',
    goodFor: ['Hard, disciplined work under pressure'],
    avoid: ['Anything meant to bring joy — expect pressure instead'],
    remedies: ['Read books on making friends and influencing people, and on not carrying everyone’s judgement — they suffer from what others will think.'],
    story: 'A woman wrote that she gets along with neither her parents, her husband, her in-laws nor her siblings — the Vishkambha signature.',
  },
  Priti: {
    essence: 'Love and connection — a contact everywhere.',
    nature: 'Know someone in every place and dig out a connection anywhere — even with the sweet-shop owner after buying two kilos. People think they are rich because of their network and luxury.',
    shadow: 'Respected by the whole world but not at home; their luxury and contacts serve others. Friends don’t come to their aid — strangers they merely know do. Intentions are misread as asking for something.',
    goodFor: ['Stepping into a completely new field where you know no one'],
    avoid: ['Joining a new office — you’ll know everyone, but it won’t help you'],
    remedies: ['Learn to use your connections and state your intentions clearly — manage which contact to use when.'],
    story: 'The same yoga can flip with the other limbs: with a different tithi and vaar, home knows them and outsiders don’t.',
  },
  Ayushman: {
    essence: 'Long life — healing and things that extend life.',
    nature: 'Drawn to doctors, healers, medicine-making, yoga training and anything that lengthens life; a pioneer of genetic engineering was born in it.',
    shadow: 'Doesn’t get along with siblings or sons; the first child’s health trouble sends them round hospitals until they become half-doctors.',
    goodFor: ['Healing and health work'],
    avoid: ['Starting treatment or being admitted to hospital — the illness lingers like a lifelong event'],
    remedies: ['Learn healing — Ayurveda or a course in what medicines do. Learning the subject of your yoga nullifies its trouble.'],
    story: 'Until they learn about life-extending substances, the yoga keeps them circling doctors.',
  },
  Saubhagya: {
    essence: 'Good fortune through skill and saving.',
    nature: 'Very skilled in practical trades, hard-working, often two jobs. A superb manager of resources who knows what a job should cost; skills and wealth grow steadily with age.',
    shadow: 'Labelled a miser or crooked; hard money experiences while growing up. Good for management, harsh on those below.',
    goodFor: ['Management and resource planning', 'Work earned by your own skill'],
    avoid: ['Careless spending or donation'],
    remedies: ['Never drop your shrewdness — if you do, people will eat you up. Let them call you a miser.'],
    story: 'Their caution comes from having seen money go badly early on — and it is why they end up rich.',
  },
  Shobhana: {
    essence: 'Splendour — they make everyone around them shine.',
    nature: 'Teams, teachers and companies feel proud to have them. Unexpected rise, far beyond what anyone imagined — and the more criticism, the higher they go. A one-man army who trusts no one.',
    shadow: 'Marriage and sexuality are the one persistent issue — two partners, or one that doesn’t settle. If life turns “normal”, the yoga stops working.',
    goodFor: ['An emotional connection with your spouse', 'Doing something extra for your body — new soap, perfume'],
    avoid: ['A wedding — books call it shubh, but the marriage struggles'],
    remedies: ['Never answer criticism or abuse — let success be the reply.'],
    story: 'A wise elder at a May wedding said he’d go in his old kurta because everyone’s clothes would be ruined — the barat was soaked in a storm.',
  },
  Atiganda: {
    essence: 'Two opposite energies joined — all or nothing.',
    nature: 'Wherever they put their hand they finish it — completely good or completely ruined. No middle path; revenge, once decided, must be taken.',
    shadow: 'No one to carry the name forward — the lineage tends to end with them.',
    goodFor: ['Donation and works in your name'],
    avoid: ['Weddings, starting a business, buying a new house'],
    remedies: ['Build something people use and remember you by — an orphanage, a hospital, a water stall or trees with your name on it. The day you do, the negative effect ends.'],
    story: 'A childless merchant was told to make the world remember him for good deeds; he built a gilded bathing ghat, and every bath there earned him merit.',
  },
  Sukarma: {
    essence: 'Good deeds — with self-protection as the motive.',
    nature: 'Prayer in the morning, outings in the evening: dharma up to the point their work gets done. Stays well with everyone, carries sweets to all, never takes an open stand.',
    shadow: 'Constant anxiety that something will go wrong; cholesterol. Stress finds an outlet in a second partner or in wine. May let others be sacrificed to keep their position.',
    goodFor: ['Keeping good relations', 'Meditation'],
    avoid: ['A new business or wedding — anxiety follows for life'],
    remedies: ['Work without attachment to results; read the Gita or Ashtavakra Gita; find a guru — only that brings peace.'],
    story: 'One student felt a win-win all day on Sukarma: a sattvic and a spicy dish both made at home.',
  },
  Dhriti: {
    essence: 'Extreme patience — the silent watcher.',
    nature: 'Let you make mistakes until the water reaches your nose, then confront you with proof. The vizier behind the king; spies, lawyers and cunning teachers; faces show nothing.',
    shadow: 'Emotions dried up by past pain, replaced by sarcasm; rarely open up — and when they do, it floods. Hard money times.',
    goodFor: ['Supporting someone, patient work', 'Investigation and quiet observation'],
    avoid: ['Expecting them to open up under pressure'],
    remedies: ['Emotional films and books, love stories; Moon worship; wear light blue; time near water; feed fish or ducks — trust and emotion return.'],
    story: 'Chanakya’s spy asked to wait for Dhriti before entering Amatya Rakshasa’s camp — and went unrecognised.',
  },
  Shula: {
    essence: 'A psychological thorn — pain from the closest people.',
    nature: 'Brilliant strategists who read people well; having been betrayed by those closest, they can confront anyone, loudly and anywhere.',
    shadow: 'Help is mistaken for self-interest. Stomach and gall-bladder trouble; lower-belly fat that holds the pain and won’t go until the hurt is released.',
    goodFor: ['Confrontation', 'Counselling and heading a school'],
    avoid: ['Lending money, helping, or showing mercy — you will regret it'],
    remedies: ['Keep someone in front to deal with people for you', 'Travel often to clear stagnation', 'Read books that sort out emotions'],
    story: 'You lend money in someone’s crisis and they return it saying it didn’t help — that sting is Shula.',
  },
  Ganda: {
    essence: 'Cutting off the near and dear.',
    nature: 'Brave; used so often by their own that they drop everyone who manipulated them with “beta, beta”. Strong in economics (artha-shastra). Outsiders understand them better than family.',
    shadow: 'Multiple marriages are a theme; expect nothing from your own children.',
    goodFor: ['Ending exploitative ties'],
    avoid: ['A wedding — multiple marriages become the theme'],
    remedies: ['Work for others without expectation; give charity outside your own circle.'],
    story: 'A leader born in Ganda first removed every minister who had called her “daughter”.',
  },
  Vriddhi: {
    essence: 'Growth — slow and steady from birth.',
    nature: 'The house starts growing the day they are born; full results come in old age. Accumulate and love to show it — watches, gold, a full showcase. No enemies; a businessman’s yoga.',
    shadow: 'Opportunistic; parents and spouse can’t live together; married life switches on and off.',
    goodFor: ['Business and slow accumulation'],
    avoid: ['Expecting quick results'],
    remedies: ['Let growth take its time.'],
    story: 'Their cupboard is the proof: everything they gathered is on display.',
  },
  Dhruva: {
    essence: 'The pole star — a reference for others.',
    nature: 'Becomes the example others cite; a wedding or business begun now becomes the city’s benchmark. Never steps out of character; breaks old community myths.',
    shadow: 'Must leave home and community to rise, and ends up alone — the family quotes them but can’t reach them.',
    goodFor: ['Weddings and businesses meant to become a reference'],
    avoid: ['Expecting the reference to be useful to you — a pole star is only seen'],
    remedies: ['Accept the sacrifice: a star leaves the common place to shine.'],
    story: '“Our son is in the US” — praised by all, part of none of their days.',
  },
  Vyaghata: {
    essence: 'Beating — off-the-record cruelty.',
    nature: 'Fighters and weapon-makers; random, loyal, yes-or-no decision makers. Masters of fighting technique, strategy and psychological warfare.',
    shadow: 'No calculation or diplomacy; anything started now ends in a fight — even a house-warming.',
    goodFor: ['War or a fight you’ve already decided on'],
    avoid: ['Auspicious starts like a griha pravesh'],
    remedies: ['Channel it — martial arts, the army, defence. Don’t force them into management.'],
    story: 'An unruly minister’s son at Takshashila, given the task of keeping wild animals out, invented a defence and became a great general.',
  },
  Harshana: {
    essence: 'Excitement and entitlement.',
    nature: 'Feels entitled — the heir who rides free because grandfather built the station.',
    shadow: 'The inheritance or promotion they expect doesn’t come — the ancestors overused it. False allegations and rumours spread in a day.',
    goodFor: ['Spreading news fast'],
    avoid: ['A wedding — rumours about the couple, little respect later'],
    remedies: ['Spread your own story before others do', 'Wash your face daily with charcoal — the condition is met, so it won’t work against you', 'Fearing a scandal: publish a small notice yourself — a greeting or condolence'],
    story: 'On ships, a rumour dropped near the galley reached every deck by evening.',
  },
  Vajra: {
    essence: 'The thunderbolt — nothing left to lose.',
    nature: 'Born after great parental sacrifice; emotions under control; strong body and hand skills; take hard decisions without fear. You can’t defeat someone who wants nothing.',
    shadow: 'Can’t be reached emotionally — and shouldn’t let emotion into their work.',
    goodFor: ['Hard decisions', 'Work that needs a cool heart — HR, surgery, law'],
    avoid: ['Showing faith or family at work — it becomes the handle to bend you'],
    remedies: ['Keep family and emotion out of the profession.'],
    story: 'Rishi Dadhichi gave his own bones for Indra’s vajra — what can frighten someone who gave that?',
  },
  Siddha: {
    essence: 'Completion — the work is already done.',
    nature: 'In their own world, generous, content with whatever comes; luck walks with them. Often loose clothes and a heavy body.',
    shadow: 'Not goal-oriented, so no proper position; their department is the one nobody consults.',
    goodFor: ['Starting work', 'Teaching'],
    avoid: ['Hiring an employee — they’ll feel all is fine and put in no effort'],
    remedies: ['Use the luck, but keep putting effort in.'],
    story: 'A call that comes while this yoga runs usually means the work is done.',
  },
  Vyatipata: {
    essence: 'Calamity — life overturned in a day.',
    nature: 'Proud and powerful; picks fights to hurt others.',
    shadow: 'Their own foolish ego decisions and revenge bring everything down in a week — one day a “Chanakya” arrives.',
    goodFor: ['Nothing that needs a cool head'],
    avoid: ['Picking fights, revenge'],
    remedies: ['Stay humble — times change fast', 'Read about what comes after life; the ego comes down'],
    story: 'Dhanananda, proud of Magadha, was overturned by Chanakya within weeks.',
  },
  Variyan: {
    essence: 'Wealth, knowledge and emotional peace — Kubera’s yoga.',
    nature: 'Rich, ambitious and knowledgeable; beautiful homes with gardens and water; a magnetic presence that wins people without trying. Heals many.',
    shadow: 'Sexual problems and too-close relationships; no protection — people loot them, they don’t know their own bank balance.',
    goodFor: ['Starting medicine or treatment', 'Peace and healing'],
    avoid: ['Accepting everything that is offered'],
    remedies: ['Install Kubera at home', 'Keep a protector around who can say no for you'],
    story: 'Money enough that it can’t be spent — and still no idea where peace lies.',
  },
  Parigha: {
    essence: 'Limitation — a prisoner of one’s own mind.',
    nature: 'Talented, yet stays fourteen years in one company and marries the first person seen.',
    shadow: 'Doesn’t know their own value; surrounded by people who keep the fear alive.',
    goodFor: ['Staying put'],
    avoid: ['Starting a challenging new job — confidence won’t come'],
    remedies: ['Break the mental bond — a placebo works: do a puja for them', 'Meet a fearless risk-taker and keep something of theirs', 'Watch animals take risks; read battle and spy stories (Hari Singh Nalwa, Saragarhi)'],
    story: 'One friend dropped out of school and tried everything abroad; the other did an MBA and never left his comfort zone.',
  },
  Shiva: {
    essence: 'Shiva’s blessing — content and honest.',
    nature: 'Simple and dedicated; just as happy at a burger counter as a CEO. Peace is their only measure; they can’t be changed by outside factors.',
    shadow: 'Odd hurdles before the wedding — an accident, distance — because marrying Shiva is never easy. Trickery against them backfires on the trickster.',
    goodFor: ['Honest work'],
    avoid: ['Games and trickery around them'],
    remedies: ['Stay honest — it is their strength.'],
    story: 'A man settled in Canada flew back and married his fiancée after an accident doctors feared would leave her unable to walk.',
  },
  Vaidhriti: {
    essence: 'Stories and back-biting.',
    nature: 'A storyteller who listens at walls.',
    shadow: 'Gossip and back-biting.',
    goodFor: ['Storytelling'],
    avoid: ['Gossip'],
    remedies: ['Stop gossiping and don’t listen to criticism of others.'],
    story: 'Only a short note on Vaidhriti was given in class.',
  },
}

export const YOGA_PRINCIPLES_EN: string[] = [
  'Yoga is the outcome — where soul (Sun) and mind (Moon) agree “this must happen”.',
  'Yoga point = Sun + Moon + 93°20′ (or divide by 13°20′); yoga 1 starts at Pushya. Its nakshatra lord is the yoga lord.',
  'Never read the nakshatra’s own energy into the yoga — Pushya is the best nakshatra, Vishkambha is not.',
  'Check the yoga every morning: what the day will deliver and where your mind will settle.',
  'Learning the subject of your birth yoga nullifies much of its trouble.',
  'All five limbs are never good together; aim for three or four and remedy the rest.',
  'Practise on 10–20 charts per yoga before predicting for a whole city.',
]

export function getYogaTeaching(nameOrNumber: string | number, lang: EngineLang = 'en'): YogaTeaching | null {
  const meta = getYogaMeta(nameOrNumber)
  if (!meta) return null
  const text = (lang === 'hi' ? YOGA_TEACHING_HI : YOGA_TEACHING_EN)[meta.id]
  if (!text) return null
  return { ...text, id: meta.id, number: meta.number, lord: yogaLord(meta.number) }
}

export function listYogaPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? YOGA_PRINCIPLES_HI : YOGA_PRINCIPLES_EN
}
