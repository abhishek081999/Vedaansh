/**
 * Saura masa, ayana, ritu, and 60-year samvatsara names (approximate civil-year alignment).
 * Regional lunisolar calendars differ; labels are indicative for almanac-style display.
 */

import type { Rashi } from '@/types/astrology'

/** North Indian saura month names when Sun is in rashi Mesha…Mina (1…12). */
export const SAURA_MASA_BY_RASHI: Record<Rashi, string> = {
  1: 'Vaishakha',
  2: 'Jyeshtha',
  3: 'Ashadha',
  4: 'Shravana',
  5: 'Bhadrapada',
  6: 'Ashvina',
  7: 'Karttika',
  8: 'Margashirsha',
  9: 'Pausha',
  10: 'Magha',
  11: 'Phalguna',
  12: 'Caitra',
}

/** Six seasons (two signs each), northern scheme. */
export const RITU_BY_RASHI: Record<Rashi, { sa: string; en: string }> = {
  1: { sa: 'Vasanta', en: 'Spring' },
  2: { sa: 'Vasanta', en: 'Spring' },
  3: { sa: 'Grishma', en: 'Summer' },
  4: { sa: 'Grishma', en: 'Summer' },
  5: { sa: 'Varsha', en: 'Monsoon' },
  6: { sa: 'Varsha', en: 'Monsoon' },
  7: { sa: 'Sharad', en: 'Autumn' },
  8: { sa: 'Sharad', en: 'Autumn' },
  9: { sa: 'Hemanta', en: 'Pre-winter' },
  10: { sa: 'Hemanta', en: 'Pre-winter' },
  11: { sa: 'Shishira', en: 'Winter' },
  12: { sa: 'Shishira', en: 'Winter' },
}

/** Uttarayana: Sun in Makara–Mithuna (10–3); Dakshinayana: Karka–Dhanu (4–9). */
export function getAyana(sunRashi: Rashi): { sa: string; en: string } {
  const ut = sunRashi >= 10 || sunRashi <= 3
  return ut
    ? { sa: 'Uttarayana', en: 'Sun northward (approx. mid-Jan–mid-Jul)' }
    : { sa: 'Dakshinayana', en: 'Sun southward (approx. mid-Jul–mid-Jan)' }
}

/** 60-year cycle names (1 = Prabhava … 60 = Akshaya). */
export const SAMVATSARA_NAMES = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoduta', 'Prajotpatti', 'Angirasa',
  'Shrimukha', 'Bhava', 'Yuvan', 'Dhatri', 'Ishvara', 'Bahudhanya',
  'Pramathi', 'Vikrama', 'Vrisha', 'Citrabhanu', 'Subhanu', 'Tarana',
  'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti',
  'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
  'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit',
  'Shobhana', 'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Kilaka',
  'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda',
  'Rakshasa', 'Nala', 'Pinggala', 'Kalayukti', 'Siddhartha', 'Raudra',
  'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
] as const

/**
 * Samvatsara index 0–59 from Gregorian year (aligned to common Surya Siddhanta–style civil mapping).
 * Not a substitute for panchang shaka/vikrama reckoning.
 */
export function samvatsaraIndexForYear(ceYear: number): number {
  return ((ceYear - 1987) % 60 + 60) % 60
}

/**
 * Rough Shaka (national calendar of India) — year advances near March–April.
 * Pass civil year/month (0 = January) in the user’s timezone.
 */
export function approximateShakaYear(ceYear: number, monthIndex0: number): number {
  return monthIndex0 >= 2 ? ceYear - 78 : ceYear - 79
}

/** Rough Vikrama Samvat (often +57 from CE around April). */
export function approximateVikramSamvat(ceYear: number, monthIndex0: number): number {
  return monthIndex0 >= 2 ? ceYear + 57 : ceYear + 56
}
