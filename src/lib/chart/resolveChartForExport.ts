import { fromZonedTime } from 'date-fns-tz'
import { calculateChart } from '@/lib/engine/calculator'
import { hydrateSpecialLagnas } from '@/lib/engine/astroDetailsDerived'
import { hydrateCharaDashas } from '@/lib/engine/dasha/hydrateChara'
import type { ChartOutput, ChartSettings, Gender, UserPlan } from '@/types/astrology'

function localToUTC(date: string, time: string, tz: string): { utcDate: string; utcTime: string } {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  const localDT = `${date}T${safeTime}`

  try {
    const utcDate = fromZonedTime(localDT, tz)
    return {
      utcDate: utcDate.toISOString().slice(0, 10),
      utcTime: utcDate.toISOString().slice(11, 19),
    }
  } catch {
    return { utcDate: date, utcTime: safeTime }
  }
}

function hydrateChart(chartData: ChartOutput): ChartOutput {
  if (!chartData?.lagnas || !Array.isArray(chartData.grahas)) return chartData
  const lagnas = hydrateSpecialLagnas(chartData.lagnas, chartData.grahas)
  const withLagnas = lagnas === chartData.lagnas ? chartData : { ...chartData, lagnas }
  return hydrateCharaDashas(withLagnas)
}

type ExportMeta = {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  gender?: Gender
  settings?: ChartSettings
  prashnaNumber?: number
}

function isExportMeta(value: unknown): value is ExportMeta {
  if (!value || typeof value !== 'object') return false
  const m = value as ExportMeta
  return (
    typeof m.name === 'string' &&
    typeof m.birthDate === 'string' &&
    typeof m.birthTime === 'string' &&
    typeof m.birthPlace === 'string' &&
    typeof m.latitude === 'number' &&
    typeof m.longitude === 'number' &&
    typeof m.timezone === 'string'
  )
}

/** Resolve chart for PDF/HTML export from slim meta or legacy full ChartOutput. */
export async function resolveChartForExport(
  body: unknown,
  plan: UserPlan,
): Promise<ChartOutput | null> {
  const payload = body as { meta?: unknown; grahas?: unknown }

  if (isExportMeta(payload?.meta)) {
    const meta = payload.meta
    const { utcDate, utcTime } = localToUTC(meta.birthDate, meta.birthTime, meta.timezone)
    const chart = await calculateChart(
      {
        name: meta.name,
        birthDate: meta.birthDate,
        birthTime: meta.birthTime,
        utcDate,
        utcTime,
        birthPlace: meta.birthPlace,
        latitude: meta.latitude,
        longitude: meta.longitude,
        timezone: meta.timezone,
        gender: meta.gender ?? 'male',
        settings: meta.settings,
        prashnaNumber: meta.prashnaNumber,
      },
      plan,
    )
    return hydrateChart(chart)
  }

  if (payload?.meta && payload?.grahas) {
    return payload as ChartOutput
  }

  return null
}
