/**
 * Saura māsa, ayana, ṛtu, and 60-year saṃvatsara names (approximate civil-year alignment).
 * Regional lunisolar calendars differ; labels are indicative for almanac-style display.
 */

import type { Rashi } from '@/types/astrology'

/** North Indian saura month names when Sun is in rāśi Meṣa…Mīna (1…12). */
export const SAURA_MASA_BY_RASHI: Record<Rashi, string> = {
  1: 'Vaiśākha',
  2: 'Jyeṣṭha',
  3: 'Āṣāḍha',
  4: 'Śrāvaṇa',
  5: 'Bhādrapada',
  6: 'Āśvina',
  7: 'Kārttika',
  8: 'Mārgaśīrṣa',
  9: 'Pauṣa',
  10: 'Māgha',
  11: 'Phālguna',
  12: 'Caitra',
}

/** Six seasons (two signs each), northern scheme. */
export const RITU_BY_RASHI: Record<Rashi, { sa: string; en: string }> = {
  1: { sa: 'Vasanta', en: 'Spring' },
  2: { sa: 'Vasanta', en: 'Spring' },
  3: { sa: 'Grīṣma', en: 'Summer' },
  4: { sa: 'Grīṣma', en: 'Summer' },
  5: { sa: 'Varṣā', en: 'Monsoon' },
  6: { sa: 'Varṣā', en: 'Monsoon' },
  7: { sa: 'Śarad', en: 'Autumn' },
  8: { sa: 'Śarad', en: 'Autumn' },
  9: { sa: 'Hemanta', en: 'Pre-winter' },
  10: { sa: 'Hemanta', en: 'Pre-winter' },
  11: { sa: 'Śiśira', en: 'Winter' },
  12: { sa: 'Śiśira', en: 'Winter' },
}

/** Uttarayana: Sun in Makara–Mithuna (10–3); Dakṣiṇāyana: Karka–Dhanu (4–9). */
export function getAyana(sunRashi: Rashi): { sa: string; en: string } {
  const ut = sunRashi >= 10 || sunRashi <= 3
  return ut
    ? { sa: 'Uttarāyaṇa', en: 'Sun northward (approx. mid-Jan–mid-Jul)' }
    : { sa: 'Dakṣiṇāyana', en: 'Sun southward (approx. mid-Jul–mid-Jan)' }
}

/** 60-year cycle names (1 = Prabhāva … 60 = Akṣaya). */
export const SAMVATSARA_NAMES = [
  'Prabhāva', 'Vibhāva', 'Śukla', 'Pramodūta', 'Prajotpatti', 'Āṅgirasa',
  'Śrīmukha', 'Bhāva', 'Yuvan', 'Dhātṛ', 'Īśvara', 'Bahudhānya',
  'Pramāthi', 'Vikrama', 'Vṛṣa', 'Citrabhānu', 'Subhānu', 'Tāraṇa',
  'Pārthiva', 'Vyaya', 'Sarvajit', 'Sarvadhārī', 'Virodhī', 'Vikṛti',
  'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
  'Hevilambi', 'Vilambi', 'Vikāri', 'Śārvarī', 'Plava', 'Śubhakṛt',
  'Śobhana', 'Krodhī', 'Viśvāvasu', 'Parābhava', 'Plavaṅga', 'Kīlaka',
  'Saumya', 'Sādhāraṇa', 'Virodhikṛt', 'Paridhāvi', 'Pramādi', 'Ānanda',
  'Rākṣasa', 'Nala', 'Piṅgala', 'Kālayukti', 'Siddhārtha', 'Raudra',
  'Durmati', 'Dundubhi', 'Rudhirōdgāri', 'Raktākṣi', 'Krodhana', 'Akṣaya',
] as const

/**
 * Saṃvatsara index 0–59 from Gregorian year (aligned to common Sūrya Siddhānta–style civil mapping).
 * Not a substitute for pañcāṅga śaka/vikrama reckoning.
 */
export function samvatsaraIndexForYear(ceYear: number): number {
  return ((ceYear - 1987) % 60 + 60) % 60
}

/**
 * Rough Śaka (national calendar of India) — year advances near March–April.
 * Pass civil year/month (0 = January) in the user’s timezone.
 */
export function approximateShakaYear(ceYear: number, monthIndex0: number): number {
  return monthIndex0 >= 2 ? ceYear - 78 : ceYear - 79
}

/** Rough Vikrama Samvat (often +57 from CE around April). */
export function approximateVikramSamvat(ceYear: number, monthIndex0: number): number {
  return monthIndex0 >= 2 ? ceYear + 57 : ceYear + 56
}
