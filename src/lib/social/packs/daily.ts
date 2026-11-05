/**
 * Daily Instagram content pack: the three posts ops usually ship every morning.
 * A1 panchang carousel · A2 shubh/ashubh timings · A3 12-sign rashiphal.
 */
export const DAILY_PACK_TEMPLATE_IDS = ['panchang', 'shubh-ashubh', 'rashiphal'] as const

export type DailyPackTemplateId = (typeof DAILY_PACK_TEMPLATE_IDS)[number]

export const DAILY_PACK_LABEL = 'Daily pack (A1+A2+A3)'
