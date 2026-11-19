// Shared colours, glyphs and English names for astrocartography UI.
import type { GrahaId } from '@/types/astrology'

export const ACG_PLANETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export const ACG_COLORS: Record<string, string> = {
  Su: '#FFD700', Mo: '#B8D4F0', Ma: '#FF4500', Me: '#00E56B',
  Ju: '#FFA500', Ve: '#FF69B4', Sa: '#9B7FD4', Ra: '#A9A9A9', Ke: '#8B6F47',
}

export const ACG_GLYPHS: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

export const ACG_NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}
