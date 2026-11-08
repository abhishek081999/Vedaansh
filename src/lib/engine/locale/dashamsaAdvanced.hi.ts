// Hindi text for src/lib/engine/dashamsaAdvanced.ts (D10 Advanced levers).
// English ids, enums, and keys unchanged; string tables for pick/fill.

export const KARAKA_CAREER_HI: Record<string, string> = {
  AK: 'आत्मकारक — आत्मा का निष्ठा कार्य से',
  AmK: 'अमात्यकारक — मंत्री; पेशा और पद',
  BK: 'भ्रातृकारक — भाई-बहन, साहस, सहकर्मी, प्रयास',
  MK: 'मातृकारक — कार्यस्थल की भावनात्मक लहर',
  PK: 'पुत्रकारक — शिष्य, सृजन, अधिकार-परियोजनाएँ',
  GK: 'ज्ञातिकारक — प्रतिद्वंद्वी, वाद, सेवा घर्षण',
  DK: 'दारकारक — साझेदार, ग्राहक, सार्वजनिक अनुबंध',
  PiK: 'पुत्रीकारक — सृजनात्मक वंश और शिष्य',
}

export const D10A_TEXT_EN = {
  aspectMarsSpecial: '{house}th (Mars special)',
  aspectJuSpecial: '{house}th (Jupiter special)',
  aspectSaSpecial: '{house}th (Saturn special)',
  aspect7Full: '7th (full)',
  aspectNth: '{house}th',

  dispCyclic:
    '{start}’s D10 dispositor (ruler of the sign it sits in) chain loops ({chain}). A closed loop locks the career style — results recycle through those planets’ dashas.',
  dispLinear: '{start} ({role}) runs {links}.',
  dispTail: ' Final support rests with {name} in {rashi}.',
  dispLink: '{name} H{house}',

  targetD10Tenth: 'D10 10th',
  targetD10Lagna: 'D10 lagna',
  drishtiNote: '{name} from D10 H{fromHouse} casts {aspectLabel} on the {targetLabel}{special}',
  drishtiSpecial: ' — special aspect counts full in Parashara.',
  drishtiPlainEnd: '.',

  drishtiOnTenth: 'Aspects on the D10 10th: {names}.',
  drishtiOnTenthNone: 'No full graha drishti (aspect) reaches the D10 10th from other signs.',
  drishtiOnLagna: 'Aspects on D10 lagna: {names}.',
  drishtiOnLagnaNone: 'D10 lagna is free of outside full aspects.',

  roleD10TenthLord: 'D10 10th lord',
  roleD10LagnaLord: 'D10 lagna lord',
  roleLivelihoodPlanet: 'livelihood planet',
  role10thLord: '10th lord',
  roleLagnaLord: 'Lagna lord',
  roleLivelihood: 'Livelihood',
  roleAmK: 'AmK',
  roleCareerLord: 'Career lord',
  roleCareer: 'Career',

  rajaTitle1_10: 'Lagna–10th link',
  rajaWhy1_10: 'Self and profession reinforce each other',
  rajaTitle9_10: '9th–10th dharma-karma',
  rajaWhy9_10: 'Fortune and work move together',
  rajaTitle5_10: '5th–10th counsel yoga',
  rajaWhy5_10: 'Intelligence and status (ministerial flavour)',
  rajaTitle4_10: '4th–10th axis',
  rajaWhy4_10: 'Base and peak — property, vehicles, or homeland duty with status',
  rajaTitle7_10: '7th–10th public axis',
  rajaWhy7_10: 'Partners and profession share one story',
  rajaFormed: '{a} and {b} are linked in Dashamsha — {why}.',
  rajaNotFormed: '{a} and {b} are not joined by conjunction, exchange, or aspect in D10.',

  shadbalaMissing: 'Shadbala not on this chart payload.',
  shadbalaStrong:
    '{name} clears required Shadbala (ratio {ratio}) — natal muscle behind the D10 promise.',
  shadbalaWeak:
    '{name} is below required Shadbala (ratio {ratio}) — D10 status needs supporting lords and dasha.',
  shadbalaPredAvailable:
    'Shadbala is natal strength. A weak 10th lord can still deliver in its dasha if D10 yoga and SAV support, but the road is harder.',
  shadbalaPredMissing: 'Recalculate the chart to attach Shadbala.',

  bhava10Strong: 'Natal 10th bhava bala {rupa} rupa — strong career house.',
  bhava10Weak: 'Natal 10th bhava bala {rupa} rupa — career house needs effort.',
  bhava11Strong: 'Natal 11th bhava bala {rupa} rupa — gains house supports awards.',
  bhava11Weak: 'Natal 11th bhava bala {rupa} rupa — gains come slowly.',
  bhavaPredAvailable:
    'Bhava bala is cast on the birth chart; strong natal 10th/11th backs whatever Dashamsha promises.',
  bhavaPredMissing: 'Bhava bala not attached — recalculate for house strength.',

  savUnavailable: 'SAV for natal H{house} unavailable.',
  savNote: 'Natal H{house} ({rashi}) has {bindus} SAV bindus — {support}.',
  savSupportHigh: 'transit and dasha fruits land easily',
  savSupportMid: 'average support',
  savSupportLow: 'thin support; effort and remedies matter',
  savPredAvailable:
    'SAV bindus (strength points) show how easily transit and dasha results land in natal career houses. Pair with D10 for what the result looks like.',
  savPredMissing: 'Ashtakavarga not on this payload.',

  karakaThrone: 'sits on the career throne',
  karakaFortune: 'supports status through fortune or gains',
  karakaPressure: 'works through pressure, secrecy, or service',
  karakaEffort: 'supports the profession from effort and speech',
  karakaCareerNote: '{code} {name} in D10 H{house} ({rashi}) {place}. {label}.',

  flagVargottama: 'Vargottama',
  flagPushkara: 'Pushkara',
  flagPushkaraNav: 'Pushkara Navamsha',
  flagCombust: 'Combust',
  flagRetro: 'Retrograde',
  flagD10Dignity: 'D10 {dignity}',
  flagD10Debilitated: 'D10 debilitated',
  flagNoteWith: '{name} ({role}): {flags}.',
  flagNoteNone: '{name} ({role}): no special dignity flags.',

  timelineCareerHit: '{name} is a D10 career significator{housePart}. {hint}',
  timelineHousePart: ' in house {house}',
  timelineHintDefault: 'Watch status, role, and income moves.',
  timelineBackground: '{toneLabel}. {hint}',
  timelineHintBg: 'Background period for livelihood.',
  timelineNextMahaCareer: 'Next mahadasha of career lord {name} — major professional chapter.',
  timelineNextMahaCheck: 'Next mahadasha {name} — check its D10 house when it arrives.',

  takeawayDispMissing: 'Dispositor chain unavailable.',
  takeawayStrongSb: 'Strong natal Shadbala: {names}.',
  takeawayWeakSb:
    'Career lords are not all strong in Shadbala — lean on timing and supporting yogas.',
  takeawaySbMissing: 'Attach Shadbala on recalculation for strength confirmation.',
  takeawayRajaFormed: 'Formed D10 raja links: {titles}.',
  takeawayRajaNone:
    'No kendra (angular houses: 1, 4, 7, 10)–trikona (trine houses: 1, 5, 9) career links formed in D10 beyond isolated lords.',
  takeawayTimelineNone:
    'No immediate career-lord antardasha in the next windows — watch the listed timeline.',

  headlineRajaLinks: '{n} raja links',
  headlineTechnical: 'technical read',
  headlineDrishti: 'drishti×{n}',
  headlineStrong: 'strong {names}',

  framing:
    'Advanced levers behind the Śāstra and Synthesis tabs: who feeds the career lords (dispositors), who aspects the D10 10th, natal Shadbala and SAV support, Jaimini karakas (natural indicator) in D10, dignity flags, kendra (angular houses: 1, 4, 7, 10)–trikona (trine houses: 1, 5, 9) links, and the next career-sensitive dasha windows.',

  timelineHeadlineFallback: 'Upcoming Vimshottari windows',
} as const

export type D10AText = Record<keyof typeof D10A_TEXT_EN, string>

export const D10A_TEXT_HI: D10AText = {
  aspectMarsSpecial: '{house}वाँ (मंगल विशेष)',
  aspectJuSpecial: '{house}वाँ (गुरु विशेष)',
  aspectSaSpecial: '{house}वाँ (शनि विशेष)',
  aspect7Full: '7वाँ (पूर्ण)',
  aspectNth: '{house}वाँ',

  dispCyclic:
    '{start} का दशांश स्वामी (जिस राशि में बैठा है उसके स्वामी) श्रृंखला चक्र में फँसती है ({chain})। बंद चक्र कार्य-शैली लॉक कर देता है — फल उन्हीं ग्रहों की दशा में घूमते रहते हैं।',
  dispLinear: '{start} ({role}) {links} चलता है।',
  dispTail: ' अंतिम सहारा {rashi} में {name} पर टिका है।',
  dispLink: '{name} H{house}',

  targetD10Tenth: 'दशांश दशम',
  targetD10Lagna: 'दशांश लग्न',
  drishtiNote: 'दशांश H{fromHouse} से {name} {targetLabel} पर {aspectLabel} दृष्टि डालता है{special}',
  drishtiSpecial: ' — पाराशर में विशेष दृष्टि पूर्ण गिनी जाती है।',
  drishtiPlainEnd: '।',

  drishtiOnTenth: 'दशांश दशम पर दृष्टि: {names}।',
  drishtiOnTenthNone: 'दूसरी राशियों से दशांश दशम पर कोई पूर्ण ग्रह-दृष्टि नहीं पहुँचती।',
  drishtiOnLagna: 'दशांश लग्न पर दृष्टि: {names}।',
  drishtiOnLagnaNone: 'दशांश लग्न बाहरी पूर्ण दृष्टि से मुक्त है।',

  roleD10TenthLord: 'दशांश दशमेश',
  roleD10LagnaLord: 'दशांश लग्नेश',
  roleLivelihoodPlanet: 'आजीविका ग्रह',
  role10thLord: 'दशमेश',
  roleLagnaLord: 'लग्नेश',
  roleLivelihood: 'आजीविका',
  roleAmK: 'अमात्यकारक',
  roleCareerLord: 'कार्य स्वामी',
  roleCareer: 'कार्य',

  rajaTitle1_10: 'लग्न–दशम संबंध',
  rajaWhy1_10: 'स्व और पेशा एक-दूसरे को बल देते हैं',
  rajaTitle9_10: 'नवम–दशम धर्म-कर्म',
  rajaWhy9_10: 'भाग्य और कर्म साथ चलते हैं',
  rajaTitle5_10: 'पंचम–दशम मंत्री योग',
  rajaWhy5_10: 'बुद्धि और पद (मंत्री स्वभाव)',
  rajaTitle4_10: 'चतुर्थ–दशम अक्ष',
  rajaWhy4_10: 'आधार और शिखर — संपत्ति, वाहन या मातृभूमि का कर्तव्य पद के साथ',
  rajaTitle7_10: 'सप्तम–दशम सार्वजनिक अक्ष',
  rajaWhy7_10: 'साझेदार और पेशा एक कथा साझा करते हैं',
  rajaFormed: 'दशांश में {a} और {b} जुड़े हैं — {why}।',
  rajaNotFormed: 'दशांश में {a} और {b} युति, परिवर्तन या दृष्टि से नहीं जुड़े।',

  shadbalaMissing: 'इस चार्ट में षड्बल संलग्न नहीं है।',
  shadbalaStrong:
    '{name} आवश्यक षड्बल पार करता है (अनुपात {ratio}) — दशांश वादे के पीछे जन्म-शक्ति।',
  shadbalaWeak:
    '{name} आवश्यक षड्बल से नीचे है (अनुपात {ratio}) — दशांश पद को सहायक स्वामियों और दशा चाहिए।',
  shadbalaPredAvailable:
    'षड्बल जन्म-शक्ति है। कमजोर दशमेश भी अपनी दशा में दे सकता है यदि दशांश योग और सर्व अष्टकवर्ग सहारा दें, पर मार्ग कठिन रहता है।',
  shadbalaPredMissing: 'षड्बल जोड़ने के लिए चार्ट पुनः गणना करें।',

  bhava10Strong: 'जन्म दशम भावबल {rupa} रूप — मजबूत करियर भाव।',
  bhava10Weak: 'जन्म दशम भावबल {rupa} रूप — करियर भाव को प्रयास चाहिए।',
  bhava11Strong: 'जन्म एकादश भावबल {rupa} रूप — लाभ भाव पुरस्कार सहारा देता है।',
  bhava11Weak: 'जन्म एकादश भावबल {rupa} रूप — लाभ धीरे आते हैं।',
  bhavaPredAvailable:
    'भावबल जन्मकुंडली पर है; मजबूत जन्म दशम/एकादश जो भी दशांश वादा करे उसे पीछे से सहारा देता है।',
  bhavaPredMissing: 'भावबल संलग्न नहीं — भाव शक्ति के लिए पुनर्गणना करें।',

  savUnavailable: 'जन्म H{house} के लिए सर्व अष्टकवर्ग उपलब्ध नहीं।',
  savNote: 'जन्म H{house} ({rashi}) में {bindus} सर्व बिंदु — {support}।',
  savSupportHigh: 'गोचर और दशा फल आसानी से लगते हैं',
  savSupportMid: 'औसत सहारा',
  savSupportLow: 'पतला सहारा; प्रयास और उपाय महत्वपूर्ण',
  savPredAvailable:
    'सर्व बिंदु बताते हैं जन्म करियर भावों में गोचर/दशा फल कितनी आसानी से लगते हैं। परिणाम का रूप दशांश से मिलाएँ।',
  savPredMissing: 'इस चार्ट में अष्टकवर्ग संलग्न नहीं।',

  karakaThrone: 'करियर सिंहासन पर बैठता है',
  karakaFortune: 'भाग्य या लाभ से पद सहारता है',
  karakaPressure: 'दबाव, गोपनीयता या सेवा से काम करता है',
  karakaEffort: 'प्रयास और वाणी से पेशा सहारता है',
  karakaCareerNote: '{code} {name} दशांश H{house} ({rashi}) में {place}। {label}।',

  flagVargottama: 'वर्गोत्तम',
  flagPushkara: 'पुष्कर',
  flagPushkaraNav: 'पुष्कर नवांश',
  flagCombust: 'अस्त',
  flagRetro: 'वक्री',
  flagD10Dignity: 'दशांश {dignity}',
  flagD10Debilitated: 'दशांश नीच',
  flagNoteWith: '{name} ({role}): {flags}।',
  flagNoteNone: '{name} ({role}): कोई विशेष दिग्बल ध्वज नहीं।',

  timelineCareerHit: '{name} दशांश करियर कारक है{housePart}। {hint}',
  timelineHousePart: ' भाव {house} में',
  timelineHintDefault: 'पद, भूमिका और आय की गति देखें।',
  timelineBackground: '{toneLabel}। {hint}',
  timelineHintBg: 'आजीविका के लिए पृष्ठभूमि काल।',
  timelineNextMahaCareer: 'अगली करियर स्वामी {name} की महादशा — बड़ा व्यावसायिक अध्याय।',
  timelineNextMahaCheck: 'अगली महादशा {name} — आने पर उसका दशांश भाव देखें।',

  takeawayDispMissing: 'स्वामी श्रृंखला उपलब्ध नहीं।',
  takeawayStrongSb: 'मजबूत जन्म षड्बल: {names}।',
  takeawayWeakSb: 'सभी करियर स्वामी षड्बल में मजबूत नहीं — समय और सहायक योगों पर निर्भर करें।',
  takeawaySbMissing: 'शक्ति पुष्टि के लिए पुनर्गणना पर षड्बल संलग्न करें।',
  takeawayRajaFormed: 'बने दशांश राज-संबंध: {titles}।',
  takeawayRajaNone:
    'दशांश में केवल अलग-थलग स्वामियों के बाहर केंद्र (1, 4, 7, 10)–त्रिकोण (1, 5, 9) करियर संबंध नहीं बने।',
  takeawayTimelineNone:
    'अगले खिड़कियों में तत्काल करियर-स्वामी अंतर्दशा नहीं — सूचीबद्ध समयरेखा देखें।',

  headlineRajaLinks: '{n} राज-संबंध',
  headlineTechnical: 'तकनीकी पठन',
  headlineDrishti: 'दृष्टि×{n}',
  headlineStrong: 'मजबूत {names}',

  framing:
    'शास्त्र और संश्लेषण टैब के पीछे उन्नत लीवर: करियर स्वामियों को कौन खिलाता है (स्वामी श्रृंखला), दशांश दशम को कौन देखता है, जन्म षड्बल और सर्व सहारा, दशांश में जैमिनी कारक, दिग्बल ध्वज, केंद्र–त्रिकोण संबंध, और अगले करियर-संवेदनशील दशा खिड़कियाँ।',

  timelineHeadlineFallback: 'आगामी विंशोत्तरी खिड़कियाँ',
}
