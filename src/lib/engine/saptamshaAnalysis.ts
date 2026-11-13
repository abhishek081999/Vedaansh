// ─────────────────────────────────────────────────────────────
//  src/lib/engine/saptamshaAnalysis.ts
//  Saptamsha (D7) — purva punya, desire, progeny, relating,
//  devotion, recognition, love/breakup (class episodes 1–3)
//  Class heuristics: dharma/artha/kama/moksha pillars, Moon/Venus
//  preference, children markers, clutch patterns, Moon deity map,
//  BK/AK/DK recognition, Aquarius–Rahu / Scorpio / Me–Sa–Ke circuits,
//  D7 love entry/exit + D3 mind cross-read
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D7_HOUSE_THEMES_HI,
  D7_LAGNA_PLANET_HI,
  D7_LAGNA_SIGN_FLAVOR_HI,
  D7_MOON_SIGN_HI,
  D7_PURPOSE_HI,
  D7_TEXT_HI,
  D7_VENUS_SIGN_HI,
} from '@/lib/engine/locale/saptamsha.hi'

export type D7Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export type D7PillarId = 'dharma' | 'artha' | 'kama' | 'moksha'

export interface SaptamshaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface SaptamshaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
  tone: D7Tone
}

export interface SaptamshaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D7Tone
}

export interface SaptamshaPillar {
  id: D7PillarId
  label: string
  focus: string
  occupants: string[]
  tone: D7Tone
  reading: string
}

export interface SaptamshaProgeny {
  sunHouse: number | null
  sunDignity: Dignity | null
  ketuHouse: number | null
  jupiterHouse: number | null
  jupiterDignity: Dignity | null
  conceptionNote: string
  continuityNote: string
  joyNote: string
  miscarriageNote: string | null
  adoptionNote: string | null
  lagnaLordNote: string | null
  reading: string
  tone: D7Tone
}

export interface SaptamshaLoveLife {
  entryReading: string
  hiddenReading: string | null
  departureReading: string | null
  fidelityReading: string
  playboyFlag: boolean
  exposureReading: string | null
  d3Notes: SaptamshaPattern[]
  patterns: SaptamshaPattern[]
  reading: string
  tone: D7Tone
}

export interface SaptamshaDesire {
  moon: {
    rashi: Rashi
    rashiName: string
    house: number
    reading: string
  } | null
  venus: {
    rashi: Rashi
    rashiName: string
    house: number
    reading: string
  } | null
  reading: string
}

export interface SaptamshaDevotion {
  moonRashi: Rashi | null
  moonRashiName: string | null
  moonHouse: number | null
  deityHints: string[]
  reading: string
  tone: D7Tone
}

export interface SaptamshaRecognition {
  bhratriId: GrahaId | null
  bhratriName: string | null
  bhratriHouse: number | null
  bhratriDignity: Dignity | null
  bhratriReading: string
  atmaId: GrahaId | null
  atmaName: string | null
  atmaHouse: number | null
  atmaReading: string | null
  daraId: GrahaId | null
  daraReading: string | null
  lagnaPowerReading: string
  moonFameReading: string | null
  sunPowerReading: string | null
  ketuDelayReading: string | null
  strong: boolean
  reading: string
  tone: D7Tone
}

export type D7Clutch = 'self' | 'other' | 'shared'

export interface SaptamshaPattern {
  id: string
  title: string
  text: string
  tone: D7Tone
}

export interface SaptamshaRelating {
  lagnaEmpty: boolean
  occupants: { id: GrahaId; name: string; isRetro: boolean; reading: string }[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctNames: string[]
    reading: string
  }
  signFlavor: string
  clutch: D7Clutch
  clutchLabel: string
  clutchReading: string
  meetingReading: string
  distance: 'local' | 'long' | 'mixed'
  distanceReading: string
  patterns: SaptamshaPattern[]
  pastLifeFriendHint: string
}

export interface SaptamshaAnalysis {
  d7Lagna: Rashi
  d7LagnaName: string
  d7LagnaSanskrit: string
  summary: string
  purpose: string
  pillars: SaptamshaPillar[]
  progeny: SaptamshaProgeny
  desire: SaptamshaDesire
  devotion: SaptamshaDevotion
  recognition: SaptamshaRecognition
  loveLife: SaptamshaLoveLife
  relating: SaptamshaRelating
  planets: SaptamshaPlanetRow[]
  houses: SaptamshaHouseRow[]
  focusedHouses: SaptamshaHouseRow[]
  insights: SaptamshaInsight[]
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']
const FOCUS_HOUSES = [1, 5, 7, 9, 11] as const

const D7_PURPOSE =
  'Saptamsha shows the weight of prior merit: dharma, artha, kama, and moksha imprints; where desire and affection stick; and how progeny and relating tones run. Read it as a glimpse of carry-forward hunger and punya — not as a single verdict.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Aries D7 lagna — fast desire and immediate attraction; courage and conflict both color affection.',
  2: 'Taurus D7 lagna — kama trikona doorway; stability, fertility, and body-comfort seeking.',
  3: 'Gemini D7 lagna — attraction through talk, music, and wedding / gathering atmospheres.',
  4: 'Cancer D7 lagna — care, home warmth, and a nurturing / lunar-type partner preference.',
  5: 'Leo D7 lagna — dharma and dignity tone; even affection runs a moral / regal filter.',
  6: 'Virgo D7 lagna — cleanliness, service / “slave” tone, and karmic grade-down; impurity feels intolerable.',
  7: 'Libra D7 lagna — beauty, balance, and a partner’s polish / manners matter.',
  8: 'Scorpio D7 lagna — intensity, privacy, and deep change; relating can deepen or wound.',
  9: 'Sagittarius D7 lagna — dharma, travel, and ideals; trust / boundaries are easily tested.',
  10: 'Capricorn D7 lagna — binding and duty tone; leaving or fully arriving can both feel hard.',
  11: 'Aquarius D7 lagna — unexpected patterns, groups / friendship, and past-life connection flavor.',
  12: 'Pisces D7 lagna — giving nature, compassion, and surrender; affection tastes like sacrifice.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Saptamsha self — the face of desire and merit',
  2: 'Resources, speech, and family-tied desires',
  3: 'Courage, effort, and affection through skills / hands',
  4: 'Heart, home, and desire in the emotional root',
  5: 'Children, creativity, and the romance field',
  6: 'Service, debt, conflict, and corrective desires',
  7: 'Partner and the relationship arena',
  8: 'Deep change, crisis, and hidden desire',
  9: 'Dharma, teachers, and distant / higher meetings',
  10: 'Work, status, and public desire',
  11: 'Gains, groups, and wish-fulfillment circles',
  12: 'Release, distance, and subconscious desire',
}

const MOON_SIGN: Record<Rashi, string> = {
  1: 'Moon in Aries — past-life devotion flavor can lean Narasimha / Durga / Hanuman-like fierce guardian energy; body preference for courage and drive.',
  2: 'Moon in Taurus — attachment to stable, tactile comfort and secure body / atmosphere.',
  3: 'Moon in Gemini — attachment to talkative, musical, agile partners / spaces.',
  4: 'Moon in Cancer — deep attachment to caregiving, home-like, nurturing natures.',
  5: 'Moon in Leo — attachment to dignity, radiance, and regal presence.',
  6: 'Moon in Virgo — attachment to clean, orderly, service-oriented presence.',
  7: 'Moon in Libra — attachment to beauty, balance, and social grace.',
  8: 'Moon in Scorpio — attachment to intense, private, transformative energy.',
  9: 'Moon in Sagittarius — attachment to teacher / dharmic / travel-leaning natures.',
  10: 'Moon in Capricorn — attachment to serious, disciplined, duty-bound presence.',
  11: 'Moon in Aquarius — attachment to friendship, groups, and unusual / humane natures.',
  12: 'Moon in Pisces — attachment to compassionate, giving, renunciate natures.',
}

const VENUS_SIGN: Record<Rashi, string> = {
  1: 'Venus in Aries — preference for active, brave, direct partner presence.',
  2: 'Venus in Taurus — preference for steady, tactile, soft-bodied comfort.',
  3: 'Venus in Gemini — preference for witty, playful, intellectual attraction.',
  4: 'Venus in Cancer — preference for caring partners who give a home vibe.',
  5: 'Venus in Leo — preference for radiant, confident, proud presence.',
  6: 'Venus in Virgo — preference for clean, practical, service-toned beauty.',
  7: 'Venus in Libra — preference for polished, trendy, balanced presence.',
  8: 'Venus in Scorpio — preference for intense, mysterious, deep attraction.',
  9: 'Venus in Sagittarius — preference for idealistic / dharmic / travel-leaning partners; trust can be tested.',
  10: 'Venus in Capricorn — preference for mature, serious, status-aware attraction.',
  11: 'Venus in Aquarius — preference for friendship-first, unusual, independent attraction.',
  12: 'Venus in Pisces — preference for compassionate, giving, devoted presence.',
}

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, string>> = {
  Su: 'Sun on D7 lagna — dharma and dignity lead; even affection carries a moral filter.',
  Mo: 'Moon on D7 lagna — emotional attachment is intense; a “feels so good” binding factor.',
  Ma: 'Mars on D7 lagna — heat and pressure in desire; courage or conflict tone.',
  Me: 'Mercury on D7 lagna — analysis, questions, and calculation color affection.',
  Ju: 'Jupiter on D7 lagna — punya image and distance; may seem less worried where the partner goes.',
  Ve: 'Venus on D7 lagna — beauty and affection are central; relating flavor is strong.',
  Sa: 'Saturn on D7 lagna — delay, filters, and a serious bar; affection ripens slowly.',
  Ra: 'Rahu on D7 lagna — sharp desire and illusion; quick attraction then confusion.',
  Ke: 'Ketu on D7 lagna — loves by forgetting the self — hunger for surrender, not “no love”.',
}

const D7_TEXT_EN: Record<keyof typeof D7_TEXT_HI, string> = {
  purposeFallback: 'Saptamsha is the chart of prior merit and desire.',
  houseFallback: 'D7 house {house}',
  planetIn: '{planet} in {rashi} (H{house}, {dignity}).',
  themeEnd: '{theme}.',
  planetRetro: 'Retrograde intensifies the inner replay of that theme.',
  houseEmpty: 'Empty — read the lord of {rashi} for quieter results.',
  occupiedBy: 'Occupied by {names}.',
  lordSits: '{lord} sits in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} placement unavailable.',
  lordWith: 'With {names} — blend those natures into the story.',
  occupiedLabel: 'Lagna occupied by {names}',
  emptyLabel: 'Empty lagna — follow {lord} in house {house}',
  houseLabel: 'House {house}',
  sumOpen: 'D7 opens in {rashi} — prior merit and desire lead with {label}.',
  sumDharma: 'Dharma pillar is {tone}.',
  sumProgeny: 'Progeny tone: {note}.',
  sumClutch: 'Relationship clutch: {who}.',
  pillarDharma: 'Dharma',
  pillarArtha: 'Artha',
  pillarKama: 'Kama',
  pillarMoksha: 'Moksha',
  pillarSun: 'Sun in {rashi} (H{house}, {dignity}) — quantity of dharma in prior merit.',
  pillarLeo: 'Leo holds {names}: dharma trikona active.',
  pillarLeoEmpty: 'Leo empty — read dharma from Sun and Leo’s lord.',
  pillarJu: 'Jupiter in {rashi} (H{house}, {dignity}) — artha / finance tone.',
  pillarSag: 'Sagittarius holds {names}: artha trikona active.',
  pillarSagEmpty: 'Sagittarius empty — read artha from Jupiter and Sagittarius.',
  pillarSagPapa: 'Sagittarius hemmed / afflicted: pressure on property or artha conflict.',
  pillarTau: 'Taurus holds {names}: kama / fertility field.',
  pillarTauEmpty: 'Taurus empty — read kama from Nandi (Taurus) and Venus.',
  pillarLib: 'Libra holds {names}: second kama doorway (Venus domain).',
  pillarSa: 'Saturn in {rashi} (H{house}) — moksha / delay / filter marker.',
  pillarKe: 'Ketu in {rashi} (H{house}) — moksha / renunciation residue.',
  pillarToneSupportive: 'supportive',
  pillarToneChallenging: 'challenging',
  pillarToneMixed: 'mixed',
  pillarToneNeutral: 'neutral',
  progenySun: 'Sun is read for whether progeny arrives.',
  progenySunWeak: 'Sun debilitated or in the 8th: friction / delay around conception — cross-check D1.',
  progenyKetu: 'Ketu is read for continuity / survival of the line.',
  progenyKetuWeak: 'Ketu afflicted: pressure on continuity — read carefully, not fearfully.',
  progenyJu: 'Jupiter is read for joy from children.',
  progenyJuStrong: 'Jupiter strong: supportive signal for joy from children.',
  progenyJuWeak: 'Jupiter weak / afflicted: even with children, contentment may feel incomplete.',
  desireMoon: 'Moon shows what you attach to — body, atmosphere, and devotion flavor.',
  desireVenus: 'Wherever Venus sits, that kind of presence / aesthetic preference strengthens.',
  clutchSelf: 'self (strong lagna)',
  clutchOther: 'other (7th / 7th lord)',
  clutchShared: 'shared',
  clutchL1H7: 'Lagna lord in the 7th: relationship clutch often sits with the other.',
  clutchStrongLagna: 'Strong D7 lagna: clutch usually stays in one’s own hand.',
  clutchSharedNote: 'Both lagna and 7th are active: clutch is shared or shifting.',
  meetJuMe: 'Jeeva karakas Jupiter and Mercury often mark where meetings open.',
  meetH5H9: 'Yoga in 5th / 9th: meetings through learning / dharma / travel fields.',
  meetH8: 'Jeeva karaka in the 8th: meeting through crisis / rescue stories; help-expectation can run.',
  meetH1: 'Jeeva karaka on lagna: meeting arrives on the “throne” — less need to go out.',
  distanceLong: 'Yoga involving 9th / 12th: long-distance relating is possible.',
  distanceLocal: 'Yoga in kendras: near / local relating tone.',
  distanceMixed: 'Distance is mixed — both possibilities stay open.',
  patVenusSag: 'Venus in Sagittarius: trust and boundaries can be tested; risk of betrayal or ideal-break — not a fixed verdict.',
  patSaKe7: 'Saturn–Ketu in the 7th: one-sided love, delay, and a hard filter.',
  patSaKe: 'Saturn–Ketu together: sharp wanting first, then emotional numbness / rejection cycles.',
  patMeSa: 'Mercury–Saturn: Sankhya / question-heavy affection; measuring and accounting love.',
  patMeKe: 'Mercury–Ketu: analysis and detachment; confusion or distance in affection.',
  patJuLagna: 'Jupiter on lagna: punya image; low reactivity to partner’s movement — “politician” distance.',
  patKeLagna: 'Ketu on lagna: loves by erasing the self — surrender hunger, not absence of love.',
  patMaVe: 'Mars–Venus together: physical / chemical attraction can become the main relating flavor.',
  patL1H7: 'Lagna lord in the 7th: control leans to the other.',
  pastLifeFriend: 'Someone whose birth lagna matches your D7 lagna ({rashi}) — or its trine — can feel like a past-life friend.',
  insightPillars: 'Dharma · Artha · Kama · Moksha',
  insightPillarsText: 'Sun/Leo = dharma, Jupiter/Sag = artha, Taurus = kama, Saturn/Ketu = moksha residue.',
  insightProgeny: 'Progeny sutra',
  insightDesire: 'Desire and attachment',
  insightClutch: 'Relationship clutch',
  insightMeet: 'Meeting field',
  h5Note: '5th: children and romance field.',
  h7Note: '7th: partner and relating.',
  h9Note: '9th: dharma and distant meeting.',
  leoSupport: 'Benefic influence in Leo supports dharma.',
  leoChallenge: 'Leo afflicted: dharma-crisis signal.',
  sagSupport: 'Benefic influence in Sagittarius supports artha.',
  tauSupport: 'Taurus active: kama / fertility doorway open.',

  devotionBase: 'Wherever the Moon sits or circuits in D7, devotion-love leans to that deity / form.',
  devotionKeSag: 'Moon–Ketu in Sagittarius: devotion to Lord Krishna.',
  devotionSun: 'Moon with the Sun: devotion toward Lord Rama.',
  devotionKeCancer: 'Moon–Ketu in Cancer: Krishna bhakti and mother-devotion tone.',
  devotionRa: 'Moon–Rahu: devotion to Mother Durga / Parvati.',
  devotionLibra: 'Moon in Libra: devotion to Mother Lakshmi / Venus-deity forms.',
  devotionKeLibra: 'Moon–Ketu in Libra: Devi bhakti is strong.',
  devotionVirgo: 'Virgo field: Brahma / nirguna–service devotion tone.',
  devotionCapJuSa: 'Jupiter–Saturn in Capricorn: devotion to strong Devi or Hanuman-like vigraha.',
  devotionGeneric: 'Moon in {rashi} (H{house}): attachment to that sign’s deity flavor.',

  recogBkTitle: 'Bhratri karaka · medals & recognition',
  recogBkMissing: 'Bhratri karaka (BK) unavailable on this chart.',
  recogBkStrong: 'BK {planet} strong in D7 (lagna / trine / 10th / exalted): medals, fame, and memorable recognition.',
  recogBkPlaced: 'BK {planet} in D7 in {rashi} (H{house}, {dignity}).',
  recogBkEighth: 'BK in the 8th: recognition after heavy effort — slow and deep.',
  recogLagnaPower: 'Powerful D7 lagna circuit: rising high and lasting kirti.',
  recogLagnaShubha: 'Lagna in shubha kartari / between Jupiter–Mercury: recognition with protection.',
  recogMoonLagna: 'Moon linked to D7 lagna or lagna lord: mass recognition and affection-fame.',
  recogSunPower: 'Sun on / empowering D7 lagna: positional power and authority fame.',
  recogKetuDelay: 'Ketu involved: credit often arrives after leaving — work may go unrecognized in the moment.',
  recogAkTitle: 'Atmakaraka · D7',
  recogAkToxic: 'D1 AK ({planet}) in D7 H{house}: toxic / past-life relating tone and a search for purpose in bonds.',
  recogAkBkLagna: 'AK and BK both near D7 lagna: a very famous / hard-to-forget life imprint.',
  recogDkAfflicted: 'Darakaraka afflicted in D7: love does not come easily.',
  recogDkOk: 'Darakaraka tolerable in D7: the love doorway is not closed.',
  sumRecognition: 'Recognition tone: {note}.',

  patAqRa: 'Aquarius / Rahu active: relating outside lineage norms or socially non-accepted patterns.',
  patSc: 'Scorpio active: heartbreak, toxic culture, or deep trauma pressure — read gently.',
  patMePapa: 'Mercury in papa kartari / afflicted: youth-age rejection, breakup, or unwanted experience imprint.',
  patJuAfflict: 'Jupiter afflicted: relationship trouble even after marriage / maturity (jeeva karaka).',
  patMeSaKe: 'Mercury–Saturn–Ketu circuit: the stronger it is, the more hidden / unwanted desire patterns surface.',
  patSagOrient: 'Sagittarius / Jupiter afflicted and tied to lagna: moral-principle drop / non-traditional desire tone.',
  patVirgoTrauma: 'Sun / Mars / Venus in Virgo: boundary-crossing or trauma residue; healing is needed.',
  patVirgoService: 'Virgo active: service / “slave” tone — carrying, dropping off, fixing becomes part of relating.',
  patTauJuMe: 'Jupiter or Mercury in Taurus: attraction grows with age (Prajapati tone).',
  patJuSunReveal: 'Jupiter or Sun active aspect / yoga: hidden bonds or secrets come into the light.',
  patMoonMeLagna: 'Lagna between Moon and Mercury: heart vs logic — dual conflict in relating.',
  patCircuit68: '6–8 relating: quarrel, crack, and breakup pressure.',
  patCircuit12: '12th-linked relating circuit: departure / walking away.',
  insightDevotion: 'Devotion tone',
  insightRecognition: 'Recognition and kirti',

  loveIntro: 'D7 shows who enters life; D3 shows what the mind runs in a dasha. Read both together.',
  loveEntry3: '3rd house active: entry through close relatives / familiar circles.',
  loveEntry5: '5th / D7 (5th’s derivative): people arrive through the romance field.',
  loveHidden8: '8th loaded: pressure for hidden / private bonds — sharper when 8th periods run.',
  loveDepartKe: 'Ketu in 6/8/12: partner may exit the life (“finished / gone”).',
  loveDepart12Soft: '12th in decent shape: leaving can be accepted more quietly.',
  loveDepart8Grief: '8th / marana tone: grief can linger after the exit.',
  loveFidelityStrong: 'Strong Jupiter / Saturn on D7 lagna: fewer cheating options; steadiness tone.',
  loveFidelityRahu: 'Rahu active (lagna / 7th / 8th): extra options / boundary-test risk.',
  lovePlayboy: 'Moon on D7 lagna: red flag for multiple-bond tendency — stronger if coming from the 8th.',
  loveMeRaLagna: 'Mercury–Rahu on lagna: loyalty softer; watch friend-circle / online contacts.',
  loveVeLeo: 'Venus in Leo: Suryavanshi multi-attraction tone.',
  loveExposure: 'Sun antardasha inside Saturn: relationship secrets can surface / defamation risk.',
  loveSaVe: 'Saturn–Venus yoga / period: a doorway into relating can open.',
  loveD3Mind: 'D3 dasha planet runs the mind-theme; in 6/8/12 it brings distress, regret, or hidden pressure.',
  loveD3Libra12: 'D3 Libra / 12th active: regret about an old partner and breakup-mind.',
  loveD3VeRa: 'D3 Venus–Rahu: mind tangled in relating; restlessness even while leaving.',
  loveD3MoKe8: 'D3 8th Moon–Ketu: emotional cut after intimacy / one-night tone.',
  loveD3Missing: 'D3 unavailable — open Drekkana for mind-timing.',
  loveCircuitNote: 'Circuit 1–7 / 5 active: bond can run long; 6–8 crack; 12 departure.',
  progenyMiscarriage: 'Mars–Ketu together: miscarriage / incomplete-development pressure — cross-check medical facts.',
  progenyAdoption: 'Moon–Mercury link: another’s child / adoption signal possible.',
  progenyLagnaLord: 'D7 lagna lord {planet} in H{house}: progeny capacity and prior-merit tone.',
  progenyLagnaLordStrong: 'Lagna / lagna lord strong: good prior merit; brave / auspicious children tone.',
  progenyLagnaLordWeak: 'Lagna lord afflicted / hemmed: effort or blockage on the progeny path.',
  insightLove: 'Love · breakup · boundaries',
  sumLove: 'Love tone: {note}.',
}

interface D7Ctx {
  T: Record<keyof typeof D7_TEXT_HI, string>
  HT: Record<number, string>
  g: (id: GrahaId) => string
  r: (x: Rashi) => string
  dig: (d: Dignity) => string
  names: (list: GrahaData[]) => string
  lang: EngineLang
}

function d7Ctx(lang: EngineLang): D7Ctx {
  const g = (id: GrahaId) => gName(id, lang)
  return {
    T: pick(D7_TEXT_EN, D7_TEXT_HI as Record<keyof typeof D7_TEXT_HI, string>, lang),
    HT: pick(HOUSE_THEMES, D7_HOUSE_THEMES_HI, lang),
    g,
    r: (x: Rashi) => rName(x, lang),
    dig: (d: Dignity) => dignityText(d, lang),
    names: (list: GrahaData[]) => list.map((x) => g(x.id)).join(', '),
    lang,
  }
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function toneFromDignity(d: Dignity, house: number): D7Tone {
  if (STRONG_DIGNITY.includes(d) && ![6, 8, 12].includes(house)) return 'supportive'
  if (WEAK_DIGNITY.includes(d) || [6, 8, 12].includes(house)) return 'challenging'
  if ([1, 4, 5, 7, 9, 10].includes(house)) return 'mixed'
  return 'neutral'
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function occupantsOfSign(grahas: GrahaData[], sign: Rashi): GrahaData[] {
  return grahas.filter((g) => g.rashi === sign)
}

function isMaleficId(id: GrahaId): boolean {
  return MALEFICS.includes(id)
}

function signHemmedByMalefics(grahas: GrahaData[], sign: Rashi): boolean {
  const before = (((sign - 2 + 12) % 12) + 1) as Rashi
  const after = (((sign) % 12) + 1) as Rashi
  const left = occupantsOfSign(grahas, before)
  const right = occupantsOfSign(grahas, after)
  return left.some((g) => isMaleficId(g.id)) && right.some((g) => isMaleficId(g.id))
}

function toneLabel(tone: D7Tone, T: D7Ctx['T']): string {
  if (tone === 'supportive') return T.pillarToneSupportive
  if (tone === 'challenging') return T.pillarToneChallenging
  if (tone === 'mixed') return T.pillarToneMixed
  return T.pillarToneNeutral
}

function blendTone(tones: D7Tone[]): D7Tone {
  if (tones.includes('challenging') && tones.includes('supportive')) return 'mixed'
  if (tones.includes('challenging')) return 'challenging'
  if (tones.includes('supportive')) return 'supportive'
  if (tones.includes('mixed')) return 'mixed'
  return 'neutral'
}

function buildPillars(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaPillar[] {
  const { T } = L
  const sun = planetById(grahas, 'Su')
  const ju = planetById(grahas, 'Ju')
  const sa = planetById(grahas, 'Sa')
  const ke = planetById(grahas, 'Ke')

  const leoOcc = occupantsOfSign(grahas, 5)
  const sagOcc = occupantsOfSign(grahas, 9)
  const tauOcc = occupantsOfSign(grahas, 2)
  const libOcc = occupantsOfSign(grahas, 7)

  // Dharma — Sun + Leo
  const dharmaBits: string[] = []
  const dharmaTones: D7Tone[] = []
  if (sun) {
    const h = houseOf(sun.rashi, asc)
    dharmaBits.push(fill(T.pillarSun, { rashi: L.r(sun.rashi), house: h, dignity: L.dig(sun.dignity) }))
    dharmaTones.push(toneFromDignity(sun.dignity, h))
    if (sun.rashi === 5 || h === 5 || h === 9 || h === 1) dharmaTones.push('supportive')
    if (sun.dignity === 'debilitated' || h === 8 || h === 6) dharmaTones.push('challenging')
  }
  if (leoOcc.length) {
    dharmaBits.push(fill(T.pillarLeo, { names: L.names(leoOcc) }))
    if (leoOcc.some((g) => !isMaleficId(g.id) || g.id === 'Su')) {
      dharmaBits.push(T.leoSupport)
      dharmaTones.push('supportive')
    }
    if (leoOcc.every((g) => isMaleficId(g.id) && g.id !== 'Su')) {
      dharmaBits.push(T.leoChallenge)
      dharmaTones.push('challenging')
    }
  } else {
    dharmaBits.push(T.pillarLeoEmpty)
  }

  // Artha — Jupiter + Sag
  const arthaBits: string[] = []
  const arthaTones: D7Tone[] = []
  if (ju) {
    const h = houseOf(ju.rashi, asc)
    arthaBits.push(fill(T.pillarJu, { rashi: L.r(ju.rashi), house: h, dignity: L.dig(ju.dignity) }))
    arthaTones.push(toneFromDignity(ju.dignity, h))
  }
  if (sagOcc.length) {
    arthaBits.push(fill(T.pillarSag, { names: L.names(sagOcc) }))
    if (sagOcc.some((g) => !isMaleficId(g.id))) {
      arthaBits.push(T.sagSupport)
      arthaTones.push('supportive')
    }
  } else {
    arthaBits.push(T.pillarSagEmpty)
  }
  if (signHemmedByMalefics(grahas, 9) || sagOcc.some((g) => isMaleficId(g.id) && WEAK_DIGNITY.includes(g.dignity))) {
    arthaBits.push(T.pillarSagPapa)
    arthaTones.push('challenging')
  }

  // Kama — Taurus (+ Libra)
  const kamaBits: string[] = []
  const kamaTones: D7Tone[] = []
  if (tauOcc.length) {
    kamaBits.push(fill(T.pillarTau, { names: L.names(tauOcc) }))
    kamaBits.push(T.tauSupport)
    kamaTones.push(tauOcc.some((g) => isMaleficId(g.id)) ? 'mixed' : 'supportive')
  } else {
    kamaBits.push(T.pillarTauEmpty)
  }
  if (libOcc.length) {
    kamaBits.push(fill(T.pillarLib, { names: L.names(libOcc) }))
    kamaTones.push('mixed')
  }

  // Moksha — Saturn / Ketu residual
  const mokshaBits: string[] = []
  const mokshaTones: D7Tone[] = []
  if (sa) {
    const h = houseOf(sa.rashi, asc)
    mokshaBits.push(fill(T.pillarSa, { rashi: L.r(sa.rashi), house: h }))
    mokshaTones.push([1, 4, 5, 9, 12].includes(h) ? 'supportive' : h === 7 || h === 8 ? 'challenging' : 'mixed')
  }
  if (ke) {
    const h = houseOf(ke.rashi, asc)
    mokshaBits.push(fill(T.pillarKe, { rashi: L.r(ke.rashi), house: h }))
    mokshaTones.push([1, 12, 9].includes(h) ? 'supportive' : 'mixed')
  }

  return [
    {
      id: 'dharma',
      label: T.pillarDharma,
      focus: 'Su · Leo',
      occupants: leoOcc.map((g) => L.g(g.id)),
      tone: blendTone(dharmaTones),
      reading: dharmaBits.join(' '),
    },
    {
      id: 'artha',
      label: T.pillarArtha,
      focus: 'Ju · Sag',
      occupants: sagOcc.map((g) => L.g(g.id)),
      tone: blendTone(arthaTones),
      reading: arthaBits.join(' '),
    },
    {
      id: 'kama',
      label: T.pillarKama,
      focus: 'Taurus · Venus',
      occupants: [...tauOcc, ...libOcc].map((g) => L.g(g.id)),
      tone: blendTone(kamaTones.length ? kamaTones : ['neutral']),
      reading: kamaBits.join(' '),
    },
    {
      id: 'moksha',
      label: T.pillarMoksha,
      focus: 'Sa · Ke',
      occupants: [sa, ke].filter(Boolean).map((g) => L.g((g as GrahaData).id)),
      tone: blendTone(mokshaTones.length ? mokshaTones : ['neutral']),
      reading: mokshaBits.join(' ') || T.purposeFallback,
    },
  ]
}

function buildProgeny(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaProgeny {
  const { T } = L
  const sun = planetById(grahas, 'Su')
  const ke = planetById(grahas, 'Ke')
  const ju = planetById(grahas, 'Ju')
  const ma = planetById(grahas, 'Ma')
  const mo = planetById(grahas, 'Mo')
  const me = planetById(grahas, 'Me')

  const sunHouse = sun ? houseOf(sun.rashi, asc) : null
  const ketuHouse = ke ? houseOf(ke.rashi, asc) : null
  const jupiterHouse = ju ? houseOf(ju.rashi, asc) : null

  const sunWeak = Boolean(
    sun && (sun.dignity === 'debilitated' || sunHouse === 8 || sunHouse === 6 || sunHouse === 12),
  )
  const ketuWeak = Boolean(
    ke && (
      WEAK_DIGNITY.includes(ke.dignity)
      || (ketuHouse != null && [6, 8, 12].includes(ketuHouse) && !STRONG_DIGNITY.includes(ke.dignity))
      || grahas.some((g) => g.rashi === ke.rashi && isMaleficId(g.id) && g.id !== 'Ke')
    ),
  )
  const juStrong = Boolean(
    ju && (STRONG_DIGNITY.includes(ju.dignity) || (jupiterHouse != null && [1, 4, 5, 7, 9, 10, 11].includes(jupiterHouse))),
  )
  const juWeak = Boolean(
    ju && (WEAK_DIGNITY.includes(ju.dignity) || jupiterHouse === 6 || jupiterHouse === 8 || jupiterHouse === 12),
  )

  const conceptionNote = sunWeak ? T.progenySunWeak : T.progenySun
  const continuityNote = ketuWeak ? T.progenyKetuWeak : T.progenyKetu
  const joyNote = juStrong ? T.progenyJuStrong : juWeak ? T.progenyJuWeak : T.progenyJu

  const miscarriageNote =
    ma && ke && ma.rashi === ke.rashi ? T.progenyMiscarriage : null
  const adoptionNote =
    mo && me && mo.rashi === me.rashi ? T.progenyAdoption : null

  const lagnaLordId = SIGN_LORDS[asc]
  const l1 = planetById(grahas, lagnaLordId)
  const l1House = l1 ? houseOf(l1.rashi, asc) : null
  let lagnaLordNote: string | null = null
  if (l1 && l1House != null) {
    const bits = [
      fill(T.progenyLagnaLord, { planet: L.g(l1.id), house: l1House }),
    ]
    const hemmed = signHemmedByMalefics(grahas, l1.rashi)
    if ((STRONG_DIGNITY.includes(l1.dignity) || [1, 5, 9, 10].includes(l1House)) && !hemmed) {
      bits.push(T.progenyLagnaLordStrong)
    } else if (planetAfflicted(l1, l1House) || hemmed) {
      bits.push(T.progenyLagnaLordWeak)
    }
    lagnaLordNote = bits.join(' ')
  }

  const tones: D7Tone[] = []
  if (sunWeak || ketuWeak || juWeak || miscarriageNote) tones.push('challenging')
  if (juStrong && !sunWeak) tones.push('supportive')
  if (!tones.length) tones.push('mixed')

  return {
    sunHouse,
    sunDignity: sun?.dignity ?? null,
    ketuHouse,
    jupiterHouse,
    jupiterDignity: ju?.dignity ?? null,
    conceptionNote,
    continuityNote,
    joyNote,
    miscarriageNote,
    adoptionNote,
    lagnaLordNote,
    reading: [conceptionNote, continuityNote, joyNote, miscarriageNote, adoptionNote, lagnaLordNote]
      .filter(Boolean)
      .join(' '),
    tone: blendTone(tones),
  }
}

function buildLoveLife(
  chart: ChartOutput,
  grahas: GrahaData[],
  asc: Rashi,
  L: D7Ctx,
): SaptamshaLoveLife {
  const { T } = L
  const patterns: SaptamshaPattern[] = []
  const h3 = grahas.filter((g) => houseOf(g.rashi, asc) === 3)
  const h5 = grahas.filter((g) => houseOf(g.rashi, asc) === 5)
  const h8 = grahas.filter((g) => houseOf(g.rashi, asc) === 8)
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const ke = planetById(grahas, 'Ke')
  const keH = ke ? houseOf(ke.rashi, asc) : null
  const ra = planetById(grahas, 'Ra')
  const raH = ra ? houseOf(ra.rashi, asc) : null
  const mo = planetById(grahas, 'Mo')
  const ve = planetById(grahas, 'Ve')
  const sa = planetById(grahas, 'Sa')
  const me = planetById(grahas, 'Me')
  const su = planetById(grahas, 'Su')

  const entryBits = [T.loveIntro, T.loveEntry5]
  if (h3.length) {
    entryBits.push(T.loveEntry3)
    patterns.push({ id: 'entry-3', title: L.HT[3] ?? 'H3', text: T.loveEntry3, tone: 'mixed' })
  }
  if (h5.length) {
    patterns.push({ id: 'entry-5', title: L.HT[5] ?? 'H5', text: T.loveEntry5, tone: 'supportive' })
  }

  const hiddenReading = h8.length
    ? T.loveHidden8
    : null
  if (hiddenReading) {
    patterns.push({ id: 'hidden-8', title: L.HT[8] ?? 'H8', text: T.loveHidden8, tone: 'challenging' })
  }

  let departureReading: string | null = null
  if (ke && keH != null && [6, 8, 12].includes(keH)) {
    const bits = [T.loveDepartKe]
    if (keH === 12 && !WEAK_DIGNITY.includes(ke.dignity)) bits.push(T.loveDepart12Soft)
    if (keH === 8) bits.push(T.loveDepart8Grief)
    departureReading = bits.join(' ')
    patterns.push({ id: 'depart-ke', title: L.g('Ke'), text: departureReading, tone: 'challenging' })
  }

  const strongLagnaStability = lagnaOcc.some((g) => g.id === 'Ju' || g.id === 'Sa')
  const rahuBoundary = Boolean(
    ra && raH != null && [1, 7, 8].includes(raH),
  )
  const fidelityReading = rahuBoundary
    ? T.loveFidelityRahu
    : strongLagnaStability
      ? T.loveFidelityStrong
      : T.loveCircuitNote
  if (rahuBoundary) {
    patterns.push({ id: 'fidelity-ra', title: L.g('Ra'), text: T.loveFidelityRahu, tone: 'challenging' })
  } else if (strongLagnaStability) {
    patterns.push({ id: 'fidelity-strong', title: `${L.g('Ju')} · ${L.g('Sa')}`, text: T.loveFidelityStrong, tone: 'supportive' })
  }

  const playboyFlag = Boolean(mo && houseOf(mo.rashi, asc) === 1)
  if (playboyFlag) {
    patterns.push({ id: 'playboy-moon', title: L.g('Mo'), text: T.lovePlayboy, tone: 'challenging' })
  }
  if (me && ra && me.rashi === ra.rashi && houseOf(me.rashi, asc) === 1) {
    patterns.push({ id: 'me-ra-lagna', title: `${L.g('Me')} · ${L.g('Ra')}`, text: T.loveMeRaLagna, tone: 'challenging' })
  }
  if (ve?.rashi === 5) {
    patterns.push({ id: 've-leo', title: L.g('Ve'), text: T.loveVeLeo, tone: 'mixed' })
  }
  if (sa && su && (sa.rashi === su.rashi || Math.abs(houseOf(sa.rashi, asc) - houseOf(su.rashi, asc)) === 6)) {
    patterns.push({ id: 'exposure-sa-su', title: `${L.g('Sa')} · ${L.g('Su')}`, text: T.loveExposure, tone: 'challenging' })
  }
  if (sa && ve && (sa.rashi === ve.rashi || [sa, ve].some((g) => houseOf(g.rashi, asc) === 7))) {
    patterns.push({ id: 'sa-ve-entry', title: `${L.g('Sa')} · ${L.g('Ve')}`, text: T.loveSaVe, tone: 'mixed' })
  }

  // D3 cross-read
  const d3Notes: SaptamshaPattern[] = []
  const d3Asc = chart.vargaLagnas?.D3 as Rashi | undefined
  const d3Grahas = chart.vargas?.D3
  if (!d3Asc || !d3Grahas?.length) {
    d3Notes.push({ id: 'd3-missing', title: 'D3', text: T.loveD3Missing, tone: 'neutral' })
  } else {
    d3Notes.push({ id: 'd3-mind', title: 'D3', text: T.loveD3Mind, tone: 'mixed' })
    const has12 = d3Grahas.some((g) => houseOf(g.rashi, d3Asc) === 12)
    const hasLibra = d3Grahas.some((g) => g.rashi === 7)
    if (has12 || hasLibra) {
      d3Notes.push({ id: 'd3-libra12', title: L.r(7), text: T.loveD3Libra12, tone: 'challenging' })
    }
    const d3Ve = planetById(d3Grahas, 'Ve')
    const d3Ra = planetById(d3Grahas, 'Ra')
    if (d3Ve && d3Ra && d3Ve.rashi === d3Ra.rashi) {
      d3Notes.push({ id: 'd3-ve-ra', title: `${L.g('Ve')} · ${L.g('Ra')}`, text: T.loveD3VeRa, tone: 'challenging' })
    }
    const d3Mo = planetById(d3Grahas, 'Mo')
    const d3Ke = planetById(d3Grahas, 'Ke')
    if (d3Mo && d3Ke && d3Mo.rashi === d3Ke.rashi && houseOf(d3Mo.rashi, d3Asc) === 8) {
      d3Notes.push({ id: 'd3-mo-ke-8', title: `${L.g('Mo')} · ${L.g('Ke')}`, text: T.loveD3MoKe8, tone: 'challenging' })
    }
  }

  const exposureReading = patterns.find((p) => p.id === 'exposure-sa-su')?.text ?? null
  const tone = blendTone([
    ...(hiddenReading || departureReading || playboyFlag || rahuBoundary ? ['challenging' as D7Tone] : []),
    ...(strongLagnaStability ? ['supportive' as D7Tone] : []),
    'mixed',
  ])

  const reading = [
    entryBits.join(' '),
    hiddenReading,
    departureReading,
    fidelityReading,
    playboyFlag ? T.lovePlayboy : null,
    ...d3Notes.slice(0, 2).map((n) => n.text),
  ].filter(Boolean).join(' ')

  return {
    entryReading: entryBits.join(' '),
    hiddenReading,
    departureReading,
    fidelityReading,
    playboyFlag,
    exposureReading,
    d3Notes,
    patterns,
    reading,
    tone,
  }
}

function buildDesire(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaDesire {
  const { T } = L
  const moon = planetById(grahas, 'Mo')
  const venus = planetById(grahas, 'Ve')
  const moonPack = L.lang === 'hi' ? D7_MOON_SIGN_HI : MOON_SIGN
  const venusPack = L.lang === 'hi' ? D7_VENUS_SIGN_HI : VENUS_SIGN

  const moonBlock = moon
    ? {
        rashi: moon.rashi,
        rashiName: L.r(moon.rashi),
        house: houseOf(moon.rashi, asc),
        reading: moonPack[moon.rashi] ?? T.desireMoon,
      }
    : null

  const venusBlock = venus
    ? {
        rashi: venus.rashi,
        rashiName: L.r(venus.rashi),
        house: houseOf(venus.rashi, asc),
        reading: venusPack[venus.rashi] ?? T.desireVenus,
      }
    : null

  return {
    moon: moonBlock,
    venus: venusBlock,
    reading: [T.desireMoon, moonBlock?.reading, T.desireVenus, venusBlock?.reading]
      .filter(Boolean)
      .join(' '),
  }
}

function rolePlanetId(chart: ChartOutput, role: string): GrahaId | null {
  const hit = chart.grahas.find((g) => g.charaKaraka === role)
  return hit?.id ?? null
}

function planetAfflicted(g: GrahaData | undefined, house: number | null): boolean {
  if (!g || house == null) return false
  return WEAK_DIGNITY.includes(g.dignity) || [6, 8, 12].includes(house)
}

function buildDevotion(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaDevotion {
  const { T } = L
  const moon = planetById(grahas, 'Mo')
  if (!moon) {
    return {
      moonRashi: null,
      moonRashiName: null,
      moonHouse: null,
      deityHints: [],
      reading: T.devotionBase,
      tone: 'neutral',
    }
  }
  const house = houseOf(moon.rashi, asc)
  const withMoon = grahas.filter((g) => g.id !== 'Mo' && g.rashi === moon.rashi).map((g) => g.id)
  const hints: string[] = [T.devotionBase]
  if (withMoon.includes('Ke') && moon.rashi === 9) hints.push(T.devotionKeSag)
  if (withMoon.includes('Su')) hints.push(T.devotionSun)
  if (withMoon.includes('Ke') && moon.rashi === 4) hints.push(T.devotionKeCancer)
  if (withMoon.includes('Ra')) hints.push(T.devotionRa)
  if (moon.rashi === 7 && withMoon.includes('Ke')) hints.push(T.devotionKeLibra)
  else if (moon.rashi === 7) hints.push(T.devotionLibra)
  if (moon.rashi === 6) hints.push(T.devotionVirgo)
  const ju = planetById(grahas, 'Ju')
  const sa = planetById(grahas, 'Sa')
  if (ju && sa && ju.rashi === 10 && sa.rashi === 10) hints.push(T.devotionCapJuSa)
  if (hints.length === 1) {
    hints.push(fill(T.devotionGeneric, { rashi: L.r(moon.rashi), house }))
  }
  return {
    moonRashi: moon.rashi,
    moonRashiName: L.r(moon.rashi),
    moonHouse: house,
    deityHints: hints.slice(1),
    reading: hints.join(' '),
    tone: 'supportive',
  }
}

function buildRecognition(
  chart: ChartOutput,
  grahas: GrahaData[],
  asc: Rashi,
  L: D7Ctx,
): SaptamshaRecognition {
  const { T } = L
  const bkId = rolePlanetId(chart, 'BK')
  const akId = rolePlanetId(chart, 'AK')
  const dkId = rolePlanetId(chart, 'DK')

  const bk = bkId ? planetById(grahas, bkId) : undefined
  const ak = akId ? planetById(grahas, akId) : undefined
  const dk = dkId ? planetById(grahas, dkId) : undefined

  const bkHouse = bk ? houseOf(bk.rashi, asc) : null
  const akHouse = ak ? houseOf(ak.rashi, asc) : null
  const dkHouse = dk ? houseOf(dk.rashi, asc) : null

  const bkStrong = Boolean(
    bk
    && bkHouse != null
    && (
      STRONG_DIGNITY.includes(bk.dignity)
      || [1, 5, 9, 10, 11].includes(bkHouse)
    ),
  )

  let bhratriReading = T.recogBkMissing
  if (bk && bkHouse != null) {
    const bits = [
      fill(T.recogBkPlaced, {
        planet: L.g(bk.id),
        rashi: L.r(bk.rashi),
        house: bkHouse,
        dignity: L.dig(bk.dignity),
      }),
    ]
    if (bkStrong) {
      bits.push(fill(T.recogBkStrong, { planet: L.g(bk.id) }))
    }
    if (bkHouse === 8) bits.push(T.recogBkEighth)
    bhratriReading = bits.join(' ')
  }

  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lord = planetById(grahas, SIGN_LORDS[asc])
  const lordStrong = Boolean(lord && STRONG_DIGNITY.includes(lord.dignity))
  const before = occupantsOfSign(grahas, (((asc - 2 + 12) % 12) + 1) as Rashi)
  const after = occupantsOfSign(grahas, (((asc) % 12) + 1) as Rashi)
  const benefics = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
  const shubhaKartari =
    before.some((g) => benefics.has(g.id)) && after.some((g) => benefics.has(g.id))
  const betweenJuMe =
    (before.some((g) => g.id === 'Ju') && after.some((g) => g.id === 'Me'))
    || (before.some((g) => g.id === 'Me') && after.some((g) => g.id === 'Ju'))

  const lagnaPowerful = lagnaOcc.length > 0 || lordStrong || shubhaKartari || betweenJuMe
  const lagnaBits = [T.recogLagnaPower]
  if (shubhaKartari || betweenJuMe) lagnaBits.push(T.recogLagnaShubha)
  const lagnaPowerReading = lagnaPowerful ? lagnaBits.join(' ') : ''

  const moon = planetById(grahas, 'Mo')
  const moonHouse = moon ? houseOf(moon.rashi, asc) : null
  const moonWithLord = Boolean(moon && lord && moon.rashi === lord.rashi)
  const moonSeesLagna = moonHouse === 1 || moonHouse === 7 || moonWithLord
  const moonFameReading = moonSeesLagna ? T.recogMoonLagna : null

  const sun = planetById(grahas, 'Su')
  const sunHouse = sun ? houseOf(sun.rashi, asc) : null
  const sunPowerReading =
    sun && (sunHouse === 1 || (sun && STRONG_DIGNITY.includes(sun.dignity) && sunHouse != null && [1, 10, 9, 5].includes(sunHouse)))
      ? T.recogSunPower
      : null

  const ketu = planetById(grahas, 'Ke')
  const ketuOnFameAxis = Boolean(
    ketu
    && (
      houseOf(ketu.rashi, asc) === 1
      || (bk && ketu.rashi === bk.rashi)
      || (moon && ketu.rashi === moon.rashi && moonSeesLagna)
      || lagnaOcc.some((g) => g.id === 'Ke')
    ),
  )
  const ketuDelayReading = ketuOnFameAxis ? T.recogKetuDelay : null

  let atmaReading: string | null = null
  if (ak && akHouse != null) {
    atmaReading = fill(T.recogAkToxic, { planet: L.g(ak.id), house: akHouse })
  }
  if (ak && bk && akHouse === 1 && bkHouse === 1) {
    atmaReading = `${atmaReading ?? ''} ${T.recogAkBkLagna}`.trim()
  }

  let daraReading: string | null = null
  if (dk) {
    daraReading = planetAfflicted(dk, dkHouse) || signHemmedByMalefics(grahas, dk.rashi)
      ? T.recogDkAfflicted
      : T.recogDkOk
  }

  const strong = bkStrong || lagnaPowerful || Boolean(moonFameReading) || Boolean(sunPowerReading)
  const reading = [
    bhratriReading,
    lagnaPowerReading,
    moonFameReading,
    sunPowerReading,
    ketuDelayReading,
    atmaReading,
    daraReading,
  ].filter(Boolean).join(' ')

  return {
    bhratriId: bkId,
    bhratriName: bkId ? L.g(bkId) : null,
    bhratriHouse: bkHouse,
    bhratriDignity: bk?.dignity ?? null,
    bhratriReading,
    atmaId: akId,
    atmaName: akId ? L.g(akId) : null,
    atmaHouse: akHouse,
    atmaReading,
    daraId: dkId,
    daraReading,
    lagnaPowerReading,
    moonFameReading,
    sunPowerReading,
    ketuDelayReading,
    strong,
    reading,
    tone: strong ? 'supportive' : daraReading === T.recogDkAfflicted ? 'challenging' : 'mixed',
  }
}

function buildPatterns(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaPattern[] {
  const { T } = L
  const out: SaptamshaPattern[] = []
  const byId = (id: GrahaId) => planetById(grahas, id)
  const sameSign = (a: GrahaId, b: GrahaId) => {
    const x = byId(a)
    const y = byId(b)
    return Boolean(x && y && x.rashi === y.rashi)
  }
  const houseOfId = (id: GrahaId) => {
    const g = byId(id)
    return g ? houseOf(g.rashi, asc) : null
  }

  const ve = byId('Ve')
  if (ve?.rashi === 9) {
    out.push({ id: 'venus-sag', title: L.g('Ve'), text: T.patVenusSag, tone: 'challenging' })
  }

  const saH = houseOfId('Sa')
  const keH = houseOfId('Ke')
  if (sameSign('Sa', 'Ke')) {
    out.push({
      id: 'sa-ke',
      title: `${L.g('Sa')} · ${L.g('Ke')}`,
      text: saH === 7 || keH === 7 ? T.patSaKe7 : T.patSaKe,
      tone: 'challenging',
    })
  }

  if (sameSign('Me', 'Sa')) {
    out.push({ id: 'me-sa', title: `${L.g('Me')} · ${L.g('Sa')}`, text: T.patMeSa, tone: 'mixed' })
  }
  if (sameSign('Me', 'Ke')) {
    out.push({ id: 'me-ke', title: `${L.g('Me')} · ${L.g('Ke')}`, text: T.patMeKe, tone: 'mixed' })
  }
  if (houseOfId('Ju') === 1) {
    out.push({ id: 'ju-lagna', title: L.g('Ju'), text: T.patJuLagna, tone: 'mixed' })
  }
  if (houseOfId('Ke') === 1) {
    out.push({ id: 'ke-lagna', title: L.g('Ke'), text: T.patKeLagna, tone: 'mixed' })
  }
  if (sameSign('Ma', 'Ve')) {
    out.push({ id: 'ma-ve', title: `${L.g('Ma')} · ${L.g('Ve')}`, text: T.patMaVe, tone: 'mixed' })
  }

  const lagnaLordId = SIGN_LORDS[asc]
  const l1 = byId(lagnaLordId)
  if (l1 && houseOf(l1.rashi, asc) === 7) {
    out.push({ id: 'l1-h7', title: L.g(lagnaLordId), text: T.patL1H7, tone: 'mixed' })
  }

  // Episode 2 patterns
  const aqOcc = occupantsOfSign(grahas, 11)
  const ra = byId('Ra')
  if (aqOcc.length || (ra && (ra.rashi === 11 || houseOfId('Ra') === 1 || houseOfId('Ra') === 7))) {
    out.push({ id: 'aq-ra', title: `${L.r(11)} · ${L.g('Ra')}`, text: T.patAqRa, tone: 'mixed' })
  }

  const scOcc = occupantsOfSign(grahas, 8)
  if (asc === 8 || scOcc.some((g) => isMaleficId(g.id)) || houseOfId('Ma') === 8 || houseOfId('Ke') === 8) {
    out.push({ id: 'scorpio', title: L.r(8), text: T.patSc, tone: 'challenging' })
  }

  const me = byId('Me')
  const meH = houseOfId('Me')
  if (me && (signHemmedByMalefics(grahas, me.rashi) || planetAfflicted(me, meH))) {
    out.push({ id: 'me-papa', title: L.g('Me'), text: T.patMePapa, tone: 'challenging' })
  }

  const ju = byId('Ju')
  const juH = houseOfId('Ju')
  if (ju && planetAfflicted(ju, juH)) {
    out.push({ id: 'ju-afflict', title: L.g('Ju'), text: T.patJuAfflict, tone: 'challenging' })
  }

  const meSaKe =
    (sameSign('Me', 'Sa') && (sameSign('Me', 'Ke') || sameSign('Sa', 'Ke')))
    || (sameSign('Me', 'Sa') && keH != null && [1, 5, 7, 8].includes(keH))
    || (sameSign('Me', 'Ke') && saH != null && [1, 5, 7, 8].includes(saH))
  if (meSaKe || (sameSign('Me', 'Sa') && sameSign('Me', 'Ke'))) {
    out.push({ id: 'me-sa-ke', title: `${L.g('Me')} · ${L.g('Sa')} · ${L.g('Ke')}`, text: T.patMeSaKe, tone: 'challenging' })
  }

  const sagAfflicted =
    signHemmedByMalefics(grahas, 9)
    || occupantsOfSign(grahas, 9).some((g) => isMaleficId(g.id) && WEAK_DIGNITY.includes(g.dignity))
    || (ju && planetAfflicted(ju, juH))
  const sagLagnaLink =
    asc === 9
    || lagnaLordId === 'Ju'
    || (l1 && l1.rashi === 9)
    || Boolean(ju && houseOf(ju.rashi, asc) === 1)
  if (sagAfflicted && sagLagnaLink) {
    out.push({ id: 'sag-orient', title: L.r(9), text: T.patSagOrient, tone: 'challenging' })
  }

  const viOcc = occupantsOfSign(grahas, 6)
  if (viOcc.some((g) => g.id === 'Su' || g.id === 'Ma' || g.id === 'Ve')) {
    out.push({ id: 'virgo-trauma', title: L.r(6), text: T.patVirgoTrauma, tone: 'challenging' })
  }
  if (asc === 6 || viOcc.length > 0) {
    out.push({ id: 'virgo-service', title: L.r(6), text: T.patVirgoService, tone: 'mixed' })
  }

  const tauOcc = occupantsOfSign(grahas, 2)
  if (tauOcc.some((g) => g.id === 'Ju' || g.id === 'Me')) {
    out.push({ id: 'tau-ju-me', title: L.r(2), text: T.patTauJuMe, tone: 'supportive' })
  }

  // Jupiter/Sun "reveal" when strong or on axis with 7th/12th
  if (
    (ju && (juH === 7 || juH === 12 || juH === 1 || STRONG_DIGNITY.includes(ju.dignity)))
    || (byId('Su') && [1, 7, 10, 12].includes(houseOfId('Su') ?? -1))
  ) {
    out.push({ id: 'ju-sun-reveal', title: `${L.g('Ju')} · ${L.g('Su')}`, text: T.patJuSunReveal, tone: 'mixed' })
  }

  const moon = byId('Mo')
  if (moon && me) {
    const beforeSign = (((asc - 2 + 12) % 12) + 1) as Rashi
    const afterSign = (((asc) % 12) + 1) as Rashi
    const hemmedByMoonMe =
      (occupantsOfSign(grahas, beforeSign).some((g) => g.id === 'Mo')
        && occupantsOfSign(grahas, afterSign).some((g) => g.id === 'Me'))
      || (occupantsOfSign(grahas, beforeSign).some((g) => g.id === 'Me')
        && occupantsOfSign(grahas, afterSign).some((g) => g.id === 'Mo'))
    if (hemmedByMoonMe) {
      out.push({ id: 'moon-me-lagna', title: `${L.g('Mo')} · ${L.g('Me')}`, text: T.patMoonMeLagna, tone: 'challenging' })
    }
  }

  return out
}

function buildRelating(grahas: GrahaData[], asc: Rashi, L: D7Ctx): SaptamshaRelating {
  const { T } = L
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const h7Occ = grahas.filter((g) => houseOf(g.rashi, asc) === 7)
  const lagnaLordId = SIGN_LORDS[asc]
  const lord = planetById(grahas, lagnaLordId)
  const lordHouse = lord ? houseOf(lord.rashi, asc) : 1
  const conjunct = lord
    ? grahas.filter((g) => g.id !== lord.id && g.rashi === lord.rashi)
    : []

  const lagnaPlanetPack = L.lang === 'hi' ? D7_LAGNA_PLANET_HI : LAGNA_PLANET_READINGS
  const occupants = lagnaOcc.map((g) => ({
    id: g.id,
    name: L.g(g.id),
    isRetro: Boolean(g.isRetro),
    reading: lagnaPlanetPack[g.id] ?? fill(T.planetIn, {
      planet: L.g(g.id),
      rashi: L.r(g.rashi),
      house: 1,
      dignity: L.dig(g.dignity),
    }),
  }))

  const lordReading = lord
    ? [
        fill(T.lordSits, {
          lord: L.g(lord.id),
          rashi: L.r(lord.rashi),
          house: lordHouse,
          dignity: L.dig(lord.dignity),
        }),
        conjunct.length
          ? fill(T.lordWith, { names: L.names(conjunct) })
          : '',
      ].filter(Boolean).join(' ')
    : fill(T.lordMissing, { lord: L.g(lagnaLordId) })

  const l1In7 = Boolean(lord && lordHouse === 7)
  const strongLagna = lagnaOcc.length > 0
    && (
      lagnaOcc.some((g) => STRONG_DIGNITY.includes(g.dignity) || ['Ju', 'Ve', 'Mo', 'Su'].includes(g.id))
      || lagnaOcc.length >= 2
    )

  let clutch: D7Clutch = 'shared'
  let clutchReading = T.clutchSharedNote
  if (l1In7 && !strongLagna) {
    clutch = 'other'
    clutchReading = T.clutchL1H7
  } else if (strongLagna && !l1In7) {
    clutch = 'self'
    clutchReading = T.clutchStrongLagna
  } else if (l1In7 && strongLagna) {
    clutch = 'shared'
    clutchReading = `${T.clutchL1H7} ${T.clutchStrongLagna}`
  } else if (h7Occ.length && !lagnaOcc.length) {
    clutch = 'other'
    clutchReading = T.clutchL1H7
  }

  const clutchLabel =
    clutch === 'self' ? T.clutchSelf : clutch === 'other' ? T.clutchOther : T.clutchShared

  const ju = planetById(grahas, 'Ju')
  const me = planetById(grahas, 'Me')
  const juH = ju ? houseOf(ju.rashi, asc) : null
  const meH = me ? houseOf(me.rashi, asc) : null
  const meetBits = [T.meetJuMe]
  if ([juH, meH].includes(1)) meetBits.push(T.meetH1)
  if ([juH, meH].some((h) => h === 5 || h === 9)) meetBits.push(T.meetH5H9)
  if ([juH, meH].includes(8)) meetBits.push(T.meetH8)

  const longish = [juH, meH, houseOfIdSafe(grahas, asc, 'Ve'), houseOfIdSafe(grahas, asc, 'Mo')]
    .some((h) => h === 9 || h === 12)
  const kendraMeet = [juH, meH].some((h) => h != null && [1, 4, 7, 10].includes(h))
  const distance: SaptamshaRelating['distance'] =
    longish && !kendraMeet ? 'long' : longish && kendraMeet ? 'mixed' : 'local'
  const distanceReading =
    distance === 'long' ? T.distanceLong : distance === 'mixed' ? T.distanceMixed : T.distanceLocal

  return {
    lagnaEmpty: lagnaOcc.length === 0,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: L.g(lagnaLordId),
      house: lordHouse,
      rashi: lord?.rashi ?? asc,
      rashiName: L.r(lord?.rashi ?? asc),
      dignity: lord?.dignity ?? 'neutral',
      isRetro: Boolean(lord?.isRetro),
      conjunctNames: conjunct.map((g) => L.g(g.id)),
      reading: lordReading,
    },
    signFlavor: (L.lang === 'hi' ? D7_LAGNA_SIGN_FLAVOR_HI : LAGNA_SIGN_FLAVOR)[asc],
    clutch,
    clutchLabel,
    clutchReading,
    meetingReading: meetBits.join(' '),
    distance,
    distanceReading,
    patterns: buildPatterns(grahas, asc, L),
    pastLifeFriendHint: fill(T.pastLifeFriend, { rashi: L.r(asc) }),
  }
}

function houseOfIdSafe(grahas: GrahaData[], asc: Rashi, id: GrahaId): number | null {
  const g = planetById(grahas, id)
  return g ? houseOf(g.rashi, asc) : null
}

function buildPlanetRow(g: GrahaData, asc: Rashi, L: D7Ctx): SaptamshaPlanetRow {
  const { T } = L
  const house = houseOf(g.rashi, asc)
  const theme = L.HT[house] ?? fill(T.houseFallback, { house })
  const tone = toneFromDignity(g.dignity, house)
  const bits: string[] = [
    fill(T.planetIn, { planet: L.g(g.id), rashi: L.r(g.rashi), house, dignity: L.dig(g.dignity) }),
    fill(T.themeEnd, { theme }),
  ]
  if (g.isRetro) bits.push(T.planetRetro)
  return {
    id: g.id,
    name: L.g(g.id),
    rashi: g.rashi,
    rashiName: L.r(g.rashi),
    house,
    dignity: g.dignity,
    isRetro: Boolean(g.isRetro),
    theme,
    interpretation: bits.join(' '),
    tone,
  }
}

function buildHouseReading(
  house: number,
  occ: GrahaData[],
  rashi: Rashi,
  L: D7Ctx,
): { reading: string; tone: D7Tone } {
  const { T } = L
  const theme = L.HT[house] ?? fill(T.houseLabel, { house })
  const bits = [theme]
  if (!occ.length) {
    bits.push(fill(T.houseEmpty, { rashi: L.r(rashi) }))
    return { reading: bits.join(' '), tone: 'neutral' }
  }
  bits.push(fill(T.occupiedBy, { names: L.names(occ) }))
  if (house === 5) bits.push(T.h5Note)
  if (house === 7) bits.push(T.h7Note)
  if (house === 9) bits.push(T.h9Note)
  const tones = occ.map((g) => toneFromDignity(g.dignity, house))
  return { reading: bits.join(' '), tone: blendTone(tones) }
}

/**
 * Analyze Saptamsha (D7) for prior-merit pillars, desire, progeny,
 * devotion, recognition, and relating.
 * Returns null when D7 varga data is missing.
 */
export function analyzeSaptamsha(
  chart: ChartOutput,
  lang: EngineLang = 'en',
): SaptamshaAnalysis | null {
  const asc = chart.vargaLagnas?.D7 as Rashi | undefined
  const grahas = chart.vargas?.D7
  if (!asc || !grahas?.length) return null

  const L = d7Ctx(lang)
  const { T } = L

  const pillars = buildPillars(grahas, asc, L)
  const progeny = buildProgeny(grahas, asc, L)
  const desire = buildDesire(grahas, asc, L)
  const devotion = buildDevotion(grahas, asc, L)
  const recognition = buildRecognition(chart, grahas, asc, L)
  const loveLife = buildLoveLife(chart, grahas, asc, L)
  const relating = buildRelating(grahas, asc, L)

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc, L))

  const houses: SaptamshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const { reading, tone } = buildHouseReading(h, occ, rashi, L)
    const lordId = SIGN_LORDS[rashi]
    houses.push({
      house: h,
      rashi,
      rashiName: L.r(rashi),
      lordId,
      lordName: L.g(lordId),
      occupants: occ.map((g) => ({ id: g.id, name: L.g(g.id), isRetro: Boolean(g.isRetro) })),
      theme: L.HT[h] ?? fill(T.houseLabel, { house: h }),
      reading,
      tone,
    })
  }

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))

  const primaryLabel = relating.occupants.length
    ? fill(T.occupiedLabel, { names: relating.occupants.map((o) => o.name).join(', ') })
    : fill(T.emptyLabel, { lord: relating.lagnaLord.name, house: relating.lagnaLord.house })

  const summaryBits = [
    fill(T.sumOpen, { rashi: L.r(asc), label: primaryLabel }),
    fill(T.sumDharma, { tone: toneLabel(pillars[0].tone, T) }),
    fill(T.sumProgeny, {
      note: progeny.tone === 'challenging' ? progeny.conceptionNote : progeny.joyNote,
    }),
    fill(T.sumClutch, { who: relating.clutchLabel }),
    fill(T.sumRecognition, {
      note: recognition.strong
        ? (recognition.moonFameReading ?? recognition.bhratriReading)
        : (recognition.daraReading ?? recognition.bhratriReading),
    }),
    fill(T.sumLove, {
      note: loveLife.playboyFlag
        ? T.lovePlayboy
        : (loveLife.departureReading ?? loveLife.hiddenReading ?? loveLife.fidelityReading),
    }),
  ]

  const insights: SaptamshaInsight[] = [
    {
      kind: 'highlight',
      title: T.insightPillars,
      text: T.insightPillarsText,
    },
    {
      kind: 'info',
      title: primaryLabel,
      text: relating.signFlavor,
    },
    {
      kind: progeny.tone === 'challenging' ? 'caution' : 'info',
      title: T.insightProgeny,
      text: progeny.reading,
    },
    {
      kind: 'info',
      title: T.insightDesire,
      text: desire.reading,
    },
    {
      kind: 'info',
      title: T.insightDevotion,
      text: devotion.reading,
    },
    {
      kind: recognition.tone === 'challenging' ? 'caution' : recognition.strong ? 'strength' : 'info',
      title: T.insightRecognition,
      text: recognition.reading,
    },
    {
      kind: loveLife.tone === 'challenging' ? 'caution' : loveLife.tone === 'supportive' ? 'strength' : 'highlight',
      title: T.insightLove,
      text: loveLife.reading,
    },
    {
      kind: relating.clutch === 'other' ? 'caution' : 'strength',
      title: T.insightClutch,
      text: relating.clutchReading,
    },
    {
      kind: 'info',
      title: T.insightMeet,
      text: `${relating.meetingReading} ${relating.distanceReading}`,
    },
  ]

  for (const pat of [...loveLife.patterns, ...relating.patterns].slice(0, 4)) {
    insights.push({
      kind: pat.tone === 'challenging' ? 'caution' : pat.tone === 'supportive' ? 'strength' : 'highlight',
      title: pat.title,
      text: pat.text,
    })
  }

  return {
    d7Lagna: asc,
    d7LagnaName: L.r(asc),
    d7LagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    summary: summaryBits.join(' '),
    purpose: pick(D7_PURPOSE, D7_PURPOSE_HI, lang),
    pillars,
    progeny,
    desire,
    devotion,
    recognition,
    loveLife,
    relating,
    planets,
    houses,
    focusedHouses,
    insights,
  }
}
