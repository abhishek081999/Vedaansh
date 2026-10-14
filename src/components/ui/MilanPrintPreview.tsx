'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanPrintPreview.tsx
//  Opens Kundali Milan print preview in a new tab (same UX as chart PDF)
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import type { MilanRole } from '@/lib/engine/milanSuite'
import {
  buildMilanReportInput,
  openMilanPrintPreview,
  type MilanReportInput,
} from '@/lib/pdf/milanHtml'

export interface OpenMilanPrintArgs {
  report?: MilanReportInput | null
  chartA?: ChartOutput | null
  chartB?: ChartOutput | null
  ashtakoot?: AshtakootResult | null
  roleA?: MilanRole
  roleB?: MilanRole
}

/** Build report input and open the chart-style print preview page. */
export function openMilanPrintPage(args: OpenMilanPrintArgs): boolean {
  const {
    report,
    chartA,
    chartB,
    ashtakoot,
    roleA = 'boy',
    roleB = 'girl',
  } = args

  const input =
    report ??
    (chartA && chartB && ashtakoot
      ? buildMilanReportInput(chartA, chartB, ashtakoot, roleA, roleB)
      : null)

  if (!input) return false
  return openMilanPrintPreview(input)
}
