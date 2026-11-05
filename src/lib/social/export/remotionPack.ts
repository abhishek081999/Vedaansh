/**
 * Remotion bridge helpers: turn Social Studio slide PNGs into a pack the
 * existing ImageReel composition / `npm run reel:mp4` CLI can consume.
 * Remotion is fixed at 1080×1920 — prefer exporting from the 9:16 frame.
 */
import type { FrameId } from '@/lib/social/render/frame'
import type { ReelPresetId } from '@/lib/reel/reel-remotion-presets'

export interface RemotionPackProps {
  images: string[]
  secondsPerImage: number
  objectFit: 'contain'
  preset: ReelPresetId
  effects: {
    enableFade: true
    fadeFrames: number
    enableZoom: true
    zoomStart: number
    zoomEnd: number
  }
}

export interface RemotionPackMeta {
  templateId: string
  date: string
  frameId: FrameId
  slideCount: number
  secondsPerImage: number
  createdAt: string
  note: string
}

/** Ordered PNG names used inside the Remotion pack ZIP. */
export function remotionSlideName(index: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return `slide-${String(index + 1).padStart(width, '0')}.png`
}

/** Props for Remotion Studio / ImageReel — paths relative to the unzipped pack. */
export function buildRemotionPackProps(slideCount: number, secondsPerImage: number): RemotionPackProps {
  const n = Math.max(1, Math.floor(slideCount))
  const seconds = Math.min(10, Math.max(1.5, secondsPerImage))
  return {
    images: Array.from({ length: n }, (_, i) => remotionSlideName(i, n)),
    secondsPerImage: seconds,
    objectFit: 'contain',
    preset: 'chart',
    effects: {
      enableFade: true,
      fadeFrames: 18,
      enableZoom: true,
      zoomStart: 1.02,
      zoomEnd: 1,
    },
  }
}

export function buildRemotionPackMeta(input: {
  templateId: string
  date: string
  frameId: FrameId
  slideCount: number
  secondsPerImage: number
}): RemotionPackMeta {
  return {
    ...input,
    slideCount: Math.max(1, Math.floor(input.slideCount)),
    secondsPerImage: Math.min(10, Math.max(1.5, input.secondsPerImage)),
    createdAt: new Date().toISOString(),
    note:
      input.frameId === '9x16'
        ? 'Frame matches Remotion ImageReel (1080×1920).'
        : `Source frame is ${input.frameId}; Remotion renders 1080×1920 with object-fit contain (letterboxing possible). Prefer 9:16 in Social Studio for Reels.`,
  }
}

/** Human instructions shipped inside the ZIP. */
export function remotionPackReadme(meta: RemotionPackMeta, props: RemotionPackProps): string {
  const dirHint = `tmp/social-reel-${meta.templateId}-${meta.date}`
  return `# Vedaansh Remotion pack

Template: ${meta.templateId}
Date: ${meta.date}
Slides: ${meta.slideCount}
Source frame: ${meta.frameId}
Seconds per slide: ${props.secondsPerImage}

${meta.note}

## Quick HQ MP4 (CLI)

From the repo root:

\`\`\`bash
# 1. Unzip this pack into a folder (example)
mkdir -p ${dirHint}
# copy the unzipped PNGs + props.json into ${dirHint}

# 2. Render with the existing ImageReel composition
npm run reel:mp4 -- \\
  --images-dir ${dirHint} \\
  --preset chart \\
  --object-fit contain \\
  --seconds-per-image ${props.secondsPerImage} \\
  --output out/vedaansh-${meta.templateId}-${meta.date}.mp4
\`\`\`

Or open Remotion Studio and paste \`props.json\` (update \`images\` to \`staticFile\` paths if needed):

\`\`\`bash
npm run remotion:studio
\`\`\`

Social Studio’s “Make video (MP4)” stays the fast browser path.
This pack is for higher-quality H.264 via Remotion on your machine.
`
}
