/** Canonical breakpoints — use these instead of magic numbers in CSS/JS. */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1100,
  '2xl': 1440,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

export const MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.xs}px)`,
  sm: `(max-width: ${BREAKPOINTS.sm}px)`,
  md: `(max-width: ${BREAKPOINTS.md}px)`,
  lg: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  xl: `(max-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  sidenavOverlay: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  sidenavInline: `(min-width: ${BREAKPOINTS.lg}px)`,
} as const

export function isSidenavOverlayWidth(width: number): boolean {
  return width < BREAKPOINTS.lg
}
