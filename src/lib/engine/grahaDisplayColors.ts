// Fixed colors for graha labels on charts (not dignity / avastha based).
import type { GrahaId } from '@/types/astrology'

export const GRAHA_DISPLAY_COLOR: Record<GrahaId, string> = {
  Su: '#E07800',
  Mo: '#4A7FA8',
  Ma: '#D63030',
  Me: '#2E9E55',
  Ju: '#B8860B',
  Ve: '#C94285',
  Sa: '#5C7299',
  Ra: '#7A3E10',
  Ke: '#7D3C98',
  Ur: '#00CED1',
  Ne: '#4169E1',
  Pl: '#800000',
}

/** SVG / chart text: each planet has a fixed color; AS uses lagna accent. */
export function grahaChartFill(id: string): string {
  if (id === 'AS') return 'var(--text-gold, #c9a84c)'
  return GRAHA_DISPLAY_COLOR[id as GrahaId] ?? 'var(--text-secondary, #aaaaaa)'
}
