// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/index.ts
//  Public Lal Kitab engine API. Pure; safe in the browser.
// ─────────────────────────────────────────────────────────────

export * from './types'
export { buildTeva, houseOfRashi } from './chart'
export type { LkTeva } from './chart'
export { LK_PAKKA_GHAR, LK_UCHCHA, LK_NEECH, LK_HOUSE_KARAKA, LK_NODE_DIGNITY_PENDING, lkDignity } from './pakkaGhar'
export type { LkDignity } from './pakkaGhar'
export { LK_FRIENDS, LK_ENEMIES, lkRelation, lkMutualClash } from './friendship'
export { LK_HOUSE_ASPECTS, LK_ASPECT_PERCENT, lkAspectsFromHouse, lkBunyadHouse, lkPlanetAspects, lkTakkarHouse, lkTakkars } from './drishti'
export type { LkHouseAspectRule, LkPlanetAspect, LkTakkar } from './drishti'
export { LK_GRAHA_KARAKA, LK_HOUSE_MEANING, lkGrahaKaraka, lkHouseMeaning } from './karakas'
export type { LkGrahaKaraka, LkHouseMeaning } from './karakas'
export { evalCondition } from './conditions'
export type { LkCondition, LkEval, LkTrailStep } from './conditions'
export { lkFacts, lkFactsFromTeva } from './facts'
export type { LkFacts } from './facts'
export { evaluateRules } from './evaluate'
export type { LkMatch } from './evaluate'
export { LK_FOUNDATION_RULES, LK_FOUNDATION_TEXT, LK_GRAHA_AREAS } from './catalogue/foundation'
export type { LkRule, LkRuleText } from './catalogue/types'
export { describeLkStep, lkGrahaName, readLalKitab } from './read'
export type { LalKitabReading, LkFinding, LkHouseView, LkPlanetView, ReadLalKitabOptions } from './read'
