// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/index.ts
//  Nadi reading foundation for later prediction modules.
// ─────────────────────────────────────────────────────────────

export {
  NADI_HOUSES,
  NADI_LORD_LINKS,
  NADI_MALEFIC_LIVING_RULE,
  NADI_PAPA_GRAHAS,
  NADI_PILLARS,
  nadiHouse,
} from '@/lib/engine/nadi/houses'
export type { NadiHouseProfile, NadiLordLink } from '@/lib/engine/nadi/houses'

export {
  NADI_COMBUSTION_NOTE,
  NADI_CONJUNCTION_ORB,
  NADI_GRAHAS,
  nadiAfflictedBy,
  nadiGraha,
} from '@/lib/engine/nadi/grahas'
export type { NadiGrahaProfile } from '@/lib/engine/nadi/grahas'

export {
  NADI_RELATIVES,
  houseCountedFrom,
  readNadiChart,
  readNadiHouses,
  rolesOfHouse,
} from '@/lib/engine/nadi/read'
export type {
  NadiChartReading,
  NadiHouseReading,
  NadiOccupantReading,
  NadiPlacement,
  NadiRelativeReading,
} from '@/lib/engine/nadi/read'
