'use client'
// Planet / ascendant glyphs inside the chart drawings, in the page language.
// Hindi uses the traditional two-letter forms (सू चं मं बु गु शु श रा के, ल for lagna).
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_SHORT_HI } from '@/i18n/jyotish'
import type { GrahaId } from '@/types/astrology'

export function useChartLabels() {
  const t = useTranslations('chart.chakra')
  const { hi } = useLang()
  return {
    hi,
    /** 'Su' → 'सू'; 'AS' / 'As' → 'ल'; anything else unchanged. */
    graha: (id: string): string => {
      if (!hi) return id
      if (id === 'AS' || id === 'As' || id === 'Asc') return t('asc')
      return GRAHA_SHORT_HI[id as GrahaId] ?? id
    },
    retro: t('retro'),
    t,
  }
}
