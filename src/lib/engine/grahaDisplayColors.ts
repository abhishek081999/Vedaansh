// Fixed colors for graha labels on charts (not dignity / avastha based).
import type { GrahaId } from '@/types/astrology'

export const GRAHA_DISPLAY_COLOR: Record<GrahaId, string> = {
  Su: '#FF8C00',
  Mo: '#8EB8E8',
  Ma: '#E83838',
  Me: '#38B868',
  Ju: '#F09800',
  Ve: '#FF55A8',
  Sa: '#7290C8',
  Ra: '#A0522D',
  Ke: '#A040C8',
  Ur: '#00C4C8',
  Ne: '#3A62D8',
  Pl: '#8B0000',
}

/** SVG / chart text: each planet has a fixed color; AS uses lagna accent. */
export function grahaChartFill(id: string): string {
  if (id === 'AS') return 'var(--text-gold, #c9a84c)'
  return GRAHA_DISPLAY_COLOR[id as GrahaId] ?? 'var(--text-secondary, #aaaaaa)'
}
