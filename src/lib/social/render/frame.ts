/**
 * Output frames for social content. Width is always 1080; height decides the format.
 * Every slide is laid out natively for its frame (never letterboxed).
 */
export type FrameId = '4x5' | '1x1' | '9x16'

export interface Frame {
  id: FrameId
  w: number
  h: number
  label: string
  /** Top of the content area (below the brand header). */
  contentTop: number
  /** Bottom of the content area (above the footer). */
  contentBottom: number
  /** Baseline Y of the footer line(s). */
  footerY: number
}

export const FRAMES: Record<FrameId, Frame> = {
  '4x5': { id: '4x5', w: 1080, h: 1350, label: 'Feed post 4:5', contentTop: 190, contentBottom: 1210, footerY: 1262 },
  '1x1': { id: '1x1', w: 1080, h: 1080, label: 'Square 1:1', contentTop: 180, contentBottom: 950, footerY: 1000 },
  // Stories/reels: Instagram UI covers ~220px top and ~320px bottom — keep content clear of it.
  '9x16': { id: '9x16', w: 1080, h: 1920, label: 'Story / Reel 9:16', contentTop: 250, contentBottom: 1600, footerY: 1690 },
}

export const FRAME_IDS: FrameId[] = ['4x5', '9x16', '1x1']

/** 1 for the 4:5 baseline; >1 when the frame has more room (9:16), <1 when tighter (1:1). */
export function frameScale(f: Frame): number {
  return (f.contentBottom - f.contentTop) / (FRAMES['4x5'].contentBottom - FRAMES['4x5'].contentTop)
}
