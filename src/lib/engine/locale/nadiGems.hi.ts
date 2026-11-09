import type { ClassicalGrahaId } from '@/lib/engine/houseInterpretations'

export const NADI_GEM_NOTE_HI =
  'रत्न ग्रह को बढ़ाता है। दुर्बल ग्रह को सुधारता नहीं। आकार से गुण भारी है। इसे अंगूठी में पहनें जो त्वचा को छुए। आरंभ उस ग्रह की दशा में करें, या जब उसका गोचर स्वराशि, उच्च या मित्र राशि में हो। दृष्टि रत्न नहीं बदलती। अस्त होना अपने आप उस ग्रह से रत्न नहीं हटाता जो अन्यथा बलवान हो।'

export const NADI_GEM_HI = {
  lagnaOff: ' लग्नेश का अपना रत्न अलग रहता है।',
} as const

export const NADI_GEM_STONE_HI: Record<ClassicalGrahaId, {
  stone: string
  substitute: string
  metal: string
  finger: string
  day: string
}> = {
  Su: { stone: 'माणिक', substitute: '', metal: 'पीला सोना', finger: 'अनामिका', day: 'रविवार' },
  Mo: { stone: 'मोती', substitute: '', metal: 'सफ़ेद सोना, चाँदी या प्लेटिनम', finger: 'मध्यमा या कनिष्ठा', day: 'सोमवार' },
  Ma: { stone: 'मूंगा', substitute: '', metal: 'पीला सोना', finger: 'मध्यमा या अनामिका', day: 'मंगलवार' },
  Me: { stone: 'पन्ना', substitute: 'पेरिडॉट', metal: 'पीला सोना', finger: 'कनिष्ठा', day: 'बुधवार' },
  Ju: { stone: 'पुखराज', substitute: 'पीला टोपाज़', metal: 'पीला सोना', finger: 'तर्जनी या अनामिका', day: 'गुरुवार' },
  Ve: { stone: 'हीरा', substitute: 'सफ़ेद ओपल', metal: 'सफ़ेद सोना, प्लेटिनम या चाँदी', finger: 'तर्जनी या अनामिका', day: 'शुक्रवार' },
  Sa: { stone: 'नीलम', substitute: 'जामुनिया', metal: 'सफ़ेद सोना, प्लेटिनम या चाँदी', finger: 'मध्यमा या कनिष्ठा', day: 'शनिवार' },
  Ra: { stone: 'गोमेद', substitute: '', metal: 'सफ़ेद सोना, प्लेटिनम या चाँदी', finger: 'मध्यमा', day: 'शनिवार' },
  Ke: { stone: 'लहसुनिया', substitute: '', metal: 'पीला सोना', finger: 'अनामिका', day: 'मंगलवार' },
}
