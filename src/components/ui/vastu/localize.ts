// ─────────────────────────────────────────────────────────────
//  src/components/ui/vastu/localize.ts
//  Swap display strings for Hindi. Ids, enums, angles, colours
//  and graha/rashi codes stay English in every language.
// ─────────────────────────────────────────────────────────────
import type { EngineLang } from '@/lib/engine/lang'
import { HI } from './tables.hi'
import {
  BHAVA_MAP,
  DEITY_DESC,
  DEITY_MAP,
  DIG_BALA,
  DIKPALAS,
  FACING,
  LIFE_AREAS,
  LORD_PLACEMENT_KEY,
  MARMA_POINTS,
  METAL_REMEDIES,
  NAVAGRAHA_ZONES,
  PANCHA_BHUTAS,
  PLANET_COMPASS,
  PLANET_PROFILES,
  PRANA_VAYU_MAP,
  RASHI_PROFILES,
  ROOM_GUIDE,
  SLEEP_DIRECTIONS,
  VASTU_DOSHAS,
  VASTU_OBJECTS,
  VASTU_PLANTS,
  YANTRA_GUIDE,
  ZONE_COLORS,
  ZONES_16,
  ZONES_8,
} from './tables'

type Overlay = Record<string, unknown>

function apply<T extends object>(en: T, hi: Overlay | undefined, lang: EngineLang): T {
  if (lang !== 'hi' || !hi) return en
  const out = { ...en } as Record<string, unknown>
  for (const [key, value] of Object.entries(hi)) {
    if (typeof value === 'string') out[key] = value
    else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) out[key] = value
  }
  return out as T
}

function applyList<T extends object>(
  list: readonly T[],
  keyOf: (item: T) => string,
  hi: Record<string, Overlay> | undefined,
  lang: EngineLang,
): T[] {
  if (lang !== 'hi' || !hi) return list as T[]
  return list.map((item) => apply(item, hi[keyOf(item)], lang))
}

function applyRecord<T extends object>(
  rec: Record<string, T>,
  hi: Record<string, Overlay> | undefined,
  lang: EngineLang,
): Record<string, T> {
  if (lang !== 'hi' || !hi) return rec
  const out: Record<string, T> = {}
  for (const [key, value] of Object.entries(rec)) out[key] = apply(value, hi[key], lang)
  return out
}

const EN = {
  zones16: ZONES_16,
  zones8: ZONES_8,
  deities: DEITY_MAP,
  deityDesc: DEITY_DESC,
  navagraha: NAVAGRAHA_ZONES,
  doshas: VASTU_DOSHAS,
  marma: MARMA_POINTS,
  yantras: YANTRA_GUIDE,
  metals: METAL_REMEDIES,
  plants: VASTU_PLANTS,
  sleep: SLEEP_DIRECTIONS,
  bhutas: PANCHA_BHUTAS,
  prana: PRANA_VAYU_MAP,
  dikpalas: DIKPALAS,
  bhavas: BHAVA_MAP,
  planets: PLANET_PROFILES,
  lordKey: LORD_PLACEMENT_KEY,
  rashis: RASHI_PROFILES,
  digbala: DIG_BALA,
  rooms: ROOM_GUIDE,
  colors: ZONE_COLORS,
  lifeAreas: LIFE_AREAS,
  compassCells: PLANET_COMPASS,
  objects: VASTU_OBJECTS,
  facing: FACING,
}

export type VastuTables = typeof EN

let hiCache: VastuTables | null = null

type HiMap = Record<string, Overlay>

export function vastuTables(lang: EngineLang): VastuTables {
  if (lang !== 'hi') return EN
  if (hiCache) return hiCache
  const hi = HI as unknown as Record<string, HiMap>
  hiCache = {
    zones16: applyList(ZONES_16, (z) => z.id, hi.zones16, lang),
    zones8: applyList(ZONES_8, (z) => z.id, hi.zones8, lang),
    deities: applyList(DEITY_MAP, (d) => d.id, hi.deityNames, lang),
    deityDesc: applyRecord(DEITY_DESC, hi.deityDesc, lang),
    navagraha: applyList(NAVAGRAHA_ZONES, (n) => n.planet, hi.navagraha, lang),
    doshas: applyList(VASTU_DOSHAS, (d) => d.id, hi.doshas, lang),
    marma: applyList(MARMA_POINTS, (m) => m.id, hi.marma, lang),
    yantras: applyList(YANTRA_GUIDE, (y) => y.yantra, hi.yantras, lang),
    metals: applyList(METAL_REMEDIES, (m) => m.dir, hi.metals, lang),
    plants: applyList(VASTU_PLANTS, (p) => p.plant, hi.plants, lang),
    sleep: applyList(SLEEP_DIRECTIONS, (s) => s.head, hi.sleep, lang),
    bhutas: applyList(PANCHA_BHUTAS, (b) => b.bhuta, hi.bhutas, lang),
    prana: applyList(PRANA_VAYU_MAP, (p) => p.vayu, hi.prana, lang),
    dikpalas: applyList(DIKPALAS, (d) => d.dir, hi.dikpalas, lang),
    bhavas: applyList(BHAVA_MAP, (b) => String(b.h), hi.bhavas, lang),
    planets: applyRecord(PLANET_PROFILES, hi.planets, lang),
    lordKey: applyList(LORD_PLACEMENT_KEY, (r) => r.quality, hi.lordKey, lang),
    rashis: applyRecord(
      Object.fromEntries(Object.entries(RASHI_PROFILES)) as Record<string, (typeof RASHI_PROFILES)[1]>,
      hi.rashis,
      lang,
    ) as unknown as typeof RASHI_PROFILES,
    digbala: applyList(DIG_BALA, (d) => d.planet, hi.digbala, lang),
    rooms: applyList(ROOM_GUIDE, (r) => r.room, hi.rooms, lang),
    colors: applyList(ZONE_COLORS, (c) => c.zone, hi.colors, lang),
    lifeAreas: applyList(LIFE_AREAS, (a) => a.area, hi.lifeAreas, lang),
    compassCells: applyList(PLANET_COMPASS, (c) => c.dir, hi.compassCells, lang),
    objects: applyList(VASTU_OBJECTS, (o) => o.obj, hi.objects, lang),
    facing: applyRecord(FACING, hi.facing, lang) as typeof FACING,
  }
  return hiCache
}
