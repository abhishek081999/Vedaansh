// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariScriptures.ts
//  Classical scripture paraphrases for Vimshottari MD / AD
//  Educational digests — not verbatim translations.
//  Sources: BPHS, Phaladeepika, Laghu Parashari, Jataka Parijata, Saravali
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'

export type ScriptureSource =
  | 'BPHS'
  | 'Phaladeepika'
  | 'Laghu Parashari'
  | 'Jataka Parijata'
  | 'Saravali'

export interface ScripturePassage {
  source: ScriptureSource
  /** Chapter / section cue when known */
  ref?: string
  text: string
}

/** Mahadasha lord → classical period effects (paraphrase). */
export const VIMSHOTTARI_MAHA_SCRIPTURES: Record<string, ScripturePassage[]> = {
  Su: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Sun periods favour authority, favour from rulers, courage, and public standing when the Sun is strong; when weak or afflicted, quarrels with superiors, loss of honour, and heat-related strain are classically indicated.',
    },
    {
      source: 'Phaladeepika',
      text: 'A well-placed Sun brings royal patronage, fame, and success in government or leadership work; an afflicted Sun troubles the father, eyesight themes, and reputation.',
    },
    {
      source: 'Jataka Parijata',
      text: 'Solar dasha activates soul purpose and status — gains through father, government, temples, or positions of command; arrogance and enmity with elders appear if the Sun is combust/afflicted.',
    },
    {
      source: 'Saravali',
      text: 'Sun periods heighten ambition and visibility; travel connected with duty, awards, and disputes over pride are typical classical motifs.',
    },
  ],
  Mo: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Moon periods govern mind, mother, liquids, travel, and fluctuating fortunes. Strong Moon: comfort, popularity, and emotional support. Weak/dark Moon: restlessness, mother troubles, and unsteady gains.',
    },
    {
      source: 'Phaladeepika',
      text: 'Lunar dasha brings changes of residence, public contact, and care for dependents; affliction yields mental anxiety, cold/phlegm themes, and drained savings.',
    },
    {
      source: 'Laghu Parashari',
      text: 'Results of the Moon are read strongly through occupied and owned houses — mind and public image deliver the period’s fruit more than fixed status alone.',
    },
    {
      source: 'Saravali',
      text: 'Moon dasha emphasises nurture, food, and companionship; extremes of mood and travel by water or night journeys are classical storylines.',
    },
  ],
  Ma: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Mars periods activate siblings, land, weapons/tools, courage, and disputes. Strong Mars: victory, property effort, and technical skill. Afflicted Mars: wounds, quarrels, haste, and litigation heat.',
    },
    {
      source: 'Phaladeepika',
      text: 'Mangala dasha favours military, engineering, surgery, sports, and construction; blood, inflammation, and accidents of effort rise when Mars is poorly placed.',
    },
    {
      source: 'Jataka Parijata',
      text: 'Mars delivers through bold action — acquisition of land/house with struggle, competition, and proving strength; enemies and sibling friction accompany affliction.',
    },
    {
      source: 'Saravali',
      text: 'Martian periods reward initiative and punish impulsive anger; travel for work and fights for position are common classical notes.',
    },
  ],
  Me: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Mercury periods favour intellect, speech, trade, writing, and calculation. Strong Mercury: business growth, learning, and clever alliances. Afflicted Mercury: nervous speech, document troubles, and scattered mind.',
    },
    {
      source: 'Phaladeepika',
      text: 'Budha dasha prospers merchants, analysts, messengers, and students; with malefics, false speech, debt of words, and unstable partnerships appear.',
    },
    {
      source: 'Laghu Parashari',
      text: 'Mercury’s dual nature means results flip with association — with benefics, refined intellect; with malefics, cunning or anxiety colours the same houses.',
    },
    {
      source: 'Saravali',
      text: 'Mercurial periods multiply communications, short travels, and skills; over-analysis and fickleness are the classical pitfalls.',
    },
  ],
  Ju: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Jupiter periods expand dharma, wisdom, children (age-fit), wealth of faith, and counsel. Strong Jupiter: teachers, mentors, and auspicious ceremonies. Afflicted Jupiter: delayed progeny themes, hollow advice, and over-expansion.',
    },
    {
      source: 'Phaladeepika',
      text: 'Guru dasha brings honour through learning, priesthood, law, or guidance roles; liver/weight/lifestyle excess is a soft classical caution when Jupiter is weak.',
    },
    {
      source: 'Laghu Parashari',
      text: 'Jupiter as a natural benefic fructifies houses he owns/occupies with growth — unless he is combust, debilitated, or hemmed by malefics.',
    },
    {
      source: 'Jataka Parijata',
      text: 'Jovian periods favour marriage support, education, and long journeys for learning; arrogance of knowledge appears if Jupiter is ego-linked.',
    },
  ],
  Ve: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Venus periods bring comforts, vehicles, arts, marriage/romance, and luxuries. Strong Venus: pleasures with grace. Afflicted Venus: over-indulgence, relationship strain, and drained resources on desire.',
    },
    {
      source: 'Phaladeepika',
      text: 'Shukra dasha prospers artists, diplomats, and those dealing in beauty, perfume, or hospitality; scandals of desire and speech karma rise with affliction.',
    },
    {
      source: 'Saravali',
      text: 'Venusian periods soften life with enjoyment and alliances; classical texts warn that unrestrained bhoga invites later purification.',
    },
    {
      source: 'Jataka Parijata',
      text: 'Venus activates 7th-house and comfort significations — partnerships, adornment, and sensual happiness, tempered by dignity and aspects.',
    },
  ],
  Sa: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Saturn periods test patience, duty, servants, longevity themes, and lasting structures. Strong Saturn: position through labour and time. Afflicted Saturn: delays, separation, fear, and chronic obstacles.',
    },
    {
      source: 'Phaladeepika',
      text: 'Shani dasha builds slowly — land, factories, hierarchy, and reputation for endurance; knees/back/nerves and loneliness are classical soft cautions.',
    },
    {
      source: 'Laghu Parashari',
      text: 'Saturn gives durable fruit for houses he owns when well placed; as a functional malefic he can obstruct those same houses until lessons of time are accepted.',
    },
    {
      source: 'Saravali',
      text: 'Saturnine periods strip illusions and reward discipline; false friendships end and true allies remain — a recurring classical motif.',
    },
  ],
  Ra: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Rahu periods bring unconventional, foreign, sudden, and ambitious results. Strong/supported Rahu: breakthroughs via unusual paths. Afflicted Rahu: confusion, deception, addiction loops, and status swings.',
    },
    {
      source: 'Phaladeepika',
      text: 'Rahu dasha favours research, foreign lands, technology, and shadow power; serpents, epidemics of rumour, and unclear diagnosis are classical caution images (not medical advice).',
    },
    {
      source: 'Jataka Parijata',
      text: 'Rahu magnifies the house he occupies — desire intensifies there; mid-period ego checks and rebuilds are often described in teaching summaries.',
    },
    {
      source: 'Laghu Parashari',
      text: 'Nodes act through association and house — Rahu’s fruit is read with the sign lord and aspects more than with a single fixed nature.',
    },
  ],
  Ke: [
    {
      source: 'BPHS',
      ref: 'Vimshottari effects',
      text: 'Ketu periods emphasise detachment, past-life skill flashes, occult/research, and sudden accounting. Strong Ketu: insight and liberation themes. Afflicted Ketu: separations, mysterious losses, and abrupt cuts.',
    },
    {
      source: 'Phaladeepika',
      text: 'Ketu dasha can feel brief or dreamlike; spiritual openings and inheritance/sudden money with strings appear in classical lists, alongside hard-to-pin ailments when weak.',
    },
    {
      source: 'Saravali',
      text: 'Ketu withdraws attachment from the house he influences — what is closest to the heart may be tested so essence remains.',
    },
    {
      source: 'Jataka Parijata',
      text: 'Ketu with benefics supports moksha-leaning intelligence; with malefics, sudden accidents of fate and isolation motifs increase.',
    },
  ],
}

/**
 * High-signal MD–AD pair notes drawn from classical teaching summaries.
 * Not a full 9×9 scripture matrix — gaps fall back to synthesised classical rule.
 */
export const VIMSHOTTARI_ANTAR_SCRIPTURES: Record<string, ScripturePassage[]> = {
  'Su-Su': [
    { source: 'BPHS', text: 'Sun–Sun antar opens the solar mahadasha with concentrated ego and status themes — quick rises if the Sun is strong; early friction with authority if afflicted.' },
    { source: 'Phaladeepika', text: 'Self-period of the Sun: father, government, and honour dominate; classical lists also note short heat/health dips after a boost.' },
  ],
  'Su-Mo': [
    { source: 'BPHS', text: 'Sun–Moon antar mixes authority with mind/public mood — transfers, home shifts, and image vs emotion conflicts are classical motifs.' },
    { source: 'Phaladeepika', text: 'Royal Sun coloured by Moon: popularity swings; mother and public opinion influence career moves.' },
  ],
  'Su-Ma': [
    { source: 'BPHS', text: 'Sun–Mars antar heats ambition — courage for status, but quarrels with bosses or siblings when Mars is hot.' },
    { source: 'Phaladeepika', text: 'Energy and command combine; land/technical fights for position appear in classical notes.' },
  ],
  'Su-Me': [
    { source: 'BPHS', text: 'Sun–Mercury antar favours speech, paperwork, and networking around career or government work.' },
    { source: 'Phaladeepika', text: 'Budha under Surya: clever petitions, writing for authority, and trade under a public banner.' },
  ],
  'Su-Ju': [
    { source: 'BPHS', text: 'Sun–Jupiter antar supports mentors, ethics, and counsel roles alongside authority — teaching under a royal banner.' },
    { source: 'Laghu Parashari', text: 'When both are functional benefics for the lagna, this antar is classically supportive for dharma and status.' },
  ],
  'Su-Ve': [
    { source: 'Phaladeepika', text: 'Sun–Venus antar seeks comfort with status — image spending, alliances, and artistic favour; excess vanity if Venus is weak.' },
  ],
  'Su-Sa': [
    { source: 'BPHS', text: 'Sun–Saturn antar tests authority with duty — slow structures, hierarchy lessons, and ego under time pressure.' },
    { source: 'Laghu Parashari', text: 'Natural enmity of Sun and Saturn often colours this antar with friction before consolidation.' },
  ],
  'Su-Ra': [
    { source: 'BPHS', text: 'Sun–Rahu antar: sudden status swings and unconventional routes to recognition — verify before leaping.' },
    { source: 'Phaladeepika', text: 'Shadow on the king — fame through unusual channels or scandal risk if the Sun is afflicted.' },
  ],
  'Su-Ke': [
    { source: 'BPHS', text: 'Sun–Ketu antar detaches from ego projects — research, occult, or sudden cuts in status themes.' },
  ],
  'Mo-Mo': [
    { source: 'BPHS', text: 'Moon–Moon antar intensifies emotional extremes and money/mood swings — classically “no middle ground” when the Moon is weak.' },
    { source: 'Phaladeepika', text: 'Self-period of the Moon: mother, mind, and fluids dominate; unrest if the Moon is dark or afflicted.' },
  ],
  'Mo-Sa': [
    { source: 'BPHS', text: 'Moon–Saturn antar carries Vish Yoga flavour in teaching summaries — mental labour and heaviness unless Saturn is well placed.' },
    { source: 'Phaladeepika', text: 'Duty presses on the mind; family obligations and delayed comforts are classical notes.' },
  ],
  'Mo-Ra': [
    { source: 'BPHS', text: 'Moon–Rahu antar: distance from family or unconventional emotional bonds; Rahu may still “save” via unusual routes if strong.' },
  ],
  'Mo-Ma': [
    { source: 'Phaladeepika', text: 'Moon–Mars antar increases physical effort and travel — action over contemplation; heat on the mind if both afflicted.' },
  ],
  'Mo-Me': [
    { source: 'BPHS', text: 'Moon–Mercury antar: spending on self-growth and careful career decisions — impulsive switches are classically discouraged.' },
  ],
  'Mo-Ve': [
    { source: 'Phaladeepika', text: 'Moon–Venus antar softens desire and comfort; if the prior solar gains were strong and Moon is weak, resources can drain into pleasure.' },
  ],
  'Mo-Su': [
    { source: 'BPHS', text: 'Moon–Sun antar can spotlight the whole personality near the close of Moon MD — clarity of earlier stress, or peak pressure (not medical advice).' },
  ],
  'Mo-Ju': [
    { source: 'Phaladeepika', text: 'Moon–Jupiter antar restores faith and elder support after emotional unrest — counselling and dharmic comfort.' },
  ],
  'Ma-Ma': [
    { source: 'BPHS', text: 'Mars–Mars antar is peak warrior energy — compete, build, travel; channel heat into skill, not quarrels.' },
    { source: 'Phaladeepika', text: 'Self-period of Mars: land, siblings, and courage dominate; wounds of haste if afflicted.' },
  ],
  'Ma-Sa': [
    { source: 'Laghu Parashari', text: 'Mars–Saturn antar: frustration then discipline — long projects move only with patience; natural friction of the pair.' },
  ],
  'Ma-Ra': [
    { source: 'BPHS', text: 'Mars–Rahu antar: sudden fights or foreign/tech battles — high adrenaline; classical advice is pause before risk.' },
  ],
  'Ma-Ke': [
    { source: 'Phaladeepika', text: 'Mars–Ketu antar: detached action and abrupt cuts in conflict or property themes.' },
  ],
  'Ma-Me': [
    { source: 'BPHS', text: 'Mars–Mercury antar joins strategy with action — tech, engineering, sharp negotiations.' },
  ],
  'Ma-Ju': [
    { source: 'Phaladeepika', text: 'Mars–Jupiter antar: dharmic courage — teaching through action; avoid righteous anger.' },
  ],
  'Ve-Ve': [
    { source: 'BPHS', text: 'Venus–Venus antar sprouts bhoga — strong attraction to comforts and attachments at the opening of Venus MD.' },
    { source: 'Phaladeepika', text: 'Self-period of Venus: luxuries, arts, and partnerships intensify.' },
  ],
  'Ve-Ra': [
    { source: 'BPHS', text: 'Venus–Rahu antar is classically memorable — Maya meets Maya; subconscious imprint and transformation themes; soft caution for major procedures.' },
    { source: 'Phaladeepika', text: 'Desire amplified by Rahu — unconventional romance or luxury, with illusion risk.' },
  ],
  'Ve-Ke': [
    { source: 'Saravali', text: 'Venus–Ketu antar begins detachment — relationships or identity may shed; early spiritual light after enjoyment.' },
  ],
  'Ve-Su': [
    { source: 'Phaladeepika', text: 'Venus–Sun antar activates ego and self-image in style and status — “me and mine” focus.' },
  ],
  'Ve-Mo': [
    { source: 'BPHS', text: 'Venus–Moon antar opens the heart — soulmate search, past emotions, possible heartbreak if Moon is weak.' },
  ],
  'Ve-Ma': [
    { source: 'Phaladeepika', text: 'Venus–Mars antar hyper-activates senses and drive — control impulsiveness in relationships and conflict.' },
  ],
  'Ve-Me': [
    { source: 'BPHS', text: 'Venus–Mercury antar: mind vs heart — pull toward practical work and aesthetic collaboration.' },
  ],
  'Ve-Ju': [
    { source: 'Phaladeepika', text: 'Venus–Jupiter antar: mentors appear; romance seeks balance with dharma.' },
  ],
  'Ve-Sa': [
    { source: 'Laghu Parashari', text: 'Venus–Saturn antar: duty vs comfort — relationships mature or end; luxury earned slowly.' },
  ],
  'Sa-Sa': [
    { source: 'BPHS', text: 'Saturn–Saturn antar is double restructuring — foundation years for the rest of the mahadasha.' },
    { source: 'Phaladeepika', text: 'Self-period of Saturn: labour, delays, and lasting foundations dominate.' },
  ],
  'Sa-Me': [
    { source: 'BPHS', text: 'Saturn–Mercury antar: speech control, documentation, and skills with patience — poor papers now haunt later periods.' },
  ],
  'Sa-Ke': [
    { source: 'Phaladeepika', text: 'Saturn–Ketu antar: uncertainty and separation themes; isolation can push toward a mentor.' },
  ],
  'Sa-Ju': [
    { source: 'Laghu Parashari', text: 'Saturn–Jupiter antar: karmic teaching — mentors who demand discipline; wisdom through work.' },
  ],
  'Me-Me': [
    { source: 'BPHS', text: 'Mercury–Mercury antar is the mind’s programmer phase — identity and learning questions refresh old patterns.' },
    { source: 'Phaladeepika', text: 'Self-period of Mercury: trade, speech, and study intensify.' },
  ],
  'Me-Ke': [
    { source: 'Saravali', text: 'Mercury–Ketu antar: silent wisdom — knowledge without peace if overloaded; learn stillness.' },
  ],
  'Me-Ra': [
    { source: 'Phaladeepika', text: 'Mercury–Rahu antar: information illusion trap — verify sources; digital fame possible with confusion risk.' },
  ],
  'Me-Ju': [
    { source: 'BPHS', text: 'Mercury–Jupiter antar: data meets wisdom — knowing ≠ understanding; purpose clarifies if open.' },
  ],
  'Me-Sa': [
    { source: 'Laghu Parashari', text: 'Mercury–Saturn antar grounds dreams — reality test that builds a platform for later harvest.' },
  ],
  'Ju-Ju': [
    { source: 'BPHS', text: 'Jupiter–Jupiter antar expands faith and teaching; over-optimism needs a budget.' },
    { source: 'Phaladeepika', text: 'Self-period of Jupiter: dharma, counsel, and auspicious growth dominate.' },
  ],
  'Ju-Sa': [
    { source: 'Laghu Parashari', text: 'Jupiter–Saturn antar: wisdom meets duty — slow dharmic gains; avoid moral rigidity.' },
  ],
  'Ju-Ra': [
    { source: 'Phaladeepika', text: 'Jupiter–Rahu antar: unconventional gurus or foreign wisdom — filter hype from truth.' },
  ],
  'Ju-Ke': [
    { source: 'BPHS', text: 'Jupiter–Ketu antar: detached wisdom and sudden cuts in over-expansion — spiritual tilt.' },
  ],
  'Ra-Ra': [
    { source: 'BPHS', text: 'Rahu–Rahu antar peaks ambition — verify motives; mid-cycle ego checks are common in teaching summaries.' },
    { source: 'Phaladeepika', text: 'Self-period of Rahu: foreign/unusual paths and desire amplification dominate.' },
  ],
  'Ra-Ve': [
    { source: 'BPHS', text: 'Rahu–Venus antar shares the memorable Maya imprint with Venus–Rahu — events stamp the subconscious.' },
  ],
  'Ra-Ju': [
    { source: 'Phaladeepika', text: 'Rahu–Jupiter antar: illusion toward wisdom — a platform for later Jupiter lessons.' },
  ],
  'Ra-Sa': [
    { source: 'Laghu Parashari', text: 'Rahu–Saturn antar: slow shadow work — unconventional duties or foreign work with delays.' },
  ],
  'Ra-Ke': [
    { source: 'BPHS', text: 'Rahu–Ketu antar: shadow axis — abrupt pivots between craving and detachment.' },
  ],
  'Ke-Ke': [
    { source: 'BPHS', text: 'Ketu–Ketu antar deepens detachment — the period can feel brief; release what no longer fits.' },
    { source: 'Phaladeepika', text: 'Self-period of Ketu: occult insight and sudden accounting themes dominate.' },
  ],
  'Ke-Ve': [
    { source: 'Saravali', text: 'Ketu–Venus antar: spiritual light after release — relationships may feel otherworldly or distant.' },
  ],
  'Ke-Su': [
    { source: 'BPHS', text: 'Ketu–Sun antar dissolves ego around status — research or occult career flashes.' },
  ],
  'Ke-Mo': [
    { source: 'Phaladeepika', text: 'Ketu–Moon antar: emotional release — solitude or unusual healing paths (educational only).' },
  ],
  'Ke-Ra': [
    { source: 'BPHS', text: 'Ketu–Rahu antar: karmic axis flip — craving returns briefly then drops again.' },
  ],
}

function synthesiseAntarScripture(mahaLord: string, antarLord: string): ScripturePassage[] {
  const mahaName = GRAHA_NAMES[mahaLord as GrahaId] ?? mahaLord
  const antarName = GRAHA_NAMES[antarLord as GrahaId] ?? antarLord
  const same = mahaLord === antarLord

  return [
    {
      source: 'BPHS',
      ref: 'Dasha result hierarchy',
      text: same
        ? `Classical rule: the opening antardasha of ${mahaName} mahadasha often seeds the whole period — house and sign results of ${mahaName} begin to operate before later antars colour them.`
        : `Classical rule: antardasha of ${antarName} within ${mahaName} mahadasha does not replace the mahadasha. Read ${mahaName}'s house/sign fruit first, then colour with ${antarName}'s natural and house significations.`,
    },
    {
      source: 'Phaladeepika',
      text: same
        ? `${mahaName}–${mahaName} antar concentrates the planet’s own karakatvas at the start of its mahadasha.`
        : `${antarName} antar under ${mahaName} MD mixes ${antarName}'s karakatvas (speech, courage, comfort, duty, etc.) into the ongoing ${mahaName} chapter — results are finer-grained and shorter than a full ${antarName} mahadasha.`,
    },
    {
      source: 'Laghu Parashari',
      text: 'Antardasha fruit follows functional nature for the lagna: a functional benefic antar supports delivery; a functional malefic antar can obstruct or delay the same mahadasha houses until dignity and aspects are weighed.',
    },
  ]
}

/** Scripture passages for a mahadasha lord. */
export function getVimshottariMahaScriptures(lord: string): ScripturePassage[] {
  return VIMSHOTTARI_MAHA_SCRIPTURES[lord] ?? []
}

/**
 * Scripture for antardasha: pair-specific passages when curated,
 * otherwise classical hierarchy synthesis (never the full AD-lord mahadasha essay alone).
 */
export function getVimshottariAntarScriptures(mahaLord: string, antarLord: string): ScripturePassage[] {
  const key = `${mahaLord}-${antarLord}`
  const pair = VIMSHOTTARI_ANTAR_SCRIPTURES[key]
  if (pair?.length) {
    const antarMaha = getVimshottariMahaScriptures(antarLord).slice(0, 1)
    return [
      ...pair,
      ...antarMaha.map(p => ({
        ...p,
        text: `Antar-lord background (${GRAHA_NAMES[antarLord as GrahaId] ?? antarLord} as planet): ${p.text}`,
      })),
    ]
  }
  return synthesiseAntarScripture(mahaLord, antarLord)
}
