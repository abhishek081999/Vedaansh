// ─────────────────────────────────────────────────────────────
//  src/components/home/landingPaint.ts
//  Tracks whether the server-rendered landing hero has already been shown,
//  so the interactive hero that replaces it does not replay its entrance.
// ─────────────────────────────────────────────────────────────

let landingPainted = false

/** Called once the landing shell has mounted in the browser. */
export function markLandingPainted(): void {
  landingPainted = true
}

/** True after a landing shell has been on screen in this page view (browser only). */
export function wasLandingPainted(): boolean {
  return typeof window !== 'undefined' && landingPainted
}
