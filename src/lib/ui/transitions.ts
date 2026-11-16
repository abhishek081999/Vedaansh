// ─────────────────────────────────────────────────────────────
//  src/lib/ui/transitions.ts
//  Inline-style transition helpers. Avoid `transition: all` — it also animates
//  layout properties (width, padding, font-size…) that should change instantly.
// ─────────────────────────────────────────────────────────────

/** Properties that change on hover, focus, selection and toggles (HTML and SVG). */
const INTERACTIVE_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'box-shadow',
  'opacity',
  'transform',
  'filter',
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
] as const

/**
 * Transition value for interactive state changes, e.g. `interactiveTransition('0.2s')`
 * or `interactiveTransition('0.3s cubic-bezier(0.4, 0, 0.2, 1)')`.
 */
export function interactiveTransition(timing: string): string {
  return INTERACTIVE_PROPERTIES.map((property) => `${property} ${timing}`).join(', ')
}
