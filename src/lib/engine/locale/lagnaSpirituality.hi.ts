// Hindi for src/lib/engine/lagnaSpirituality.ts — string fields only;
// ids, element ids and sign lists stay English.
import type { LagnaElementId } from '@/lib/engine/lagnaSpirituality'

export const LAGNA_SPIRITUALITY_NOTE_HI =
  'लग्न चेतना का वह लेंस है जिससे आत्मा कर्म का अनुभव करती है — ' +
  'आध्यात्मिक दिशा (विधि नहीं), अहं का रूप, और वह ढर्रा जिस पर साधना को काम करना है। ' +
  'केवल शिक्षण संदर्भ; चिकित्सा, क़ानूनी या आयु संबंधी सलाह नहीं।'

type ElementText = {
  name: string
  sanskrit: string
  birthConsciousness: string
  spiritualPath: string
  understandingMethod: string
  challenge: string
  liberationPath: string
  liberationSanskrit: string
  exitPattern: string
  fearPattern: string
}

export const LAGNA_ELEMENTS_HI: Record<LagnaElementId, ElementText> = {
  fire: {
    name: 'अग्नि',
    sanskrit: 'अग्नि तत्व',
    birthConsciousness: 'संघर्ष / कर्म की चेतना — अतीत का अधूरा कर्म; अभी कर्म करने की आवश्यकता',
    spiritualPath: 'तपस्या, योग, अनुशासन, तंत्र, अघोर की ओर झुकी साधनाएँ',
    understandingMethod: 'करके — पहले कर्म',
    challenge: 'अधीरता और आक्रामकता',
    liberationPath: 'ठहराव / विराम; बाध्यकारी कर्तव्य-प्रेरणा का त्याग',
    liberationSanskrit: 'ठहराव · बेचैन कर्म का त्याग',
    exitPattern: 'अंत तक कर्म-केंद्रित जागरूकता; प्रायः परिवर्तन के निकट आने का आभास',
    fearPattern: 'रुक जाएँ तो अस्तित्व मिट जाएगा',
  },
  earth: {
    name: 'पृथ्वी',
    sanskrit: 'पृथ्वी तत्व',
    birthConsciousness: 'ज़िम्मेदारी / स्मृति की चेतना — कर्तव्य से बँधा जन्म; कामों की सूची वाली सोच',
    spiritualPath: 'सेवा, स्थिर साधना, पहले शरीर-शुद्धि',
    understandingMethod: 'रचकर / निर्माण करके',
    challenge: 'बोझ ढोना और अधूरे कामों की स्मृति',
    liberationPath: 'त्याग — पूरा करने के बोझ को छोड़ना',
    liberationSanskrit: 'त्याग',
    exitPattern: 'कर्तव्य-केंद्रित जागरूकता; शरीर और ज़िम्मेदारी के विषय',
    fearPattern: 'परिवर्तन या अस्थिरता उन्हें नष्ट कर देगी',
  },
  air: {
    name: 'वायु',
    sanskrit: 'वायु तत्व',
    birthConsciousness: 'अवलोकन / बँटी हुई चेतना — आधी भीतर, आधी बाहर; पूरी तरह उतरना नहीं चाहते थे',
    spiritualPath: 'ज्ञान, विरक्ति, अपरंपरागत विधियाँ',
    understandingMethod: 'बौद्धिक रूप से समझकर',
    challenge: 'गहरी तल्लीनता से बचना; आधे भीतर / आधे बाहर रहना',
    liberationPath: 'मौन और स्वीकार',
    liberationSanskrit: 'मौन',
    exitPattern: 'स्वीकार और मौन; अचानक हो सकता है पर भीतर से शांत',
    fearPattern: 'अज्ञान / न समझ पाना, या गहरे जुड़ने पर पहचान खो देना',
  },
  water: {
    name: 'जल',
    sanskrit: 'जल तत्व',
    birthConsciousness: 'भावनात्मक / स्मृति में डूबना — पुरानी यादें और अधूरी भावना',
    spiritualPath: 'भक्ति, करुणा, समर्पण',
    understandingMethod: 'महसूस करके',
    challenge: 'भावनाओं से अभिभूत होना, अतीत की याद, खोने का भाव',
    liberationPath: 'सब कुछ साक्षी भाव से देखना',
    liberationSanskrit: 'साक्षी भाव',
    exitPattern: 'भावनात्मक स्वीकार और समर्पण की चेतना',
    fearPattern: 'भावनात्मक टूटन या स्वयं को भूल जाना',
  },
}

type ProfileText = {
  primaryConsciousness: string
  subconsciousEnergy: string
  invisibleFear: string
  egoType: string
  purpose: string
  lifePattern: string
  whatBreaksPattern: string
}

export const LAGNA_SPIRITUAL_PROFILES_HI: Record<number, ProfileText> = {
  1: {
    primaryConsciousness: '“मैं हूँ” — स्व-अस्तित्व',
    subconsciousEnergy: 'सदा युद्ध / संघर्ष में',
    invisibleFear: 'रुक गया तो मेरा अस्तित्व मिट जाएगा',
    egoType: 'अस्तित्व का अहं',
    purpose: 'आत्म-चेतना का जागरण',
    lifePattern: 'शांति से पहले कर्म; निरंतर गति',
    whatBreaksPattern: 'ठहराव; विराम को स्वीकार करना',
  },
  2: {
    primaryConsciousness: '“मुझे ज़मीन से जुड़ा रहना है”',
    subconsciousEnergy: 'स्थिर रहना ही होगा',
    invisibleFear: 'परिवर्तन मुझे नष्ट कर देगा',
    egoType: 'स्थिरता का अहं',
    purpose: 'सुरक्षा बनाना',
    lifePattern: 'बनाना, जमा करना, थामे रखना',
    whatBreaksPattern: 'छोड़ देना; अनित्यता को स्वीकार करना',
  },
  3: {
    primaryConsciousness: '“मुझे सब कुछ समझना है”',
    subconsciousEnergy: 'बँटी हुई जागरूकता; अवलोकन',
    invisibleFear: 'अज्ञान मुझे भटका देगा',
    egoType: 'बौद्धिक अहं',
    purpose: 'विश्लेषण से समझ',
    lifePattern: 'कई रास्ते; ऊपरी खोज',
    whatBreaksPattern: 'गहरा मौन; एक रास्ता चुनना',
  },
  4: {
    primaryConsciousness: '“मुझे रक्षा / पोषण करना है”',
    subconsciousEnergy: 'मातृ-स्मृति; बचाने की प्रवृत्ति',
    invisibleFear: 'गहराई से महसूस किया तो टूट जाऊँगा',
    egoType: 'रक्षक अहं',
    purpose: 'भावनात्मक सुरक्षा',
    lifePattern: 'ढालें बनाना; रक्षा करना',
    whatBreaksPattern: 'सोखे बिना साक्षी बनना',
  },
  5: {
    primaryConsciousness: '“मुझे देखा / पहचाना जाना है”',
    subconsciousEnergy: 'आत्म-पहचान की खोज',
    invisibleFear: 'न देखा गया तो कुछ नहीं रहूँगा',
    egoType: 'दैवी / प्रतिनिधि अहं',
    purpose: 'आत्म-अभिव्यक्ति और प्रतिनिधित्व',
    lifePattern: 'दिखने की निरंतर खोज',
    whatBreaksPattern: 'विनम्रता, ज़मीन से जुड़ाव, दया',
  },
  6: {
    primaryConsciousness: '“कुछ ग़लत है — ठीक करना है”',
    subconsciousEnergy: 'सुधारक चेतना',
    invisibleFear: 'अव्यवस्था सब नष्ट कर देगी',
    egoType: 'पूर्णता का अहं',
    purpose: 'शुद्धि और सेवा',
    lifePattern: 'अंतहीन सुधार और विश्लेषण',
    whatBreaksPattern: 'अपूर्णता को स्वीकार करना',
  },
  7: {
    primaryConsciousness: '“मुझे संतुलन / सामंजस्य बनाना है”',
    subconsciousEnergy: 'दर्पण चेतना; संतुलन की खोज',
    invisibleFear: 'असंतुलन यानी अकेले रह जाना',
    egoType: 'संतुलक अहं',
    purpose: 'संतुलन खोजना / बनाना',
    lifePattern: 'निरंतर समायोजन; निर्णयों से बचना',
    whatBreaksPattern: 'स्पष्ट निर्णय लेना; असंतुलन को स्वीकार करना',
  },
  8: {
    primaryConsciousness: '“मैं पहले भी मर चुका हूँ”',
    subconsciousEnergy: 'गहरा परिवर्तन और नवीनीकरण',
    invisibleFear: 'बहुत गहरे गया तो लौटूँगा नहीं',
    egoType: 'रूपांतरण का अहं',
    purpose: 'चेतना में गहरे उतरना',
    lifePattern: 'तीव्र रूपांतरण और संकट',
    whatBreaksPattern: 'गहराई पर भरोसा; परिवर्तन के प्रति समर्पण',
  },
  9: {
    primaryConsciousness: '“मुझे अर्थ / उद्देश्य चाहिए”',
    subconsciousEnergy: 'निरंतर खोज',
    invisibleFear: 'अर्थहीन जीवन असहनीय लगता है',
    egoType: 'साधक अहं',
    purpose: 'सत्य और उच्च अर्थ की खोज',
    lifePattern: 'बेचैन खोज और अन्वेषण',
    whatBreaksPattern: 'साधारण में अर्थ पाना',
  },
  10: {
    primaryConsciousness: '“मुझे पूरा / प्राप्त करना है”',
    subconsciousEnergy: 'अधूरे कर्तव्य की चेतना',
    invisibleFear: 'असफलता यानी मूल्यहीनता',
    egoType: 'कर्तव्य / ज़िम्मेदारी का अहं',
    purpose: 'ज़िम्मेदारियाँ पूरी करना',
    lifePattern: 'काम से चलने वाला; उपलब्धि पर ध्यान',
    whatBreaksPattern: 'अधूरेपन को स्वीकार करना',
  },
  11: {
    primaryConsciousness: '“मैं अलग / भिन्न हूँ”',
    subconsciousEnergy: 'बाहरी व्यक्ति की चेतना',
    invisibleFear: 'जुड़ना यानी स्वयं को खो देना',
    egoType: 'विरक्त अहं',
    purpose: 'अनूठापन बनाए रखना',
    lifePattern: 'भीड़ में अकेले; क्रांतिकारी प्रवृत्ति',
    whatBreaksPattern: 'पहचान खोए बिना जुड़ाव',
  },
  12: {
    primaryConsciousness: '“मैं लौटना नहीं चाहता था”',
    subconsciousEnergy: 'जन्म लेने का प्रतिरोध',
    invisibleFear: 'पूरी तरह आ गया तो स्रोत को भूल जाऊँगा',
    egoType: 'विलय का अहं',
    purpose: 'स्रोत की ओर लौटना',
    lifePattern: 'पलायन; अतिक्रमण की खोज',
    whatBreaksPattern: 'पूर्ण देह-स्थिति; वर्तमान में रहना',
  },
}

/** Same order as LAGNA_SPIRITUAL_PRINCIPLES. */
export const LAGNA_SPIRITUAL_PRINCIPLES_HI: { title: string; body: string }[] = [
  {
    title: 'लग्न एक लेंस है, आत्मा नहीं',
    body:
      'लग्न आत्मा का स्वभाव नहीं है और भाव-स्थिति से अपने आप अच्छा या बुरा नहीं होता। ' +
      'यह मुखौटा, थकान का ढर्रा और कर्म के अनुभव का कोड है — आध्यात्मिक दिशा, विधि नहीं।',
  },
  {
    title: 'सुख-क्षेत्र ही बाधा है',
    body:
      'जो लग्न तत्व को सहज लगता है वही प्रायः सबसे बड़ी आध्यात्मिक बाधा बनता है: ' +
      'अग्नि को ठहराव सीखना है, पृथ्वी को त्याग, वायु को मौन, जल को डूबे बिना साक्षी भाव।',
  },
  {
    title: 'अदृश्य भय ही द्वार है',
    body:
      'हर लग्न जन्म से एक अवचेतन भय लिए होता है जिसे प्रायः पहचाना नहीं जाता। ' +
      'परंपरागत शिक्षा मानती है कि इस भय से लड़ने की बजाय मित्रता करने से मुक्ति का मार्ग खुलता है। ' +
      'साधना को लग्न-विशेष भय पर काम करना चाहिए।',
  },
  {
    title: 'जन्मों में ढर्रा बनाम रूप',
    body:
      'जन्मों में रूप और भूमिकाएँ बदलती हैं; ऊर्जा के ढर्रे दोहराते हैं। ' +
      'जागरूकता कर्म को घोलती है: ढर्रे को पहचानें, भय को स्वीकारें, तत्व के अनुकूल औषधि का अभ्यास करें, ' +
      'और जीवन के छोटे अंतों (अहं की हानियों) से सचेत होकर मिलें।',
  },
  {
    title: 'आध्यात्मिक संदर्भ के लिए पढ़ने का क्रम',
    body:
      'पहले आशीर्वाद (नवम भाव और उसकी स्थिति) तौलें, फिर लग्न तत्व और भय का ढर्रा, ' +
      'फिर ग्रहों का रूप। धर्म त्रिकोण (त्रिकोण भाव: 1, 5, 9) की शिक्षा बाहरी जीवन, भीतरी स्व और आध्यात्मिक विकास के लिए D1–D9–D20 को भी जोड़ती है।',
  },
  {
    title: 'भक्ति कुंडली से ऊपर उठा सकती है',
    body:
      'सच्ची भक्ति व्यक्ति को सामान्य ग्रह और नक्षत्र नियमों से ऊपर उठा सकती है — ' +
      'जीवन का प्रकटीकरण पुस्तकीय फलित से अलग हो सकता है। केवल अनुष्ठान पर्याप्त नहीं; समर्पण अर्थ बदल देता है।',
  },
  {
    title: 'आशीर्वाद नवम भाव में रहते हैं',
    body:
      'हर कुंडली में कहीं न कहीं कृपा होती है; नवम भाव आशीर्वाद का स्तर और आवृत्ति दिखाता है। ' +
      'वहाँ शनि, राहु या केतु भी पूरी कुंडली साथ दे तो आध्यात्मिक शक्ति का संकेत दे सकते हैं।',
  },
]
