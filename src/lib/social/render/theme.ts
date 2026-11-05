/**
 * Visual themes for social slides. "Cosmic" follows the app's brand tokens
 * (globals.css: --surface-0 #0e0e18, --gold #c9a84c / --gold-light #e2c97e, --accent #8b7cf6).
 */
export type ThemeId = 'cosmic' | 'temple' | 'parchment'

export const THEME_IDS: ThemeId[] = ['cosmic', 'temple', 'parchment']

export const THEME_LABEL: Record<ThemeId, string> = {
  cosmic: 'Cosmic night',
  temple: 'Temple',
  parchment: 'Parchment',
}

export interface Theme {
  id: ThemeId
  dark: boolean
  bg: [string, string, string]
  nebula: [string, string]
  ink: string
  inkSoft: string
  inkMute: string
  gold: string
  goldSoft: string
  goldLine: string
  goldFill: string
  panel: string
  panelStroke: string
  good: string
  goodFill: string
  warn: string
  warnFill: string
  mixed: string
  mixedFill: string
  /** "r,g,b" used for star dots */
  star: string
  wheel: string
  /** Text drawn on a solid gold fill */
  onGold: string
}

export type Tone = 'good' | 'warn' | 'mixed' | 'neutral'

export function getTheme(id: ThemeId): Theme {
  if (id === 'temple') {
    return {
      id,
      dark: true,
      bg: ['#1C0505', '#360B0B', '#4A1608'],
      nebula: ['rgba(255,140,40,0.20)', 'rgba(200,40,40,0.18)'],
      ink: '#FFF5E1',
      inkSoft: '#F3D9AE',
      inkMute: 'rgba(243,217,174,0.72)',
      gold: '#F2C45A',
      goldSoft: 'rgba(242,196,90,0.80)',
      goldLine: 'rgba(242,196,90,0.42)',
      goldFill: 'rgba(242,196,90,0.16)',
      panel: 'rgba(30,6,4,0.78)',
      panelStroke: 'rgba(242,196,90,0.38)',
      good: '#9BE3A8',
      goodFill: 'rgba(80,190,110,0.16)',
      warn: '#FF9B8A',
      warnFill: 'rgba(230,70,50,0.18)',
      mixed: '#FFD27A',
      mixedFill: 'rgba(255,190,80,0.14)',
      star: '255,226,170',
      wheel: 'rgba(242,196,90,0.58)',
      onGold: '#2A0707',
    }
  }
  if (id === 'parchment') {
    return {
      id,
      dark: false,
      bg: ['#FBF6EA', '#F4ECDA', '#EADFC6'],
      nebula: ['rgba(214,160,60,0.18)', 'rgba(139,124,246,0.10)'],
      ink: '#1E1838',
      inkSoft: '#4A4264',
      inkMute: 'rgba(74,66,100,0.78)',
      gold: '#9A6A14',
      goldSoft: 'rgba(154,106,20,0.88)',
      goldLine: 'rgba(154,106,20,0.40)',
      goldFill: 'rgba(154,106,20,0.10)',
      panel: 'rgba(255,255,255,0.84)',
      panelStroke: 'rgba(154,106,20,0.35)',
      good: '#1E7A46',
      goodFill: 'rgba(30,122,70,0.10)',
      warn: '#B3261E',
      warnFill: 'rgba(179,38,30,0.09)',
      mixed: '#8A5D00',
      mixedFill: 'rgba(200,150,30,0.12)',
      star: '154,106,20',
      wheel: 'rgba(154,106,20,0.58)',
      onGold: '#FFFFFF',
    }
  }
  return {
    id: 'cosmic',
    dark: true,
    bg: ['#06060D', '#0E0E18', '#1B1538'],
    nebula: ['rgba(139,124,246,0.24)', 'rgba(201,168,76,0.13)'],
    ink: '#F4F0FF',
    inkSoft: '#C9C3E3',
    inkMute: 'rgba(201,195,227,0.74)',
    gold: '#E2C97E',
    goldSoft: 'rgba(226,201,126,0.82)',
    goldLine: 'rgba(226,201,126,0.40)',
    goldFill: 'rgba(226,201,126,0.13)',
    panel: 'rgba(14,14,30,0.80)',
    panelStroke: 'rgba(226,201,126,0.32)',
    good: '#8FE3B4',
    goodFill: 'rgba(70,200,140,0.14)',
    warn: '#FF9E9E',
    warnFill: 'rgba(240,80,90,0.15)',
    mixed: '#FFD98A',
    mixedFill: 'rgba(255,200,90,0.12)',
    star: '255,248,225',
    wheel: 'rgba(226,201,126,0.58)',
    onGold: '#0E0E18',
  }
}

export function toneColors(t: Theme, tone: Tone): { ink: string; fill: string; bar: string } {
  if (tone === 'good') return { ink: t.good, fill: t.goodFill, bar: t.good }
  if (tone === 'warn') return { ink: t.warn, fill: t.warnFill, bar: t.warn }
  if (tone === 'mixed') return { ink: t.mixed, fill: t.mixedFill, bar: t.mixed }
  return { ink: t.gold, fill: 'transparent', bar: t.goldLine }
}
