import type { SatpanchasikaVerdict } from '@/lib/engine/satpanchasikaEngine'

export const VEDIC_TOPIC_HI: Record<string, string> = {
  general: 'सामान्य विषय',
  career: 'करियर या पद',
  money: 'धन या लाभ',
  marriage: 'विवाह या साथी',
  children: 'संतान',
  health: 'रोग और स्वास्थ्य',
  education: 'पढ़ाई या परीक्षा',
  property: 'घर या संपत्ति',
  travel: 'लंबी यात्रा',
  dispute: 'विवाद या मुकदमा',
}

export const VEDIC_NOTICE_HI: Record<string, string> = {
  money: 'यह पारंपरिक संकेत है, वित्तीय सलाह नहीं।',
  children: 'यह पारंपरिक संकेत है, चिकित्सा सलाह नहीं।',
  health: 'यह पारंपरिक संकेत है, चिकित्सा सलाह नहीं। योग्य चिकित्सक पर निर्भर रहें।',
  dispute: 'यह पारंपरिक संकेत है, कानूनी सलाह नहीं।',
}

export const VEDIC_HEADLINE_HI: Record<SatpanchasikaVerdict, string> = {
  favourable: 'संकेत विषय के पूरा होने के पक्ष में हैं',
  with_difficulty: 'पूर्ति कठिनाई के साथ संकेतित है',
  leans_unfavourable: 'संकेत विषय के विरुद्ध झुकते हैं',
  unfavourable: 'संकेत विषय का साथ नहीं देते',
  no_change: 'कोई स्पष्ट परिवर्तन नहीं दिखता',
  indication_only: 'केवल संकेत',
  insufficient: 'पढ़ने के लिए संकेत बहुत कम हैं',
}

export const VEDIC_STUDY_HI =
  'यह शास्त्रीय प्रश्न पद्धति का अध्ययन-ढाँचा है, भविष्यवाणी नहीं। ज्ञात परिणाम वाले पुराने प्रश्नों पर जाँचें और सही-गलत का लेखा रखें।'
