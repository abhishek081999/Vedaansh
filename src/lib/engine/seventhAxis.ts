// src/lib/engine/seventhAxis.ts
// Marriage through the Kaal Purush axis.
// Every chart is read for where Aries (the self) falls and where Libra
// (the other person) falls, then for the lagna and its 7th sign.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { wholeSignHouse, wholeSignHouseSign } from '@/lib/engine/marriedLifeAnalysis'

export interface AxisSeat {
  house: number
  signName: string
  title: string
  detail: string
}

export interface LagnaSeventhPair {
  lagnaName: string
  seventhName: string
  self: string
  teaches: string
  friction: string | null
}

export interface SeventhAxisReading {
  headline: string
  principle: string
  aries: AxisSeat
  libra: AxisSeat
  perception: string
  pair: LagnaSeventhPair
  matchHint: string
  notes: MarriedLifeNote[]
}

export interface AxisMatchNote {
  tone: LifeTone
  mark: string
  detail: string
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const CLASSICAL = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const FRIENDLY: Dignity[] = ['friend']
const WEAK: Dignity[] = ['debilitated', 'enemy', 'great_enemy']
const DEBT_NAKSHATRAS = new Set([7, 16, 25])

const PRINCIPLE =
  'The natural chart begins with Aries. In every horoscope, Aries is the self and Libra is the other person — the circumstances of marriage and the relationship that has to be managed. That Libra house is the karmic debt. It stays, whatever the lagna is. The lagna shows who the person is. The 7th shows how other people perceive them.'

const LIBRA_DUTY: Record<number, { title: string; detail: string }> = {
  1: {
    title: 'Balance yourself first',
    detail: 'Libra on the ascendant makes self-balance the debt. A person who is unsettled inside cannot keep anyone else settled. Marriage and business both wait on that.',
  },
  2: {
    title: 'The family is the marriage',
    detail: 'The relationship that has to be managed is the family. Family struggle lands directly on the marriage. Speech and money inside the house are part of the same debt.',
  },
  3: {
    title: 'Siblings',
    detail: 'The relationship with siblings has to stay tended. When it breaks, the marriage and the business both feel it.',
  },
  4: {
    title: 'Mother and comfort',
    detail: 'The relationship with the mother, and the way comfort is taken, is the debt. Comfort won by insulting other people works against the marriage.',
  },
  5: {
    title: 'Children',
    detail: 'The relationship with children has to be maintained for the marriage to survive. Neglect there spreads into the partnership.',
  },
  6: {
    title: 'Disease, debt, and enemies',
    detail: 'The debt is the maternal uncle and aunt, and the management of disease, debt, and enemies. Family illness, money trouble, and fights with relatives keep showing up until this house is settled. The marriage improves after the 6th is handled.',
  },
  7: {
    title: 'The partnership itself',
    detail: 'Libra is the 7th, so the debt is the partner. The marriage is the relationship that has to be managed, and a failure here spreads into business and the rest of life.',
  },
  8: {
    title: 'What is shared and hidden',
    detail: 'The relationship that has to be managed sits in crisis, joint resources, and the partner’s family. Secrets, in-laws, and shared money decide whether the marriage holds.',
  },
  9: {
    title: 'Father, teacher, and dharma',
    detail: 'The relationship with the father and with one’s own dharma is the debt. The marriage loses its ground when that bond is neglected.',
  },
  10: {
    title: 'Conduct at work',
    detail: 'Relationship balance has to happen through the career. Poor behavior with people at work affects whether the marriage survives. When the career is unsteady, self-respect drops, emotion cannot hold, and the marriage suffers.',
  },
  11: {
    title: 'The outer world',
    detail: 'The relationship with the wider circle and the public is the debt. When respect from society is missing, the mindset inside the marriage changes.',
  },
  12: {
    title: 'Solitude and expenditure',
    detail: 'The relationship that has to be managed is the private one: sleep, spending, foreign or isolated life, and what happens behind a closed door. Leakage there drains the marriage.',
  },
}

const ARIES_SEAT: Record<number, string> = {
  1: 'Aries is the ascendant. Identity, body, and pride are the project of the life. Progress comes through the self.',
  2: 'Aries falls in the 2nd. Pride sits in family, speech, and resources. The self is fed by what is said and what is owned.',
  3: 'Aries falls in the 3rd. Courage and self-effort go through siblings, skills, and short initiatives.',
  4: 'Aries falls in the 4th. The self is rooted in the home and the mother. Private pride drives the life.',
  5: 'Aries falls in the 5th. Identity runs through children, intelligence, and one’s own creation.',
  6: 'Aries falls in the 6th. The self is spent on conflict, service, debt, and competition.',
  7: 'Aries falls in the 7th. The self shows up as the partner and as the way other people experience this person. Identity and marriage are the same room.',
  8: 'Aries falls in the 8th. The self is worked through crisis, secrecy, and other people’s resources.',
  9: 'Aries falls in the 9th. Pride sits in dharma, the father, and a teaching role.',
  10: 'Aries falls in the 10th. Name, career, and public action are where the self advances.',
  11: 'Aries falls in the 11th. The self is built through gains, networks, and a wish fulfilled.',
  12: 'Aries falls in the 12th. The self is dealt with in isolation: sleep, retreat, and private expenditure, away from the crowd.',
}

const PAIR: Record<number, { self: string; teaches: string; friction: string | null }> = {
  1: {
    self: 'The life is built around the self: body, name, and personal progress. Speech needs a pause, because Venus rules both the 2nd house of speech and the 7th house of marriage. The native aggression needs more attention on partnership if the life is going to widen.',
    teaches: 'The partner’s work is to pull attention off the self and onto the relationship. A quality built in the lagna, including the body, is there for the 7th to perceive.',
    friction: null,
  },
  2: {
    self: 'Family, resources, and society’s opinion run the life. Venus as 2nd lord makes speech soft, so other people’s comments land hard. A good deed wants to be shown in public.',
    teaches: 'Scorpio in the 7th asks for time alone and an end to display. The partner, carrying Mars, is the one who stands up for this person.',
    friction: null,
  },
  3: {
    self: 'The mind stays young. The 2nd lord is the Moon, so speech runs before the consequence is seen, and a marriage can be decided because someone was liked in the moment. The 10th is Pisces, a debilitated seat for its lord, so career confusion is native.',
    teaches: 'The spouse is the teacher. When the 7th holds benefics, the guidance is at home. After marriage the partner is the one who supports a new venture.',
    friction: null,
  },
  4: {
    self: 'Emotion is deep and often unspoken, from a fear that showing the hurt will look like bad conduct. Venus is exalted in the 4th, so stress looks for comfort in food and sweets when the partner goes cold.',
    teaches: 'The Capricorn partner works by karma and discipline and, when the 7th is supported, stands up for this person. When that partner is absorbed only in work, the marriage turns bad: one side wants emotional attention and the other stays inside the task.',
    friction: 'Some marital friction is built in. The lagna lord is the Moon and the 7th lord is Saturn, and they do not share an element. The practical partner completes the feeling, and the feeling completes the work, only while both stay in the exchange.',
  },
  5: {
    self: 'The lagna is a court: how one is seen, what people demand, and how the partner is treated at home. The 5th carries the private image behind the public one.',
    teaches: 'Aquarius, Saturn with Rahu, is the humbling. Arrogance brings eclipse-style trouble: rumor, duplicity, a public story that is false. Rahu’s fame is short. The Sun’s fame lasts. Humility inside the marriage is the protection. Saturn as 7th lord is in its own sign in the 7th, so the marriage has a structural holder when that humility is practiced.',
    friction: 'Leo and Aquarius are an extreme opposition. Ego on one side and the crowd on the other keep producing friction. The whole chart still decides how far it goes.',
  },
  6: {
    self: 'Technical, perfectionist, and always inside disease, debt, and enemies. Skill turns into the belief that the mind can solve everything. Mercury’s exaltation feeds that confidence.',
    teaches: 'Pisces in the 7th says some things do not yield to technique. The partner brings the spiritual or energetic side the lagna skips.',
    friction: 'Venus is debilitated in Virgo and exalted in Pisces, so desire often sits at two temperatures. Read the actual Venus. When both Virgo and Pisces are under pressure, the chart can show a pull outside the marriage. One placement does not settle that question.',
  },
  7: {
    self: 'The day is spent managing people. The 11th is Leo, so gains are chased through power and position. Saturn is exalted in the lagna, which can calculate, and can undercut someone else to build a name. The question is what is being shown. A right display gives a clean result. A false display gives bad karma.',
    teaches: 'The Aries partner brings this person back to their own want. Each one supplies what the other spends the day avoiding: the self, or the relationship.',
    friction: null,
  },
  8: {
    self: 'The preference is to be alone, and isolation makes the mind rigid. Secrecy is native: little is shown. In Scorpio, Saturn and Ketu support occult and research work. The Moon is debilitated here, and Venus does not perform.',
    teaches: 'The Taurus partner teaches how to manage people, and how much to reveal. Taurus carries a pleasant presence; people feel better in that company. The exchange is solitude against display, each one moderating the other.',
    friction: null,
  },
  9: {
    self: 'Ethical, and full of knowledge that often stays unapplied. New methods are resisted because the person already knows. No planet is exalted in Sagittarius; the sign is Jupiter alone. Jupiter joined to a watery or dual influence on the lagna tends toward physical heaviness, which slows the work.',
    teaches: 'The Gemini partner says keep a window open. Accept a change. The wisdom is already there; the marriage is what puts it into motion.',
    friction: null,
  },
  10: {
    self: 'Karma and career fill the life. The 7th is Cancer, and emotion is still hard to say: the wrong sentence comes out even when the care is real. Libra falls in the 10th, so relationship balance happens through conduct at work. Career stability comes before marriage. A thin, unsteady income is a reason to wait.',
    teaches: 'The Cancer partner brings the feeling this lagna does not know how to show. Unlike Gemini, this lagna does not get to postpone the practical life and hope the marriage will supply a spiritual direction. The work has to be standing first.',
    friction: 'Some marital friction is built in. The lagna lord is Saturn and the 7th lord is the Moon. Discipline and emotion complete each other, and they also miss each other.',
  },
  11: {
    self: 'Social, commercial, aimed at the crowd. When Saturn is afflicted, ethics slip. Public and online conduct has to stay clean, because this lagna’s results follow its rules.',
    teaches: 'The Sun of the 7th (Leo) is what keeps conduct ethical. A failed ethic can show up as illness that forces a change of life, often with the spouse as the guide. Rahu works well in this lagna and can balance Saturn’s dryness, and the Sun still has to be strong. For Leo, Saturn as 7th lord sits in its own Aquarius. Aquarius does not get that free hold: the partner’s Sun is the support, and earnings alone do not replace it.',
    friction: 'Leo and Aquarius are an extreme opposition. The Aquarius side can drift into duplicity when Saturn is weak. The Leo side can become rigid about being right. Placements override the sign story.',
  },
  12: {
    self: 'Worldly detail is easy to dismiss. Confidence sits in energy and faith. The person can give property away, including into the spouse’s name, and still feel that energy is the whole matter.',
    teaches: 'The Virgo partner is the one who implements. Technique, which this lagna skips, is what makes the faith usable.',
    friction: 'Venus is exalted in Pisces and debilitated in Virgo, so desire often sits at two temperatures. Read Venus. When both signs are under pressure, a pull outside the marriage is possible. The whole chart decides.',
  },
}

const MATCH_HINT: Record<number, string> = {
  1: 'On a match, the partner’s Venus shows whether the relationship will actually be managed. This lagna supplies the decision; Libra has to supply the exchange.',
  2: 'Settle 6th-house disease, debt, and enemies before expecting the marriage to feel easy. In the partner’s chart, Mars shows whether someone will stand up for this person.',
  3: 'For a Gemini lagna match, weigh the partner’s Jupiter above Venus. This lagna already carries Venus, sometimes in strength, in the 12th. Jupiter is the wisdom that balances the confusion.',
  4: 'Look for a partner whose discipline can stand up for this person and still stay emotionally present. A partner absorbed only in work is the failure mode of this axis.',
  5: 'Humility is the matching condition. Read Saturn and Rahu on the Aquarius side before calling the pair easy.',
  6: 'Read Venus, rather than Mercury. Exaltation and debilitation of Venus sit on the two ends of this marriage.',
  7: 'The partner’s Mars shows whether this person is brought back to their own want, or kept performing for other people.',
  8: 'The partner has to be able to teach ordinary relationship, because this lagna prefers to stay alone.',
  9: 'Read the partner’s Mercury. Mercury with Rahu, and under Saturn, uses this person’s knowledge for one person’s rise. That match is one to refuse.',
  10: 'Work and money need to be stable before the marriage. Conduct in the career is the relationship debt.',
  11: 'A strong Sun in the partner’s chart is the support this lagna needs. Earnings without that Sun do not hold the life up.',
  12: 'Read Venus, as with Virgo. Generosity on this side and self-interest on the Virgo side are tendencies. Placements override them.',
}

const LIBRA_PLANET: Partial<Record<GrahaId, { title: string; detail: string; tone: LifeTone }>> = {
  Su: {
    title: 'Sun in Libra',
    detail: 'The Sun in Libra puts authority, ego, or the father into the circumstances of the marriage. The wedding and the bond carry a question of status.',
    tone: 'mixed',
  },
  Mo: {
    title: 'Moon in Libra',
    detail: 'Feelings about the other person run the circumstances of marriage. The public mood around the wedding shifts with the mind.',
    tone: 'mixed',
  },
  Ma: {
    title: 'Mars in Libra',
    detail: 'Mars in Libra points to a quarrel around the marriage: between the families, or between an uncle and the father. The conflict is real and usually limited, and it sits on the event itself.',
    tone: 'caution',
  },
  Me: {
    title: 'Mercury in Libra',
    detail: 'Negotiation and speech decide how the marriage is arranged. The circumstances stay movable until something is put in words.',
    tone: 'mixed',
  },
  Ju: {
    title: 'Jupiter in Libra',
    detail: 'A teacher, an elder, or a dharmic consideration shapes the circumstances of the marriage.',
    tone: 'supportive',
  },
  Ve: {
    title: 'Venus in Libra',
    detail: 'Venus is in its own sign. Managing the other person is native, and the relationship debt of this house is easier to perform.',
    tone: 'supportive',
  },
  Sa: {
    title: 'Saturn in Libra',
    detail: 'Saturn is exalted in Libra. The person can calculate, and can build a name by reducing someone else. The marriage circumstances are slow, contractual, and status-conscious.',
    tone: 'mixed',
  },
  Ra: {
    title: 'Rahu in Libra',
    detail: 'The circumstances of marriage are unconventional, public, or distorted. The bond is arranged through an unusual channel.',
    tone: 'caution',
  },
  Ke: {
    title: 'Ketu in Libra',
    detail: 'The circumstances of marriage are cut short, spiritual, or oddly detached. Something about the wedding does not belong to ordinary social form.',
    tone: 'mixed',
  },
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function find(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function classical(chart: ChartOutput): GrahaData[] {
  return chart.grahas.filter(g => CLASSICAL.has(g.id))
}

function inSign(chart: ChartOutput, sign: number): GrahaData[] {
  return classical(chart).filter(g => g.rashi === sign)
}

function inHouse(chart: ChartOutput, house: number, asc: number): GrahaData[] {
  return classical(chart).filter(g => wholeSignHouse(g.rashi, asc) === house)
}

function names(list: GrahaData[]): string {
  return list.map(g => GRAHA_NAMES[g.id] ?? g.id).join(', ')
}

function isStrong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function isWeak(d: Dignity | undefined): boolean {
  return !!d && WEAK.includes(d)
}

export function dignityMark(g: GrahaData | undefined): number {
  if (!g) return 0
  let score = 3
  if (isStrong(g.dignity)) score = 5
  else if (g.dignity && FRIENDLY.includes(g.dignity)) score = 4
  else if (g.dignity === 'debilitated') score = 1
  else if (isWeak(g.dignity)) score = 2
  if (g.isCombust) score = Math.max(1, score - 1)
  return score
}

function saturnReaches(from: number, to: number): boolean {
  const d = (to - from + 12) % 12
  return d === 0 || d === 2 || d === 6 || d === 9
}

function signPressed(chart: ChartOutput, sign: number): boolean {
  const there = inSign(chart, sign)
  if (there.some(g => MALEFICS.has(g.id))) return true
  const lord = find(chart, LORDS[sign])
  return isWeak(lord?.dignity)
}

function debtNakshatra(g: GrahaData | undefined): boolean {
  return !!g && DEBT_NAKSHATRAS.has(g.nakshatraIndex)
}

function perceptionLine(chart: ChartOutput, asc: number): string {
  const lagna = inHouse(chart, 1, asc)
  const seventh = inHouse(chart, 7, asc)
  const self = lagna.length
    ? `The lagna holds ${names(lagna)}. That is who this person is.`
    : 'The lagna is empty. Identity is carried by the lagna lord, wherever that lord sits.'
  const seen = seventh.length
    ? `The 7th holds ${names(seventh)}. People perceive this person through that planet, including when the lagna tells a different story.`
    : 'The 7th is empty, so perception follows the 7th lord. A house with no planet has less fuel of its own, and the lord still decides how the bond behaves. Attention is less locked on marriage, which is why an empty 7th is an easier seat for liberation readings.'
  return `${self} ${seen}`
}

function pairTeaching(chart: ChartOutput, asc: number): { teaches: string; friction: string | null } {
  const row = PAIR[asc]
  let teaches = row.teaches
  if (asc === 3) {
    const benefics = inHouse(chart, 7, asc).filter(g => g.id === 'Ju' || g.id === 'Ve' || g.id === 'Me')
    if (benefics.length) {
      teaches += ` ${names(benefics)} in the 7th: ask the spouse before searching outside for advice.`
    }
  }
  return { teaches, friction: row.friction }
}

function pushScorpio(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  if (asc !== 2 && asc !== 8) return
  const there = inSign(chart, 8)
  const research = there.filter(g => g.id === 'Sa' || g.id === 'Ke')
  const soft = there.filter(g => g.id === 'Mo' || g.id === 'Ve')
  if (research.length) {
    notes.push(note(
      'scorpio-research',
      'Saturn or Ketu in Scorpio',
      `${names(research)} in Scorpio supports occult and research sense. Malefics are the planets that work in this sign.`,
      'supportive',
    ))
  }
  if (soft.length) {
    notes.push(note(
      'scorpio-soft',
      'Moon or Venus in Scorpio',
      `${names(soft)} in Scorpio is an uncomfortable seat. The Moon is debilitated here, and Venus does not perform. Feeling and romance run hot and do not run smoothly.`,
      'caution',
    ))
  }
}

function pushPassion(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  const moon = find(chart, 'Mo')
  const venus = find(chart, 'Ve')
  const obsessed = isStrong(moon?.dignity) && !!venus && (isStrong(venus.dignity) || (venus.dignity && FRIENDLY.includes(venus.dignity)))
  if (asc === 8 || obsessed) {
    notes.push(note(
      'passion',
      'Passionate attachment',
      asc === 8
        ? `Scorpio lagna loves with fixation.${obsessed ? ' A strong Moon with a benefic Venus intensifies it.' : ''} The bond becomes the whole room.`
        : 'A strong Moon with a benefic Venus loves with fixation. The bond becomes the whole room.',
      'mixed',
    ))
  }
}

function pushDebt(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  const venus = find(chart, 'Ve')
  const saturn = find(chart, 'Sa')
  const seventhLord = find(chart, LORDS[wholeSignHouseSign(asc, 7)])
  const flagged = [saturn, venus, seventhLord, ...inSign(chart, 7), ...inHouse(chart, 7, asc)]
    .filter((g): g is GrahaData => !!g && debtNakshatra(g))
  const unique = [...new Map(flagged.map(g => [g.id, g])).values()]
  if (unique.length) {
    const stars = unique.map(g => `${GRAHA_NAMES[g.id]} in ${NAKSHATRA_NAMES[g.nakshatraIndex] ?? 'a Saturn nakshatra'}`)
    notes.push(note(
      'rin-nakshatra',
      'Debt nakshatra',
      `${stars.join('; ')}. Pushya, Anuradha, and Uttara Bhadrapada are Saturn’s nakshatras, and they carry debt. Financial and karmic debt sits inside the marriage story.`,
      'caution',
    ))
  }

  const mercury = find(chart, 'Me')
  const eighthSign = wholeSignHouseSign(asc, 8)
  const mercuryOnEighth = !!mercury && (
    wholeSignHouse(mercury.rashi, asc) === 8
    || (LORDS[eighthSign] === 'Me' && [6, 8, 12].includes(wholeSignHouse(mercury.rashi, asc)))
  )
  if (mercuryOnEighth) {
    notes.push(note(
      'mercury-eighth',
      'Mercury on the 8th',
      'Mercury on the 8th ties a debt to the maternal uncle’s family, including a rite left unfinished after a death.',
      'caution',
    ))
  }
}

function pushWater(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  const saturn = find(chart, 'Sa')
  if (asc === 4 || asc === 10 || isWeak(saturn?.dignity)) {
    notes.push(note(
      'saturn-water',
      'Saturn and household water',
      'On this Saturn axis, check the house for leaking taps and wasted bathroom water. A small water feature in Saturn’s direction is the correction. An aquarium belongs to Pisces and is a different remedy.',
      'mixed',
    ))
  }
}

function pushAffairFlag(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  if (asc !== 6 && asc !== 12) return
  if (signPressed(chart, 6) && signPressed(chart, 12)) {
    notes.push(note(
      'virgo-pisces-pressure',
      'Virgo and Pisces both under pressure',
      'Both ends of this marriage axis are afflicted. That can show interest outside the marriage. Treat it as a consultation flag. The rest of the chart, including Navamsha, decides it.',
      'caution',
    ))
  }
}

function pushLibraLinks(chart: ChartOutput, notes: MarriedLifeNote[]) {
  const inLibra = inSign(chart, 7)
  if (!inLibra.length) {
    notes.push(note(
      'libra-empty',
      'Libra is empty',
      'No planet sits in Libra. The circumstances of marriage are carried by Venus and by the house Libra occupies.',
      'mixed',
    ))
  }
  for (const g of inLibra) {
    const row = LIBRA_PLANET[g.id]
    if (row) notes.push(note(`libra-${g.id}`, row.title, row.detail, row.tone))
  }

  const sun = find(chart, 'Su')
  if (sun && sun.rashi !== 7 && sun.nakshatraIndex != null) {
    const sunLord = NAKSHATRA_LORDS[sun.nakshatraIndex]
    const linked = inLibra.filter(g => g.nakshatraIndex != null && NAKSHATRA_LORDS[g.nakshatraIndex] === sunLord)
    if (linked.length && sunLord) {
      notes.push(note(
        'sun-nakshatra-libra',
        'Sun linked to Libra by nakshatra',
        `The Sun is in ${NAKSHATRA_NAMES[sun.nakshatraIndex]}, whose lord is ${GRAHA_NAMES[sunLord]}. ${names(linked)} in Libra shares that nakshatra lord, so authority and the father still color the circumstances of marriage.`,
        'mixed',
      ))
    }
  }
}

export function analyzeSeventhAxis(chart: ChartOutput): SeventhAxisReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const ariesHouse = wholeSignHouse(1, asc)
  const libraHouse = wholeSignHouse(7, asc)
  const seventh = wholeSignHouseSign(asc, 7)
  const duty = LIBRA_DUTY[libraHouse]
  const taught = pairTeaching(chart, asc)
  const notes: MarriedLifeNote[] = []
  pushLibraLinks(chart, notes)
  pushScorpio(chart, asc, notes)
  pushPassion(chart, asc, notes)
  pushDebt(chart, asc, notes)
  pushWater(chart, asc, notes)
  pushAffairFlag(chart, asc, notes)

  return {
    headline: `${RASHI_NAMES[asc]} lagna · Libra in house ${libraHouse}`,
    principle: PRINCIPLE,
    aries: {
      house: ariesHouse,
      signName: 'Aries',
      title: `Aries in house ${ariesHouse}`,
      detail: ARIES_SEAT[ariesHouse],
    },
    libra: {
      house: libraHouse,
      signName: 'Libra',
      title: `Libra in house ${libraHouse} — ${duty.title}`,
      detail: duty.detail,
    },
    perception: perceptionLine(chart, asc),
    pair: {
      lagnaName: RASHI_NAMES[asc],
      seventhName: RASHI_NAMES[seventh],
      self: PAIR[asc].self,
      teaches: taught.teaches,
      friction: taught.friction,
    },
    matchHint: MATCH_HINT[asc],
    notes,
  }
}

function personName(chart: ChartOutput, fallback: string): string {
  return chart.meta?.name?.trim() || fallback
}

export function seventhAxisMatch(chartA: ChartOutput, chartB: ChartOutput): AxisMatchNote | null {
  const ascA = chartA.lagnas?.ascRashi
  const ascB = chartB.lagnas?.ascRashi
  if (!ascA || !ascB) return null

  const nameA = personName(chartA, 'Person 1')
  const nameB = personName(chartB, 'Person 2')
  const bits: string[] = []
  let tone: LifeTone = 'mixed'

  const side = (chart: ChartOutput, other: ChartOutput, name: string, otherName: string) => {
    const asc = chart.lagnas?.ascRashi
    if (!asc) return
    const house = wholeSignHouse(7, asc)
    bits.push(`${name}: Libra in house ${house} (${LIBRA_DUTY[house].title}).`)

    if (asc === 3) {
      const score = dignityMark(find(other, 'Ju'))
      if (score <= 2) tone = 'caution'
      bits.push(`${name} is Gemini lagna. Weigh ${otherName}’s Jupiter above Venus. That Jupiter is ${score}/5.`)
    }
    if (asc === 9) {
      const mercury = find(other, 'Me')
      const rahu = find(other, 'Ra')
      const saturn = find(other, 'Sa')
      const withRahu = !!mercury && !!rahu && mercury.rashi === rahu.rashi
      const underSaturn = !!mercury && !!saturn && saturnReaches(saturn.rashi, mercury.rashi)
      if (withRahu && underSaturn) {
        tone = 'caution'
        bits.push(`${otherName}’s Mercury is with Rahu and under Saturn. For ${name}’s Sagittarius lagna, that person uses the knowledge for their own rise. Refuse the match.`)
      } else {
        bits.push(`${name} is Sagittarius lagna. Read ${otherName}’s Mercury for a real exchange of knowledge.`)
      }
    }
    if (asc === 11) {
      const score = dignityMark(find(other, 'Su'))
      if (score <= 2) tone = 'caution'
      bits.push(`${name} is Aquarius lagna. ${otherName}’s Sun is ${score}/5. This lagna needs that Sun to be strong.`)
    }
  }

  side(chartA, chartB, nameA, nameB)
  side(chartB, chartA, nameB, nameA)

  const pair = [ascA, ascB].sort((a, b) => a - b).join('-')
  if (pair === '4-10') {
    tone = 'caution'
    bits.push('Cancer with Capricorn carries built-in friction. The Moon and Saturn complete each other only while both stay in the marriage.')
  }
  if (pair === '5-11') {
    bits.push('Leo with Aquarius needs humility on the Leo side and clean conduct on the Aquarius side. Leo’s 7th lord is at home in Aquarius. Aquarius depends on the Sun staying strong.')
  }
  if (pair === '6-12') {
    bits.push('Virgo with Pisces: read Venus. Desire often sits at two temperatures on this axis.')
    if (signPressed(chartA, 6) && signPressed(chartA, 12) && signPressed(chartB, 6) && signPressed(chartB, 12)) {
      tone = 'caution'
      bits.push('Virgo and Pisces are under pressure in both charts. Keep an affair question on the table, and decide it from the whole horoscope.')
    }
  }

  return {
    tone,
    mark: tone === 'caution' ? 'Axis caution' : `Libra ${wholeSignHouse(7, ascA)} · ${wholeSignHouse(7, ascB)}`,
    detail: bits.join(' '),
  }
}
