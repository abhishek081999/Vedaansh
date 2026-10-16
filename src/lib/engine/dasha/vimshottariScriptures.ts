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

/** Vimshottari dasha lords — 9×9 = 81 MD–AD pairs. */
export const VIMSHOTTARI_SCRIPTURE_LORDS = [
  'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke',
] as const

/**
 * Full 9×9 MD–AD pair notes (educational paraphrases of classical teaching summaries).
 * Prefer Phaladeepika / BPHS tone; gaps never reuse a full AD-lord mahadasha essay alone.
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
  'Mo-Ke': [
    { source: 'BPHS', text: 'Moon–Ketu antar withdraws the mind from ordinary comfort — solitude, research, or sudden emotional accounting.' },
    { source: 'Phaladeepika', text: 'Detachment from mother/mood habits; unusual dreams or healing paths appear in classical lists (educational only).' },
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
  'Ma-Su': [
    { source: 'BPHS', text: 'Mars–Sun antar heats authority — courage for leadership roles; quarrels with superiors if both are afflicted.' },
    { source: 'Phaladeepika', text: 'Command and weapons/tools combine — status through bold effort; ego friction is the classical caution.' },
  ],
  'Ma-Mo': [
    { source: 'BPHS', text: 'Mars–Moon antar drives action through emotion — travel, property effort, and restless mind; cool the temper.' },
    { source: 'Phaladeepika', text: 'Physical push meets mood swings; mother/home themes can heat up alongside career drive.' },
  ],
  'Ma-Ve': [
    { source: 'Phaladeepika', text: 'Mars–Venus antar mixes desire with drive — romance, vehicles, and competitive charm; impulsiveness in pleasure.' },
    { source: 'BPHS', text: 'Passion and initiative rise together — classical notes warn against haste in relationships and spending.' },
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
  'Sa-Su': [
    { source: 'BPHS', text: 'Saturn–Sun antar tests ego under hierarchy — authority earns respect slowly through duty.' },
    { source: 'Laghu Parashari', text: 'Natural enmity of Sun and Saturn often colours this antar with friction before consolidation.' },
  ],
  'Sa-Mo': [
    { source: 'Phaladeepika', text: 'Saturn–Moon antar: emotional coldness then maturity — family duties and mental labour intensify.' },
    { source: 'BPHS', text: 'Mind under time pressure; patience with mother/dependents is the classical medicine.' },
  ],
  'Sa-Ma': [
    { source: 'Laghu Parashari', text: 'Saturn–Mars antar: effort with friction — physical labour and hard boundaries; pace the body.' },
    { source: 'BPHS', text: 'Discipline meets drive; long projects move only when haste is dropped.' },
  ],
  'Sa-Ve': [
    { source: 'Phaladeepika', text: 'Saturn–Venus antar: duty vs comfort — relationships mature or end; luxury earned slowly.' },
    { source: 'Laghu Parashari', text: 'Results of past indulgence arrive as boundaries; lasting alliances survive the test.' },
  ],
  'Sa-Ra': [
    { source: 'BPHS', text: 'Saturn–Rahu antar: slow shadow work — unconventional duties or foreign labour with delays.' },
    { source: 'Phaladeepika', text: 'Ambition under time; breakthroughs come late and through unusual structures.' },
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
  'Me-Su': [
    { source: 'BPHS', text: 'Mercury–Sun antar puts speech and intellect under the spotlight — petitions, exams, and public writing.' },
    { source: 'Phaladeepika', text: 'Budha coloured by Surya: clever work for authority; watch ego in debate.' },
  ],
  'Me-Mo': [
    { source: 'BPHS', text: 'Mercury–Moon antar mixes logic with mood — study, trade, and travel of mind; overnight decisions classically advised.' },
    { source: 'Phaladeepika', text: 'Communications swing with emotion; mother/public themes enter business talk.' },
  ],
  'Me-Ma': [
    { source: 'Phaladeepika', text: 'Mercury–Mars antar executes plans — tech, engineering, sharp negotiations; haste in speech is the caution.' },
    { source: 'BPHS', text: 'Strategy meets action; documents and tools both move — avoid impulsive contracts.' },
  ],
  'Me-Ve': [
    { source: 'BPHS', text: 'Mercury–Venus antar joins aesthetics with intellect — design, diplomacy, creative commerce.' },
    { source: 'Phaladeepika', text: 'Thoughts + beauty: collaborations prosper; don’t force pure logic onto feelings.' },
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
  'Ju-Su': [
    { source: 'BPHS', text: 'Jupiter–Sun antar elevates counsel into authority — teaching, law, or guidance under a public banner.' },
    { source: 'Phaladeepika', text: 'Dharma meets status; honour through wisdom roles if both are strong.' },
  ],
  'Ju-Mo': [
    { source: 'Phaladeepika', text: 'Jupiter–Moon antar softens expansion with care — elder support, emotional wisdom, and family counsel.' },
    { source: 'BPHS', text: 'Faith and mind align; comfort through mentors and auspicious home themes when well placed.' },
  ],
  'Ju-Ma': [
    { source: 'BPHS', text: 'Jupiter–Mars antar: righteous courage — action guided by ethics; avoid moral warfare.' },
    { source: 'Phaladeepika', text: 'Teaching through effort; property or competition with a dharmic frame.' },
  ],
  'Ju-Me': [
    { source: 'Phaladeepika', text: 'Jupiter–Mercury antar: publishing, counsel, and intellect in service of a larger purpose.' },
    { source: 'BPHS', text: 'Wisdom meets speech — students, writers, and advisors prosper when both are dignified.' },
  ],
  'Ju-Ve': [
    { source: 'Phaladeepika', text: 'Jupiter–Venus antar balances enjoyment with dharma — marriage support, arts with ethics, gracious mentors.' },
    { source: 'BPHS', text: 'Comfort and counsel combine; classical lists favour auspicious ceremonies when age-fit.' },
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
  'Ra-Su': [
    { source: 'BPHS', text: 'Rahu–Sun antar: sudden status via unusual routes — fame risk and ego inflation if the Sun is weak.' },
    { source: 'Phaladeepika', text: 'Shadow on authority — unconventional recognition or scandal pressure; verify before leaping.' },
  ],
  'Ra-Mo': [
    { source: 'Phaladeepika', text: 'Rahu–Moon antar: restless mind and unconventional emotional bonds; distance from family motifs.' },
    { source: 'BPHS', text: 'Desire amplifies mood; classical advice is ground the nervous system before big moves.' },
  ],
  'Ra-Ma': [
    { source: 'BPHS', text: 'Rahu–Mars antar: high-adrenaline fights or foreign/tech battles — pause before risk.' },
    { source: 'Phaladeepika', text: 'Sudden courage and conflict; heat on property or siblings themes when afflicted.' },
  ],
  'Ra-Me': [
    { source: 'Phaladeepika', text: 'Rahu–Mercury antar: information overload and digital branding — stay reality-checked.' },
    { source: 'BPHS', text: 'Speech and networks amplify through unusual channels; verify sources and contracts.' },
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
  'Ke-Ma': [
    { source: 'Phaladeepika', text: 'Ketu–Mars antar: sudden action cuts — martial energy without attachment; abrupt property/conflict closure.' },
    { source: 'BPHS', text: 'Detached courage; classical notes warn of haste without a clear aim.' },
  ],
  'Ke-Me': [
    { source: 'Saravali', text: 'Ketu–Mercury antar: silent or occult intellect — research, coding, or speech withdrawal.' },
    { source: 'BPHS', text: 'Knowledge without noise; scattered documents if Mercury is afflicted.' },
  ],
  'Ke-Ju': [
    { source: 'BPHS', text: 'Ketu–Jupiter antar: detached wisdom — sudden cuts in over-expansion; spiritual or advisory tilt.' },
    { source: 'Phaladeepika', text: 'Guru flavour with release — mentors who point inward rather than to status.' },
  ],
  'Ke-Sa': [
    { source: 'Laghu Parashari', text: 'Ketu–Saturn antar: deep restructuring with detachment — isolation can become disciplined solitude.' },
    { source: 'Phaladeepika', text: 'Slow release of burdens; longevity/structure themes with a moksha colouring.' },
  ],
}

/** True when all 81 MD–AD keys exist with at least one passage each. */
export function hasCompleteAntarScriptureMatrix(): boolean {
  for (const maha of VIMSHOTTARI_SCRIPTURE_LORDS) {
    for (const antar of VIMSHOTTARI_SCRIPTURE_LORDS) {
      const passages = VIMSHOTTARI_ANTAR_SCRIPTURES[`${maha}-${antar}`]
      if (!passages?.length) return false
    }
  }
  return true
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

/** Short classical hierarchy note for pratyantardasha (finest visible layer). */
export function getVimshottariPratyantarScriptures(
  mahaLord: string,
  antarLord: string,
  pratyaLord: string,
): ScripturePassage[] {
  const mahaName = GRAHA_NAMES[mahaLord as GrahaId] ?? mahaLord
  const antarName = GRAHA_NAMES[antarLord as GrahaId] ?? antarLord
  const pratyaName = GRAHA_NAMES[pratyaLord as GrahaId] ?? pratyaLord
  return [
    {
      source: 'BPHS',
      ref: 'Dasha subdivisions',
      text: `Pratyantardasha of ${pratyaName} under ${antarName} antardasha within ${mahaName} mahadasha is the fine timer — it does not replace MD or AD. Read ${mahaName} houses first, then ${antarName} colouring, then brief ${pratyaName} events.`,
    },
    {
      source: 'Phaladeepika',
      text: `${pratyaName} pratyantar lasts only a fraction of the antar — results are sharper and shorter, often felt as specific incidents rather than a whole life chapter.`,
    },
  ]
}

/**
 * Scripture for antardasha: full 81-pair matrix when present,
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
