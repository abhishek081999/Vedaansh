// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/method.ts
//  Two Jaimini reading methods, selectable in the panel.
//  M1 is the textbook reading. M2 is the practical reading.
// ─────────────────────────────────────────────────────────────

export type JaiminiMethod = 'classical' | 'practical'

export const JAIMINI_METHODS: Array<{ id: JaiminiMethod; code: string; name: string; topic: string }> = [
  {
    id: 'classical',
    code: 'M1',
    name: 'Classical',
    topic: 'Textbook rules. Argala is obstructed by number and strength of planets. Sthira starts from Brahma. Mandook uses the Scorpio and Aquarius co-lords. The 5th karaka keeps the chart label Pitrukaraka.',
  },
  {
    id: 'practical',
    code: 'M2',
    name: 'Practical',
    topic: 'A practical reading. Argala is obstructed only from the opposite degree quarter, then compared by strength. Sthira starts from the stronger of Lagna and 7th. Mandook uses Mars and Saturn only. The 5th karaka is Putrakaraka.',
  },
]

/** Label of the 5th chara karaka in the 7-karaka scheme. */
export function fifthKarakaName(method: JaiminiMethod): string {
  return method === 'practical' ? 'Putrakaraka' : 'Pitrukaraka'
}
