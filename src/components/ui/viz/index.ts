// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/index.ts
//  Shared SVG visual kit — token-themed, dependency-free
// ─────────────────────────────────────────────────────────────

export { VizCard, Legend, type LegendItem } from './VizCard'
export { RadarChart, type RadarSeries } from './RadarChart'
export { SegmentRing, type RingSegment } from './SegmentRing'
export { Gauge, Meter, BarList, DivergingBarList, type GaugeZone, type BarRow } from './Gauge'
export { TimelineBand, type BandSegment } from './TimelineBand'
export { AreaChart, Sparkline, type AreaSeries } from './AreaChart'
export { ClockDial, type DialWindow } from './ClockDial'
export { Heatmap } from './Heatmap'
export { MoonPhase } from './MoonPhase'
export { arcPath, polar, clamp, toneFor } from './geometry'
