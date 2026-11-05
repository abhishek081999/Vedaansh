/**
 * Slideshow video for social posts: each slide holds with a gentle zoom, then crossfades
 * into the next. Recorded in the browser with Canvas + MediaRecorder — straight to H.264 MP4
 * where supported (current Chrome / Safari), otherwise WebM converted by ffmpeg.wasm (slow).
 */
import type { Frame } from '@/lib/social/render/frame'

const FPS = 30

const MP4_TYPES = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.4d0028', 'video/mp4;codecs=avc1', 'video/mp4']
const WEBM_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'video/webm'
  return [...MP4_TYPES, ...WEBM_TYPES].find((c) => MediaRecorder.isTypeSupported(c)) ?? 'video/webm'
}

export interface SlideshowOptions {
  secondsPerSlide: number
  /** Crossfade length in seconds (0 = hard cut). */
  fadeSeconds?: number
  /** Zoom at the start of each slide (1 = none). */
  zoomFrom?: number
  onProgress?: (ratio: number) => void
}

/** Frame plan: which slide(s) to draw at frame n and with what opacity / zoom. Exported for tests. */
export function slideshowFrame(n: number, slideCount: number, framesPerSlide: number, fadeFrames: number, zoomFrom: number) {
  const slide = Math.min(slideCount - 1, Math.floor(n / framesPerSlide))
  const local = n - slide * framesPerSlide
  const t = framesPerSlide > 1 ? local / (framesPerSlide - 1) : 1
  const zoom = zoomFrom + (1 - zoomFrom) * t
  const fadeStart = framesPerSlide - fadeFrames
  const hasNext = slide < slideCount - 1
  const nextAlpha = hasNext && fadeFrames > 0 && local >= fadeStart ? (local - fadeStart + 1) / (fadeFrames + 1) : 0
  return { slide, zoom, nextAlpha }
}

/** Records the slideshow; the blob is MP4 when the browser can record H.264, else WebM. */
export async function encodeSlideshow(blobs: Blob[], frame: Frame, o: SlideshowOptions): Promise<Blob> {
  if (!blobs.length) throw new Error('No slides to encode')
  const images = await Promise.all(blobs.map((b) => createImageBitmap(b)))
  const canvas = document.createElement('canvas')
  canvas.width = frame.w
  canvas.height = frame.h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')

  const framesPerSlide = Math.max(FPS, Math.round(FPS * o.secondsPerSlide))
  const fadeFrames = Math.min(Math.round(FPS * (o.fadeSeconds ?? 0.5)), Math.floor(framesPerSlide / 2))
  const zoomFrom = o.zoomFrom ?? 1.04
  const total = framesPerSlide * images.length

  const draw = (img: ImageBitmap, zoom: number, alpha: number) => {
    const w = frame.w * zoom
    const h = frame.h * zoom
    ctx.globalAlpha = alpha
    ctx.drawImage(img, (frame.w - w) / 2, (frame.h - h) / 2, w, h)
    ctx.globalAlpha = 1
  }

  const mime = pickMime()
  const stream = canvas.captureStream(FPS)
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 })
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    rec.onerror = () => reject(new Error('MediaRecorder failed'))
    rec.onstop = () => {
      images.forEach((im) => im.close())
      resolve(new Blob(chunks, { type: mime.split(';')[0] }))
    }
    let n = 0
    rec.start()
    const tick = () => {
      if (n >= total) {
        o.onProgress?.(1)
        rec.stop()
        return
      }
      const f = slideshowFrame(n, images.length, framesPerSlide, fadeFrames, zoomFrom)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, frame.w, frame.h)
      draw(images[f.slide], f.zoom, 1)
      if (f.nextAlpha > 0) draw(images[f.slide + 1], zoomFrom, f.nextAlpha)
      o.onProgress?.((n + 1) / total)
      n += 1
      setTimeout(tick, 1000 / FPS)
    }
    tick()
  })
}

export async function makeSlideshowMp4(
  blobs: Blob[],
  frame: Frame,
  secondsPerSlide: number,
  onProgress?: (stage: 'encode' | 'convert', ratio: number) => void,
): Promise<Blob> {
  const recorded = await encodeSlideshow(blobs, frame, { secondsPerSlide, onProgress: (r) => onProgress?.('encode', r) })
  if (recorded.type === 'video/mp4') return recorded
  const { webmToMp4ForInstagram } = await import('@/lib/social/export/mp4')
  return webmToMp4ForInstagram(recorded, { onProgress: (r) => onProgress?.('convert', r) })
}
