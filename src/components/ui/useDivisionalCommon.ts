'use client'
// Shared display helpers for the divisional-chart workspaces (D3/D4/D9/D10/D12/D27).
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { Dignity, GrahaId, Rashi } from '@/types/astrology'

export function useDivisionalCommon() {
  const { lang, hi } = useLang()
  const t = useTranslations('divisional.common')
  return {
    lang,
    hi,
    /** Tone enum → label ("supportive" / "सहायक"). */
    tone: (tone: string) => (t.has(`tone.${tone}`) ? t(`tone.${tone}`) : tone),
    /** Dignity enum → label ("great enemy" / "अधिशत्रु राशि"). */
    dignity: (d: Dignity | string) => (t.has(`dignity.${d}`) ? t(`dignity.${d}`) : String(d).replace(/_/g, ' ')),
    house: (n: number) => t('house', { n }),
    houseShort: (n: number) => t('houseShort', { n }),
    vitality: (n: number) => t('vitality', { n }),
    /** Short sign label for chart captions ("Ari" / "मेष"). */
    signShort: (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r]),
    /** Full sign name ("Aries" / "मेष"). */
    sign: (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r]),
    lagnaOf: (r: Rashi) => t('lagnaSuffix', { sign: hi ? RASHI_HI[r] : RASHI_SHORT[r] }),
    graha: (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]),
  }
}
