// Stable chart key for the remedy tracker when no Mongo chart id exists.

export function lkChartKey(meta: {
  birthDate: string
  birthTime: string
  latitude: number
  longitude: number
}): string {
  const lat = Number.isFinite(meta.latitude) ? meta.latitude.toFixed(4) : '0'
  const lng = Number.isFinite(meta.longitude) ? meta.longitude.toFixed(4) : '0'
  return `${meta.birthDate}|${meta.birthTime}|${lat}|${lng}`.slice(0, 120)
}
