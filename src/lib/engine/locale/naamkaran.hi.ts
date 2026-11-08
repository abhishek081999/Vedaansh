// Hindi text for src/lib/engine/naamkaran.ts. Templates use {slots}
// filled by fill(); sounds, ids and counts stay as the engine wrote them.

/** Devanagari namakshara, same 27 × 4 layout as AKSHAR_CHAKRA. */
export const AKSHAR_CHAKRA_DE: string[][] = [
  ['चू', 'चे', 'चो', 'ला'], ['ली', 'लू', 'ले', 'लो'], ['अ', 'इ', 'उ', 'ए'], ['ओ', 'वा', 'वी', 'वू'],
  ['वे', 'वो', 'का', 'की'], ['कु', 'घ', 'ङ', 'छ'], ['के', 'को', 'हा', 'ही'], ['हु', 'हे', 'हो', 'डा'],
  ['डी', 'डू', 'डे', 'डो'], ['मा', 'मी', 'मू', 'मे'], ['मो', 'टा', 'टी', 'टू'], ['टे', 'टो', 'पा', 'पी'],
  ['पू', 'ष', 'ण', 'ठ'], ['पे', 'पो', 'रा', 'री'], ['रू', 'रे', 'रो', 'ता'], ['ती', 'तू', 'ते', 'तो'],
  ['ना', 'नी', 'नू', 'ने'], ['नो', 'या', 'यी', 'यू'], ['ये', 'यो', 'भा', 'भी'], ['भू', 'धा', 'फा', 'ढा'],
  ['भे', 'भो', 'जा', 'जी'], ['खी', 'खू', 'खे', 'खो'], ['गा', 'गी', 'गू', 'गे'], ['गो', 'सा', 'सी', 'सू'],
  ['से', 'सो', 'दा', 'दी'], ['दू', 'थ', 'झ', 'ञ'], ['दे', 'दो', 'चा', 'ची'],
]

/** Session Shravana row (Ju Je Jo Gha). */
export const SESSION_SHRAVANA_DE = ['जू', 'जे', 'जो', 'घ']

/** Rashi-naam sounds not in the pada table. */
export const EXTRA_SOUNDS_DE: Record<string, string> = {
  A: 'अ', La: 'ल', E: 'ए', Ba: 'ब', Va: 'व', U: 'उ', Ka: 'क', Chha: 'छ', Gha: 'घ', Dda: 'ड', Ha: 'ह',
  Ma: 'म', Tta: 'ट', Pa: 'प', Ttha: 'ठ', Nna: 'ण', Ra: 'र', Ta: 'त', Na: 'न', Ya: 'य', Bha: 'भ',
  Dha: 'ध', Pha: 'फ', Ddha: 'ढ', Kha: 'ख', Ja: 'ज', Ga: 'ग', Sa: 'स', Sha: 'श', Da: 'द', Cha: 'च',
  Jha: 'झ', Tha: 'थ', Ju: 'जू', Je: 'जे', Jo: 'जो',
}

export const MOTION_LABEL_HI: Record<string, string> = {
  char: 'चर — 2 अक्षर',
  sthir: 'स्थिर — 4 अक्षर',
  dwiswabhav: 'द्विस्वभाव — 3 अक्षर',
}

export const MOTION_HI: Record<string, string> = { char: 'चर', sthir: 'स्थिर', dwiswabhav: 'द्विस्वभाव' }

export const GENDER_HI: Record<string, string> = { male: 'बालक', female: 'बालिका', other: 'अन्य' }

export const PARITY_HI: Record<string, string> = { even: 'सम', odd: 'विषम', any: 'कोई भी' }

export const PRIORITY_HI: Record<string, string> = { trikona: 'त्रिकोण', kendra: 'केंद्र', other: 'अन्य' }

export const VARGA_HI: Record<string, string> = {
  'Swar (Vowels)': 'स्वर (स्वर वर्ण)',
  'Antahstha + Ushma + Aspirate': 'अंतःस्थ + ऊष्म + महाप्राण',
  'Kanthya (Gutturals)': 'कंठ्य (क वर्ग)',
  'Talavya (Palatals)': 'तालव्य (च वर्ग)',
  'Murdhanya (Cerebrals)': 'मूर्धन्य (ट वर्ग)',
  'Dantya (Dentals)': 'दंत्य (त वर्ग)',
  'Oshthya (Labials)': 'ओष्ठ्य (प वर्ग)',
}

export const ROLE_HI: Record<string, string> = {
  '1st strongest Shadbala': 'षड्बल में पहला सबसे प्रबल',
  '2nd strongest Shadbala': 'षड्बल में दूसरा सबसे प्रबल',
}

/** Ishta deities and stotra titles, keyed by the English engine strings. */
export const ISHTA_TEXT_HI: Record<string, string> = {
  'Kartikeya / Shree Ram': 'कार्तिकेय / श्री राम',
  'Subrahmanya Sahasranama / Rama Raksha Stotra': 'सुब्रह्मण्य सहस्रनाम / राम रक्षा स्तोत्र',
  'Lakshmi / Gauri': 'लक्ष्मी / गौरी',
  'Lakshmi Sahasranama / Lalita Sahasranama': 'लक्ष्मी सहस्रनाम / ललिता सहस्रनाम',
  'Vishnu (Hari)': 'विष्णु (हरि)',
  'Vishnu Sahasranama': 'विष्णु सहस्रनाम',
  'Krishna / Vishnu': 'कृष्ण / विष्णु',
  'Krishna Sahasranama / Vishnu Sahasranama': 'कृष्ण सहस्रनाम / विष्णु सहस्रनाम',
  'Surya / Shiva': 'सूर्य / शिव',
  'Aditya Hridayam / Surya Sahasranama / Shiva Sahasranama': 'आदित्य हृदयम् / सूर्य सहस्रनाम / शिव सहस्रनाम',
  'Vishnu / Durga': 'विष्णु / दुर्गा',
  'Vishnu Sahasranama / Durga Sahasranama': 'विष्णु सहस्रनाम / दुर्गा सहस्रनाम',
  'Vishnu (Lakshmi Narayan)': 'विष्णु (लक्ष्मी नारायण)',
  'Vishnu Sahasranama / Lakshmi Sahasranama': 'विष्णु सहस्रनाम / लक्ष्मी सहस्रनाम',
  'Kartikeya / Shiva': 'कार्तिकेय / शिव',
  'Shiva Sahasranama / Subrahmanya Sahasranama': 'शिव सहस्रनाम / सुब्रह्मण्य सहस्रनाम',
  'Vishnu / Brahma': 'विष्णु / ब्रह्मा',
  Shiva: 'शिव',
  'Shiva Sahasranama / Shani Stotra': 'शिव सहस्रनाम / शनि स्तोत्र',
  'Shiva / Shani': 'शिव / शनि',
  'Shiva Sahasranama': 'शिव सहस्रनाम',
  'Vishnu / Brihaspati': 'विष्णु / बृहस्पति',
  'Vishnu Sahasranama / Lalita Sahasranama (for females)': 'विष्णु सहस्रनाम / ललिता सहस्रनाम (स्त्रियों के लिए)',
  'Lakshmi (consort of Vishnu)': 'लक्ष्मी (विष्णु की शक्ति)',
  'Lalita / Śakti': 'ललिता / शक्ति',
  'Lakshmi Sahasranama': 'लक्ष्मी सहस्रनाम',
  'Lalita Sahasranama': 'ललिता सहस्रनाम',
  'Lalita / Gauri': 'ललिता / गौरी',
  'For a woman: name searched in the consort / Śakti Sahasranama (session rule).':
    'स्त्री के लिए: नाम शक्ति / सहचरी सहस्रनाम में खोजा जाता है (सत्र नियम)।',
  'For a woman: masculine Ishta form searched via Lalita Sahasranama (session rule).':
    'स्त्री के लिए: पुरुष इष्ट रूप ललिता सहस्रनाम से खोजा जाता है (सत्र नियम)।',
}

/** Name-suggestion note parts (split on " · "). */
export const NOTE_PART_HI: Record<string, string> = {
  'Session demo candidate': 'सत्र का उदाहरण नाम',
  'Rashi naam': 'राशि नाम',
  'Janma nama': 'जन्म नाम',
  'Vyavahara nama': 'व्यवहार नाम',
  'curated stem': 'चुना हुआ मूल',
  'Shadbala method': 'षड्बल विधि',
  'curated Sahasranama stem': 'चुना हुआ सहस्रनाम मूल',
  'curated stem, not a full stotra extract': 'चुना हुआ मूल, पूरे स्तोत्र का अंश नहीं',
  'Curated Sahasranama stem — confirm in the full text': 'चुना हुआ सहस्रनाम मूल — पूरे पाठ में पुष्टि करें',
}

export const NAAM_HI = {
  parityMale: 'गृह्य नियम: बालक के नाम में अक्षरों की संख्या सम होती है।',
  parityFemale: 'गृह्य नियम: बालिका के नाम में अक्षरों की संख्या विषम होती है।',
  parityNone: 'लिंग निर्धारित नहीं — अक्षर संख्या केवल चंद्र राशि से।',
  adjust: ' चंद्र राशि से संख्या {from} थी; लिंग नियम के लिए {to} की गई।',
  classicalSummary:
    'निर्धारित आरंभ “{sound}” — चंद्र {nak} के पद {pada} में। चंद्र {rashi} ({motion}) में। नाम {count} अक्षरों का। {parity}{adjust} उसी नक्षत्र के अन्य पद ही शास्त्रीय विकल्प अक्षर हैं।',
  rashiSummary:
    '{rashi} में चंद्र के लिए राशि-नाम: {list}। सामान्य आरंभ “{sound}” ({de})। इस राशि से लंबाई {count} अक्षर{parity}।',
  rashiSummaryParity: ' (लिंग नियम के बाद)',
  rashiMethod:
    'राशि नाम: रोज़मर्रा का नाम चंद्र राशि के किसी अक्षर से शुरू होता है (प्रचलित राशि-अक्षर पंक्ति)। अक्षर संख्या उस राशि की गति से, फिर गृह्य नियम से। संस्कार वाला जन्म अक्षर शास्त्रीय टैब पर रहता है।',
  janmaTitle: 'जन्म नाम',
  janmaBasis: 'चंद्र नक्षत्र पद — संस्कार / निजी नाम',
  vyTitle: 'व्यवहार नाम',
  vyBasisPada: 'लग्न नक्षत्र पद — सार्वजनिक / सांसारिक नाम',
  vyBasisRow: 'लग्न राशि अक्षर पंक्ति — सार्वजनिक / सांसारिक नाम',
  padaNote: '{nak} पद {pada}',
  rowNote: '{rashi} राशि पंक्ति',
  vySummaryPada: 'सार्वजनिक नाम “{sound}” से शुरू — लग्न {nak} के पद {pada} में, {rashi}। लग्न राशि से लंबाई {count} अक्षर।',
  vySummaryRow: 'सार्वजनिक नाम {rashi} की अक्षर पंक्ति से “{sound}” से शुरू। लंबाई {count} अक्षर।',
  twoMethod:
    'दो नाम: जन्म नाम चंद्र-पद का अक्षर है (संस्कार और पारिवारिक अभिलेख)। व्यवहार नाम लग्न-पद का अक्षर है जो संसार में प्रयोग होता है, लग्न राशि के अक्षर अतिरिक्त विकल्प हैं। हर नाम अपनी राशि से लंबाई लेता है, फिर गृह्य नियम।',
  sessionSummary:
    'सत्र का चुनाव “{sound}” — {planet} → {nak} पद {pada}, {rashi} में (भाव {house}, {priority})। उस राशि से नाम {count} अक्षरों का। {verdict}',
  sessionTrikona: 'त्रिकोण से पुष्टि।',
  sessionKendra: 'केंद्र विकल्प (त्रिकोण नहीं)।',
  sessionNone: 'त्रिकोण/केंद्र में नहीं — कोई अन्य अक्षर चुनें।',
  sessionEmpty: 'प्रबल षड्बल ग्रहों से कोई त्रिकोण (त्रिकोण भाव: 1, 5, 9)/केंद्र (केंद्र भाव: 1, 4, 7, 10) अक्षर नहीं मिला।',
  sessionMethod:
    'षड्बल विधि: (1) षड्बल में दो सबसे प्रबल ग्रह → (2) BPHS ध्वनि अक्षर → (3) अक्षर चक्र नक्षत्र-पद → (4–6) पहले त्रिकोण (1/5/9) फिर केंद्र (1/4/7/10) रखें → (7) उस राशि की गति से अक्षर संख्या → (8) आत्मकारक की D1 राशि से इष्ट → (9) सहस्रनाम शब्द → (10) कटपयादि सहायक जाँच → (11) त्रिकोण (त्रिकोण भाव: 1, 5, 9) की पुष्टि।',
  katapayadiFull:
    '{planet} {deg}° से कटपयादि → अंकों का योग {sum} → शेष {rem} ({rashi})। नवांश लग्न {nav} है{verdict}',
  katapayadiAligns: ' — मेल खाता है।',
  katapayadiNoMatch: ' — मेल नहीं (केवल सहायक जाँच)।',
  katapayadiShort: '{planet} {deg}° से कटपयादि → शेष {rem} ({rashi})।',
  fallbackSound: 'चंद्र पद उपलब्ध नहीं। वैकल्पिक अक्षर “{sound}”।',
  noLetter: 'कोई नामाक्षर निर्धारित नहीं हो सका।',
  methodNote:
    'शास्त्रीय टैब = चंद्र-पद जन्म नाम। राशि नाम = चंद्र राशि के अक्षर। दो नाम = जन्म (चंद्र) और व्यवहार (लग्न)। षड्बल विधि = प्रबल ग्रह → BPHS अक्षर → त्रिकोण (त्रिकोण भाव: 1, 5, 9)/केंद्र (केंद्र भाव: 1, 4, 7, 10)।',
}

/** Devanagari for every curated Sahasranama stem in naamkaranNames.ts. */
export const SAHASRANAMA_NAME_DE: Record<string, string> = {
  Achyuta: 'अच्युत', Ananta: 'अनंत', Aditya: 'आदित्य', Ishana: 'ईशान', Upendra: 'उपेंद्र', Omkara: 'ओंकार',
  Kesava: 'केशव', Keshava: 'केशव', Govinda: 'गोविंद', Madhava: 'माधव', Madhusudana: 'मधुसूदन', Narayana: 'नारायण',
  Padmanabha: 'पद्मनाभ', Hrishikesha: 'हृषीकेश', Vamana: 'वामन', Vasudeva: 'वासुदेव', Vishnu: 'विष्णु',
  Damodara: 'दामोदर', Chakrapani: 'चक्रपाणि', Janardana: 'जनार्दन', Purushottama: 'पुरुषोत्तम', Sridhara: 'श्रीधर',
  Trivikrama: 'त्रिविक्रम', Chaitanya: 'चैतन्य', Chakrana: 'चक्रण', Charu: 'चारु', Charani: 'चारणी',
  Chamundi: 'चामुंडी', Chandika: 'चंडिका', Chitkala: 'चित्कला', Chinmayi: 'चिन्मयी', Lalita: 'ललिता',
  Lavanya: 'लावण्या', Kamala: 'कमला', Kalyani: 'कल्याणी', Tripura: 'त्रिपुरा', Tripurasundari: 'त्रिपुरसुंदरी',
  Shyamala: 'श्यामला', Sundari: 'सुंदरी', Bhavani: 'भवानी', Bhuvaneshi: 'भुवनेशी', Mahadevi: 'महादेवी',
  Madhuri: 'माधुरी', Padmaja: 'पद्मजा', Gauri: 'गौरी', Gayatri: 'गायत्री', Ambika: 'अंबिका', Anandi: 'आनंदी',
  Indira: 'इंदिरा', Uma: 'उमा', Rajeshwari: 'राजेश्वरी', Vimala: 'विमला', Jaya: 'जया', Jayanti: 'जयंती',
  Lakshmi: 'लक्ष्मी', Lakshika: 'लक्षिका', Kanaka: 'कनका', Padma: 'पद्मा', Sri: 'श्री', Sridevi: 'श्रीदेवी',
  Haripriya: 'हरिप्रिया', Chanchala: 'चंचला', Varada: 'वरदा', Vishnupriya: 'विष्णुप्रिया', Mahalakshmi: 'महालक्ष्मी',
  Bhargavi: 'भार्गवी', Shiva: 'शिव', Shankara: 'शंकर', Shambhu: 'शंभु', Mahesha: 'महेश', Mahadeva: 'महादेव',
  Hara: 'हर', Harendra: 'हरेंद्र', Rudra: 'रुद्र', Rudraja: 'रुद्रज', Bholenath: 'भोलेनाथ',
  Chandrashekhara: 'चंद्रशेखर', Trilochan: 'त्रिलोचन', Neelkanth: 'नीलकंठ', Gangadhara: 'गंगाधर',
  Krishna: 'कृष्ण', Gopala: 'गोपाल', Murari: 'मुरारी', Nanda: 'नंद', Nandagopal: 'नंदगोपाल', Yashoda: 'यशोदा',
  Radheshyam: 'राधेश्याम', Hari: 'हरि', Aruna: 'अरुण', Bhaskara: 'भास्कर', Ravi: 'रवि', Ravindra: 'रवींद्र',
  Surya: 'सूर्य', Suryansh: 'सूर्यांश', Martanda: 'मार्तंड', Divakara: 'दिवाकर', Tapana: 'तपन', Hiranya: 'हिरण्य',
  Kartikeya: 'कार्तिकेय', Kumara: 'कुमार', Skanda: 'स्कंद', Shanmukha: 'षण्मुख', Subrahmanya: 'सुब्रह्मण्य',
  Murugan: 'मुरुगन', Guha: 'गुह', Velan: 'वेलन', Durga: 'दुर्गा', Durgati: 'दुर्गति', Kali: 'काली',
  Kalika: 'कालिका', Parvati: 'पार्वती', Shakti: 'शक्ति',
}
