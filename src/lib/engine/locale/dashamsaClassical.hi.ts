// Hindi text for src/lib/engine/dashamsaClassical.ts (D10 शास्त्रीय महत्फल / आजीविका).
// English ids, enums, and keys unchanged; string tables only for overlay().

import type { GrahaId } from '@/types/astrology'
import type { MahatGrade, SignModality } from '@/lib/engine/dashamsaClassical'

type RoleKey =
  | 'tenthLord'
  | 'occupant'
  | 'aspect'
  | 'navamshaLord'
  | 'conjunctLord'
  | 'tenthFromMoon'
  | 'tenthFromSun'

export const ROLE_LABEL_HI: Record<RoleKey, string> = {
  tenthLord: 'दशमेश',
  occupant: 'दशम भाव में',
  aspect: 'दशम को दृष्टि',
  navamshaLord: 'दशमेश के नवमांश का स्वामी',
  conjunctLord: 'दशमेश के साथ युति',
  tenthFromMoon: 'चंद्र से दशम',
  tenthFromSun: 'सूर्य से दशम',
}

/** फलदीपिका आजीविका अध्याय + सर्वारेलि / BPHS कारकत्व। */
export const LIVELIHOOD_HI: Record<GrahaId, { nature: string; fields: string[] }> = {
  Su: {
    nature: 'राजसेवा, अधिकार, स्वर्ण और राज्य या पिता-सहित कर्म',
    fields: [
      'शासन और प्रशासन',
      'स्वर्ण, खजाना और राजकीय आपूर्ति',
      'अधिकार के अधीन चिकित्सा',
      'ऊन, वन और जन-कार्य',
      'संस्था का नेतृत्व',
    ],
  },
  Mo: {
    nature: 'जनता, जल और पोषण-युक्त व्यापार',
    fields: [
      'द्रव, डेयरी और कृषि',
      'मोती और जल व्यापार',
      'नर्सिंग और लोक-सेवा',
      'वस्त्र, यात्रा और आतिथ्य',
      'जनमन का सामना',
    ],
  },
  Ma: {
    nature: 'अग्नि, धातु, साहस और तकनीकी बल',
    fields: [
      'धातु, अग्नि और अस्त्र',
      'सैन्य, पुलिस और शल्य',
      'अभियांत्रिकी और भूमि',
      'रसायन, रसोई और खेल',
      'प्रतिस्पर्धी या शल्य कौशल',
    ],
  },
  Me: {
    nature: 'बुद्धि, वाणिज्य, लेखन और कुशल वाणी',
    fields: [
      'लेखन, लेखा और व्यापार',
      'गणित, ज्योतिष और विश्लेषण',
      'काव्य, शिल्प और हरित वस्तुएँ',
      'दलाली और संदेश',
      'कौशल का शिक्षण',
    ],
  },
  Ju: {
    nature: 'परामर्श, धर्म, न्याय और संरक्षित विस्तार',
    fields: [
      'अधिकार को परामर्श',
      'न्याय, बैंकिंग और खजाना',
      'शिक्षण और पुरोहितत्व',
      'दर्शन और प्रकाशन',
      'सलाह और अक्षय',
    ],
  },
  Ve: {
    nature: 'कला, सुख, रत्न और परिष्कृत वाणिज्य',
    fields: [
      'रत्न, चाँदी और विलास',
      'संगीत, नृत्य और काव्य',
      'सुगंध, वस्त्र और पशु',
      'वाहन और सौंदर्य व्यापार',
      'कूटनीति और कलाएँ',
    ],
  },
  Sa: {
    nature: 'सेवा, श्रम, तेल, पत्थर और धीमी संस्थाएँ',
    fields: [
      'श्रम, तेल और खनिज',
      'लकड़ी, पत्थर और लोहा',
      'संस्थाओं में सेवा',
      'धैर्य से फल देने वाली संरचना',
      'सेवक, भूमि या विलंब से कार्य',
    ],
  },
  Ra: {
    nature: 'विदेशी, अपरंपरागत और बढ़ी हुई महत्वाकांक्षा',
    fields: [
      'विदेश और सीमा व्यापार',
      'शोध, रसायन और असामान्य वस्तुएँ',
      'प्रौद्योगिकी और विघटन',
      'कुटुंब पेशे के बाहर के मार्ग',
    ],
  },
  Ke: {
    nature: 'विशेषज्ञ कौशल और सिंहासन के बिना किया जाने वाला कर्म',
    fields: [
      'शोध और गूढ़ कौशल',
      'मरम्मत, पूँछ और विशेष शिल्प',
      'वैराग्य-प्रवण या मोक्षाभिमुख सेवा',
      'मार्ग टूटने के बाद महारत',
    ],
  },
  Ur: { nature: 'अचानक सुधार', fields: [] },
  Ne: { nature: 'आदर्शवाद', fields: [] },
  Pl: { nature: 'शक्ति', fields: [] },
}

/** BPHS — दशमेश के भावफल; दशमांश और जन्म करियर दोनों में। */
export const TENTH_LORD_PHALA_HI: Record<number, { headline: string; prediction: string }> = {
  1: {
    headline: 'दशमेश प्रथम भाव में — स्वयं निर्मित यश',
    prediction:
      'BPHS: कर्मेश लग्न में हो तो नाम कार्य से बँधता है। व्यक्ति व्यक्तिगत प्रयास से जाना जाता है, पेशा शरीर में सीखता है, और नेतृत्व करने पर उठता है, पद के पीछे छिपने पर नहीं।',
  },
  2: {
    headline: 'दशमेश द्वितीय भाव में — पेशे से धन',
    prediction:
      'BPHS: पद परिवार और वाणी को पोषित करता है। आजीविका वाणी, अन्न, वित्त या घरेलू व्यापार से; उपाधि से अधिक पैसा काम के पीछे चलता है।',
  },
  3: {
    headline: 'दशमेश तृतीय भाव में — साहस, कौशल और लघु उद्यम',
    prediction:
      'BPHS: पेशा साहस, हाथ, लेखन, भाई-बहन या छोटी यात्रा से बढ़ता है। पहल ही करियर है। कौशल सिद्ध होने तक संसाधन कड़ी पकड़ में रह सकते हैं।',
  },
  4: {
    headline: 'दशमेश चतुर्थ भाव में — संपत्ति, वाहन, स्वदेशी कार्य',
    prediction:
      'BPHS: पेशा वाहन, संपत्ति या स्वदेशी संस्था बनाता है; मानसिक शांति तभी जब काम घर जैसा लगे। नींव शिक्षण और भूमि यहाँ स्वाभाविक बैठती है।',
  },
  5: {
    headline: 'दशमेश पंचम भाव में — बुद्धि, रचनाशीलता, परामर्श',
    prediction:
      'BPHS: मंत्री और बुद्धिमान कर्म। पद रचना, सट्टा, राजनीति, शिष्यों या परामर्श से; काम ऐसा हो जो नाम को ढो सके।',
  },
  6: {
    headline: 'दशमेश षष्ठ भाव में — सेवा और प्रतिद्वंद्वियों पर विजय',
    prediction:
      'BPHS: विरोध पर विजय से यश। चिकित्सा, न्याय, ऋण, श्रम या प्रतिस्पर्धी सेवा। शरीर नौकरी पर खर्च; प्रतिद्वंद्वी साफ़ तरीके से सँभाले तो गरिमा लौटती है।',
  },
  7: {
    headline: 'दशमेश सप्तम भाव में — व्यापार, साझेदार, लोक-व्यवहार',
    prediction:
      'BPHS: आजीविका साझेदारी, जीवनसाथी, ग्राहकों या व्यापार से, अक्सर यात्रा सहित। छिपे डेस्क से व्यवसाय अधिक अनुकूल। जनता और साथी दोनों उदय को रंगते हैं।',
  },
  8: {
    headline: 'दशमेश अष्टम भाव में — विघटन, शोध, परों का धन',
    prediction:
      'BPHS: करियर की अवधि असमान। संकट, शोध, गूढ़/बीमा, विरासत या साझे धन से सफलता — सीधी सीढ़ी से नहीं। रूपांतरण ही नौकरी है।',
  },
  9: {
    headline: 'दशमेश नवम भाव में — भाग्य और धर्म कार्य में',
    prediction:
      'BPHS: भाग्यशाली, गुरु-सहित पेशा। अधिकार, प्रकाशन, न्याय, दूर यात्रा या धर्म-संरेखित पद। कर्म धर्म से रहे तो पद कम बल से आता है।',
  },
  10: {
    headline: 'दशमेश दशम भाव में — राजसी कर्म',
    prediction:
      'BPHS: पेशा ही जीवन है। स्वनिर्मित यश और दृश्य कर्म। स्वामी गरिमावान या दिग्बल में हो तो सबसे बलवान; व्यक्ति पद से ही पहचाना जाता है।',
  },
  11: {
    headline: 'दशमेश एकादश भाव में — पेशे से लाभ',
    prediction:
      'BPHS: महत्वाकांक्षाएँ काम से पूर्ण। आय, जाल और बड़ों का सहारा दृश्य फल। उपाधि से कम मायने रखते हैं जो कर्म के बाद आते हैं।',
  },
  12: {
    headline: 'दशमेश द्वादश भाव में — विदेशी, एकांत या व्यय-युक्त कार्य',
    prediction:
      'BPHS: व्यय, विदेश, अस्पताल, आश्रम या पर्दे के पीछे का काम। स्वामी बलवान न हो तो सुख पतला। दान, निर्यात, शोध या मोक्षाभिमुख सेवा इस स्थिति का शुद्ध उपयोग है।',
  },
}

/** BPHS — दशम भाव में स्थित ग्रह का फल। */
export const OCCUPANT_PHALA_HI: Record<GrahaId, string> = {
  Su: 'BPHS: दशम में सूर्य को दिग्बल — शासन, प्रशासन और दृश्य पद। राज्य या पिता कर्म का हिस्सा। अहं को वास्तविक जिम्मेदारी की सीट दें।',
  Mo: 'BPHS: दशम में चंद्र प्रतिष्ठा को जनता-मुख और परिवर्तनशील बनाता है। देखभाल, द्रव, यात्रा या जनसमूह। बलवान चंद्र नाम स्थिर करता है; निर्बल चंद्र पद को मनोदशा पर निर्भर बनाता है।',
  Ma: 'BPHS: दशम में मंगल को दिग्बल — अभियांत्रिकी, शल्य, रक्षा, भूमि या अग्नि व्यापार। साहस करियर गढ़ता है। दबाव में मंगल हो तो कार्यस्थल संघर्ष कर लगती है।',
  Me: 'BPHS / फलदीपिका: दशम में बुध वाणिज्य, लेखन, लेखा और परामर्श है। कौशल ही आजीविका। द्विस्वभाव राशि में दो पेशा-मार्ग अपेक्षित।',
  Ju: 'BPHS: दशम में गुरु सम्मान, परामर्श, शिक्षण, न्याय या बैंकिंग लाता है। बड़े और गुरु उदय की रक्षा। पेशा ऐसा हो जिसे धर्म पर ठोंक सकें।',
  Ve: 'BPHS: दशम में शुक्र कला, विलास, कूटनीति, वाहन और सुखद लोक-व्यवहार को अनुकूल करता है। पद बल से अधिक परिष्कार से आता है।',
  Sa: 'BPHS: दशम में शनि विलंब करता है, फिर पद पक्का करता है। सेवा, श्रम, खनिज, तेल या संस्थाएँ। उदय धीमा, टिकाऊपन परिणाम है।',
  Ra: 'दशम में राहु महत्वाकांक्षा और विदेशी या अपरंपरागत कर्म बढ़ाता है। प्रतिष्ठा उछल सकती है; विधि अशुद्ध हो तो कलंक जोखिम है।',
  Ke: 'दशम में केतु विशेषज्ञ महारत और सिंहासन की कम भूख देता है। करियर में टूटन ही कौशल बनती है। शोध और वैराग्य-युक्त सेवा अनुकूल।',
  Ur: '',
  Ne: '',
  Pl: '',
}

export const GRADE_COPY_HI: Record<MahatGrade, string> = {
  ordinary:
    'सामान्य महत्फल — कार्य करने योग्य पेशा; पद से अधिक धैर्य से यश बढ़ता है।',
  notable: 'उल्लेखनीय महत्फल — करियर नाम ले सकता है; ऊँचाई फिर भी प्रयास तय करता है।',
  distinguished:
    'विशिष्ट महत्फल — पद और जिम्मेदारी वास्तविक वादा है, विशेषकर स्वामियों की दशाओं में।',
  mahat:
    'यथार्थ महत्फल — महत्वपूर्ण कर्म, अधिकार या जन-कर्म जब कुंडली शुद्ध जीवित हो।',
}

export const MODALITY_COPY_HI: Record<SignModality, { label: string; prediction: string }> = {
  movable: {
    label: 'चर · चलायमान',
    prediction:
      'सर्वारेलि और बृहज्जातक: चर दशम पेशा, पद या नगर बदलता है। आजीविका चलती है। एक आजीवन उपाधि मजबूर न करें — कर्म धागा है, नौकरी नहीं।',
  },
  fixed: {
    label: 'स्थिर · अचल',
    prediction:
      'सर्वारेलि और बृहज्जातक: स्थिर दशम एक ही दृढ़ पेशा। निरंतरता विविधता पर भारी। एक क्षेत्र में यश जमा होता है।',
  },
  dual: {
    label: 'द्विस्वभाव · द्विधा',
    prediction:
      'सर्वारेलि और बृहज्जातक: द्विस्वभाव दशम दो धाराएँ — दो पेशे, या एक पद और एक कमाई-कौशल। मुख्य कर्म के साथ शिक्षण, लेखन या व्यापार।',
  },
}

export const ELEMENT_COPY_HI: Record<number, string> = {
  0: 'अग्नि दशम: कर्म नेतृत्व, प्रतिस्पर्धा या आरंभ करता है।',
  1: 'पृथ्वी दशम: आजीविका भौतिक, संरचनात्मक; संपत्ति या संस्थाओं में गिनी जाती है।',
  2: 'वायु दशम: वाणिज्य, बुद्धि और जाल पद का माध्यम हैं।',
  3: 'जल दशम: जनता, देखभाल, द्रव या शोध पेशा ढोते हैं।',
}

export const GRADE_LABEL_EN: Record<MahatGrade, string> = {
  ordinary: 'Ordinary',
  notable: 'Notable',
  distinguished: 'Distinguished',
  mahat: 'Mahat',
}

export const GRADE_LABEL_HI: Record<MahatGrade, string> = {
  ordinary: 'सामान्य',
  notable: 'उल्लेखनीय',
  distinguished: 'विशिष्ट',
  mahat: 'महत्',
}

const D10C_BASE = {
  framing:
    'BPHS gives Dashamsha for mahatphala — power, status, and deeds of consequence. Phaladeepika names the livelihood from the birth-chart 10th. This tab applies both, then the yogas and the Amatyakaraka, and times them. Natal rashi and bhava phala tables are also read on the D10 placements.',
  mahatText:
    'Counted factors: lagna-lord dignity, 10th-lord dignity, the 10th lord’s house, Digbala in the 10th, Dharma-Karmadhipati, Vargottama, Neecha Bhanga, a strong Amatyakaraka, and helpful drishti (aspect) on the D10 10th. Other formed yogas are listed beside the grade. This is a mahatphala grade, not a job title.',
  livMethod:
    'Phaladeepika takes the strongest among the 10th lord, planets in the 10th, planets aspecting the 10th, and the lord of the Navamsha occupied by the 10th lord. Uttara Kalamrita stresses that Navamsha lord. The 10th from Moon and from Sun are supporting checks (BPHS chandra and surya lagna).',
  livLead: '{name} leads the Phaladeepika test ({roles}).',
  livFields: 'Fields: {fields}.',
  livInD10: 'In Dashamsha, {name} is in {rashi} H{house} ({dignity}).',
  livCombust: 'Combust in the birth chart: the skill works under another’s brilliance — credit may travel upward.',
  livRetro: 'Retrograde: this significator revisits unfinished work before it stabilizes.',
  agreeYes:
    '{name} leads both the birth-chart livelihood test and the Dashamsha 10th complex. The kind of work and the way status is earned point the same way.',
  agreeNo:
    '{winner} is the livelihood type in the birth chart. {mahat} carries mahatphala inside D10 ({roles}). Use {winner} for the kind of work and {mahat} for how status is earned.',
  ptrLord: '10th lord',
  ptrLordDetail: '{planet} · D1 H{house} · {dignity}',
  ptrOcc: 'Planets in the 10th',
  ptrOccNone: 'None',
  ptrAspect: 'Aspecting the 10th',
  ptrAspectNone: 'None by full graha drishti',
  ptrNav: 'Navamsha lord of the 10th lord',
  ptrNavDetail: '{navLord} (D9 of {tenthLord} is {sign})',
  ptrNavSkip: 'D9 is not on this chart — Uttara Kalamrita check skipped',
  srcPhaladeepika: 'Phaladeepika',
  srcPBJ: 'Phaladeepika · Brihat Jataka',
  srcDrishti: 'Phaladeepika · BPHS drishti',
  srcUK: 'Phaladeepika · Uttara Kalamrita',
  occFallback: '{name} occupies the Dashamsha 10th.',
  amkHeadline: 'Amatyakaraka {name} in D10 H{house}',
  amkSource: 'Jaimini Sutras — AmK is the minister, the karma the person is known for',
  timeTenthLord: 'D10 10th lord · {name}',
  timeLivelihood: 'Livelihood lord · {name}',
  timeMahat: 'Mahatphala lord · {name}',
  timeAmk: 'Amatyakaraka · {name}',
  timePredTenthLord:
    '{name} periods accelerate work karma and the house-{house} result above.',
  timePredLivelihood:
    '{name} periods bring the Phaladeepika profession into the open — {nature}.',
  timePredMahat: '{name} periods show how status is actually earned in Dashamsha.',
  timePredAmk: '{name} periods activate the Jaimini career significator.',
  predGrade: '{grade} ({score}).',
  predLivelihood: '{name} is the livelihood planet. {detail}.',
  predTenthLord: '{name}, D10 10th lord, in house {house}: {headline}.',
  predModality: '{label} D10 10th ({sign}). {element}',
  predNoYoga:
    'No major career yoga is formed in this Dashamsha — read the 10th lord’s house as the whole story.',
  predTimingFallback:
    'Time the 10th lord, the livelihood planet, and the Amatyakaraka with Vimshottari.',
  predLagnaCareers: 'D10 lagna {sign} ({keyword}) careers: {careers}.',
  predPriorityLens: '{name} in D10: {lens}',
  tenthLordPred: '{name} in D10 H{house} ({rashi}, {dignity}). {prediction}',
  tenthLordSource: 'BPHS — effects of the lord of the 10th, read in Dashamsha',
  d1TenthNote:
    'Birth-chart 10th is {d1Sign} ({d1Mod}). D10 {d10Sign} is the mahatphala version of that promise.',
  tenthSignSource: 'Saravali · Brihat Jataka',
  phalaFraming:
    'The same BPHS / Phaladeepika / Saravali planet-in-house and planet-in-rashi tables used on the birth chart are read on Dashamsha placements. House meanings stay career-scoped by the D10 house themes.',
  roleLagna: 'D10 lagna lord',
  roleTenth: 'D10 10th lord',
  role11: 'D10 11th lord',
  roleLivelihood: 'livelihood planet',
  roleAmk: 'Amatyakaraka',
  careerLensHouse: '{name} in D10 H{house}: {teaching}',
  careerLensFallback: '{name} in D10 H{house} ({theme}).',
  careerLensSign: 'In {rashi}: {text}',
  keywordFallback: 'livelihood',
  d10HouseTheme: 'D10 house {house}',
  lumMoonFace: 'public reputation',
  lumSunFace: 'authority and the state',
  lumPred:
    '10th from {from} in Dashamsha is {sign} (H{house}), lord {lord}{occupants}. This is the {face} face of the same mahatphala.',
  lumWithOcc: ', with {names}',
  amkPlaceKendra: 'in a kendra (angular houses: 1, 4, 7, 10) — the career significator is visible',
  amkPlaceTrikona: 'in a trikona (trine houses: 1, 5, 9) — the career significator is tied to dharma, students, or fortune',
  amkPlace11: 'in the 11th — gains and networks are how the minister works',
  amkPlace10: 'in the 10th — the profession is the life',
  amkPlaceDusthana:
    'in a dusthana (difficult houses: 6, 8, 12) — service under pressure, hidden work, or a career of fixing what is broken',
  amkPlaceOther: 'supporting the profession from effort, speech, or courage',
  amkPred:
    'Jaimini: Amatyakaraka {name} in D10 {rashi} H{house} ({dignity}) is {place}. Judge the post from this house, and the kind of work from the Phaladeepika planet.',
  mfLagnaLord: 'D10 lagna lord',
  mfLagnaNote: '{name} is {dignity} in house {house}.',
  mfTenthDig: 'D10 10th lord dignity',
  mfTenthDigNote: '{name} is {dignity}.',
  mfTenthHouse: 'D10 10th lord’s house',
  mfTenthHouseNote: 'House {house} of the karma lord.',
  mfDigbala: 'Digbala in the D10 10th',
  mfDigbalaNote: 'Sun or Mars in the Dashamsha 10th (BPHS directional strength).',
  mfDk: 'Dharma-Karmadhipati',
  mfDkNote: '9th and 10th lords are connected in D10.',
  mfVgTenth: 'Vargottama 10th lord',
  mfVgTenthNote: '{name} repeats its natal sign in Dashamsha.',
  mfVgLagna: 'Vargottama lagna lord',
  mfVgLagnaNote: '{name} repeats its natal sign in Dashamsha.',
  mfNeecha: 'Neecha Bhanga',
  mfNeechaCancel: 'Debility of a career lord is cancelled.',
  mfNeechaStand: 'Debility stands without cancellation.',
  mfNeechaPartial: 'Debility is only partly cancelled.',
  mfAmk: 'Amatyakaraka well placed',
  mfAmkNote: '{name} in D10 H{house}.',
  mfDrishti: 'Helpful drishti (aspect) on the D10 10th',
  mfDrishtiNote: 'Jupiter, Venus, or the Moon aspects the karma sign.',
  candDignity: 'dignity {dignity} {pts}',
  candHouse: 'house {house} {pts}',
  candVargottama: 'vargottama +{pts}',
  candDigbala: 'digbala +{pts}',
  candD10Digbala: 'D10 digbala +{pts}',
  candCombust: 'combust {pts}',
  ro1: 'Confirm D1 first. Dashamsha does not replace the birth chart — BPHS uses it for mahatphala on top of the rashi promise.',
  ro2: 'Name the Phaladeepika livelihood planet from the four pointers, with the Navamsha lord included when D9 is present.',
  ro3: 'Read that planet’s Dashamsha house as how the profession fruits.',
  ro4: 'Read the D10 10th lord’s house (BPHS bhava phala) for the shape of status.',
  ro5: 'Apply natal planet-in-house and planet-in-rashi phala to the D10 placements of the career lords.',
  ro6: 'Note chara, sthira, or dvisvabhava of the D10 10th — changes, one profession, or two tracks.',
  ro7:
    'Keep only the yogas that are formed: Dharma-Karmadhipati, Digbala, Vargottama, Neecha Bhanga, Viparita, Budhaditya, shared 10th/11th lord.',
  ro8: 'Place the Amatyakaraka in D10. That is the Jaimini minister’s post.',
  ro9: 'Time the above with Vimshottari of the 10th lord, the livelihood planet, and the Amatyakaraka.',
  src1:
    'BPHS — Dashamsha is mahatphala; 10th-lord results; Digbala; Dharma-Karmadhipati; Neecha Bhanga; Viparita; Budhaditya; Vargottama',
  src2:
    'Phaladeepika — livelihood from the strongest of the 10th lord, occupants, aspectors, and the Navamsha lord of the 10th lord',
  src3: 'Uttara Kalamrita — Navamsha of the 10th lord for profession',
  src4: 'Saravali and Brihat Jataka — movable, fixed, or dual 10th',
  src5: 'Jaimini — Amatyakaraka as the career significator',
  src6: 'BPHS / Phaladeepika / Saravali — planet-in-rashi and planet-in-bhava phala applied inside Dashamsha',
  dashaLevel0: 'Dasha',
  dashaLevel1: 'Maha',
  dashaLevel2: 'Antar',
  dashaLevel3: 'Pratyantar',
  dashaLevel4: 'Sukshma',
  timingWindowLive: '{level} {planet} is running until {end}.',
  timingWindowFuture: 'When {planet}’s Vimshottari periods run.',
  timingPredLive: '{level} {planet} is live until {end}. {prediction}',
  timingPredFuture: '{prediction} Watch {planet} mahadasha and antardasha.',
  yDkName: 'Dharma-Karmadhipati',
  yDkSrc: 'BPHS raja yoga',
  yDkYes:
    '{how} Dharma-Karmadhipati in the Dashamsha: fortune and profession move together. The rise is cleaner when the work can be defended as right.',
  yDkNo:
    'Dharma-Karmadhipati is not formed — 9th and 10th lords are neither the same planet nor joined by conjunction, aspect, or exchange.',
  dkNotSambandha: '9th and 10th lords are not in sambandha.',
  dkSameLord: '{planet} owns both the 9th and the 10th — the yoga is in the lordship itself.',
  dkConjunct: '{ninth} and {tenth} join in {sign}.',
  dkExchange: '{ninth} and {tenth} exchange signs.',
  dkAspect: '{ninth} and {tenth} are in graha drishti.',
  yDigName: 'Digbala in the 10th',
  yDigSrc: 'BPHS digbala, read in Dashamsha',
  yDigYes:
    '{names} in the Dashamsha 10th has directional strength. Authority or technical command is part of the post, not an accident.',
  yDigNo: 'Neither Sun nor Mars occupies the Dashamsha 10th, so karma-digbala is not formed there.',
  ySwName: 'Own or exalted planet in the 10th',
  ySwSrc: 'BPHS — dignified graha in the karma house',
  ySwYes:
    '{detail} sits in the Dashamsha 10th. The profession has a seat of its own strength.',
  ySwNo: 'No planet is in own sign, moolatrikona, or exaltation in the Dashamsha 10th.',
  ySwPlanet: '{name} ({dignity})',
  yBudhaName: 'Budha-Aditya',
  yBudhaSrc: 'BPHS',
  yBudhaYes:
    'Sun and Mercury join in D10 {sign}. Skill, counsel, writing, and commerce serve the career. If Mercury is combust in the birth chart, the skill is real and the credit is shared upward.',
  yBudhaNo: 'Sun and Mercury are not conjunct in Dashamsha.',
  yNeechaBhanga: 'Neecha Bhanga',
  yNeechaDebil: 'Debility in the career lords',
  yNeechaSrc: 'BPHS neecha bhanga',
  yNeechaNone: 'No key career planet is debilitated in Dashamsha, so Neecha Bhanga is not in question.',
  yKarmaLabhaName: 'One lord for karma and gains',
  yKarmaLabhaSrc: 'BPHS lordship of the 10th and 11th',
  yKarmaLabhaYes:
    '{planet} owns both the Dashamsha 10th and 11th. Work and income are the same planet — gains follow the karma, and that planet’s delays or dignity hit both.',
  yKarmaLabhaNo: 'The 10th and 11th have different lords.',
  yLabhaName: '10th–11th income link',
  yLabhaSrc: 'BPHS — karma lord and labha',
  yLabhaYes: 'The 10th lord and 11th lord are linked by house or exchange. Income is a direct fruit of the profession.',
  yLabhaNo: 'No separate 10th–11th exchange or mutual house placement.',
  yPar910Name: 'Parivartana of 9th and 10th',
  yPar910Src: 'BPHS exchange',
  yPar910Yes: '9th and 10th lords exchange. Dharma-Karmadhipati by parivartana — fortune and work trade places.',
  yPar910No: '9th and 10th lords do not exchange signs.',
  yPar110Name: 'Parivartana of lagna and 10th',
  yPar110Src: 'BPHS exchange',
  yPar110Yes: 'Lagna lord and 10th lord exchange. The person and the profession are one story — self-made status.',
  yPar110No: 'Lagna lord and 10th lord do not exchange.',
  yPar1011Name: 'Parivartana of 10th and 11th',
  yPar1011Src: 'BPHS exchange',
  yPar1011Yes: '10th and 11th lords exchange. Gains and profession reinforce each other.',
  yPar1011No: '10th and 11th lords do not exchange.',
  yVipName: 'Viparita in the career chart',
  yVipSrc: 'BPHS Harsha, Sarala, Vimala',
  yVipNo:
    'Dusthana (difficult houses: 6, 8, 12) lords are not placed in another dusthana, so Viparita is not lifting the career through crisis.',
  yVgName: 'Vargottama career lords',
  yVgSrc: 'BPHS vargottama',
  yVgYes:
    '{names} {keep} the same sign in D1 and D10. The career promise repeats instead of splitting. A vargottama debility repeats the fall-and-rise pattern; it does not erase it.',
  yVgKeep: 'keep',
  yVgKeeps: 'keeps',
  yVgNo: 'Neither the Dashamsha lagna lord nor the 10th lord is vargottama.',
  yAmkName: 'Amatyakaraka in a strong D10 house',
  yAmkSrc: 'Jaimini',
  yAmkYesStrong:
    'Amatyakaraka {name} in D10 H{house} can act — kendra (angular houses: 1, 4, 7, 10), trikona (trine houses: 1, 5, 9), or gains.',
  yAmkYesWeak:
    'Amatyakaraka {name} is in D10 H{house}, outside kendra (angular houses: 1, 4, 7, 10), trikona (trine houses: 1, 5, 9), and the 11th. The minister works indirectly.',
  yAmkNoChart: 'Amatyakaraka is not on this chart.',
  neechaDisp:
    '{name}, lord of the fall sign, is in a kendra (angular houses: 1, 4, 7, 10) from {from}',
  neechaExalt:
    '{name}, exalted in that sign, is in a kendra (angular houses: 1, 4, 7, 10) from {from}',
  neechaFromLagna: 'D10 lagna',
  neechaFromMoon: 'D10 Moon',
  neechaCancelled:
    '{name} is debilitated in Dashamsha and cancellation applies — {reason}. BPHS: rise after the fall, especially in the dispositor (ruler of the sign it sits in)’s dasha.',
  neechaUncancelled:
    '{name} is debilitated in Dashamsha without neecha bhanga. The career needs the dispositor (ruler of the sign it sits in)’s support; do not expect the fall to cancel itself.',
  vipHarsha: 'Harsha (6th lord)',
  vipSarala: 'Sarala (8th lord)',
  vipVimala: 'Vimala (12th lord)',
  vipHit: '{label} {name} is in house {house}',
  vipSummary:
    '{hits}. Viparita can lift status through crisis, rivalry, or loss — the fruit is real and the road is not comfortable.',
} as const

export const D10C_TEXT_EN = D10C_BASE

export const D10C_TEXT_HI: Record<keyof typeof D10C_TEXT_EN, string> = {
  framing:
    'BPHS दशमांश को महत्फल — शक्ति, पद और परिणामकारी कर्म के लिए देता है। फलदीपिका जन्म-कुंडली के दशम से आजीविका नामित करती है। यह टैब दोनों लागू करता है, फिर योग और अमात्यकारक, और समय बाँधता है। जन्म राशि और भावफल सारणियाँ D10 स्थितियों पर भी पढ़ी जाती हैं।',
  mahatText:
    'गिने गए कारक: लग्नेश की गरिमा, दशमेश की गरिमा, दशमेश का भाव, दशम में दिग्बल, धर्म-कर्माधिपति, वर्गोत्तम, नीच भंग, बलवान अमात्यकारक, और D10 दशम पर सहायक दृष्टि। अन्य बने योग श्रेणी के पास सूचीबद्ध हैं। यह महत्फल की श्रेणी है, नौकरी का शीर्षक नहीं।',
  livMethod:
    'फलदीपिका दशमेश, दशम में ग्रह, दशम को दृष्टि करने वाले, और दशमेश के नवमांश के स्वामी में से सबसे बलवान लेती है। उत्तर कालामृत उस नवमांशेश पर ज़ोर देता है। चंद्र और सूर्य से दशम सहायक जाँच हैं (BPHS चंद्र और सूर्य लग्न)।',
  livLead: 'फलदीपिका परीक्षा में {name} अग्रणी ({roles})।',
  livFields: 'क्षेत्र: {fields}।',
  livInD10: 'दशमांश में {name} {rashi} भाव {house} में ({dignity})।',
  livCombust:
    'जन्म-कुंडली में अस्त: कौशल दूसरे की चमक के अधीन काम करता है — श्रेय ऊपर जा सकता है।',
  livRetro: 'वक्री: यह कारक स्थिर होने से पहले अधूरे कर्म को दोहराता है।',
  agreeYes:
    '{name} जन्म-कुंडली की आजीविका परीक्षा और दशमांश दशम-समूह दोनों में अग्रणी है। काम का प्रकार और पद कैसे अर्जित हो, एक ही दिशा में इंगित करते हैं।',
  agreeNo:
    'जन्म-कुंडली में आजीविका-प्रकार {winner} है। {mahat} D10 के भीतर महत्फल ढोता है ({roles})। काम के प्रकार के लिए {winner} और पद कैसे मिले इसके लिए {mahat} देखें।',
  ptrLord: 'दशमेश',
  ptrLordDetail: '{planet} · D1 भाव {house} · {dignity}',
  ptrOcc: 'दशम में ग्रह',
  ptrOccNone: 'कोई नहीं',
  ptrAspect: 'दशम को दृष्टि',
  ptrAspectNone: 'पूर्ण ग्रह-दृष्टि से कोई नहीं',
  ptrNav: 'दशमेश के नवमांश का स्वामी',
  ptrNavDetail: '{navLord} (दशमेश {tenthLord} का D9 {sign} है)',
  ptrNavSkip: 'इस कुंडली पर D9 नहीं — उत्तर कालामृत जाँच छोड़ी',
  srcPhaladeepika: 'फलदीपिका',
  srcPBJ: 'फलदीपिका · बृहज्जातक',
  srcDrishti: 'फलदीपिका · BPHS दृष्टि',
  srcUK: 'फलदीपिका · उत्तर कालामृत',
  occFallback: '{name} दशमांश के दशम में स्थित है।',
  amkHeadline: 'अमात्यकारक {name} D10 भाव {house} में',
  amkSource: 'जैमिनी सूत्र — अमK मंत्री है, जिस कर्म से व्यक्ति जाना जाता है',
  timeTenthLord: 'D10 दशमेश · {name}',
  timeLivelihood: 'आजीविका स्वामी · {name}',
  timeMahat: 'महत्फल स्वामी · {name}',
  timeAmk: 'अमात्यकारक · {name}',
  timePredTenthLord: '{name} की दशाएँ कार्य-कर्म और ऊपर भाव-{house} के फल को तेज करती हैं।',
  timePredLivelihood: '{name} की दशाएँ फलदीपिका पेशे को खुले में लाती हैं — {nature}।',
  timePredMahat: '{name} की दशाएँ दिखाती हैं कि दशमांश में पद वास्तव में कैसे अर्जित होता है।',
  timePredAmk: '{name} की दशाएँ जैमिनी करियर-कारक को सक्रिय करती हैं।',
  predGrade: '{grade} ({score})।',
  predLivelihood: '{name} आजीविका-ग्रह है। {detail}।',
  predTenthLord: '{name}, D10 दशमेश, भाव {house} में: {headline}।',
  predModality: '{label} D10 दशम ({sign})। {element}',
  predNoYoga:
    'इस दशमांश में कोई बड़ा करियर-योग नहीं बना — पूरी कथा के लिए दशमेश का भाव पढ़ें।',
  predTimingFallback:
    'दशमेश, आजीविका-ग्रह और अमात्यकारक को विंशोत्तरी से समय दें।',
  predLagnaCareers: 'D10 लग्न {sign} ({keyword}) पेशे: {careers}।',
  predPriorityLens: 'D10 में {name}: {lens}',
  tenthLordPred: 'D10 भाव {house} में {name} ({rashi}, {dignity})। {prediction}',
  tenthLordSource: 'BPHS — दशमेश के फल, दशमांश में पढ़े',
  d1TenthNote:
    'जन्म-कुंडली का दशम {d1Sign} ({d1Mod}) है। D10 {d10Sign} उस वादे का महत्फल-संस्करण है।',
  tenthSignSource: 'सर्वारेलि · बृहज्जातक',
  phalaFraming:
    'जन्म-कुंडली पर उपयोग की वही BPHS / फलदीपिका / सर्वारेलि भाव में ग्रह और राशि में ग्रह सारणियाँ दशमांश स्थितियों पर पढ़ी जाती हैं। भाव अर्थ D10 भाव-विषयों से करियर-सीमित रहते हैं।',
  roleLagna: 'D10 लग्नेश',
  roleTenth: 'D10 दशमेश',
  role11: 'D10 एकादशेश',
  roleLivelihood: 'आजीविका-ग्रह',
  roleAmk: 'अमात्यकारक',
  careerLensHouse: 'D10 भाव {house} में {name}: {teaching}',
  careerLensFallback: 'D10 भाव {house} में {name} ({theme})।',
  careerLensSign: '{rashi} में: {text}',
  keywordFallback: 'आजीविका',
  d10HouseTheme: 'D10 भाव {house}',
  lumMoonFace: 'जन-प्रतिष्ठा',
  lumSunFace: 'अधिकार और राज्य',
  lumPred:
    'दशमांश में {from} से दशम {sign} है (भाव {house}), स्वामी {lord}{occupants}। यह उसी महत्फल का {face} पहलू है।',
  lumWithOcc: ', साथ {names}',
  amkPlaceKendra: 'केंद्र (कोण भाव: 1, 4, 7, 10) में — करियर-कारक दृश्य है',
  amkPlaceTrikona: 'त्रिकोण (1, 5, 9) में — करियर-कारक धर्म, शिष्य या भाग्य से बँधा',
  amkPlace11: 'एकादश में — लाभ और जाल मंत्री का ढंग हैं',
  amkPlace10: 'दशम में — पेशा ही जीवन है',
  amkPlaceDusthana:
    'दुःस्थान (6, 8, 12) में — दबाव में सेवा, गुप्त कर्म, या टूटी चीज़ सँभालने का करियर',
  amkPlaceOther: 'प्रयास, वाणी या साहस से पेशे का समर्थन',
  amkPred:
    'जैमिनी: D10 {rashi} भाव {house} में अमात्यकारक {name} ({dignity}) {place} है। पद इस भाव से, काम का प्रकार फलदीपिका-ग्रह से तय करें।',
  mfLagnaLord: 'D10 लग्नेश',
  mfLagnaNote: '{name} भाव {house} में {dignity} है।',
  mfTenthDig: 'D10 दशमेश की गरिमा',
  mfTenthDigNote: '{name} {dignity} है।',
  mfTenthHouse: 'D10 दशमेश का भाव',
  mfTenthHouseNote: 'कर्मेश का भाव {house}।',
  mfDigbala: 'D10 दशम में दिग्बल',
  mfDigbalaNote: 'दशमांश दशम में सूर्य या मंगल (BPHS दिग्बल)।',
  mfDk: 'धर्म-कर्माधिपति',
  mfDkNote: 'D10 में नवम और दशम स्वामी जुड़े हैं।',
  mfVgTenth: 'वर्गोत्तम दशमेश',
  mfVgTenthNote: '{name} जन्म राशि दशमांश में दोहराता है।',
  mfVgLagna: 'वर्गोत्तम लग्नेश',
  mfVgLagnaNote: '{name} जन्म राशि दशमांश में दोहराता है।',
  mfNeecha: 'नीच भंग',
  mfNeechaCancel: 'करियर-स्वामी की नीचता रद्द होती है।',
  mfNeechaStand: 'नीचता रद्दीकरण के बिना खड़ी है।',
  mfNeechaPartial: 'नीचता आंशिक रूप से ही रद्द है।',
  mfAmk: 'अमात्यकारक अच्छी जगह',
  mfAmkNote: 'D10 भाव {house} में {name}।',
  mfDrishti: 'D10 दशम पर सहायक दृष्टि',
  mfDrishtiNote: 'गुरु, शुक्र या चंद्र कर्म-राशि को देखते हैं।',
  candDignity: 'गरिमा {dignity} {pts}',
  candHouse: 'भाव {house} {pts}',
  candVargottama: 'वर्गोत्तम +{pts}',
  candDigbala: 'दिग्बल +{pts}',
  candD10Digbala: 'D10 दिग्बल +{pts}',
  candCombust: 'अस्त {pts}',
  ro1: 'पहले D1 पुष्टि करें। दशमांश जन्म-कुंडली का स्थान नहीं लेता — BPHS इसे राशि-वादे के ऊपर महत्फल के लिए उपयोग करता है।',
  ro2: 'चार संकेतकों से फलदीपिका आजीविका-ग्रह नामित करें; D9 हो तो नवमांशेश शामिल करें।',
  ro3: 'उस ग्रह का दशमांश-भाव पढ़ें — पेशा कैसे फलता है।',
  ro4: 'पद के आकार के लिए D10 दशमेश का भाव (BPHS भावफल) पढ़ें।',
  ro5: 'करियर-स्वामियों की D10 स्थितियों पर जन्म भाव/राशि फल लागू करें।',
  ro6: 'D10 दशम चर, स्थिर या द्विस्वभाव — बदलाव, एक पेशा, या दो धाराएँ।',
  ro7:
    'केवल बने योग रखें: धर्म-कर्माधिपति, दिग्बल, वर्गोत्तम, नीच भंग, विपरीत, बुधादित्य, साझा 10/11 स्वामी।',
  ro8: 'अमात्यकारक को D10 में रखें — जैमिनी मंत्री का पद।',
  ro9: 'ऊपर को दशमेश, आजीविका-ग्रह और अमात्यकारक की विंशोत्तरी से समय दें।',
  src1:
    'BPHS — दशमांश महत्फल; दशमेश-फल; दिग्बल; धर्म-कर्माधिपति; नीच भंग; विपरीत; बुधादित्य; वर्गोत्तम',
  src2:
    'फलदीपिका — दशमेश, अधिवासी, दृष्टा और दशमेश के नवमांशेश में से सबसे बलवान से आजीविका',
  src3: 'उत्तर कालामृत — पेशे के लिए दशमेश का नवमांश',
  src4: 'सर्वारेलि और बृहज्जातक — चर, स्थिर या द्विस्वभाव दशम',
  src5: 'जैमिनी — करियर-कारक के रूप में अमात्यकारक',
  src6: 'BPHS / फलदीपिका / सर्वारेलि — दशमांश के भीतर राशि और भाव में ग्रह फल',
  dashaLevel0: 'दशा',
  dashaLevel1: 'महा',
  dashaLevel2: 'अंतर',
  dashaLevel3: 'प्रत्यंतर',
  dashaLevel4: 'सूक्ष्म',
  timingWindowLive: '{level} {planet} {end} तक चल रही है।',
  timingWindowFuture: 'जब {planet} की विंशोत्तरी दशाएँ चलें।',
  timingPredLive: '{level} {planet} {end} तक सक्रिय। {prediction}',
  timingPredFuture: '{prediction} {planet} की महादशा और अंतर्दशा देखें।',
  yDkName: 'धर्म-कर्माधिपति योग',
  yDkSrc: 'BPHS राजयोग',
  yDkYes:
    '{how} दशमांश में धर्म-कर्माधिपति: भाग्य और पेशा साथ चलते हैं। काम धर्म पर ठोंका जा सके तो उदय शुद्ध होता है।',
  yDkNo:
    'धर्म-कर्माधिपति नहीं बना — नवम और दशम स्वामी न तो एक ग्रह हैं, न यति, दृष्टि या परिवर्तन से जुड़े।',
  dkNotSambandha: 'नवम और दशम स्वामी संबंध में नहीं।',
  dkSameLord: '{planet} नवम और दशम दोनों का स्वामी है — योग स्वामित्व में है।',
  dkConjunct: '{ninth} और {tenth} {sign} में युति में हैं।',
  dkExchange: '{ninth} और {tenth} राशियाँ परिवर्तित करते हैं।',
  dkAspect: '{ninth} और {tenth} ग्रह-दृष्टि में हैं।',
  yDigName: 'दशम में दिग्बल',
  yDigSrc: 'BPHS दिग्बल, दशमांश में',
  yDigYes:
    'दशमांश दशम में {names} को दिग्बल। अधिकार या तकनीकी आदेश पद का हिस्सा है, संयोग नहीं।',
  yDigNo: 'न सूर्य न मंगल दशमांश दशम में — कर्म-दिग्बल वहाँ नहीं बना।',
  ySwName: 'दशम में स्व या उच्च ग्रह',
  ySwSrc: 'BPHS — कर्म भाव में गरिमावान ग्रह',
  ySwYes: 'दशमांश दशम में {detail}। पेशे की अपनी बल की सीट है।',
  ySwNo: 'दशमांश दशम में कोई ग्रह स्व, मूलत्रिकोण या उच्च में नहीं।',
  ySwPlanet: '{name} ({dignity})',
  yBudhaName: 'बुधादित्य योग',
  yBudhaSrc: 'BPHS',
  yBudhaYes:
    'D10 {sign} में सूर्य-बुध युति। कौशल, परामर्श, लेखन और वाणिज्य करियर की सेवा करते हैं। जन्म में बुध अस्त हो तो कौशल वास्तविक, श्रेय ऊपर साझा।',
  yBudhaNo: 'दशमांश में सूर्य और बुध युति में नहीं।',
  yNeechaBhanga: 'नीच भंग',
  yNeechaDebil: 'करियर-स्वामियों में नीचता',
  yNeechaSrc: 'BPHS नीच भंग',
  yNeechaNone: 'दशमांश में कोई प्रमुख करियर-ग्रह नीच नहीं — नीच भंग प्रश्न में नहीं।',
  yKarmaLabhaName: 'कर्म और लाभ का एक स्वामी',
  yKarmaLabhaSrc: 'BPHS दशम और एकादश स्वामित्व',
  yKarmaLabhaYes:
    '{planet} दशमांश के दशम और एकादश दोनों का स्वामी। काम और आय एक ग्रह — लाभ कर्म के पीछे; उस ग्रह की देरी या गरिमा दोनों को छूती है।',
  yKarmaLabhaNo: 'दशम और एकादश के अलग स्वामी।',
  yLabhaName: 'दशम–एकादश आय-संबंध',
  yLabhaSrc: 'BPHS — कर्मेश और लाभ',
  yLabhaYes: 'दशमेश और एकादशेश भाव या परिवर्तन से जुड़े। आय पेशे का सीधा फल।',
  yLabhaNo: 'अलग दशम–एकादश परिवर्तन या पारस्परिक भाव-स्थिति नहीं।',
  yPar910Name: 'नवम–दशम परिवर्तन',
  yPar910Src: 'BPHS परिवर्तन',
  yPar910Yes: 'नवम और दशम स्वामी परिवर्तन करते हैं। परिवर्तन से धर्म-कर्माधिपति — भाग्य और कर्म स्थान बदलते हैं।',
  yPar910No: 'नवम और दशम स्वामी राशि नहीं बदलते।',
  yPar110Name: 'लग्न–दशम परिवर्तन',
  yPar110Src: 'BPHS परिवर्तन',
  yPar110Yes: 'लग्नेश और दशमेश परिवर्तन। व्यक्ति और पेशा एक कथा — स्वनिर्मित पद।',
  yPar110No: 'लग्नेश और दशमेश परिवर्तन नहीं करते।',
  yPar1011Name: 'दशम–एकादश परिवर्तन',
  yPar1011Src: 'BPHS परिवर्तन',
  yPar1011Yes: 'दशमेश और एकादशेश परिवर्तन। लाभ और पेशा एक-दूसरे को पुष्टि देते हैं।',
  yPar1011No: 'दशमेश और एकादशेश परिवर्तन नहीं करते।',
  yVipName: 'करियर-कुंडली में विपरीत',
  yVipSrc: 'BPHS हर्ष, सरल, विमल',
  yVipNo:
    'दुःस्थान (6, 8, 12) के स्वामी दूसरे दुःस्थान में नहीं — विपरीत संकट से करियर उठा नहीं रहा।',
  yVgName: 'वर्गोत्तम करियर-स्वामी',
  yVgSrc: 'BPHS वर्गोत्तम',
  yVgYes:
    '{names} D1 और D10 में एक राशि {keep}। करियर-वादा विभाजित नहीं। वर्गोत्तम नीच पतन-उदय दोहराता है; मिटाता नहीं।',
  yVgKeep: 'रखते हैं',
  yVgKeeps: 'रखता है',
  yVgNo: 'न दशमांश लग्नेश न दशमेश वर्गोत्तम है।',
  yAmkName: 'बलवान D10 भाव में अमात्यकारक',
  yAmkSrc: 'जैमिनी',
  yAmkYesStrong:
    'D10 भाव {house} में अमात्यकारक {name} कार्य कर सकता है — केंद्र (1, 4, 7, 10), त्रिकोण (1, 5, 9), या लाभ।',
  yAmkYesWeak:
    'अमात्यकारक {name} D10 भाव {house} में, केंद्र, त्रिकोण और 11 के बाहर। मंत्री अप्रत्यक्ष काम करता है।',
  yAmkNoChart: 'इस कुंडली पर अमात्यकारक नहीं।',
  neechaDisp:
    '{name}, पतन-राशि का स्वामी, {from} से केंद्र (1, 4, 7, 10) में है',
  neechaExalt:
    '{name}, उस राशि में उच्च, {from} से केंद्र (1, 4, 7, 10) में है',
  neechaFromLagna: 'D10 लग्न',
  neechaFromMoon: 'D10 चंद्र',
  neechaCancelled:
    'दशमांश में {name} नीच है और रद्दीकरण लागू — {reason}। BPHS: पतन के बाद उदय, विशेषकर अधिपति की दशा में।',
  neechaUncancelled:
    'दशमांश में {name} नीच, नीच भंग के बिना। करियर को अधिपति का सहारा चाहिए; पतन स्वयं नहीं रुकेगा।',
  vipHarsha: 'हर्ष (षष्ठेश)',
  vipSarala: 'सरल (अष्टमेश)',
  vipVimala: 'विमल (द्वादशेश)',
  vipHit: '{label} {name} भाव {house} में है',
  vipSummary:
    '{hits}। विपरीत संकट, प्रतिद्वंद्विता या हानि से पद उठा सकता है — फल वास्तविक, मार्ग सुखद नहीं।',
}
