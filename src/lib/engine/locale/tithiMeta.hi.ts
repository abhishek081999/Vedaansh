// Hindi text for src/lib/engine/tithiMeta.ts — same keys and order.
import type { TithiGroupId } from '@/lib/engine/tithiMeta'

export const GROUPS_HI: Record<TithiGroupId, {
  label: string
  elementLabel: string
  meaning: string
  peopleTraits: string
  dayGuidance: string
}> = {
  Nanda: {
    label: 'नंदा',
    elementLabel: 'अग्नि तत्त्व',
    meaning: 'आनंददायी',
    peopleTraits: 'आशावादी, सृजनशील, विकास-प्रिय',
    dayGuidance: 'सृजनात्मक शुरुआत, उत्सव और विकास से जुड़े कार्यों के लिए अनुकूल।',
  },
  Bhadra: {
    label: 'भद्रा',
    elementLabel: 'पृथ्वी तत्त्व',
    meaning: 'मंगलकारी',
    peopleTraits: 'दृढ़ इच्छाशक्ति, महत्वाकांक्षी, चुनौतियों पर विजय पाने वाले',
    dayGuidance: 'स्थिर प्रगति, अनुबंध और ठोस प्रयास के लिए अच्छा।',
  },
  Jaya: {
    label: 'जया',
    elementLabel: 'आकाश तत्त्व',
    meaning: 'विजयदायी',
    peopleTraits: 'विवादों में विजयी; नेतृत्व और पैरवी के लिए उपयुक्त',
    dayGuidance: 'प्रतियोगिता, वार्ता और निर्णायक नेतृत्व में सहायक।',
  },
  Rikta: {
    label: 'रिक्ता',
    elementLabel: 'वायु तत्त्व',
    meaning: 'रिक्त (खाली)',
    peopleTraits: 'संघर्ष का सामना; आत्म-मूल्यांकन और आत्मचिंतन आवश्यक',
    dayGuidance: 'स्थायी नींव वाले कार्य टालें; समीक्षा, तप और सफ़ाई के कार्य करें।',
  },
  Purna: {
    label: 'पूर्णा',
    elementLabel: 'जल तत्त्व',
    meaning: 'पूर्ण',
    peopleTraits: 'संतुलित, पूर्णता के खोजी, उच्च आध्यात्मिक क्षमता',
    dayGuidance: 'कार्य पूर्ण करने, मनोकामना-पूर्ति और आध्यात्मिक कार्यों के लिए अनुकूल।',
  },
}

/** Index 0 = lunar day 1 … 14 = Purnima. */
export const DAY_SEEDS_HI: {
  name: string
  deity: string
  significance: string
  bestFor: string
  ruler: string
  temperament: string
}[] = [
  { name: 'प्रतिपदा', deity: 'ब्रह्मा', significance: 'सृष्टि का आरंभ', bestFor: 'नए उपक्रम, विकास', ruler: 'चंद्र', temperament: 'कल्पनाशील और सृजनशील; शुरू किया काम पूरा करने के लिए धैर्य चाहिए।' },
  { name: 'द्वितीया', deity: 'अश्विनी कुमार', significance: 'आरोग्य, स्थिरता', bestFor: 'साझेदारी, अनुबंध', ruler: 'मंगल', temperament: 'आत्मविश्वासी और कर्मठ; आवेग से बचें।' },
  { name: 'तृतीया', deity: 'पार्वती, मंगल', significance: 'अक्षय तृतीया, दांपत्य सुख', bestFor: 'विवाह, सृजनात्मक कार्य', ruler: 'बुध', temperament: 'तेज़ सोच और संवाद-कुशल; चंचल बुद्धि को सही दिशा दें।' },
  { name: 'चतुर्थी', deity: 'गणेश, यम', significance: 'बुद्धि, विघ्न-निवारण', bestFor: 'अनुशासन, बौद्धिक कार्य', ruler: 'राहु', temperament: 'खोजी और प्रश्न करने वाले; शोध के लिए अच्छा, नींव रखने के लिए नहीं।' },
  { name: 'पंचमी', deity: 'नाग, ब्रह्मा', significance: 'रक्षा, धन', bestFor: 'नया व्यापार, चिकित्सा आरंभ', ruler: 'गुरु', temperament: 'विस्तारशील और ज्ञान-पिपासु; पढ़ने-पढ़ाने के लिए अनुकूल।' },
  { name: 'षष्ठी', deity: 'कार्तिकेय', significance: 'विजय, शक्ति', bestFor: 'नेतृत्व, विवाद-समाधान', ruler: 'शुक्र', temperament: 'आकर्षक ऊर्जा; सुख-सुविधा और उद्देश्यपूर्ण कर्म में संतुलन रखें।' },
  { name: 'सप्तमी', deity: 'सूर्य', significance: 'ऊर्जा, स्वास्थ्य', bestFor: 'यात्रा, उपचार आरंभ', ruler: 'सूर्य', temperament: 'नेतृत्व की प्रेरणा और ओज; अहंकार को सेवा-भाव से संतुलित करें।' },
  { name: 'अष्टमी', deity: 'रुद्र, दुर्गा, कृष्ण', significance: 'परिवर्तन, संतुलन', bestFor: 'कठिन परिश्रम वाले कार्य, शीघ्र परिणाम', ruler: 'चंद्र', temperament: 'गहन और परिवर्तनकारी; भावनात्मक तीव्रता अधिक रहती है।' },
  { name: 'नवमी', deity: 'दुर्गा, राम', significance: 'शक्ति-उपासना, न्याय', bestFor: 'कानूनी मामले, विवाद', ruler: 'मंगल', temperament: 'दृढ़-निश्चयी और गतिशील; निर्णायक मुकाबलों के लिए उपयुक्त।' },
  { name: 'दशमी', deity: 'यम', significance: 'विजय (दशहरा)', bestFor: 'यात्रा, धर्म-यात्रा', ruler: 'बुध', temperament: 'विश्लेषणशील और व्यावहारिक; योजना और क्रियान्वयन में सशक्त।' },
  { name: 'एकादशी', deity: 'विष्णु', significance: 'मोक्ष, शुद्धि', bestFor: 'उपवास, आध्यात्मिक कार्य', ruler: 'गुरु', temperament: 'उच्च आध्यात्मिक क्षमता; अनुशासन और साधना फल देती है।' },
  { name: 'द्वादशी', deity: 'विष्णु, सूर्य', significance: 'एकादशी व्रत का पारण', bestFor: 'दान-पुण्य के कार्य', ruler: 'शुक्र', temperament: 'सौहार्दपूर्ण और सेवाभावी; दान और संबंधों के लिए अच्छा।' },
  { name: 'त्रयोदशी', deity: 'कामदेव, शिव', significance: 'प्रेम, मनोकामना-पूर्ति', bestFor: 'प्रदोष व्रत, सौंदर्य से जुड़े कार्य', ruler: 'केतु', temperament: 'संवेदनशील और सेवाभावी; सृजनशील फिर भी व्यावहारिक।' },
  { name: 'चतुर्दशी', deity: 'शिव', significance: 'संघर्ष, परिवर्तन', bestFor: 'शत्रु और व्यसनों पर विजय', ruler: 'शनि', temperament: 'तप और तपस्या; भारी ऊर्जा सफ़ाई वाले कार्यों के अनुकूल।' },
  { name: 'पूर्णिमा', deity: 'चंद्र, लक्ष्मी', significance: 'पूर्णता, समृद्धि', bestFor: 'परियोजनाएँ पूर्ण करना, पर्व-उत्सव', ruler: 'चंद्र', temperament: 'भावनात्मक रूप से स्पष्ट और तृप्त; पूर्णता के अनुष्ठानों के लिए सशक्त।' },
]

export const AMAVASYA_HI = {
  name: 'अमावस्या',
  deity: 'पितृ, काली',
  significance: 'पितृ-पूजन',
  bestFor: 'श्राद्ध, आध्यात्मिक साधना',
  ruler: 'राहु',
  temperament: 'अंतर्मुखी और आंतरिक साधना, मोक्ष तथा पितृ-कर्म के लिए शक्तिशाली।',
}

/** Same order as AFFINITY_BY_LUNAR_DAY. */
export const AFFINITY_HI: { positiveTendency: string; healthSensitivity: string }[] = [
  { positiveTendency: 'ऊर्जावान, नेतृत्व के गुण', healthSensitivity: 'सिरदर्द, तनाव' },
  { positiveTendency: 'भावनात्मक स्थिरता, व्यावहारिकता', healthSensitivity: 'पाचन संबंधी समस्याएँ' },
  { positiveTendency: 'बहुमुखी संवाद-क्षमता', healthSensitivity: 'नकारात्मक विचार, रक्तचाप' },
  { positiveTendency: 'सृजनात्मक अभिव्यक्ति', healthSensitivity: 'तंत्रिका तंत्र के विकार' },
  { positiveTendency: 'अभिव्यक्ति, प्रेम', healthSensitivity: 'हार्मोन असंतुलन' },
  { positiveTendency: 'उच्च ऊर्जा, विस्तार', healthSensitivity: 'मांसपेशियों में खिंचाव' },
  { positiveTendency: 'सामंजस्य, संतुलन', healthSensitivity: 'जोड़ों का दर्द' },
  { positiveTendency: 'गहन परिवर्तन', healthSensitivity: 'चोट, दुर्घटना' },
  { positiveTendency: 'दार्शनिक चिंतन', healthSensitivity: 'श्वास संबंधी समस्याएँ' },
  { positiveTendency: 'विवेक, व्यावहारिकता', healthSensitivity: 'नींद में बाधा' },
  { positiveTendency: 'वैराग्य, आध्यात्मिकता', healthSensitivity: 'उपवास / तप से कमज़ोरी' },
  { positiveTendency: 'करुणा, सेवा', healthSensitivity: 'यकृत / आँतों का असंतुलन' },
  { positiveTendency: 'धन-अर्जन की प्रेरणा', healthSensitivity: 'अति-सक्रियता' },
  { positiveTendency: 'परिवर्तन की शक्ति', healthSensitivity: 'अनिद्रा, अहंकार, शल्य-चिकित्सा के प्रति संवेदनशीलता' },
  { positiveTendency: 'मोक्ष की ओर झुकाव', healthSensitivity: 'सामान्यतः संतुलित' },
]

export const COMBO_NOTES_HI = {
  noMoon: '{tithi} का पारंपरिक संबंध {rashi} राशि के चंद्रमा से है।',
  match: 'जन्म का चंद्रमा {rashi} में है, जो इस तिथि के शास्त्रीय संबंध से मेल खाता है — नीचे दी गई प्रवृत्तियाँ अधिक प्रबल होंगी।',
  mismatch: 'जन्म का चंद्रमा {moon} में है; {tithi} का शास्त्रीय संबंध {rashi} से है। चंद्र राशि और तिथि के स्वभाव को साथ मिलाकर पढ़ें।',
}

export const WEATHER_HI = { shubh: 'शुभ', ashubh: 'अशुभ' }

export const DEEP_READINGS_HI: Partial<Record<number, string>> = {
  14: 'चतुर्दशी (शनि): संघर्ष और तपस्या — हर कार्य में अतिरिक्त प्रयास लगता है। सूक्ष्म शरीर बहुत सक्रिय रहता है; भीतर से तुरंत आने वाला "हाँ / ना" इनकी छठी इंद्रिय है। कठिन निर्णयों को आगे बढ़ाते हैं; रहस्य (अपने भी और दूसरों के भी, तीक्ष्ण अवलोकन से) आसानी से सामने आ जाते हैं।',
  15: 'पूर्णिमा: भावनात्मक रूप से पूर्ण और संतुलित — प्रतिक्रिया देना जानते हैं, मन साफ़ रखते हैं और मन में बैर रखने के बजाय स्पष्ट बोलते हैं। अनुष्ठान में सही विधि चाहते हैं और त्रुटियाँ सुधारते हैं।',
  30: 'अमावस्या: अंधकार, रहस्य, सिद्धि, साधना और मोक्ष — पूर्णिमा से भी प्रबल और एक विशिष्ट आत्मविश्वास देती है। संकोची, अंतर्मुखी और चुपचाप लोगों को परखने वाले। (अमावस्या को राहु से जोड़ना प्रचलित है, पर यह BPHS, फलदीपिका, मुहूर्त चिंतामणि या वशिष्ठ संहिता में नहीं मिलता।)',
}
