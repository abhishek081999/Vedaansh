// ─────────────────────────────────────────────────────────────
//  src/components/dasha/dashaPalette.ts
//  Shared lord names + colours for dasha UIs (graha IDs and
//  sign codes used by Chara / Sthir / Mandook).
// ─────────────────────────────────────────────────────────────

export const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer',
  Le: 'Leo', Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio',
  Sg: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
}

export const GRAHA_COLOR: Record<string, string> = {
  Su: '#F59E0B', Mo: '#60A5FA', Ma: '#EF4444',
  Me: '#10B981', Ju: '#FACC15', Ve: '#EC4899',
  Sa: '#6366F1', Ra: '#8B5CF6', Ke: '#F97316',
  Ar: '#EF4444', Ta: '#10B981', Ge: '#60A5FA', Cn: '#9CA3AF',
  Le: '#F59E0B', Vi: '#10B981', Li: '#EC4899', Sc: '#EF4444',
  Sg: '#FACC15', Cp: '#6366F1', Aq: '#6366F1', Pi: '#FACC15'
}

export function lordName(lord: string): string {
  return GRAHA_NAME[lord] ?? lord
}

export function lordColor(lord: string): string {
  return GRAHA_COLOR[lord] ?? 'var(--text-muted)'
}
