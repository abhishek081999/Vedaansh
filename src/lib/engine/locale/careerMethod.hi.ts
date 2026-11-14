// Hindi display strings for src/lib/engine/careerMethod.ts
// Used by careerMethodLocale.ts — ids/enums stay English.

import type { GrahaId } from '@/types/astrology'
import type { MethodQuestion, WorkShape } from '@/lib/engine/careerMethod'

export const CM_HI = {
  principleLine:
    'एक ही योग एक ही नौकरी नहीं। ऊर्जा पढ़ें, फिर उद्योग जिसमें व्यक्ति प्रवेश कर सकता है। D1 इच्छा कहती है। D10 कार्यस्थल। दशा कब चलती है यह कहती है।',

  principle: {
    Su: 'मैं दृश्य हूँ, मैं नेतृत्व करता हूँ',
    Mo: 'मैं दर्शकों से भावनात्मक जुड़ता हूँ',
    Ma: 'मैं साहस से कार्य करता हूँ',
    Me: 'मैं सोचता, विश्लेषण और संवाद करता हूँ',
    Ju: 'मैं मार्गदर्शन और दिशा देता हूँ',
    Ve: 'मैं आकर्षित करता और सौंदर्य बनाता हूँ',
    Sa: 'मैं व्यवस्था बनाता और स्थिरता सुनिश्चित करता हूँ',
    Ra: 'मैं नवाचार और अपरंपरागत मार्ग लेता हूँ',
    Ke: 'मैं गहराई में जाता और विशेषज्ञ बनता हूँ',
    Ur: '',
    Ne: '',
    Pl: '',
  } satisfies Record<GrahaId, string>,

  structure: {
    1: 'व्यक्तित्व और काम का दृष्टिकोण',
    6: 'सेवा, नौकरी, दैनिक कर्म और प्रतिद्वंद्वी',
    7: 'व्यापार, साझेदार, जनता और बाज़ार',
    10: 'कर्म, पेशा और मान्यता',
    11: 'आय, लाभ, जाल और उपलब्धि',
  },

  support: {
    2: 'मुख्य आय, बचत और पारिवारिक धन',
    3: 'कौशल, हाथ, संवाद, साहस और प्रयास',
    4: 'स्थिरता और कार्यस्थल घर है या दूर',
    5: 'बुद्धि, रचनात्मकता, सट्टा और प्रतिष्ठा',
    8: 'शोध, छुपा काम, परिवर्तन और दूसरों के संसाधन',
    9: 'उच्च शिक्षा, विदेशी द्वार, पिता और भाग्य',
    12: 'विदेश, अस्पताल, व्यय और एकांत में काम',
  },

  shapeLabel: {
    job: 'नौकरी — संरचना के अंतर्गत',
    business: 'व्यापार — अपना बाज़ार',
    partnership: 'साझेदारी व्यापार',
    independent: 'स्वतंत्र काम',
    family: 'पारिवारिक या वंश का काम',
    mixed: 'मिश्रित आजीविका',
  } satisfies Record<WorkShape, string>,

  role: {
    Su: 'अधिकार',
    Mo: 'जनता से जुड़ाव',
    Ma: 'कार्य',
    Me: 'बुद्धि और विश्लेषण',
    Ju: 'मार्गदर्शन',
    Ve: 'मूल्य',
    Sa: 'अनुशासन',
    Ra: 'अपरंपरागत या भविष्य का क्षेत्र',
    Ke: 'छिपा कौशल',
    Ur: '',
    Ne: '',
    Pl: '',
  } satisfies Record<GrahaId, string>,

  elementLine: {
    fire: 'अग्नि शुरू करके कार्य करती है। प्रोफ़ाइल प्रारंभकर्ता की है।',
    earth: 'पृथ्वी स्थायी संरचना बनाकर कार्य करती है।',
    air: 'वायु वाणी, जाल या सार्वजनिक छवि से कार्य करती है।',
    water: 'जल मन, उपचार या भरोसे योग्य भावना से कार्य करती है।',
  },

  questions: {
    type: { title: 'काम का प्रकार', },
    skill: { title: 'कौशल', },
    income: { title: 'आय', },
    direction: { title: 'दिशा और विकास', },
    environment: { title: 'वातावरण', },
  } satisfies Record<MethodQuestion['id'], { title: string }>,

  factors: {
    mindset: { title: 'मनोदृष्टि', },
    decision: { title: 'निर्णय', },
    timing: { title: 'समय', },
  },

  steps: [
    { title: 'संरचना — लग्न, षष्ठ, सप्तम, दशम', },
    { title: 'आय — द्वितीय और एकादश', },
    { title: 'कौशल और दिशा — तृतीय, पंचम, नवम', },
    { title: 'स्थान और स्थिरता — चतुर्थ, द्वादश, शनि', },
    { title: 'योग और नक्षत्र', },
    { title: 'दशा', },
    { title: 'D10 पुष्टि', },
  ],

  ganaWord: { dev: 'देव', manushya: 'मनुष्य', rakshasa: 'राक्षस' },

  ganaPitfall: {
    dev: 'फिसलन: काम जो आदर्श पूरा न कर सके।',
    manushya: 'फिसलन: एक साथ बहुत से लक्ष्य।',
    rakshasa: 'फिसलन: काम को बहुत कसकर पकड़ना।',
    default: 'इस शिक्षा में गण नहीं मिला। व्यवहार पढ़ें।',
  },

  ganaClosing:
    'ग्रह कौशल है। नक्षत्र व्यवहार। भाव क्षेत्र। पाद बारीक तरीका। दशा समय। एक ही ग्रह एक ही भाव में भी नक्षत्र अलग हो तो करियर अलग।',

  dominantFallback: 'दशमेश पेशा उठाता है',

  d10: {
    strong: 'जन्म कुंडली की पुष्टि',
    weak: 'जन्म कुंडली विपरीत',
    missing: 'D10 इस चार्ट पर नहीं',
  },

  sectionClosings: {
    system: 'यही विधि पहले क्षेत्र, फिर जोड़ा, फिर नक्षत्र व्यवहार कहती है। D10 बाद में।',
    kshetra: 'क्षेत्र पहले नामित हो तभी प्रोफ़ाइल और धारा पढ़ें।',
    profile: 'प्रोफ़ाइल उद्योग नहीं; ऊर्जा का स्वरूप है।',
    sector: 'क्षेत्र विशिष्ट उद्योग नहीं; राशि और स्वामी का विषय है।',
    disha: 'दिशा स्थानांतरण का वादा नहीं; किस ओर ऊर्जा बढ़ती है यह बताती है।',
    pipeline: 'सेवा से नेतृत्व तक की श्रृंखला एक साथ नहीं; दशा क्रम बताती है।',
    counsel: 'परामर्श शब्द अलग; कर्म का स्वरूप चार्ट से।',
    demand: 'मांग बाज़ार का वादा नहीं; जनता क्या खींचती है यह पढ़ें।',
    pillars: 'स्तंभ एक पद नहीं; कौन से ग्रह उठाते हैं।',
    calling: 'बुलावा पद नहीं; आंतरिक दिशा।',
    streams: 'धाराएँ दूसरी नौकरी नहीं; समानांतर कौशल।',
    study: 'शिक्षा मुख्य पेशा नहीं; क्षमता और समय।',
    pattern: 'पैटर्न इत्तिहास नहीं; दोहराव की प्रवृत्ति।',
    practice: 'अभ्यास सूत्र और स्तर; दशा के साथ पढ़ें।',
  },

  practiceLessons:
    'स्तर: क्षेत्र, प्रोफ़ाइल, धारा, समय। सूत्र जोड़ें; सूची से पेशा मत थोपें।',

  titlePhrases: [
    ['Type of work', 'काम का प्रकार'],
    ['Skill set', 'कौशल'],
    ['Income', 'आय'],
    ['Direction and growth', 'दिशा और विकास'],
    ['Environment', 'वातावरण'],
    ['Mindset', 'मनोदृष्टि'],
    ['Decision', 'निर्णय'],
    ['Timing', 'समय'],
    ['Technology', 'प्रौद्योगिकी'],
    ['Content and marketing', 'सामग्री और विपणन'],
    ['Venture', 'उद्यम'],
    ['Counsel', 'परामर्श'],
    ['Service seat', 'सेवा आसन'],
    ['Dashamsha', 'दशांश'],
    ['The 10th lord', 'दशमेश'],
    ['Deva', 'देव'],
    ['Manushya', 'मनुष्य'],
    ['Rakshasa', 'राक्षस'],
    ['gana', 'गण'],
    ['Pada', 'पाद'],
    ['Foundation', 'नींव'],
    ['School', 'विद्यालय'],
    ['Higher study', 'उच्च अध्ययन'],
    ['Karma field', 'कर्म क्षेत्र'],
    ['house ', 'भाव '],
    [' in house ', ' में '],
    ['leads.', 'अग्रणी।'],
    ['on the 10th', 'दशम पर'],
    ['10th lord', 'दशमेश'],
    ['birth chart', 'जन्म कुंडली'],
    ['Without Dashamsha', 'दशांश के बिना'],
  ] as [string, string][],

  detailPhrases: [
    ['sets the professional want from house', 'व्यावसायिक इच्छा भाव से तय'],
    ['The other planets modify this. They do not replace it.', 'अन्य ग्रह बदलते हैं; बदलते नहीं।'],
    ['No planet is sitting on the career houses', 'कोई ग्रह करियर भावों पर नहीं'],
    ['the 10th lord has to carry the want', 'दशमेश को इच्छा उठानी होगी'],
    ['The planet is the skill', 'ग्रह कौशल है'],
    ['the nakshatra is the behavior', 'नक्षत्र व्यवहार है'],
    ['the house is the field', 'भाव क्षेत्र है'],
    ['the period is the timing', 'दशा समय है'],
    ['The nakshatra is not loaded', 'नक्षत्र लोड नहीं'],
    ['What the person wants is the Moon and', 'व्यक्ति की इच्छा चंद्र और'],
    ['The decision lands in house', 'निर्णय भाव में उतरता है'],
    ['Timing is the dasha, not a mood.', 'समय दशा है, मूड नहीं।'],
    ['Do this only after the birth-chart field is named.', 'जन्म कुंडली का क्षेत्र नामित होने के बाद ही।'],
    ['Without Dashamsha, stop at the birth chart.', 'दशांश के बिना जन्म कुंडली पर रुकें।'],
    ['They do not replace the 10th lord.', 'वे दशमेश नहीं बदलते।'],
    ['Staying is an advantage only inside the nakshatra that asks for it.', 'ठहरना तभी लाभ जब नक्षत्र माँगे।'],
    ['A change of field is still read from the mahadasha.', 'क्षेत्र बदलाव महादशा से पढ़ें।'],
    ['The three nakshatras share one group.', 'तीनों नक्षत्र एक समूह में।'],
    ['The blueprint stays the 10th lord.', 'रूपरेखा दशमेश पर।'],
    ['confirming', 'पुष्टि'],
    ['contradicting', 'विरोध'],
    ['neutral', 'तटस्थ'],
    ['Fire executes by starting. The profile is an initiator.', 'अग्नि शुरू करके कार्य करती है। प्रोफ़ाइल प्रारंभकर्ता की है।'],
    ['Earth executes by building a structure that lasts.', 'पृथ्वी स्थायी संरचना बनाकर कार्य करती है।'],
    ['Air executes by speech, a network, or a public face.', 'वायु वाणी, जाल या सार्वजनिक छवि से कार्य करती है।'],
    ['Water executes through a mind, a healing, or a feeling people trust.', 'जल मन, उपचार या भरोसे योग्य भावना से कार्य करती है।'],
    ['The rising sign is the same element, so the person and the work execute the same way.', 'लग्न तत्त्व समान है; व्यक्ति और काम एक जैसे चलते हैं।'],
    ['Personality and profession will not feel like the same room.', 'व्यक्तित्व और पेशा एक कमरे जैसे नहीं लगेंगे।'],
    ['Working style:', 'कार्य शैली:'],
    ['Consistent, disciplined, long-term commitment', 'संगत, अनुशासित, दीर्घकालिक प्रतिबद्धता'],
    ['NEVER switch jobs — staying IS the strategy; leaving is the biggest mistake', 'नौकरी कभी न बदलें — ठहरना ही रणनीति; जाना सबसे बड़ी गलती'],
    ['NEVER switch jobs — staying IS the leverage for success.', 'नौकरी मत बदलें — ठहरना ही सफलता का उत्तोलन है।'],
    [
      'The chart is not asking for a pure salary. The person has to face a market, a partner, or their own name.',
      'चार्ट शुद्ध वेतन नहीं माँग रहा। व्यक्ति को बाज़ार, साझेदार या अपना नाम सामना करना होगा।',
    ],
    [
      'The 3rd lord supports commissions, skill-selling, and short independent efforts alongside the main track.',
      'तृतीयेश कमीशन, कौशल-बिक्री और मुख्य धारा के साथ छोटे स्वतंत्र प्रयासों को सहारा देता है।',
    ],
    [
      'The 6th, 8th, or 12th agrees with the 10th. Service, crisis, or a hospital is part of the profession, not a side interest. Name the branch from the planet that actually sits there.',
      'षष्ठ, अष्ट या द्वादश दशम से सहमत। सेवा, संकट या अस्पताल पेशे का हिस्सा, गौण रुचि नहीं। वास्तविक बैठे ग्रह से शाखा नामित करें।',
    ],
    [
      'The 6th is service destiny: a promotion, a heavier duty, a forced leaving, or a post that ends early. It speaks when its lord’s period is running.',
      'षष्ठ सेवा भाग्य: पदोन्नति, भारी दायित्व, बाध्य विदाई या जल्दी समाप्त पद। अपने स्वामी की दशा में बोलता है।',
    ],
    [
      'The 2nd, the 6th, and the 11th are not meeting the 10th. The career question stays open. That is confusion, not two professions.',
      'द्वितीय, षष्ठ और एकादश दशम से नहीं मिल रहे। करियर प्रश्न खुला। यह भ्रम है, दो पेशे नहीं।',
    ],
    [
      "On a parent's chart this same 5th is the child's profession.",
      'माता-पिता के चार्ट में यही पंचम बच्चे का पेशा है।',
    ],
    ['The 2nd is income and a family resource. The 6th is daily service. The 7th is the other person. The 11th is the gain.', 'द्वितीय आय और पारिवारिक संसाधन। षष्ठ दैनिक सेवा। सप्तम दूसरा व्यक्ति। एकादश लाभ।'],
  ] as [string, string][],

  notes: {
    alignment: { title: 'तीन जो मिलें' },
    karmas: { title: 'तीन कर्म', answer: 'दशम वह काम है जिसे छोड़ा नहीं जा सकता।' },
    nature: { title: 'स्वभाव बनाम स्वामित्व' },
    lineage: { title: 'पारिवारिक पेशा' },
    second: { title: 'दूसरी धारा' },
    triggers: { title: 'कब हिलता है', answer: 'करियर डिग्री, नक्षत्र या A8–A10 पर गोचर।' },
    loss: { title: 'बाहर से हानि' },
    contracts: { title: 'अदृश्य संविदाएँ' },
    income: { title: 'धन कहाँ बहता है' },
    lens: { title: 'ग्रह कैसे पढ़ें' },
    field: { title: 'कर्म क्षेत्र' },
    phase: { title: 'इस दशा का चरण' },
    school: { title: 'विद्यालय' },
    foreign: { title: 'घर से दूर अध्ययन' },
    loop: { title: 'दोहराव पैटर्न' },
    appearance: { title: 'शनि और आयु' },
  } satisfies Record<string, { title?: string; answer?: string }>,

  /** Exact English answer/reading lines → Hindi (career method panels). */
  exactAnswers: {
    'The chart is not asking for a pure salary. The person has to face a market, a partner, or their own name.':
      'चार्ट शुद्ध वेतन नहीं माँग रहा। व्यक्ति को बाज़ार, साझेदार या अपना नाम सामना करना होगा।',
    'The skill and the profession are in conversation.':
      'कौशल और पेशा संवाद में हैं।',
    'The path changes place and title. Growth is by starting again, not by sitting still.':
      'मार्ग स्थान और शीर्षक बदलता है। वृद्धि फिर शुरू करने से, निष्क्रिय रहने से नहीं।',
    'The workplace wants distance: another city, a foreign desk, a hospital, or work behind a curtain.':
      'कार्यस्थल दूरी चाहता है: दूसरा शहर, विदेशी मेज, अस्पताल या पर्दे के पीछे काम।',
    'The 6th, 8th, or 12th agrees with the 10th. Service, crisis, or a hospital is part of the profession, not a side interest. Name the branch from the planet that actually sits there.':
      'षष्ठ, अष्ट या द्वादश दशम से सहमत। सेवा, संकट या अस्पताल पेशे का हिस्सा, गौण रुचि नहीं। वास्तविक ग्रह से शाखा नामित करें।',
    'The three are not locked, and they are not in a fight.':
      'तीनों लॉक नहीं, और लड़ाई में भी नहीं।',
    'Personality, karma, and feeling are not in one combination. Do not predict an unstoppable rise, and do not predict chaos. Read the dasha.':
      'व्यक्तित्व, कर्म और भावना एक संयोजन में नहीं। अजेय उन्नति या अराजकता मत भविष्यवाणी करें। दशा पढ़ें।',
    'The 10th is the work that cannot be skipped.':
      'दशम वह काम है जिसे छोड़ा नहीं जा सकता।',
    'Read both the planet and the houses it rules.':
      'ग्रह और जिन भावों का वह स्वामी है दोनों पढ़ें।',
    'Conflict, a sudden break, and a loss are active together, and they touch the 10th. The job or the business can end from the organization’s side, not only from a personal mistake.':
      'संघर्ष, अचानक टूटन और हानि एक साथ सक्रिय हैं और दशम को छूते हैं। नौकरी या व्यापार संगठन की ओर से समाप्त हो सकता है, केवल व्यक्तिगत गलती से नहीं।',
    'The 5th, the 9th, and the 10th are not tied. This person can leave the family profession and build a different one. Do not force the parent’s ambition onto the 10th.':
      'पंचम, नवम और दशम नहीं जुड़े। यह व्यक्ति पारिवारिक पेशा छोड़ दूसरा बना सकता है। माता-पिता की महत्त्वाकांक्षा दशम पर मत थोपें।',
    'One profession is enough for this period.':
      'इस अवधि के लिए एक पेशा पर्याप्त है।',
    'A transit on the career degree, the nakshatra, or A8 with A10.':
      'करियर डिग्री, नक्षत्र या A8–A10 पर गोचर।',
    'No extra contract is locked onto the 10th.':
      'दशम पर कोई अतिरिक्त संविदा लॉक नहीं।',
    'Start with the 2nd, then the other gain houses.':
      'पहले द्वितीय, फिर अन्य लाभ भाव।',
    'Read each planet through the field, not from a list.':
      'प्रत्येक ग्रह क्षेत्र से पढ़ें, सूची से नहीं।',
    'One field. Do not split the work into five jobs.':
      'एक क्षेत्र। काम को पाँच नौकरियों में मत बाँटें।',
    'The chart is not offering a lawyer, a channel, and a fund at once. Read the field, then one profile.':
      'चार्ट एक साथ वकील, चैनल और फंड नहीं दे रहा। क्षेत्र पढ़ें, फिर एक प्रोफ़ाइल।',
    'This period can change or end a post. Home is not the block.':
      'यह अवधि पद बदल या समाप्त कर सकती है। घर बाधा नहीं।',
    'The 3rd is tied to the 10th, so the work can be the hands, speech, or a craft. It is not automatically music.':
      'तृतीय दशम से जुड़ा; काम हाथ, वाणी या शिल्प हो सकता है, स्वतः संगीत नहीं।',
    'The first earning is the 2nd. The result is later.':
      'पहली कमाई द्वितीय है। परिणाम बाद में।',
    'The pipeline is not blocked by one weak link.':
      'श्रृंखला एक कमजोर कड़ी से अवरुद्ध नहीं।',
    'This period wants to understand and guide.':
      'यह अवधि समझना और मार्गदर्शन चाहती है।',
    'The karma stays. The form of the work changes.':
      'कर्म रहता है। काम का रूप बदलता है।',
    'The 6th is service destiny: a promotion, a heavier duty, a forced leaving, or a post that ends early. It speaks when its lord’s period is running. The 6th is not the profession by itself.':
      'षष्ठ सेवा भाग्य: पदोन्नति, भारी दायित्व, बाध्य विदाई या जल्दी समाप्त पद। अपने स्वामी की दशा में बोलता है। षष्ठ अकेले पेशा नहीं।',
    'The stay is for learning or a posting. It is not a settlement.':
      'ठहराव सीख या पोस्टिंग के लिए; स्थायी बसावट नहीं।',
    'A primary business spends the effort. A side stream is the most this supports.':
      'मुख्य व्यापार प्रयास खर्च करता है। बगल की धारा इतना ही सहारा।',
    'Property is not a second income on this chart.':
      'संपत्ति इस चार्ट पर दूसरी आय नहीं।',
    'Two of the 2nd, the 4th, and the 10th have to meet before property is read as income.':
      'संपत्ति को आय पढ़ने से पहले द्वितीय, चतुर्थ और दशम में से दो मिलें।',
    'The income houses and the 10th are not in sync.':
      'आय भाव और दशम ताल में नहीं।',
    'The 2nd, the 6th, and the 11th are not meeting the 10th. The career question stays open. That is confusion, not two professions.':
      'द्वितीय, षष्ठ और एकादश दशम से नहीं मिल रहे। करियर प्रश्न खुला। यह भ्रम है, दो पेशे नहीं।',
    'The 6th has the points for a heavy workload.':
      'षष्ठ में भारी कार्यभार के बिंदु हैं।',
    'A hidden career is not separate from the 10th.':
      'छिपा करियर दशम से अलग नहीं।',
    'The chart is not one of these callings yet.':
      'चार्ट अभी इन बुलावों में से एक नहीं।',
    'The 8th is not a hidden gain on this chart.':
      'अष्ट इस चार्ट पर छिपा लाभ नहीं।',
    'The subject comes from the 2nd. The 5th gives the direction.':
      'विषय द्वितीय से। पंचम दिशा देता है।',
    'The 4th is formal school, through the twelfth class.':
      'चतुर्थ औपचारिक विद्यालय, बारहवीं तक।',
    'A course away from the birthplace is a real door.':
      'जन्मस्थान से दूर पाठ्यक्रम वास्तविक द्वार है।',
    'This dasha is not sitting on a career phase.':
      'यह दशा करियर चरण पर नहीं बैठी।',
    'The same difficulty returns until the lesson is learned.':
      'वही कठिनाई लौटती है जब तक पाठ नहीं सीखा जाता।',
    'The face can look younger than the years.':
      'चेहरा वर्षों से छोटा दिख सकता है।',
    'The father is not the hinge of this career.':
      'पिता इस करियर का कब्जा नहीं।',
    'The 5th is intelligence and status here, not the switch of the profession. On a parent’s chart this same 5th is the child’s profession.':
      'यहाँ पंचम बुद्धि और पद है, पेशा बदलने का स्विच नहीं। माता-पिता के चार्ट में यही पंचम बच्चे का पेशा है।',
    'A large scale of gains is whether the 2nd can carry the person and the family. A title without the 2nd is not survival.':
      'बड़े पैमाने का लाभ यह है कि द्वितीय व्यक्ति और परिवार उठा सके। द्वितीय के बिना शीर्षक जीवन नहीं।',
    'There is a collapse or a repeat. Read the recovery, not only the exit.':
      'पतन या दोहराव है। केवल निकास नहीं, पुनर्प्राप्ति पढ़ें।',
    'Contribution here is the work itself. A leadership title is not the first promise.':
      'यहाँ योगदान स्वयं काम है। नेतृत्व शीर्षक पहला वादा नहीं।',
    'Legacy is not locked to the business. The 5th is still the child and the status, read on its own.':
      'विरासत व्यापार से लॉक नहीं। पंचम अभी भी बच्चा और पद है, अलग पढ़ें।',
    'Fire executes by starting. The profile is an initiator. The rising sign is water. Personality and profession will not feel like the same room.':
      'अग्नि शुरू करके कार्य करती है। प्रोफ़ाइल प्रारंभकर्ता की है। लग्न जल है। व्यक्तित्व और पेशा एक कमरे जैसे नहीं लगेंगे।',
    "The 5th is intelligence and status here, not the switch of the profession. On a parent's chart this same 5th is the child's profession.":
      'यहाँ पंचम बुद्धि और पद है, पेशा बदलने का स्विच नहीं। माता-पिता के चार्ट में यही पंचम बच्चे का पेशा है।',
  } satisfies Record<string, string>,
}
