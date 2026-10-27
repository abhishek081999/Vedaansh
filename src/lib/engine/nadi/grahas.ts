// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/grahas.ts
//  Nadi graha karakas — nature, body, work, relationships.
//  Number map matches GRAHA_NUMBER in numerology/tools.ts.
//  Teaching associations, not a prescription.
// ─────────────────────────────────────────────────────────────

import type { ClassicalGrahaId } from '@/lib/engine/houseInterpretations'

export type NadiGrahaNature = 'benefic' | 'malefic' | 'shadow'

export interface NadiGrahaProfile {
  id: ClassicalGrahaId
  nature: NadiGrahaNature
  color: string
  gemstone: string
  metal: string
  direction: string
  bodyParts: string[]
  relationships: string[]
  professions: string[]
  significances: string[]
  whenAfflicted: string[]
  /** Anka digit. Same map as numerology GRAHA_NUMBER. */
  number: number
}

/**
 * Same-sign conjunction strength.
 * Within 2° is the closest form, within 7° the close form, and within 15° the wide form.
 * House occupancy itself stays whole-sign even past the weak orb.
 */
export const NADI_CONJUNCTION_ORB = { strongest: 2, strong: 7, weak: 15 } as const

/** This school does not let combustion cancel a planet that is otherwise delivering. */
export const NADI_COMBUSTION_NOTE =
  'Combustion is recorded, and it is not treated as enough to cancel career or wealth when the chart is otherwise delivering.'

export const NADI_GRAHAS: Record<ClassicalGrahaId, NadiGrahaProfile> = {
  Ju: {
    id: 'Ju', nature: 'benefic', color: 'Yellow', gemstone: 'Yellow sapphire', metal: 'Gold',
    direction: 'North-east', bodyParts: ['Liver'], relationships: ['Children'], number: 3,
    professions: ['Teaching', 'Law and judging', 'University work', 'Astrology and consulting', 'Priests'],
    significances: ['Wisdom', 'Children', 'Counsel', 'Growth'],
    whenAfflicted: ['Liver strain', 'Miscarriage, delayed birth, or difficulty having children, especially with Rahu, Mars, or Saturn'],
  },
  Ve: {
    id: 'Ve', nature: 'benefic', color: 'White', gemstone: 'Diamond', metal: 'Silver',
    direction: 'South-east', bodyParts: ['Kidneys', 'Uterus', 'Reproductive system'], relationships: ['Spouse'], number: 6,
    professions: ['Dance, music, modelling, and on-camera work', 'Finance and markets', 'Restaurants, bars, and hotels', 'Vehicle trade', 'Design', 'Medicine when Saturn joins'],
    significances: ['Marriage and romance', 'Vehicles', 'Luxury, jewelry, and comfort', 'Art'],
    whenAfflicted: [
      'Marriage may be absent, late, separated, or lived with a chronically ill spouse. Do not collapse every affliction into a separation.',
      'Vehicle accidents, especially with Ketu.',
    ],
  },
  Mo: {
    id: 'Mo', nature: 'benefic', color: 'White', gemstone: 'Pearl', metal: 'Silver',
    direction: 'North-east', bodyParts: ['Mind', 'Emotions'], relationships: ['Mother'], number: 2,
    professions: ['Food, dairy, and agriculture', 'Nursing and laboratory work', 'Care'],
    significances: ['Mind', 'Mother', 'Liquids', 'The public mood'],
    whenAfflicted: ['Anxiety and low mood', 'Migraine with Rahu', 'Heaviness with Saturn', 'Disturbance with Ketu'],
  },
  Me: {
    id: 'Me', nature: 'benefic', color: 'Green', gemstone: 'Emerald', metal: '—',
    direction: 'North', bodyParts: ['Skin', 'Throat', 'Breath'], relationships: ['Father’s sisters'], number: 5,
    professions: ['Independent business', 'Teaching, writing, editing, and journalism', 'Analysis and trade'],
    significances: ['Speech', 'Trade', 'Skill with numbers and words'],
    whenAfflicted: ['Skin disease, especially with Rahu', 'Throat and breath trouble with Rahu'],
  },
  Ma: {
    id: 'Ma', nature: 'malefic', color: 'Red', gemstone: 'Red coral', metal: '—',
    direction: 'South', bodyParts: ['Blood', 'Muscles'], relationships: ['Brothers'], number: 9,
    professions: ['Uniformed work: medicine, police, army, engineering', 'Land and construction when the 5th is weak', 'Sport and physical training'],
    significances: ['Land and buildings', 'Cuts and surgery', 'Courage', 'Uniform'],
    whenAfflicted: ['Blood pressure and heart strain, especially with the Sun', 'Injury or an operation in the house it occupies, or for the relative of that house'],
  },
  Sa: {
    id: 'Sa', nature: 'malefic', color: 'Blue', gemstone: 'Blue sapphire', metal: 'Iron and steel',
    direction: 'West', bodyParts: ['Legs', 'Knees'], relationships: ['Elder family'], number: 8,
    professions: ['Politics and government rank', 'Law', 'Civil and electronics engineering', 'Farming', 'Labour and service', 'Aviation and cold-region work', 'Fuel trade with Venus'],
    significances: ['Delay', 'Labour', 'Discipline', 'Cold and lonely places', 'Long struggle'],
    whenAfflicted: ['Knees and legs', 'Chronic delay'],
  },
  Su: {
    id: 'Su', nature: 'malefic', color: 'Copper and gold', gemstone: 'Ruby', metal: 'Gold',
    direction: 'East', bodyParts: ['Heart', 'Eyes'], relationships: ['Father'], number: 1,
    professions: ['Government office', 'Gold and textile trade', 'Politics'],
    significances: ['Father’s status', 'Authority', 'Self-made effort when the Sun is weak', 'Government'],
    whenAfflicted: ['Heart strain, especially with Rahu', 'Eyes with Ketu', 'Little inheritance from the father'],
  },
  Ra: {
    id: 'Ra', nature: 'shadow', color: 'Smoke', gemstone: 'Hessonite', metal: '—',
    direction: '—', bodyParts: ['Mind, as disturbance'], relationships: [], number: 4,
    professions: ['Technical and foreign work', 'Sudden trades: markets, lottery, unusual gains'],
    significances: ['Sudden gain and sudden loss', 'Cheating and illusion', 'Transfer and change of place', 'Amplifies the sign lord'],
    whenAfflicted: ['Obsession, accident, theft, and events that were not planned', 'Acts like a weak or afflicted sign lord'],
  },
  Ke: {
    id: 'Ke', nature: 'shadow', color: 'Smoke', gemstone: 'Cat’s eye', metal: '—',
    direction: '—', bodyParts: ['The part of the body where it cuts'], relationships: [], number: 7,
    professions: ['Software and research', 'Spiritual work and NGOs'],
    significances: ['Surgery and cuts', 'Separation', 'Change of place', 'Detachment', 'Acts like the sign lord, with a Mars-like cut'],
    whenAfflicted: ['Operation, a separation, or a break in the house it occupies'],
  },
}

export function nadiGraha(id: string): NadiGrahaProfile | null {
  if (!(id in NADI_GRAHAS)) return null
  return NADI_GRAHAS[id as ClassicalGrahaId]
}

/** Affliction in this method: same house as Saturn, Mars, Rahu, or Ketu, ignoring the planet itself. */
export function nadiAfflictedBy(id: ClassicalGrahaId, coOccupants: readonly string[]): string[] {
  return coOccupants.filter((other) => other !== id && (other === 'Sa' || other === 'Ma' || other === 'Ra' || other === 'Ke'))
}
