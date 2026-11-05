/**
 * Browser export helpers for the Social Studio: slide PNGs, ZIP bundles and slideshow MP4.
 */
import type { Frame } from '@/lib/social/render/frame'
import type { Theme } from '@/lib/social/render/theme'
import type { BrandSettings, SlideSpec } from '@/lib/social/render/slides/types'
import { renderSlide } from '@/lib/social/render/slides/render'

export interface RenderOpts {
  frame: Frame
  theme: Theme
  brand: BrandSettings
  icon?: HTMLImageElement | null
  seed: string
}

export function renderSlideToCanvas(canvas: HTMLCanvasElement, slides: SlideSpec[], index: number, o: RenderOpts) {
  canvas.width = o.frame.w
  canvas.height = o.frame.h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  renderSlide(ctx, slides[index], { ...o, index, total: slides.length })
}

function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), type, quality))
}

export async function renderSlidesToBlobs(slides: SlideSpec[], o: RenderOpts, type = 'image/png'): Promise<Blob[]> {
  const c = document.createElement('canvas')
  const out: Blob[] = []
  for (let i = 0; i < slides.length; i++) {
    renderSlideToCanvas(c, slides, i, o)
    out.push(await canvasToBlob(c, type, type === 'image/jpeg' ? 0.92 : undefined))
  }
  return out
}

export interface ZipEntry {
  name: string
  data: Blob | string
}

export async function makeZip(entries: ZipEntry[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const e of entries) zip.file(e.name, e.data)
  return zip.generateAsync({ type: 'blob' })
}

export function slideFileName(base: string, index: number, total: number, ext = 'png'): string {
  return total > 1 ? `${base}-${String(index + 1).padStart(2, '0')}.${ext}` : `${base}.${ext}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
