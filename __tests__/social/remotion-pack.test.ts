import { describe, expect, it } from 'vitest'
import {
  buildRemotionPackMeta,
  buildRemotionPackProps,
  remotionPackReadme,
  remotionSlideName,
} from '@/lib/social/export/remotionPack'
import { reelPropsInputSchema } from '../../remotion/reel-schema'

describe('remotion pack bridge', () => {
  it('names slides in sorted CLI order', () => {
    expect(remotionSlideName(0, 6)).toBe('slide-01.png')
    expect(remotionSlideName(5, 6)).toBe('slide-06.png')
    expect(remotionSlideName(9, 12)).toBe('slide-10.png')
  })

  it('builds props ImageReel accepts', () => {
    const props = buildRemotionPackProps(3, 3)
    expect(props.images).toEqual(['slide-01.png', 'slide-02.png', 'slide-03.png'])
    expect(props.preset).toBe('chart')
    expect(props.objectFit).toBe('contain')
    // Paths are placeholders for Studio; schema only needs non-empty strings.
    const resolved = reelPropsInputSchema.parse(props)
    expect(resolved.images).toHaveLength(3)
    expect(resolved.secondsPerImage).toBe(3)
  })

  it('warns when source frame is not 9:16', () => {
    const meta = buildRemotionPackMeta({
      templateId: 'panchang',
      date: '2026-11-05',
      frameId: '4x5',
      slideCount: 4,
      secondsPerImage: 3,
    })
    expect(meta.note).toMatch(/letterboxing|9:16/)
    expect(remotionPackReadme(meta, buildRemotionPackProps(4, 3))).toMatch(/reel:mp4/)
  })
})
