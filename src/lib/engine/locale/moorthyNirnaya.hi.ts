// Hindi display strings for src/lib/engine/moorthyNirnaya.ts

import type { MoorthyMetal } from '@/lib/engine/moorthyNirnaya'

export const MOORTHY_METAL_HI: Record<MoorthyMetal, { label: string; blurb: string }> = {
  swarna: {
    label: 'स्वर्ण (सोना)',
    blurb: 'गोचर के भाव विषयों का बलवान सहायक वितरण।',
  },
  rajata: {
    label: 'रजत (चाँदी)',
    blurb: 'सामान्यतः अनुकूल — परिणाम स्थिरता के साथ आते हैं।',
  },
  tamra: {
    label: 'ताम्र (ताँबा)',
    blurb: 'मिश्रित / प्रयासपूर्ण — घर्षण या विलंब के बाद लाभ।',
  },
  loha: {
    label: 'लोह (लोहा)',
    blurb: 'भारी मूर्ति — अनुशासन आवश्यक; दशा से पुष्टि करें।',
  },
}

export const MOORTHY_WEEKDAY_HI = [
  'रविवार',
  'सोमवार',
  'मंगलवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
] as const

export const MOORTHY_HI = {
  summary: '{planet} ने {rashi} में {weekday} को प्रवेश किया → {metal}। {blurb}',
} as const
