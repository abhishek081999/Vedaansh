// ─────────────────────────────────────────────────────────────
//  src/lib/engine/classicalInterpretations.ts
//  Classical Jyotish phalita paraphrases for bhavas, rashis,
//  graha-in-bhava and graha-in-rashi (BPHS, Phaladeepika,
//  Saravali, Brihat Jataka, Jataka Parijata).
//  Educational summaries — not verbatim critical editions.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import type { ClassicalGrahaId, HouseNumber } from './houseInterpretations'
import { CLASSICAL_GRAHAS } from './houseInterpretations'
import { getVakriAstNotes, type VakriAstDetail } from './vakriAstInterpretations'

export type ClassicalSource =
  | 'BPHS'
  | 'Phaladeepika'
  | 'Saravali'
  | 'BrihatJataka'
  | 'JatakaParijata'
  | 'Teaching'

export const CLASSICAL_SOURCE_LABEL: Record<ClassicalSource, string> = {
  BPHS: 'Bṛhat Parāśara Horā Śāstra',
  Phaladeepika: 'Phaladīpikā',
  Saravali: 'Sārāvalī',
  BrihatJataka: 'Bṛhat Jātaka',
  JatakaParijata: 'Jātaka Pārijāta',
  Teaching: 'Advanced study (teaching paraphrase)',
}

export interface ClassicalNote {
  source: ClassicalSource
  /** Short chapter/topic hint when known */
  ref?: string
  text: string
}

function note(source: ClassicalSource, text: string, ref?: string): ClassicalNote {
  return ref ? { source, ref, text } : { source, text }
}

// ── Bhava significations (classics) ──────────────────────────

export const HOUSE_CLASSICAL: Record<HouseNumber, ClassicalNote[]> = {
  1: [
    note('BPHS', 'Tanu Bhava: body, complexion, nature, strength, happiness, sorrow, and the self. Strength of Lagna and Lagna lord shapes vitality and destiny outline.', 'Bhava significations'),
    note('Phaladeepika', 'The Ascendant shows appearance, fame, longevity beginnings, and general prosperity of the native.'),
    note('BrihatJataka', 'Lagna is the foundation; benefic influence here elevates character and bodily comfort.'),
  ],
  2: [
    note('BPHS', 'Dhana Bhava: wealth, family (kutumba), speech, right eye, food, and accumulated resources.', 'Bhava significations'),
    note('Phaladeepika', 'Second house governs family happiness, speech quality, and capacity to amass movable wealth.'),
    note('Saravali', 'Benefics in 2nd sweeten speech and increase family prosperity; malefics harshen speech and strain family.'),
  ],
  3: [
    note('BPHS', 'Sahaja Bhava: siblings (especially younger), courage, servants, short journeys, ears, and valor.', 'Bhava significations'),
    note('Phaladeepika', 'Third shows enterprise, writing, skills of the hands, and relationship with co-borns.'),
    note('JatakaParijata', 'Strong 3rd gives bravery and initiative; afflicted 3rd reduces courage and fraternal harmony.'),
  ],
  4: [
    note('BPHS', 'Bandhu/Sukha Bhava: mother, home, conveyances, lands, happiness, and emotional comfort.', 'Bhava significations'),
    note('Phaladeepika', 'Fourth indicates mother, education foundations, property, and domestic peace.'),
    note('BrihatJataka', 'Benefics in 4th grant conveyances and happiness; malefics disturb home peace.'),
  ],
  5: [
    note('BPHS', 'Putra Bhava: children, intelligence, mantra, past-life merit (pūrva puṇya), and counsel.', 'Bhava significations'),
    note('Phaladeepika', 'Fifth rules progeny, authorship, speculation, and divine worship.'),
    note('Saravali', 'Strong 5th favors learning and children; affliction delays progeny and scatters study.'),
  ],
  6: [
    note('BPHS', 'Ripu/Roga Bhava: enemies, diseases, debts, maternal uncle, service, and obstacles to be conquered.', 'Bhava significations'),
    note('Phaladeepika', 'Sixth shows litigation, servants, health struggles, and competitive contests.'),
    note('JatakaParijata', 'Malefics strong in 6th can destroy enemies; weak/afflicted 6th increases disease and debt.'),
  ],
  7: [
    note('BPHS', 'Jāyā/Kalatra Bhava: spouse, partnerships, travel abroad themes, and desire fulfillment through others.', 'Bhava significations'),
    note('Phaladeepika', 'Seventh governs marriage, business partners, and public dealings.'),
    note('BrihatJataka', 'Benefics in 7th favor a virtuous spouse; malefics bring strife or delay in marriage.'),
  ],
  8: [
    note('BPHS', 'Āyu Bhava: longevity, obstacles, inheritance, occult knowledge, and sudden transformations.', 'Bhava significations'),
    note('Phaladeepika', 'Eighth indicates life span, chronic ailments, spouse’s wealth, and hidden matters.'),
    note('Saravali', 'Strong 8th after affliction yields research power and regenerative capacity; severe affliction shortens ease of life.'),
  ],
  9: [
    note('BPHS', 'Dharma/Bhāgya Bhava: fortune, father, guru, dharma, long journeys, and higher learning.', 'Bhava significations'),
    note('Phaladeepika', 'Ninth shows piety, teachers, luck, and grandchildren themes.'),
    note('BrihatJataka', 'Benefics in 9th exalt fortune and father; malefics strain dharma and paternal happiness.'),
  ],
  10: [
    note('BPHS', 'Karma Bhava: profession, status, honor, authority, and actions that define public life.', 'Bhava significations'),
    note('Phaladeepika', 'Tenth rules livelihood, reputation, government favor, and achievements.'),
    note('JatakaParijata', 'Strong 10th and 10th lord raise the native high; affliction brings career instability.'),
  ],
  11: [
    note('BPHS', 'Lābha Bhava: gains, elder siblings, friends, fulfillment of desires, and income.', 'Bhava significations'),
    note('Phaladeepika', 'Eleventh indicates profits, social circles, and realization of ambitions.'),
    note('Saravali', 'Benefics in 11th multiply gains; malefics give gains with struggle or through harsh means.'),
  ],
  12: [
    note('BPHS', 'Vyaya Bhava: losses, expenses, liberation (mokṣa), foreign residence, sleep, and confinement places.', 'Bhava significations'),
    note('Phaladeepika', 'Twelfth shows expenditure, bed comforts, spiritual detachment, and life abroad.'),
    note('BrihatJataka', 'Benefics in 12th favor charitable expense and peaceful sleep; malefics increase wasteful loss.'),
  ],
}

// ── Rashi natures (classics) ─────────────────────────────────

export const RASHI_CLASSICAL: Record<Rashi, ClassicalNote[]> = {
  1: [
    note('BPHS', 'Meṣa: movable, fiery, male, ruled by Mars. Bold, pioneering, bilious temperament.', 'Rashi natures'),
    note('BrihatJataka', 'Aries natives are active, courageous, and somewhat restless; body marked by heat and vigor.'),
    note('Saravali', 'Mesha rising: enterprising spirit, quick to anger, fond of travel and distinction.'),
  ],
  2: [
    note('BPHS', 'Vṛṣabha: fixed, earthy, female, ruled by Venus. Steady, resourceful, pleasure-loving.', 'Rashi natures'),
    note('BrihatJataka', 'Taurus: enduring, fond of comforts, strong memory, slow to change.'),
    note('Phaladeepika', 'Vrishabha emphasizes wealth, voice, and attachment to possessions.'),
  ],
  3: [
    note('BPHS', 'Mithuna: dual, airy, male, ruled by Mercury. Clever, communicative, versatile.', 'Rashi natures'),
    note('BrihatJataka', 'Gemini: witty, skilled with hands, curious, changeable interests.'),
    note('Saravali', 'Mithuna rising favors learning, writing, and short travels.'),
  ],
  4: [
    note('BPHS', 'Karka: movable, watery, female, ruled by Moon. Emotional, nurturing, changeable mind.', 'Rashi natures'),
    note('BrihatJataka', 'Cancer: attached to mother and home, sensitive, fluctuating fortunes of mind.'),
    note('Phaladeepika', 'Karka emphasizes emotional intelligence and public sympathy.'),
  ],
  5: [
    note('BPHS', 'Siṃha: fixed, fiery, male, ruled by Sun. Royal, proud, authoritative, generous.', 'Rashi natures'),
    note('BrihatJataka', 'Leo: ambitious of honor, firm, dramatic self-expression.'),
    note('Saravali', 'Simha rising seeks leadership and recognition through dharma-aligned action.'),
  ],
  6: [
    note('BPHS', 'Kanyā: dual, earthy, female, ruled by Mercury. Analytical, service-oriented, discriminating.', 'Rashi natures'),
    note('BrihatJataka', 'Virgo: skillful, methodical, critical, devoted to duty and purity.'),
    note('Phaladeepika', 'Kanya favors detailed work, healing arts, and practical intelligence.'),
  ],
  7: [
    note('BPHS', 'Tulā: movable, airy, male, ruled by Venus. Balanced, diplomatic, partnership-seeking.', 'Rashi natures'),
    note('BrihatJataka', 'Libra: graceful, weighing options, devoted to fairness and beauty.'),
    note('Saravali', 'Tula rising thrives in trade, counsel, and harmonious alliances.'),
  ],
  8: [
    note('BPHS', 'Vṛścika: fixed, watery, female, ruled by Mars. Intense, secretive, penetrating, transformative.', 'Rashi natures'),
    note('BrihatJataka', 'Scorpio: reserved strength, research bent, capacity for extreme effort.'),
    note('JatakaParijata', 'Vrischika emphasizes occult depth and regenerative power after crisis.'),
  ],
  9: [
    note('BPHS', 'Dhanu: dual, fiery, male, ruled by Jupiter. Dharmic, expansive, philosophical, long-journeying.', 'Rashi natures'),
    note('BrihatJataka', 'Sagittarius: righteous, teacher-like, aspiring to higher aims.'),
    note('Phaladeepika', 'Dhanu favors gurus, sacred study, and fortune through dharma.'),
  ],
  10: [
    note('BPHS', 'Makara: movable, earthy, female, ruled by Saturn. Ambitious, enduring, status-conscious through labor.', 'Rashi natures'),
    note('BrihatJataka', 'Capricorn: persevering, serious, rises slowly to authority.'),
    note('Saravali', 'Makara rising builds lasting structures through disciplined karma.'),
  ],
  11: [
    note('BPHS', 'Kumbha: fixed, airy, male, ruled by Saturn. Humanitarian networks, unconventional, desire-driven.', 'Rashi natures'),
    note('BrihatJataka', 'Aquarius: scientific/social reformer bent, group-minded, detached warmth.'),
    note('Phaladeepika', 'Kumbha favors gains through associations and innovative systems.'),
  ],
  12: [
    note('BPHS', 'Mīna: dual, watery, female, ruled by Jupiter. Compassionate, imaginative, moksha-leaning.', 'Rashi natures'),
    note('BrihatJataka', 'Pisces: gentle, intuitive, sacrificial, drawn to sacred waters and solitude.'),
    note('Saravali', 'Meena rising dissolves ego boundaries toward devotion and foreign/spiritual paths.'),
  ],
}

// ── Graha in bhava (classical phalita summaries) ─────────────

type PH = Record<HouseNumber, ClassicalNote[]>
type PHTable = Record<ClassicalGrahaId, PH>

function fillPlanetHouses(
  rows: Partial<Record<HouseNumber, ClassicalNote[]>> & Record<1 | 4 | 7 | 10, ClassicalNote[]>,
  fallback: (h: HouseNumber) => ClassicalNote[],
): PH {
  const out = {} as PH
  for (let h = 1; h <= 12; h++) {
    const hn = h as HouseNumber
    out[hn] = rows[hn] ?? fallback(hn)
  }
  return out
}

export const PLANET_IN_HOUSE_CLASSICAL: PHTable = {
  Su: fillPlanetHouses({
    1: [note('BPHS', 'Sun in Lagna: authoritative nature, bilious constitution, leadership bent; may reduce hair or eye comfort if afflicted.'), note('Phaladeepika', 'Makes the native proud, active, and respected; excess heat needs care.')],
    2: [note('BPHS', 'Sun in 2nd: wealth through government/authority; proud speech; strain with family if afflicted.')],
    3: [note('BPHS', 'Sun in 3rd: courageous, victorious over rivals; younger siblings may be few or dominated.')],
    4: [note('BPHS', 'Sun in 4th: unsettled domestic peace; conveyances possible; mother’s health needs care.'), note('Phaladeepika', 'Reduces sukha; favors distant residence at times.')],
    5: [note('BPHS', 'Sun in 5th: intelligent, advisory roles; children few or delayed if afflicted; mantra siddhi possible.')],
    6: [note('BPHS', 'Sun in 6th: destroys enemies, succeeds in service/competition; digestive heat themes.')],
    7: [note('BPHS', 'Sun in 7th: delayed or ego-touched marriage; partner proud; partnerships need humility.'), note('Phaladeepika', 'Travel and public dealing increase; marital peace requires compromise.')],
    8: [note('BPHS', 'Sun in 8th: longevity tests, inheritance disputes, research into hidden matters; father’s comfort strained.')],
    9: [note('BPHS', 'Sun in 9th: fortunate if strong; devotion and fatherly pride; pilgrimage bent.'), note('Saravali', 'Raja-yoga flavor when well-placed with kendra/trikona support.')],
    10: [note('BPHS', 'Sun in 10th: digbala—fame, authority, government favor, high karma.'), note('Phaladeepika', 'Rise through own effort and royal/government channels.')],
    11: [note('BPHS', 'Sun in 11th: gains, influential friends, fulfillment of ambitions.')],
    12: [note('BPHS', 'Sun in 12th: expenses, foreign residence, eye strain; spiritual austerity if supported.'), note('Phaladeepika', 'Private authority and father-distance themes; charity/hospital lean when dignified.')],
  }, (h) => [note('BPHS', `Sun in house ${h}: colors authority, vitality, and father/government themes in that bhava—judge by dignity and aspects.`)]),

  Mo: fillPlanetHouses({
    1: [note('BPHS', 'Moon in Lagna: attractive, changeable mind, popularity; health follows mental peace.'), note('BrihatJataka', 'Strong Moon rising beautifies and sensitizes the native.')],
    2: [note('BPHS', 'Moon in 2nd: sweet speech, fluctuating wealth, family emotional tides.')],
    3: [note('BPHS', 'Moon in 3rd: short travels, artistic skills; courage fluctuates with mood.')],
    4: [note('BPHS', 'Moon in 4th: digbala—happiness, mother bond, conveyances, public goodwill.'), note('Phaladeepika', 'Home comforts and emotional security increase when unafflicted.')],
    5: [note('BPHS', 'Moon in 5th: fertile mind, devotion, children; education mood-dependent.')],
    6: [note('BPHS', 'Moon in 6th: health anxiety, service mind; overcomes enemies through adaptability.')],
    7: [note('BPHS', 'Moon in 7th: attractive partner, emotional marriage; travel and public dealings.'), note('Phaladeepika', 'Partner may be fair-minded; mood swings need grounding.')],
    8: [note('BPHS', 'Moon in 8th: psychic depth, longevity vigilance, inheritance of emotional patterns.')],
    9: [note('BPHS', 'Moon in 9th: fortune through motherly grace, pilgrimages, dharmic mind.')],
    10: [note('BPHS', 'Moon in 10th: public career, fluctuating profession, fame among masses.')],
    11: [note('BPHS', 'Moon in 11th: gains, many friends, desire fulfillment with emotional cycles.')],
    12: [note('BPHS', 'Moon in 12th: vivid dreams, foreign life, moksha lean; sleep quality is key.'), note('Phaladeepika', 'Emotional spending and healing sensitivity; domestic ease may sit outside the birth home.')],
  }, (h) => [note('BPHS', `Moon in house ${h}: mind and motherly comfort color that life area—waxing/waning and nakshatra refine results.`)]),

  Ma: fillPlanetHouses({
    1: [note('BPHS', 'Mars in Lagna: courageous, scar-prone, assertive body; Mangal dosha considerations for marriage.'), note('Phaladeepika', 'Energy high; temper needs discipline.')],
    2: [note('BPHS', 'Mars in 2nd: harsh speech possible, family strife or protective duty; wealth via effort.')],
    3: [note('BPHS', 'Mars in 3rd: valor, younger siblings, skilled hands; victory after fight.')],
    4: [note('BPHS', 'Mars in 4th: domestic agitation, property disputes or renovations; mother’s comfort strained.')],
    5: [note('BPHS', 'Mars in 5th: sharp intellect, passionate romance; children themes need care if afflicted.')],
    6: [note('BPHS', 'Mars in 6th: strong to defeat enemies and disease; surgical/competitive success.'), note('Saravali', 'Excellent for warriors and litigants when not otherwise ruined.')],
    7: [note('BPHS', 'Mars in 7th: Kuja/Mangal considerations—strife or passion in marriage; partner assertive.'), note('Phaladeepika', 'Business partnerships need clear contracts.')],
    8: [note('BPHS', 'Mars in 8th: accidents/surgery vigilance, research courage, inheritance fights.')],
    9: [note('BPHS', 'Mars in 9th: dharmic fighter, pilgrim warrior; father may be strict/authoritative.')],
    10: [note('BPHS', 'Mars in 10th: digbala—career ambition, command, technical/military success.')],
    11: [note('BPHS', 'Mars in 11th: gains through courage and networks; elder sibling energy strong.')],
    12: [note('BPHS', 'Mars in 12th: expenses, private conflicts, bed comforts strained; spiritual discipline channels heat.'), note('Phaladeepika', 'Foreign land/effort lean; weak Mars (māraṇa-kāraka + low ṣaḍbala) classically linked to erectile dysfunction; afflicted 8th aspect may show partner aggression.')],
  }, (h) => [note('BPHS', `Mars in house ${h}: courage, conflict, and initiative express through that bhava—aspects and dignity decide whether constructive or harsh.`)]),

  Me: fillPlanetHouses({
    1: [note('BPHS', 'Mercury in Lagna: witty, youthful, learned speech; versatile body-mind.'), note('BrihatJataka', 'Favors writing, trade, and cleverness.')],
    2: [note('BPHS', 'Mercury in 2nd: eloquent speech, wealth through intellect/trade.')],
    3: [note('BPHS', 'Mercury in 3rd: writing, skills, short journeys; communicative siblings.')],
    4: [note('BPHS', 'Mercury in 4th: education, conveyances of learning, mother witty or restless.')],
    5: [note('BPHS', 'Mercury in 5th: sharp buddhi, mantra, speculative intellect; children clever.')],
    6: [note('BPHS', 'Mercury in 6th: analytical service, debate with enemies; nervous strain if afflicted.')],
    7: [note('BPHS', 'Mercury in 7th: clever spouse/partner, trade marriages; youthful relating.'), note('Phaladeepika', 'Partner often from nearby circle or through relatives/friends; partnerships fluctuate yet resolve with viveka when unafflicted.')],
    8: [note('BPHS', 'Mercury in 8th: research speech, occult study; longevity of intellect through crisis.')],
    9: [note('BPHS', 'Mercury in 9th: learning from many teachers, dharma debate, long study journeys.')],
    10: [note('BPHS', 'Mercury in 10th: career in communication, accounting, counsel, trade.')],
    11: [note('BPHS', 'Mercury in 11th: gains via intellect and friends; multiple income ideas.')],
    12: [note('BPHS', 'Mercury in 12th: foreign languages, solitary study; scattered expenses on skills.'), note('Phaladeepika', 'Behind-the-scenes research and intuition; focus and speech steadier when Mercury is strong.')],
  }, (h) => [note('BPHS', `Mercury in house ${h}: intellect and speech operate through that bhava—conjunctions heavily modify Mercury.`)]),

  Ju: fillPlanetHouses({
    1: [note('BPHS', 'Jupiter in Lagna: virtuous, wise, bulky grace, protected life when strong.'), note('Phaladeepika', 'Hamsa-like dignity; teacher/guide nature.')],
    2: [note('BPHS', 'Jupiter in 2nd: wealth, truthful speech, family dharma.')],
    3: [note('BPHS', 'Jupiter in 3rd: courageous wisdom; siblings may be few but fortunate.')],
    4: [note('BPHS', 'Jupiter in 4th: happiness, motherly wisdom, property and conveyances.'), note('Saravali', 'Domestic peace and sacred home environment.')],
    5: [note('BPHS', 'Jupiter in 5th: excellent for children, counsel, mantra, past-life merit.')],
    6: [note('BPHS', 'Jupiter in 6th: mixed—defeats enemies yet may serve below worth; health moderation.')],
    7: [note('BPHS', 'Jupiter in 7th: virtuous spouse, dharmic partnerships; travel and counsel.'), note('Phaladeepika', 'When strong: teacher-like, tolerant partner. When afflicted: delay, prior-family themes, or partnership strain—judge dignity, not the house alone.')],
    8: [note('BPHS', 'Jupiter in 8th: longevity, occult wisdom, inheritance; sudden grace in crisis.')],
    9: [note('BPHS', 'Jupiter in 9th: supreme bhagya—father, guru, dharma flourish.'), note('BPHS', 'One of the most auspicious natural placements for fortune.')],
    10: [note('BPHS', 'Jupiter in 10th: respected profession, advisory/judicial/teaching roles.')],
    11: [note('BPHS', 'Jupiter in 11th: abundant gains, noble friends, desire fulfillment.')],
    12: [note('BPHS', 'Jupiter in 12th: moksha lean, charitable expense, peaceful bed/foreign dharma.'), note('Phaladeepika', 'Initiatory wisdom when strong; knowledge-ego and overspend if afflicted—judge dignity.')],
  }, (h) => [note('BPHS', `Jupiter in house ${h}: expands wisdom, grace, and dharma in that bhava—combustion and nodes can reduce purity of results.`)]),

  Ve: fillPlanetHouses({
    1: [note('BPHS', 'Venus in Lagna: charm, beauty, artistic nature, comfort-seeking body.'), note('BrihatJataka', 'Attractive and pleasure-inclined when strong.')],
    2: [note('BPHS', 'Venus in 2nd: wealth, sweet speech, family luxuries—excellent for dhana.')],
    3: [note('BPHS', 'Venus in 3rd: artistic skills, romantic hobbies, refined courage.')],
    4: [note('BPHS', 'Venus in 4th: beautiful home, vehicles, maternal comforts.'), note('Phaladeepika', 'Sukha and conveyances favored.')],
    5: [note('BPHS', 'Venus in 5th: romance, creative intelligence, love marriage themes; children affection.')],
    6: [note('BPHS', 'Venus in 6th: service in arts/healing; debts from luxury if afflicted.')],
    7: [note('BPHS', 'Venus in 7th: strong marriage magnetism; own-choice marriage needs caution.'), note('Phaladeepika', 'Partner attractive; excess desire needs balance.')],
    8: [note('BPHS', 'Venus in 8th: spouse’s wealth, occult aesthetics; sudden passion and longevity of desire.')],
    9: [note('BPHS', 'Venus in 9th: fortunate pleasures, dharmic arts, soft father/guru relations.')],
    10: [note('BPHS', 'Venus in 10th: career in beauty, arts, diplomacy, luxury trades.')],
    11: [note('BPHS', 'Venus in 11th: gains, pleasurable networks, desire fulfillment.')],
    12: [note('BPHS', 'Venus in 12th: exalted-friendly for bhakti; bed comforts, foreign luxury, charitable spend.'), note('Phaladeepika', 'Selfless love and private devotion; material desire softens through sādhana.')],
  }, (h) => [note('BPHS', `Venus in house ${h}: brings pleasure, arts, and relational sweetness to that bhava—affliction turns luxury into excess.`)]),

  Sa: fillPlanetHouses({
    1: [note('BPHS', 'Saturn in Lagna: lean/serious body, delayed rise, endurance; childhood austerity.'), note('Phaladeepika', 'Mature outlook; happiness comes later.')],
    2: [note('BPHS', 'Saturn in 2nd: slow wealth accumulation, restrained speech, family duty.')],
    3: [note('BPHS', 'Saturn in 3rd: courageous through effort; younger siblings delayed or serious.')],
    4: [note('BPHS', 'Saturn in 4th: restricted domestic comfort; property after labor; mother’s strictness.')],
    5: [note('BPHS', 'Saturn in 5th: delayed children/romance; disciplined learning; fear of creativity.')],
    6: [note('BPHS', 'Saturn in 6th: strong to grind through enemies/disease/debt via routine.'), note('Saravali', 'Service and longevity of effort favored.')],
    7: [note('BPHS', 'Saturn in 7th: delayed marriage, older/serious partner; duty-bound unions.'), note('Phaladeepika', 'Stability after patience; coldness if afflicted.')],
    8: [note('BPHS', 'Saturn in 8th: long life with chronic tests; occult endurance; inheritance delays.')],
    9: [note('BPHS', 'Saturn in 9th: orthodox hard faith; father distant/strict; late fortune.')],
    10: [note('BPHS', 'Saturn in 10th: digbala—career through endurance, mass work, lasting status.'), note('BPHS', 'Karma siddhi through slow responsible labor.')],
    11: [note('BPHS', 'Saturn in 11th: steady gains, older friends, desires fulfilled late.')],
    12: [note('BPHS', 'Saturn in 12th: isolation, sleep austerity, foreign labor; moksha via detachment.'), note('Phaladeepika', 'Long hidden sādhana; foreign exit/return hard; profession struggle then spiritual maturity.')],
  }, (h) => [note('BPHS', `Saturn in house ${h}: delays and structures that life area—results become permanent after sustained karma.`)]),

  Ra: fillPlanetHouses({
    1: [note('Phaladeepika', 'Rahu in Lagna: unconventional appearance/identity, foreign lean, intense self-reinvention.'), note('JatakaParijata', 'Amplifies personality extremes; judge with dispositor.')],
    2: [note('Phaladeepika', 'Rahu in 2nd: unusual speech/wealth paths; family unconventionality; appetite extremes.')],
    3: [note('Phaladeepika', 'Rahu in 3rd: bold short travels, media courage, unconventional siblings/skills.')],
    4: [note('Phaladeepika', 'Rahu in 4th: unsettled homeland, unusual residence, emotional restlessness.')],
    5: [note('Phaladeepika', 'Rahu in 5th: speculative intellect, unconventional romance/children themes.')],
    6: [note('Phaladeepika', 'Rahu in 6th: defeats enemies uniquely; health oddities; service in tech/foreign systems.')],
    7: [note('Phaladeepika', 'Rahu in 7th: foreign/unusual partner, intense desire marriage; ethics need care.'), note('JatakaParijata', 'Partnerships amplify obsession—dispositor decides grace or illusion.')],
    8: [note('Phaladeepika', 'Rahu in 8th: occult research, sudden upheavals, inheritance oddities.')],
    9: [note('Phaladeepika', 'Rahu in 9th: heterodox belief, foreign dharma, strained conventional father/guru.')],
    10: [note('Phaladeepika', 'Rahu in 10th: unconventional career rise, fame with controversy potential.')],
    11: [note('Phaladeepika', 'Rahu in 11th: large gains via networks, desires magnified.')],
    12: [note('Phaladeepika', 'Rahu in 12th: foreign residence, hidden expenses, moksha via unusual paths.'), note('JatakaParijata', 'Afflicted Rahu: jail/confinement combinations; with afflicted Moon: mental instability/madness risk per class teaching.')],
  }, (h) => [note('Phaladeepika', `Rahu in house ${h}: amplifies and foreignizes that bhava—always read with sign lord (dispositor) and dignity.`)]),

  Ke: fillPlanetHouses({
    1: [note('Phaladeepika', 'Ketu in Lagna: detached identity, spiritual/moksha bent, psychic sensitivity.'), note('JatakaParijata', 'Past-life mastery of self; this life seeks liberation from ego.')],
    2: [note('Phaladeepika', 'Ketu in 2nd: sparse speech, detachment from family wealth, piercing words.')],
    3: [note('Phaladeepika', 'Ketu in 3rd: solitary courage, occult skills, distance from siblings.')],
    4: [note('Phaladeepika', 'Ketu in 4th: detachment from homeland/mother comforts; inner home sought.')],
    5: [note('Phaladeepika', 'Ketu in 5th: past-life intellect, unconventional children/romance, mantra lean.')],
    6: [note('Phaladeepika', 'Ketu in 6th: dissolves enemies mysteriously; healing bent; debt detachment.')],
    7: [note('Phaladeepika', 'Ketu in 7th: spouse from known circle; spiritual/past-bond feel when clean; dissatisfaction if expectations inflate.'), note('JatakaParijata', 'Act as fakir in partnership expectations; placement outweighs mere aspect.')],
    8: [note('Phaladeepika', 'Ketu in 8th: deep occult, longevity mysteries, research detachment.')],
    9: [note('Phaladeepika', 'Ketu in 9th: unorthodox guru path, pilgrim solitude, father distance.')],
    10: [note('Phaladeepika', 'Ketu in 10th: unconventional career, breaks from bosses, behind-the-scenes mastery.')],
    11: [note('Phaladeepika', 'Ketu in 11th: selective gains, few true friends, desire reduction.')],
    12: [note('Phaladeepika', 'Ketu in 12th: strong moksha indication, isolation, dream wisdom.'), note('JatakaParijata', 'Cortisol/low-testosterone stress linked to erectile dysfunction in class notes; extreme stress may bring suicidal ideation—urge real support.')],
  }, (h) => [note('Phaladeepika', `Ketu in house ${h}: detaches and spiritualizes that bhava—past mastery, present non-attachment.`)]),
}

// ── Graha in rashi (classical) ───────────────────────────────

type PS = Record<Rashi, ClassicalNote[]>
type PSTable = Record<ClassicalGrahaId, PS>

function fillPlanetSigns(
  rows: Partial<Record<Rashi, ClassicalNote[]>>,
  fallback: (r: Rashi) => ClassicalNote[],
): PS {
  const out = {} as PS
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    out[rr] = rows[rr] ?? fallback(rr)
  }
  return out
}

const RASHI_EN: Record<Rashi, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo',
  7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
}

export const PLANET_IN_SIGN_CLASSICAL: PSTable = {
  Su: fillPlanetSigns({
    1: [note('BPHS', 'Sun exalted in Aries: powerful vitality, royal initiative, digbala of soul-force.'), note('Saravali', 'Brave, famous, heat-strong constitution.')],
    2: [note('BPHS', 'Sun in Taurus: steady authority over resources; patient pride; wealth through persistence.')],
    3: [note('BPHS', 'Sun in Gemini: communicative authority; skilled with words; restless intellect.')],
    4: [note('BPHS', 'Sun in Cancer: emotional leadership; public care; mother/homeland pride.')],
    5: [note('BPHS', 'Sun in own Leo: authority, consistency, paternal dignity.')],
    6: [note('BPHS', 'Sun in Virgo: analytical manager; service leadership; fault-finding if harsh.')],
    7: [note('BPHS', 'Sun debilitated in Libra: ego vs partnership; humility and ancestral remedies help.'), note('Phaladeepika', 'Seeks honor yet must learn equality.')],
    8: [note('BPHS', 'Sun in Scorpio: intense will, research authority; sudden transformations of ego.')],
    9: [note('BPHS', 'Sun in Sagittarius: dharmic pride, teacher-king tone; fortune through faith.')],
    10: [note('BPHS', 'Sun in Capricorn: ambitious karma, government grind; delayed but solid status.')],
    11: [note('BPHS', 'Sun in Aquarius: networked authority; gains via groups; unconventional leadership.')],
    12: [note('BPHS', 'Sun in Pisces: softer ego, spiritual authority; foreign/solitude themes.')],
  }, (r) => [note('BPHS', `Sun in ${RASHI_EN[r]}: soul/father/authority through that sign.`)]),

  Mo: fillPlanetSigns({
    1: [note('BPHS', 'Moon in Aries: quick moods, pioneering feelings; impulsive mind.')],
    2: [note('BPHS', 'Moon exalted in Taurus: stable mind, beauty, prosperity of emotion.'), note('BrihatJataka', 'Pleasing speech and comforts.')],
    3: [note('BPHS', 'Moon in Gemini: curious, talkative mind; dual emotions; learning hunger.')],
    4: [note('BPHS', 'Moon in own Cancer: peak receptivity, motherly mind, digbala potential.')],
    5: [note('BPHS', 'Moon in Leo: proud emotions; needs warm recognition; dramatic heart.')],
    6: [note('BPHS', 'Moon in Virgo: analytical feelings; service mind; health worry tendency.')],
    7: [note('BPHS', 'Moon in Libra: relational mind; seeks peace through partners; aesthetic moods.')],
    8: [note('BPHS', 'Moon debilitated in Scorpio: turbulent mind, deep feelings; needs grounding.'), note('Phaladeepika', 'Psychic intensity with emotional caution.')],
    9: [note('BPHS', 'Moon in Sagittarius: faith-seeking emotions; optimistic if supported.')],
    10: [note('BPHS', 'Moon in Capricorn: practical dry moods; duty over comfort; late emotional ease.')],
    11: [note('BPHS', 'Moon in Aquarius: social emotions; friendships color the mind.')],
    12: [note('BPHS', 'Moon in Pisces: dreamy psychic tides; compassion; sleep/dream barometer.')],
  }, (r) => [note('BPHS', `Moon in ${RASHI_EN[r]}: mind absorbs that sign—paksha and nakshatra refine.`)]),

  Ma: fillPlanetSigns({
    1: [note('BPHS', 'Mars in own Aries: raw initiative and valor.')],
    2: [note('BPHS', 'Mars in Taurus: stubborn drive for resources; slow-burning fight.')],
    3: [note('BPHS', 'Mars in Gemini: sharp debate, skilled hands, restless courage.')],
    4: [note('BPHS', 'Mars debilitated in Cancer: emotionalized aggression; protect home peace.'), note('Phaladeepika', 'Impulse needs cooling.')],
    5: [note('BPHS', 'Mars in Leo: proud warrior energy; passionate creativity/romance.')],
    6: [note('BPHS', 'Mars in Virgo: precise fighter; service competition; surgical skill.')],
    7: [note('BPHS', 'Mars in Libra: assertive partnerships; diplomacy under stress.')],
    8: [note('BPHS', 'Mars in own Scorpio: penetrating research force, controlled intensity.')],
    9: [note('BPHS', 'Mars in Sagittarius: dharmic fighter; pilgrim-warrior zeal.')],
    10: [note('BPHS', 'Mars exalted in Capricorn: disciplined ambition, career courage.'), note('Saravali', 'Commander through structure.')],
    11: [note('BPHS', 'Mars in Aquarius: networked hustle; group courage; tech fight drive.')],
    12: [note('BPHS', 'Mars in Pisces: private aggression or spiritualized effort; bed/foreign heat.')],
  }, (r) => [note('BPHS', `Mars in ${RASHI_EN[r]}: courage/heat shaped by the sign.`)]),

  Me: fillPlanetSigns({
    1: [note('BPHS', 'Mercury in Aries: quick speech, debating intellect; unfinished multiplicity.')],
    2: [note('BPHS', 'Mercury in Taurus: practical trade speech; steady learning of values.')],
    3: [note('BPHS', 'Mercury in own Gemini: versatile witty intellect.')],
    4: [note('BPHS', 'Mercury in Cancer: emotional intelligence; memory tides; mother-witty themes.')],
    5: [note('BPHS', 'Mercury in Leo: proud intellect; advisory speech; creative study.')],
    6: [note('BPHS', 'Mercury exalted in Virgo: supreme analysis, speech precision.'), note('BrihatJataka', 'Learned and skillful.')],
    7: [note('BPHS', 'Mercury in Libra: diplomatic trade mind; relational networking.')],
    8: [note('BPHS', 'Mercury in Scorpio: research speech; secret analysis; occult study.')],
    9: [note('BPHS', 'Mercury in Sagittarius: teaching debate; multi-guru learning risk if scattered.')],
    10: [note('BPHS', 'Mercury in Capricorn: serious admin intellect; precise career communication.')],
    11: [note('BPHS', 'Mercury in Aquarius: systems/coding mind; gains via networks and ideas.')],
    12: [note('BPHS', 'Mercury debilitated in Pisces: logic dissolves into imagination; intuition if supported.'), note('Phaladeepika', 'Listen more than argue.')],
  }, (r) => [note('BPHS', `Mercury in ${RASHI_EN[r]}: intellect colored by sign and yuti.`)]),

  Ju: fillPlanetSigns({
    1: [note('BPHS', 'Jupiter in Aries: pioneering wisdom; assertive counsel; heat in belief.')],
    2: [note('BPHS', 'Jupiter in Taurus: wealth wisdom; truthful resource speech.')],
    3: [note('BPHS', 'Jupiter in Gemini: teaching curiosity; many skills; scattered dharma if weak.')],
    4: [note('BPHS', 'Jupiter exalted in Cancer: peak wisdom, protection, counselor grace.'), note('Saravali', 'Vast fame and virtue.')],
    5: [note('BPHS', 'Jupiter in Leo: royal counsel; creative punya; children blessing.')],
    6: [note('BPHS', 'Jupiter in Virgo: practical service wisdom; critical guru tendency.')],
    7: [note('BPHS', 'Jupiter in Libra: dharmic partnerships; fair counsel in marriage/business.')],
    8: [note('BPHS', 'Jupiter in Scorpio: occult wisdom; regenerative faith; inheritance grace.')],
    9: [note('BPHS', 'Jupiter in own Sagittarius: dharmic expansion, teaching.')],
    10: [note('BPHS', 'Jupiter debilitated in Capricorn: faith meets cold karma; learn through effort.'), note('Phaladeepika', 'Practical dharma after struggle.')],
    11: [note('BPHS', 'Jupiter in Aquarius: philosophical networks; gains via sangha/orgs.')],
    12: [note('BPHS', 'Jupiter in own Pisces: moksha wisdom, compassion ocean.')],
  }, (r) => [note('BPHS', `Jupiter in ${RASHI_EN[r]}: expands dharma via that sign.`)]),

  Ve: fillPlanetSigns({
    1: [note('BPHS', 'Venus in Aries: passionate charm; quick attraction; aesthetic initiative.')],
    2: [note('BPHS', 'Venus in own Taurus: sensual stability, wealth magnetism.')],
    3: [note('BPHS', 'Venus in Gemini: witty romance; multi-art skills; light bonds.')],
    4: [note('BPHS', 'Venus in Cancer: soft domestic beauty; emotional luxury; mother–spouse themes.')],
    5: [note('BPHS', 'Venus in Leo: dramatic romance; creative arts pride; generous love.')],
    6: [note('BPHS', 'Venus debilitated in Virgo: critical love, service over romance; accept imperfections.'), note('Phaladeepika', 'Judge less; serve more in relating.')],
    7: [note('BPHS', 'Venus in own Libra: diplomacy, partnership grace.')],
    8: [note('BPHS', 'Venus in Scorpio: intense desire; spouse wealth; transformative bonds.')],
    9: [note('BPHS', 'Venus in Sagittarius: dharmic arts; fortunate pleasures; soft guru/father tone.')],
    10: [note('BPHS', 'Venus in Capricorn: dutiful love; structured aesthetics; late comforts.')],
    11: [note('BPHS', 'Venus in Aquarius: networked romance; gains through beauty/arts circles.')],
    12: [note('BPHS', 'Venus exalted in Pisces: supreme bhakti-beauty, refined love.'), note('BrihatJataka', 'Artistic and devoted.')],
  }, (r) => [note('BPHS', `Venus in ${RASHI_EN[r]}: pleasure/arts/bonds via that sign.`)]),

  Sa: fillPlanetSigns({
    1: [note('BPHS', 'Saturn debilitated in Aries: frustrated starts, pressure on initiative.'), note('Phaladeepika', 'Patience must be cultivated deliberately.')],
    2: [note('BPHS', 'Saturn in Taurus: slow wealth building; restrained values speech.')],
    3: [note('BPHS', 'Saturn in Gemini: disciplined skills; serious communication; effort courage.')],
    4: [note('BPHS', 'Saturn in Cancer: restricted domestic comfort; emotional austerity.')],
    5: [note('BPHS', 'Saturn in Leo: delayed pride/creativity; disciplined learning; romance caution.')],
    6: [note('BPHS', 'Saturn in Virgo: natural servant grind; conquers via routine.')],
    7: [note('BPHS', 'Saturn exalted in Libra: just endurance, balanced duty, late grace.'), note('Saravali', 'Fair, persevering, rises through justice.')],
    8: [note('BPHS', 'Saturn in Scorpio: long occult endurance; chronic tests; regenerative duty.')],
    9: [note('BPHS', 'Saturn in Sagittarius: orthodox hard faith; late fortune; strict dharma.')],
    10: [note('BPHS', 'Saturn in own Capricorn: structural karma mastery.')],
    11: [note('BPHS', 'Saturn in own Aquarius: networked endurance, systemic gains.')],
    12: [note('BPHS', 'Saturn in Pisces: isolation austerity; foreign labor; moksha via detachment.')],
  }, (r) => [note('BPHS', `Saturn in ${RASHI_EN[r]}: delays/disciplines that sign’s affairs.`)]),

  Ra: fillPlanetSigns({
    1: [note('Phaladeepika', 'Rahu in Aries: amplified initiative; foreign pioneering; restless identity heat.')],
    2: [note('Phaladeepika', 'Rahu in Taurus: appetite for resources/status; unconventional wealth paths.')],
    3: [note('JatakaParijata', 'Rahu often strong in Gemini—skill amplification.'), note('Phaladeepika', 'Unconventional intellect and speech.')],
    4: [note('Phaladeepika', 'Rahu in Cancer: restless homeland/emotions; unusual mother themes.')],
    5: [note('Phaladeepika', 'Rahu in Leo: status obsession; speculative/creative extremes.')],
    6: [note('Phaladeepika', 'Rahu in Virgo: analytical obsession, service through systems.')],
    7: [note('Phaladeepika', 'Rahu in Libra: unusual partnerships; desire amplification in relating.')],
    8: [note('Phaladeepika', 'Rahu in Scorpio: occult intensity; sudden upheaval magnetism.')],
    9: [note('Phaladeepika', 'Rahu in Sagittarius: heterodox belief, foreign dharma hunger.')],
    10: [note('Phaladeepika', 'Rahu in Capricorn: unconventional career climb; ambition with swings.')],
    11: [note('Phaladeepika', 'Rahu in Aquarius: peak network/desire amplification; tech/mass gains.')],
    12: [note('Phaladeepika', 'Rahu in Pisces: foreign/moksha fantasies; hidden expenses; dream intensity.')],
  }, (r) => [note('Phaladeepika', `Rahu in ${RASHI_EN[r]}: amplifies/foreignizes the sign—read dispositor.`)]),

  Ke: fillPlanetSigns({
    1: [note('Phaladeepika', 'Ketu in Aries: detached initiative; spiritualized courage; headless starts.')],
    2: [note('Phaladeepika', 'Ketu in Taurus: detachment from wealth/speech comforts; sparse values.')],
    3: [note('Phaladeepika', 'Ketu in Gemini: occult skills; stutter/sparse talk; sibling distance.')],
    4: [note('Phaladeepika', 'Ketu in Cancer: detachment from mother/home; inner sanctuary sought.')],
    5: [note('Phaladeepika', 'Ketu in Leo: past-life creative mastery; unconventional romance/children.')],
    6: [note('Phaladeepika', 'Ketu in Virgo: dissolves enemies via detachment; healing service.')],
    7: [note('Phaladeepika', 'Ketu in Libra: partnership dissatisfaction then fakir detachment.')],
    8: [note('Phaladeepika', 'Ketu in Scorpio: occult research, co-lord intensity.')],
    9: [note('JatakaParijata', 'Ketu spiritualized in Jupiter themes—moksha lean.'), note('Phaladeepika', 'Detached wisdom seeker.')],
    10: [note('Phaladeepika', 'Ketu in Capricorn: career breaks from hierarchy; behind-scenes mastery.')],
    11: [note('Phaladeepika', 'Ketu in Aquarius: selective gains; few true friends; desire reduction.')],
    12: [note('Phaladeepika', 'Ketu in Pisces: strong liberation indication.')],
  }, (r) => [note('Phaladeepika', `Ketu in ${RASHI_EN[r]}: detaches from the sign’s material grip.`)]),
}

// ── Helpers ──────────────────────────────────────────────────

function asHouse(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
}
function asRashi(n: number): Rashi | null {
  return n >= 1 && n <= 12 ? (n as Rashi) : null
}
function asGraha(id: string): ClassicalGrahaId | null {
  return (CLASSICAL_GRAHAS as string[]).includes(id) ? (id as ClassicalGrahaId) : null
}

export function getHouseClassical(house: number): ClassicalNote[] {
  const h = asHouse(house)
  return h ? HOUSE_CLASSICAL[h] : []
}

export function getRashiClassical(rashi: number): ClassicalNote[] {
  const r = asRashi(rashi)
  return r ? RASHI_CLASSICAL[r] : []
}

export function getPlanetInHouseClassical(grahaId: string, house: number): ClassicalNote[] {
  const g = asGraha(grahaId)
  const h = asHouse(house)
  if (!g || !h) return []
  return PLANET_IN_HOUSE_CLASSICAL[g][h] ?? []
}

export function getPlanetInSignClassical(grahaId: string, rashi: number): ClassicalNote[] {
  const g = asGraha(grahaId)
  const r = asRashi(rashi)
  if (!g || !r) return []
  return PLANET_IN_SIGN_CLASSICAL[g][r] ?? []
}

/** One-line classical blurb for UI cards (first note). */
export function getPlanetInHouseClassicalSummary(grahaId: string, house: number): string | null {
  const notes = getPlanetInHouseClassical(grahaId, house)
  return notes[0]?.text ?? null
}

export function getPlanetInSignClassicalSummary(grahaId: string, rashi: number): string | null {
  const notes = getPlanetInSignClassical(grahaId, rashi)
  return notes[0]?.text ?? null
}

// ── Dignity-aware modifiers ──────────────────────────────────

const DIGNITY_NOTE: Record<string, ClassicalNote> = {
  exalted: note('BPHS', 'Dignity: exalted — graha expresses peak constructive significations with ease.', 'Dignity'),
  moolatrikona: note('BPHS', 'Dignity: mūlatrikoṇa — purposeful strength, like a king in office.', 'Dignity'),
  own: note('BPHS', 'Dignity: own sign (svakṣetra) — stable, reliable support in its themes.', 'Dignity'),
  great_friend: note('BPHS', 'Dignity: great friend — environment highly supportive.', 'Dignity'),
  friend: note('BPHS', 'Dignity: friend — moderate ease and cooperation.', 'Dignity'),
  neutral: note('BPHS', 'Dignity: neutral — mixed results; other factors decide.', 'Dignity'),
  enemy: note('BPHS', 'Dignity: enemy — friction; effort required for clean results.', 'Dignity'),
  great_enemy: note('BPHS', 'Dignity: great enemy — significant obstruction to natural expression.', 'Dignity'),
  debilitated: note('BPHS', 'Dignity: debilitated (nīca) — significations strained or redirected; nīcabhaṅga can reverse.', 'Dignity'),
}

/** Fallback when grahaId is unknown — prefer getVakriAstNotes with a planet id. */
const COMBUST_NOTE = note(
  'BPHS',
  'Combust (asta): near the Sun — significations burned/hidden; Mercury/Venus especially sensitive.',
  'Asta',
)

export function getDignityClassicalNotes(
  dignity: string,
  isCombust?: boolean,
  isRetro?: boolean,
  grahaId?: string,
  vakriDetail: VakriAstDetail = 'summary',
): ClassicalNote[] {
  const out: ClassicalNote[] = []
  const d = DIGNITY_NOTE[dignity]
  if (d) out.push(d)
  if (grahaId && (isCombust || isRetro)) {
    out.push(...getVakriAstNotes(grahaId, isRetro, isCombust, dignity, vakriDetail))
  } else if (isCombust) {
    out.push(COMBUST_NOTE)
  }
  return out
}

export function getDignityAwarePlanetInSign(
  grahaId: string,
  rashi: number,
  dignity: string,
  isCombust?: boolean,
  isRetro?: boolean,
  vakriDetail: VakriAstDetail = 'summary',
): ClassicalNote[] {
  return [
    ...getPlanetInSignClassical(grahaId, rashi),
    ...getDignityClassicalNotes(dignity, isCombust, isRetro, grahaId, vakriDetail),
  ]
}

// ── Drishti (aspect) classical notes ─────────────────────────
// Special-aspect teachings (Ma 4/7/8, Ju 5/7/9, Sa 3/7/10) are teaching
// paraphrases used in chart UI — not critical-edition verse text.

const ASPECT_SPAN_LABEL: Record<number, string> = {
  3: '3rd aspect',
  4: '4th aspect',
  5: '5th aspect',
  7: '7th aspect',
  8: '8th aspect',
  9: '9th aspect',
  10: '10th aspect',
}

/** Generic flavor when no planet-specific span teaching exists. */
const GRAHA_ASPECT_FLAVOR: Partial<Record<ClassicalGrahaId, string>> = {
  Su: 'Solar aspect heats authority, vitality, and father/government themes into the target house.',
  Mo: 'Lunar aspect moistens mind, mother, and emotional comfort themes into the target house.',
  Me: 'Mercurial aspect brings analysis, speech, and trade skill into the target house.',
  Ve: 'Venusian aspect sweetens pleasure, arts, and relational ease into the target house.',
}

/**
 * Planet × aspect-span teaching text (Ma / Ju / Sa special drishti).
 * Key: `${grahaId}-${span}` e.g. `Ma-8`, `Sa-3`, `Ju-9`.
 */
const SPECIAL_ASPECT_TEACHING: Record<string, string> = {
  // ── Mars (मंगल) — 4th, 7th, 8th ──
  'Ma-4':
    '4th aspect (protection/territory): like a senāpati guarding the fort — watchful borders, maternal/selfless protection of that house’s significations, and leadership embedded in care. Protects rather than attacks.',
  'Ma-7':
    '7th aspect (partnership): taking-along / walking-together energy — gives power and drive to the house; the standard full aspect shared by all grahas.',
  'Ma-8':
    '8th aspect (elimination of threats): finishes sudden attacks, hidden enemies, and conspiracies related to that house — it does NOT blanket-destroy the house’s own significations (e.g. not automatic fights with spouse/siblings). Harsh results appear mainly when Mars is functionally harmful for the chart.',

  // ── Jupiter (गुरु) — 5th, 7th, 9th ──
  'Ju-5':
    '5th aspect (viśeṣa): excellent learning capacity — knowledge of many kinds comes easily into that house’s field.',
  'Ju-7':
    '7th aspect: good counsel/advice from partners (or partner-like figures) related to that house’s affairs.',
  'Ju-9':
    '9th aspect: blessings, protection, and bhāgya udaya (fortune rise) for that house; also presses the native to fulfill ethical obligations tied to it.',

  // ── Saturn (शनि) — 3rd, 7th, 10th ──
  'Sa-3':
    '3rd aspect (effort/mental tension): demands thoughtful, considered prayās — mental tension often accompanies the push to work carefully; colors effort-style toward the aspected house (e.g. on 12th: homesickness, home reorganization, workaholic home labor).',
  'Sa-7':
    '7th aspect (relationships/domestic atmosphere): basic needs in partnerships are met, yet small storms and nit-picking (“jhik-jhik”) keep the air restless — more organized commentary than major fights; too much idle peace can itself create tension.',
  'Sa-10':
    '10th aspect (daśama dṛṣṭi / karma): disciplines actions — if karmas are even slightly imbalanced, Saturn insists on honest effort (īmāndār mehnat), control, and steady work. Saturn accumulates karma across lives and delivers results here; idle laziness under a strong 10th-Saturn theme invites disturbance (e.g. home peace, mood).',
}

/** Short encyclopedia blurbs for special-aspect grahas (guide / teaching panels). */
export const SPECIAL_ASPECT_OVERVIEWS: Partial<Record<ClassicalGrahaId, ClassicalNote[]>> = {
  Ma: [
    note(
      'BPHS',
      'Mars has three aspects: 4th (protection of territory — senāpati / maternal watchfulness), 7th (companionship and energy given to the house), and 8th (elimination of sudden threats and conspiracies related to the house — not automatic destruction of the house’s own people/topics). Functional nature of Mars in the chart decides whether results turn harsh.',
      'Ma drishti',
    ),
  ],
  Ju: [
    note(
      'BPHS',
      'Jupiter’s special aspects: 5th (learning capacity), 7th (wise partner counsel), and 9th (blessings, protection, fortune-rise, and ethical duty) toward the aspected house.',
      'Ju drishti',
    ),
  ],
  Sa: [
    note(
      'BPHS',
      'Saturn’s special aspects: 3rd (thoughtful effort with mental tension), 7th (relationship/domestic atmosphere with organized restlessness), and 10th (karmic discipline — honest work, accumulated karma ripening). Laziness under strong Saturn karma themes invites disturbance; steady duty brings late, durable fruit.',
      'Sa drishti',
    ),
  ],
}

export function getSpecialAspectOverview(grahaId: string): ClassicalNote[] {
  const g = asGraha(grahaId)
  if (!g) return []
  return SPECIAL_ASPECT_OVERVIEWS[g] ?? []
}

export function getAspectTeachingText(grahaId: string, aspectSpan: number): string | null {
  const g = asGraha(grahaId)
  if (!g) return null
  const special = SPECIAL_ASPECT_TEACHING[`${g}-${aspectSpan}`]
  if (special) return special
  const flavor = GRAHA_ASPECT_FLAVOR[g]
  if (flavor) return flavor
  return null
}

export function getAspectClassicalNote(
  grahaId: string,
  fromHouse: number,
  toHouse: number,
  aspectSpan: number,
): ClassicalNote | null {
  const g = asGraha(grahaId)
  if (!g || g === 'Ra' || g === 'Ke') return null
  const spanLabel = ASPECT_SPAN_LABEL[aspectSpan] ?? `${aspectSpan}th aspect`
  const teaching = getAspectTeachingText(g, aspectSpan)
  const body =
    teaching ??
    'Aspects the target house with its nature — judge dignity and functional role.'
  return note(
    'BPHS',
    `${g} from house ${fromHouse} casts ${spanLabel} on house ${toHouse}. ${body}`,
    'Drishti',
  )
}
