// Hindi display strings for src/lib/engine/careerProfession.ts
// Used by careerProfessionLocale.ts — ids/enums stay English.

import type { CareerTrackId, CareerScore } from '@/lib/engine/careerProfession'

export const CP_HI = {
  ethics:
    'इसे नौकरी का प्रस्ताव नहीं, आजीविका का नक्शा मानें। दशम कर्म है: जो दिखाई दे सकता है। जन्म कुंडली वादा कहती है। नवांश थामता है या नहीं। दशांश वह करियर चित्र जो भुनाता है। एक योग अकेले प्रभाव है। असली पद के लिए दशमेश, शनि या कौशल ग्रह और अनुकूल दशा का मेल चाहिए।',

  scoreLabels: {
    status: 'प्रतिष्ठा',
    authority: 'अधिकार',
    profession: 'पेशा',
    skill: 'कौशल',
    gains: 'लाभ',
  } satisfies Record<CareerScore['id'], string>,

  trackCopy: {
    service: {
      headline: 'सेवा मार्ग',
      doThis:
        'नौकरी, पदानुक्रम या संस्थागत पद अनियंत्रित उद्यम से अधिक अनुकूल। दशमेश की दशा अपना काम करे तब तक उसी संरचना में रहें।',
    },
    business: {
      headline: 'व्यापार मार्ग',
      doThis: 'व्यापार, ग्राहक या अपना उद्यम आजीविका लाते हैं। एक दृश्य ग्राहक चैनल और स्वच्छ लेखा रखें।',
    },
    government: {
      headline: 'अधिकार मार्ग',
      doThis: 'नाम और आसन वाला पद चुनें — राज्य, संस्था या दृश्य नेतृत्व। मान्यता कर्म का हिस्सा है, उपोत्पाद नहीं।',
    },
    hybrid: {
      headline: 'मिश्रित मार्ग',
      doThis: 'एक पद और साथ में उद्यम या साझेदारी रखें। शुद्ध नौकरी या शुद्ध व्यापार लॉक नहीं; पूरी आजीविका एक पर मत लगाएँ।',
    },
  } satisfies Record<CareerTrackId, { headline: string; doThis: string }>,

  fitLabel: {
    good: 'करियर के लिए अनुकूल',
    mixed: 'करियर के लिए मिश्रित',
    poor: 'करियर के लिए अशुभ',
  },

  foreign: {
    activeHeadline: 'विदेश, निर्यात या एकांत कार्य सक्रिय',
    inactiveHeadline: 'विदेशी कर्म अग्रणी नहीं',
    activePrediction:
      'द्वादश, नवम या राहु पेशे से जुड़े हैं। दूरी, विदेशी संस्था, अस्पताल या सीमा के पार काम आजीविका हो सकती है। फिर भी दशमेश के स्वभाव से मेल चाहिए।',
    inactivePrediction:
      'करियर के लिए स्थानांतरण अनिवार्य नहीं। यात्रा हो सकती है; पद मुख्यतः द्वादश की कहानी नहीं।',
  },

  tracker: {
    emptyHeadline: 'इस चार्ट पर विम्शोत्तरी नहीं है, इसलिए करियर ट्रैकर नहीं बन सकता।',
    nowLabelEmpty: 'कोई अवधि नहीं',
    betweenPeriods: 'ट्रैक की अवधियों के बीच',
    noMaha: 'इस तिथि पर कोई महादशा नहीं',
    pratyMissing: 'प्रत्यंतरदशा इस चार्ट पर नहीं। बारीक अवधियों के लिए चार्ट पुनर्गणित करें।',
  },

  transit: {
    unavailable: 'गोचर स्थितियाँ अभी इस पाठ में नहीं हैं।',
    mixedSky: 'कोई भी धीमा ग्रह स्पष्ट रूप से करियर के पक्ष या विपक्ष में नहीं। आकाश मिश्रित है।',
  },

  significators: {
    tenth: { title: 'दशम भाव', question: 'सार्वजनिक कर्म क्या है?' },
    tenthLord: { title: 'दशमेश', question: 'काम कहाँ उतरता है?' },
    sun: { title: 'सूर्य', question: 'अधिकार कहाँ है?' },
    saturn: { title: 'शनि', question: 'वास्तविक पेशा क्या है?' },
    mercury: { title: 'बुध', question: 'कौन सा कौशल कमाता है?' },
    amk: { title: 'अमात्यकारक', question: 'मंत्री का पद क्या है?' },
  },

  briefHeadings: {
    Verdict: 'निर्णय',
    Delivery: 'वितरण',
    Turns: 'मोड़',
    Support: 'सहारा',
    Track: 'मार्ग',
    Fields: 'क्षेत्र',
    Yogas: 'योग',
    Timing: 'समय',
    'Do this': 'यह करें',
  },

  hybridTrackPrediction:
    'कोई एक आजीविका मार्ग लॉक नहीं। काम के लिए दशमेश का भाव और शनि की राशि ब्रीफ़ मानें; चार्ट ने नहीं कहा हो तो शीर्षक मत थोपें।',

  timingHeadlineDefault: 'दशा समय',

  remedies: {
    visible: { title: 'ऐसा काम करें जो दिख सके', detail: 'कर्म को ऐसा पद दें जिसका नाम हो। अनौपचारिक प्रभाव अधिकार का विकल्प नहीं।' },
    saturn: { title: 'शनि की सीख', detail: 'शनि सीख की अवधि माँगता है। पद छोड़ने से पहले एक वास्तविक श्रमिक स्तर पर रहें।' },
    seat: { title: 'वास्तविक आसन लें', detail: 'सूर्य या दशम में मंगल हो तो प्रशासन, तकनीक या साहस वाले क्षेत्र में नाम वाली जिम्मेदारी लें।' },
    mercury: { title: 'परखा हुआ कौशल बेचें', detail: 'बुध विचार करता है; सार्वजनिक हस्ताक्षर से पहले लेखन, लेखा या विश्लेषण की समीक्षा करें।' },
    reputation: { title: 'प्रतिष्ठा की स्वच्छता', detail: 'दशम शुद्ध है तो पद खुले रुपए से ज्यादा प्रतिष्ठा से टिकता है। एक साफ़ चैनल रखें।' },
    foreign: { title: 'विदेश या दूरस्थ सक्रिय', detail: 'बारहवें, नवम या राहु का बंधन है तो सीमा, निर्यात या पर्दे के पीछे का काम वास्तविक द्वार है। फिर भी दशमेश का स्वभाव पहले।' },
  },

  yogas: {
    amala: {
      title: 'अमल योग',
      detail:
        'दशम में स्वाभाविक शुभ ग्रह, बिना कठिन ग्रह के। सार्वजनिक काम स्वच्छ रह सकता है; प्रतिष्ठा फल का हिस्सा। {planets} जीने योग्य ग्रह हैं।',
    },
    'amala-moon': {
      title: 'चंद्र से अमल',
      detail:
        'चंद्र से दशम भी केवल शुभ ग्रह से ({planets})। संतुष्टि और प्रतिष्ठा मिल सकती हैं।',
    },
    'dharma-karma': {
      title: 'धर्म-कर्माधिपति',
      detailSame:
        '{lord} नवम और दशम दोनों का स्वामी। भाग्य और पेशा एक ग्रह। लग्न का करियर राजयोग: ऐसा काम जिसे धर्म कह सकें।',
      detailLinked:
        '{ninthLord} और {tenthLord} युति, परिवर्तन या दृष्टि से जुड़े। भाग्येश कर्मेश को सहारा देता है। गुरु, धर्म या दीर्घ लक्ष्य से रहने पर यश बढ़ता है।',
    },
    'digbala-sun': {
      title: 'सूर्य की दिग्बल',
      detail:
        'दशम में सूर्य को दिग्बल। शासन, प्रशासन या दृश्य पद स्वाभाविक उपयोग। भूमिका को असली आसन दें, अनौपचारिक प्रभाव नहीं।',
    },
    'digbala-mars': {
      title: 'मंगल की दिग्बल',
      detail:
        'दशम में मंगल को दिग्बल। अभियांत्रिकी, शल्य, रक्षा, भूमि या साहस वाला काम। दबाव में मंगल हो तो संघर्ष कर भी लगता है।',
    },
    'tenth-lord-strong': {
      title: 'बलवान दशमेश',
      detail: '{lord} {dignity} है। पेशे को शीर्षक उठाने वाला ग्रह मिला। फल फिर भी उसकी दशा की प्रतीक्षा में।',
    },
    'neecha-bhanga': {
      title: 'दशमेश का नीच भंग',
      detail:
        '{lord} नीच है और रद्दीकरण है: स्वामी या उच्च स्वामी सहारा देता है। पतन अंतिम शब्द नहीं। उन्नति असफलता या सीख के बाद, उसके बिना नहीं।',
    },
    'tenth-lord-weak': {
      title: 'दबाव में दशमेश',
      detail:
        '{lord} {state} है। सीधी सीढ़ी की अपेक्षा न करें। इस मौसम में कौशल और स्वच्छ विधि शीर्षक से अधिक मायने रखते हैं।',
    },
    budhaditya: {
      title: 'बुधादित्य योग',
      detail:
        'सूर्य और बुध {house} भाव में, बुध अस्त नहीं। बुद्धि अधिकार की सेवा में। लेखन, विश्लेषण, परामर्श, प्रशासन स्वाभाविक दुकान।',
    },
    'budha-combust': {
      title: 'सूर्य के साथ बुध',
      detail: 'बुध सूर्य के साथ अस्त। कौशल वास्तविक है और दबा हुआ। प्रकाशन, हस्ताक्षर या बिक्री से पहले समीक्षा करें।',
    },
    parivartana: {
      title: 'दशमेश का परिवर्तन',
      detail:
        '{tenthLord} और {host} राशि बदलते हैं। करियर {host} के भाव विषयों से भी बँधा। दोनों की दशाएँ पेशा हिलाती हैं।',
    },
    harsha: { title: 'हर्ष योग', detail: 'षष्ठेश कठिन भाव में; शास्त्र में यह योग निर्दोष सहनशीलता दे सकता है। सेवा और प्रतिस्पर्धा साफ़ तरीके से सँभालें।' },
    'fifth-tenth': {
      title: 'पंचमेश दशमेश के साथ',
      detail: 'पंचम और दशम के स्वामी जुड़े। बुद्धि और कर्म एक संपत्ति। शिक्षण, परामर्श या प्रशासन जहाँ बुद्धि दिखे।',
    },
    'sun-saturn-work': {
      title: 'कार्य भाव पर सूर्य–शनि',
      detail: 'सूर्य और शनि कार्य भावों पर। अधिकार धीरे बनता है; धैर्य और दायित्व जरूरी।',
    },
    vargottama: {
      title: 'दशमेश वर्गोत्तम',
      detail: '{lord} जन्म और नवांश में एक राशि में। कर्म का वादा डी9 में भी दिखता है। दशांश पुष्टि के बिना पद मत थोपें।',
    },
    'no-major-yoga': {
      title: 'कोई बड़ा करियर योग नहीं',
      detail: 'कोई प्रमुख योग नहीं मिला। दशमेश, शनि, बुध और दशा सीधे पढ़ें।',
    },
  },

  modality: {
    movable: 'चर दशम पद और स्थान बदलता है। करियर फिर से शुरू करके बनता है।',
    fixed: 'स्थिर दशम एक लंबे पद को चाहता है। अनावश्यक बदलाव से नुकसान।',
    dual: 'द्विस्वभाव दशम अक्सर दो धाराएँ: पद और कौशल, या क्रम में दो पेशे।',
  },

  advanced: {
    deliveryClosing: 'जन्म कुंडली वादा; नवांश धारण; दशांश कार्यस्थल। तीनों मिलकर बताते हैं कि कर्म वास्तव में भुन पाएगा या नहीं।',
    strengthClosing:
      'शक्ति पद को नहीं बदलती; पद कितने दबाव में रहेगा यह बताती है। शतबल, विंशोपक और भावबल एक साथ पढ़ें।',
    chainClosing: 'स्वामी श्रृंखला बताती है कि कर्म किस भाव विषय से पोषित होता है।',
    prosperityClosing: 'लाभ एकादश है, बचत द्वितीय है, और योगी बिंदु समृद्धि है। केपी उस चार्ट पर दशम लग्न का उपस्वामी जोड़ता है। इनमें से एक के बिना पद वह नाम है जिसका भुगतान अभी नहीं हुआ।',
    turnsClosing:
      'आरंभ पहला अध्याय। विराम रोकता है। परिवर्तन काम का स्वरूप बदलता है। नया अवसर द्वार खोलता है। उन्नति उसी क्षेत्र में चढ़ती है। समाप्ति अध्याय बंद। वापसी काम लौटाती है। केवल जो अर्जित हो उसे पढ़ें और दशा से समय दें।',
    ladderClosing: 'वर्ग सीढ़ी: D1 वादा, D9 धारण, D10 कार्यस्थल। अधिक वर्ग सूक्ष्म पुष्टि।',
    supportClosing:
      'अर्गला दशम राशि से गिनी जाती है। जहाँ ग्रह बाधक से अधिक हों वहाँ स्थान टिकता है। पाँचवें से सहायता तभी जब नौवें पर भारी हो। बाधक में केतु मद्द काटता है। फिर हस्ताक्षरकर्ता, प्रतिद्वंद्वी, ग्राहक और लागत नामित होती हैं।',
    supportHeadlineDefault: 'दशम के पीछे का सहारा',
  },

  ladder: {
    D1: 'जन्म कुंडली',
    D9: 'नवांश',
    D10: 'दशांश',
    D24: 'सिद्धांश',
  },

  nakshatraReveals: {
    '10th Lord': 'करियर खाका — पेशे की समग्र दिशा और डिज़ाइन',
    Moon: 'संतुष्टि, जुनून, भावनात्मक पूर्णता — क्या आनंद मिलेगा?',
    Rahu: 'अपरंपरागत प्रक्षेपवक्र — अचानक उठाव या अचानक गिरावट',
  } as Record<string, string>,

  supportHeadlines: {
    'No planet intervenes on the 10th. The lord carries the post alone.':
      'दशम पर कोई ग्रह हस्तक्षेप नहीं। स्वामी पद अकेले उठाता है।',
    'The career has support from outside the 10th.':
      'करियर को दशम के बाहर से सहारा मिलता है।',
    'Outside help to the career is blocked.': 'करियर की बाहरी सहायता अवरुद्ध है।',
    'Support and obstruction both reach the career.':
      'सहारा और बाधा दोनों करियर तक पहुँचते हैं।',
  },

  turnsAnswers: {
    start: {
      'The career starts by breaking the first plan.':
        'करियर पहली योजना तोड़कर शुरू होता है।',
      'The career starts in the 10th itself.': 'करियर स्वयं दशम में शुरू होता है।',
      'The career starts as the person.': 'करियर व्यक्ति के रूप में शुरू होता है।',
      'The career starts by your own effort.': 'करियर अपने प्रयास से शुरू होता है।',
      'The career starts as a job.': 'करियर नौकरी के रूप में शुरू होता है।',
      'The career starts through other people.': 'करियर दूसरों से होकर शुरू होता है।',
      'The career starts through a teacher or a long aim.':
        'करियर गुरु या दीर्घ लक्ष्य से शुरू होता है।',
      'The career starts through a gain.': 'करियर लाभ से शुरू होता है।',
      'The career starts away from the first plan.':
        'करियर पहली योजना से दूर शुरू होता है।',
      'The career starts from the 10th lord’s house.':
        'करियर दशमेश के भाव से शुरू होता है।',
    },
    break: {
      'A career break belongs in this life.': 'इस जीवन में करियर विराम अपेक्षित है।',
      'A pause is possible inside the post.': 'पद के भीतर ठहराव संभव है।',
      'A career break is not built into this chart.':
        'इस चार्ट में करियर विराम निर्मित नहीं।',
    },
  },

  roomSignatureAnswers: {
    'The signature can be yours.': 'हस्ताक्षर आपका हो सकता है।',
    'The signature is hard to hold.': 'हस्ताक्षर रखना कठिन है।',
    'The signature belongs to the institution.': 'हस्ताक्षर संस्था का है।',
  },

  houseRole: {
    1: 'क्षमता — व्यक्ति स्वयं कार्यकर्ता',
    2: 'वाणी, बचत और पारिवारिक व्यापार',
    3: 'साहस, कौशल और स्वयं प्रयास',
    6: 'सेवा, प्रतिद्वंद्वी और रोजगार',
    7: 'ग्राहक, साझेदार और व्यापार',
    9: 'भाग्य, गुरु और कर्म का धर्म',
    10: 'कर्म — सार्वजनिक पेशा',
    11: 'लाभ, जाल और कर्म का फल',
  },

  titlePhrases: [
    ['mahadasha', 'महादशा'],
    ['antardasha', 'अंतरदशा'],
    ['pratyantardasha', 'प्रत्यंतरदशा'],
    ['sookshma', 'सूक्ष्म'],
    ['Good for career', 'करियर के लिए अनुकूल'],
    ['Mixed for career', 'करियर के लिए मिश्रित'],
    ['Poor for career', 'करियर के लिए अशुभ'],
    ['KP 10th sub-lord', 'केपी दशम उपस्वामी'],
    ['10th house', 'दशम भाव'],
    ['10th lord', 'दशमेश'],
    ['Status', 'प्रतिष्ठा'],
    ['Authority', 'अधिकार'],
    ['Profession', 'पेशा'],
    ['Skill', 'कौशल'],
    ['Gains', 'लाभ'],
    ['Service track', 'सेवा मार्ग'],
    ['Business track', 'व्यापार मार्ग'],
    ['Authority track', 'अधिकार मार्ग'],
    ['Hybrid track', 'मिश्रित मार्ग'],
    ['Amatyakaraka', 'अमात्यकारक'],
    ['Foreign, export, or secluded work is active', 'विदेश, निर्यात या एकांत कार्य सक्रिय'],
    ['Foreign karma is not the lead', 'विदेशी कर्म अग्रणी नहीं'],
    ['Vimshottari is not on this chart', 'इस चार्ट पर विम्शोत्तरी नहीं'],
    ['Transit positions are not on this chart', 'गोचर स्थितियाँ इस चार्ट पर नहीं'],
    ['No major career yoga', 'कोई बड़ा करियर योग नहीं'],
    ['Birth chart', 'जन्म कुंडली'],
    ['Dashamsha', 'दशांश'],
    ['Navamsha', 'नवांश'],
    ['house ', 'भाव '],
    ['House ', 'भाव '],
    [' in house ', ' में '],
    [' in the ', ' में '],
    [' from the lagna', ' लग्न से'],
    [' from the Moon', ' चंद्र से'],
    ['Digbala', 'दिग्बल'],
    ['retrograde', 'वक्री'],
    ['combust', 'अस्त'],
    ['exalted', 'उच्च'],
    ['debilitated', 'नीच'],
  ] as [string, string][],

  detailPhrases: [
    ['In KP the sub-lord decides the fruit.', 'केपी में उपस्वामी फल तय करता है।'],
    ['rules a livelihood house, so the profession can fructify as work, service, or income.', 'आजीविका भाव का स्वामी है, इसलिए पेशा काम, सेवा या आय के रूप में फलित हो सकता है।'],
    ['rules the 8th or the 12th, so the fruit leaves as change, cost, research, or a foreign posting.', 'अष्ट या द्वादश का स्वामी है, इसलिए फल परिवर्तन, लागत, शोध या विदेश पद के रूप में निकलता है।'],
    ['touches both a livelihood house and a house of loss, or neither.', 'आजीविका भाव और हानि भाव दोनों को छूता है, या किसी को नहीं।'],
    ['Name the fruit only in that planet’s period.', 'फल केवल उस ग्रह की अवधि में नाम दें।'],
    ["Name the fruit only in that planet's period.", 'फल केवल उस ग्रह की अवधि में नाम दें।'],
    ['as sign lord', 'राशि स्वामी के रूप में'],
    ['as star lord', 'नक्षत्र स्वामी के रूप में'],
    ['as sub-lord', 'उपस्वामी के रूप में'],
    ['lets the 10th fructify', 'दशम को फलित होने देता है'],
    ['spends the 10th', 'दशम को खर्च करता है'],
    ['splits the fruit', 'फल बाँटता है'],
    ['The 10th cusp runs ', 'दशम लग्न चलता है '],
    ['rules the 10th', 'दशम का स्वामी'],
    ['sits in the 10th', 'दशम में बैठा'],
    ['livelihood house', 'आजीविका भाव'],
    ['joins the 10th lord', 'दशमेश से जुड़ा'],
    ['career karaka', 'करियर कारक'],
    ['is combust', 'अस्त है'],
    ['is debilitated', 'नीच है'],
    ['draws the work inward', 'काम को अंदर की ओर खींचता है'],
    ['opens an unusual door', 'असामान्य द्वार खोलता है'],
    ['off the livelihood houses', 'आजीविका भावों से दूर'],
    ['No planet occupies the 10th. The lord carries the profession.', 'दशम खाली। पेशा स्वामी ले जाता है।'],
    ['Phaladeepika names livelihood from this lord', 'फलदीपिका इस स्वामी से आजीविका कहती है'],
    ['Sun decides whether the work includes a seat of command.', 'सूर्य तय करता है कि काम में वास्तविक आसन है या नहीं।'],
    ['Saturn is the job that remains after the title is stripped off.', 'शनि वह नौकरी है जो शीर्षक हटने के बाद बचती है।'],
    ['Mercury is the skill a client can be billed for.', 'बुध वह कौशल है जिसका ग्राहक से बिल बन सकता है।'],
    ['Fruit of work is read here, with the 2nd as what is kept.', 'कर्म का फल यहाँ; द्वितीय जो रखा जाता है।'],
    ['A movable 10th changes posts and places.', 'चर दशम पद और स्थान बदलता है।'],
    ['A fixed 10th wants one long post.', 'स्थिर दशम एक लंबे पद को चाहता है।'],
    ['A dual 10th often runs two tracks', 'द्विस्वभाव दशम अक्सर दो धाराएँ चलाता है'],
    ['Jaimini: Amatyakaraka', 'जैमिनी: अमात्यकारक'],
    ['the career significator', 'करियर कारक'],
    ['the minister rather than the soul', 'आत्मा नहीं, मंत्री'],
    ['If the Sun is weak', 'सूर्य कमजोर हो'],
    ['Combust Mercury still thinks', 'अस्त बुध फिर भी सोचता है'],
    ['the skill needs review before it is signed or sold', 'हस्ताक्षर या बिक्री से पहले कौशल की समीक्षा'],
    ['Time this planet with the 10th lord when a post is the question.', 'पद सवाल हो तो इस ग्रह को दशमेश की दशा से पढ़ें।'],
    ['is good for career', 'करियर के लिए अनुकूल है'],
    ['is poor for career', 'करियर के लिए अशुभ है'],
    ['is mixed for career', 'करियर के लिए मिश्रित है'],
    ['in transit', 'गोचर में'],
    ['It is retrograde, so the result repeats before it settles.', 'वक्री है, इसलिए परिणाम स्थिर होने से पहले दोहराता है।'],
    ['From the Moon it is house', 'चंद्र से यह भाव'],
    ['transits ', 'गोचर करता है '],
    ['aspects the 10th', 'दशम को देखता है'],
    ['aspects the ', 'को देखता है '],
    ['The work is under pressure.', 'काम दबाव में है।'],
    ['off the career houses', 'करियर भावों से दूर'],
    ['Shadbala is', 'शतबल'],
    ['of required', 'आवश्यक का'],
    ['The 10th sign has', 'दशम राशि में'],
    ['Ashtakavarga bindus', 'अष्टकवर्ग बिंदु'],
    ['supportive', 'सहायक'],
    ['thin', 'कमजोर'],
    ['ordinary', 'सामान्य'],
    ['strong', 'मजबूत'],
    ['Bhava Bala of the 10th', 'दशम का भावबल'],
    ['Name the field from the 10th lord after the chart is complete.', 'चार्ट पूर्ण होने पर दशमेश से क्षेत्र नामित करें।'],
    ['Consistent, disciplined, long-term commitment', 'संगत, अनुशासित, दीर्घकालिक प्रतिबद्धता'],
    ['NEVER switch jobs — staying IS the strategy; leaving is the biggest mistake', 'नौकरी कभी न बदलें — ठहरना ही रणनीति; जाना सबसे बड़ी गलती'],
    ['NEVER switch jobs — staying IS the leverage for success.', 'नौकरी मत बदलें — ठहरना ही सफलता का उत्तोलन है।'],
    ['A career break belongs in this life.', 'इस जीवन में करियर विराम अपेक्षित है।'],
  ] as [string, string][],
}
