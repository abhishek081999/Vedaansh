/**
 * Caption builder: hook → body lines → CTA → hashtags.
 * Instagram limits: 2,200 characters and 30 hashtags.
 */
export type HashtagPreset = 'balanced' | 'growth' | 'devotional'

export const HASHTAG_PRESET_LABEL: Record<HashtagPreset, string> = {
  balanced: 'Balanced',
  growth: 'Reach / growth',
  devotional: 'Devotional',
}

export const HASHTAG_PRESETS: Record<HashtagPreset, string[]> = {
  balanced: ['#jyotish', '#vedicastrology', '#vedaansh', '#astrology', '#hinduastrology'],
  growth: ['#astroreels', '#reelsindia', '#explorepage', '#astrologyindia', '#vedaansh'],
  devotional: ['#sanatandharma', '#bhakti', '#dharma', '#spiritualindia', '#vedaansh'],
}

export interface CaptionParts {
  hook: string
  lines: string[]
  tags: string[]
}

export const CAPTION_MAX_CHARS = 2200
export const CAPTION_MAX_TAGS = 30

export function normaliseTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const t = `#${raw.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '').toLowerCase()}`
    if (t.length < 2 || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out.slice(0, CAPTION_MAX_TAGS)
}

export function composeCaption(
  parts: CaptionParts,
  opts: { ctaLine: string; handle: string; preset: HashtagPreset },
): string {
  const tags = normaliseTags([...parts.tags, ...HASHTAG_PRESETS[opts.preset]])
  const cta = [opts.ctaLine.trim(), opts.handle.trim() ? `Follow ${opts.handle.trim()} for daily panchang & rashiphal.` : '']
    .filter(Boolean)
    .join('\n')
  const head = [parts.hook.trim(), parts.lines.filter(Boolean).join('\n'), cta].filter(Boolean).join('\n\n')
  const tagLine = tags.join(' ')
  const room = CAPTION_MAX_CHARS - tagLine.length - 2
  const body = head.length > room ? `${head.slice(0, Math.max(0, room - 1)).trimEnd()}…` : head
  return `${body}\n\n${tagLine}`.trim()
}
