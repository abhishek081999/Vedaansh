import tzlookup from 'tz-lookup'

/**
 * IANA timezone for coordinates, from offline boundary data.
 * Do not shortcut this with regional bounding boxes: rectangles around India and
 * Nepal also cover Lucknow, Lahore, Dhaka and Kabul, and a wrong zone shifts the lagna.
 */
export function resolveTimezone(lat: number, lng: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return 'UTC'
  }
  return tzlookup(lat, lng)
}
