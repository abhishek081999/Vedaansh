// Fixed colors for graha labels on charts (not dignity / avastha based).
import type { GrahaId } from '@/types/astrology'

export const GRAHA_DISPLAY_COLOR: Record<GrahaId, string> = {
  Su: '#EF8845',
  Mo: '#7EB6E8',
  Ma: '#FF6B6B',
  Me: '#3ECF7A',
  Ju: '#E8C547',
  Ve: '#F071A8',
  Sa: '#8BA3FF',
  Ra: '#C9854A',
  Ke: '#B07AE0',
  Ur: '#00CED1',
  Ne: '#4169E1',
  Pl: '#800000',
}

/** SVG / chart text: each planet has a fixed color; AS uses lagna accent. */
export function grahaChartFill(id: string): string {
  if (id === 'AS') return 'var(--text-gold, #f5cba7)'
  return GRAHA_DISPLAY_COLOR[id as GrahaId] ?? 'var(--text-secondary, #aaaaaa)'
}
