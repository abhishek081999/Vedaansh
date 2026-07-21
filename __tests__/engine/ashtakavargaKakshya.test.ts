// ─────────────────────────────────────────────────────────────
//  Kakshya Ashtakavarga unit tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  KAKSHYA_LORDS,
  KAKSHYA_SPAN_DEG,
  kakshyaIndexFromDegree,
  kakshyaLordFromDegree,
} from '@/lib/engine/ashtakavargaKakshya'

describe('Kakshya Ashtakavarga', () => {
  it('has 8 lords in JHora order', () => {
    expect(KAKSHYA_LORDS).toEqual(['Sa', 'Ju', 'Ma', 'Su', 'Ve', 'Me', 'Mo', 'As'])
  })

  it('each kakshya spans 3.75 degrees', () => {
    expect(KAKSHYA_SPAN_DEG).toBe(3.75)
    expect(kakshyaIndexFromDegree(29.9)).toBe(7)
    expect(kakshyaLordFromDegree(29.9)).toBe('As')
  })
})
