'use client'
// ─────────────────────────────────────────────────────────────
//  AcgHeatmapLayer.tsx
//  World heatmap of a location score, painted once to a canvas and
//  laid over the map. Rows are spaced in Web Mercator so the image
//  lines up with the tiles.
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import { ImageOverlay } from 'react-leaflet'

const LAT_MAX = 75
const COLS = 120 // 3° of longitude per cell
const ROWS = 90

function mercY(lat: number): number {
  const r = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + r / 2))
}
function invMercY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI
}

interface Props {
  /** Score at a place: positive is supportive, negative is challenging. */
  score: (lat: number, lng: number) => number
  /** When true, only magnitude is shown (one colour ramp). */
  signed: boolean
  opacity?: number
  /** Changes whenever the inputs to `score` change, to repaint. */
  depsKey: string
}

export function AcgHeatmapLayer({ score, signed, opacity = 0.55, depsKey }: Props) {
  const url = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = COLS
    canvas.height = ROWS
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const yTop = mercY(LAT_MAX)
    const yBot = mercY(-LAT_MAX)
    const vals: number[] = []
    let maxAbs = 1
    for (let r = 0; r < ROWS; r++) {
      const lat = invMercY(yTop - ((r + 0.5) / ROWS) * (yTop - yBot))
      for (let c = 0; c < COLS; c++) {
        const lng = -180 + ((c + 0.5) / COLS) * 360
        const v = score(lat, lng)
        vals.push(v)
        maxAbs = Math.max(maxAbs, Math.abs(v))
      }
    }
    const img = ctx.createImageData(COLS, ROWS)
    vals.forEach((v, i) => {
      const k = Math.min(1, Math.abs(v) / maxAbs)
      const a = Math.round(255 * Math.pow(k, 0.7))
      const [R, G, B] = !signed ? [212, 160, 23] : v >= 0 ? [22, 163, 74] : [220, 38, 38]
      img.data[i * 4] = R
      img.data[i * 4 + 1] = G
      img.data[i * 4 + 2] = B
      img.data[i * 4 + 3] = a
    })
    ctx.putImageData(img, 0, 0)
    return canvas.toDataURL()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depsKey stands in for the score inputs
  }, [depsKey, signed])

  if (!url) return null
  return <ImageOverlay url={url} bounds={[[-LAT_MAX, -180], [LAT_MAX, 180]]} opacity={opacity} className="acg-heatmap" />
}
