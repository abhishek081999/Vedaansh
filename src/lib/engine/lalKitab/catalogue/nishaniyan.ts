// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/catalogue/nishaniyan.ts
//  Nishaniyan: signs in daily life that a planet has turned hard.
//  Lal Kitab uses them to confirm a reading and to check the chart.
//  Written in our own words; edition: commentary until checked.
//  Hindi: locale/lalKitabNishaniyan.hi.ts (keyed by id).
// ─────────────────────────────────────────────────────────────

import type { LkEdition, LkGraha } from '../types'

export interface LkNishani {
  id: string
  planet: LkGraha
  text: string
}

export const LK_NISHANI_EDITION: LkEdition = 'commentary'

const RAW: Record<LkGraha, readonly string[]> = {
  Su: [
    'Trouble with the government, tax office or a boss keeps coming back',
    'The father\'s health or his standing has been weak',
    'Strain on the right eye or a weak heart',
    'Loss of self-respect or of a post you held',
    'Copper things or a red cow at home lost or harmed',
    'Body feels stiff and loses energy without a clear cause',
    'A wheat-coloured or brown pet or animal at home falls ill',
  ],
  Mo: [
    'A milk-giving animal at home dies or falls ill',
    'A well, tap or water source at home dries up or leaks',
    'The mother\'s health has been weak',
    'Silver items lost or stolen',
    'Constant worry, low mood or poor sleep',
    'Loss of a sense of smell or touch',
    'Money comes through the mother\'s side and then goes',
  ],
  Ma: [
    'Quarrels with brothers or close friends',
    'Blood problems, frequent cuts or bleeding',
    'Fire accidents or burns in the house',
    'Disputes over land or a building',
    'Sudden bursts of anger you regret',
    'Trouble in the joints of the hands',
    'Sweets or honey at home spoil quickly',
  ],
  Me: [
    'Teeth weak, loose or decaying early',
    'Sisters, daughters or aunts face trouble',
    'Skin problems or allergies',
    'Losses in business or in speculation',
    'Speech falters or you stammer when tense',
    'Green plants at home dry up without reason',
    'Loss of a sense of smell',
  ],
  Ju: [
    'Hair falls from the crown of the head',
    'Gold lost or stolen',
    'False blame or charges against you',
    'Study broken off or interrupted',
    'A peepal tree near the house dries up',
    'Breathing trouble or a weak chest',
    'Elders or teachers turn against you',
  ],
  Ve: [
    'Pain or skin trouble on the thumb',
    'The spouse\'s health is often weak',
    'Loss of interest in married life',
    'Skin disease or loss of glow',
    'A cow linked to the house falls ill or dies',
    'Repeated trouble in love or marriage',
    'Urinary or reproductive trouble',
  ],
  Sa: [
    'Hair of the eyebrows or eyelashes falls',
    'A wall or part of the house cracks or collapses',
    'A buffalo or other animal kept at home dies',
    'Fire in the house or in a vehicle',
    'Nails, legs or knees trouble you',
    'Theft or loss of iron goods or machines',
    'A pull toward drink or bad company',
  ],
  Ra: [
    'Nails turn weak, break or change colour',
    'Sudden thefts or electrical faults at home',
    'Quarrels with in-laws',
    'False cases or confusing legal trouble',
    'Fear, nightmares or a confused mind',
    'Smoke, dampness or bad smell in the house',
    'Sudden losses that seem to come from nowhere',
  ],
  Ke: [
    'Pain in the joints, the spine or the feet',
    'Trouble with hearing or the ears',
    'A pet dog dies, falls ill or goes missing',
    'Worry or trouble around sons or nephews',
    'Urinary trouble',
    'Journeys that go wrong or bring loss',
    'Disputes with maternal uncles',
  ],
}

export const LK_NISHANIYAN: readonly LkNishani[] = (Object.entries(RAW) as [LkGraha, readonly string[]][])
  .flatMap(([planet, list]) => list.map((text, i) => ({ id: `${planet}.${i + 1}`, planet, text })))
