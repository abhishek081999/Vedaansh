// Hindi display strings for src/lib/engine/transitCalendar.ts

import type { SaturnMoonPhaseKind } from '@/lib/engine/sadeSati'

/** Short Sa–Moon flags for calendar cells (parallel to English KIND_LABEL). */
export const KIND_LABEL_HI: Record<SaturnMoonPhaseKind, string> = {
  sade_sati_rising: 'सा.सा. उदय',
  sade_sati_peak: 'सा.सा. शिखर',
  sade_sati_setting: 'सा.सा. अस्त',
  kantaka: 'कंटक',
  ashtama: 'अष्टम',
  clear: 'निर्मल',
}

export const MONTH_NAMES_HI = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
] as const

export const TRANSIT_CALENDAR_HI = {
  summary: '{monthLabel}: {eventDays} प्रमुख-घटना दिवस; शनि–चंद्र तनाव {ssDays} दिवस।',
  rx: 'वक्री',
  dir: 'मार्गी',
  html: {
    titlePrefix: 'गोचर',
    heading: 'व्यक्तिगत गोचर — {monthLabel}',
    lagna: 'लग्न',
    moon: 'चंद्र',
    thDate: 'तिथि',
    thSaMoon: 'शनि–चंद्र',
    thMajors: 'गु/श/रा/के',
    thEvents: 'घटनाएँ',
    footer: 'वेदांश · केवल शैक्षिक समय · दशा से पुष्टि करें',
  },
} as const
