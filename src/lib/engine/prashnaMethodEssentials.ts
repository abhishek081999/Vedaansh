// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaMethodEssentials.ts
//  Prashna Essentials, "Method" tab: how to approach a praśna chart, from
//  the class notes — what each element shows, when to cast, a weak lagna
//  lord, the five elements, Tajika aspects and deeptāṃśa, the three
//  ithasalas, planet-specific questions, lost items and the 12-question
//  scheme. Reference text only: nothing here feeds a verdict. Pure.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from './lang'
import { DEEPTAMSA } from './tajika'

type T = { en: string; hi: string }
export type MethodTone = 'good' | 'mixed' | 'bad' | 'neutral'

export interface MethodSection {
  id: string
  title: T
  intro?: T
  /** Two-column rows: term, meaning, with an optional tone. */
  rows?: Array<{ term: T; text: T; tone?: MethodTone }>
  /** Plain bullet points. */
  points?: T[]
}

const t = (en: string, hi: string): T => ({ en, hi })

export const METHOD_SECTIONS: MethodSection[] = [
  {
    id: 'reads', title: t('What the chart shows', 'कुंडली क्या दिखाती है'),
    rows: [
      { term: t('Lagna', 'लग्न'), text: t('The type of question; the querent himself.', 'प्रश्न का प्रकार; प्रश्नकर्ता स्वयं।') },
      { term: t('Moon', 'चंद्र'), text: t("The querent's state of mind.", 'प्रश्नकर्ता के मन की स्थिति।') },
      { term: t('Lagna lord', 'लग्नेश'), text: t("The querent's position, situation and capacity to act, and what affects him.", 'प्रश्नकर्ता की स्थिति, परिस्थिति, कार्य-क्षमता, और उस पर क्या प्रभाव है।') },
      { term: t('House of the question', 'प्रश्न का भाव'), text: t('The matter asked about. Its lord is the karyesha.', 'पूछा गया विषय। इसका स्वामी कार्येश है।') },
    ],
    points: [t('Never drop the lagna and lagna lord, whatever the question.', 'प्रश्न कोई भी हो, लग्न और लग्नेश कभी न छोड़ें।')],
  },
  {
    id: 'when', title: t('When to cast', 'कुंडली कब बनाएँ'),
    points: [
      t('Only when a question is actually asked. No question, no praśna chart.', 'केवल तब जब सच में प्रश्न पूछा जाए। प्रश्न नहीं तो प्रश्न कुंडली नहीं।'),
      t('A vague "tell me my future" still works if they are asking; you may speak of past and future.', '"मेरा भविष्य बताइए" जैसा अस्पष्ट प्रश्न भी चलता है यदि वे पूछ रहे हैं; भूत और भविष्य दोनों कह सकते हैं।'),
      t('A specific question, once answered, finishes the chart. A follow-up on the same subject uses the same chart.', 'विशिष्ट प्रश्न का उत्तर होते ही कुंडली पूरी। उसी विषय का आगे का प्रश्न उसी कुंडली से।'),
      t('A different topic needs its own chart, or the 12-question scheme.', 'अलग विषय के लिए अलग कुंडली, या 12-प्रश्न पद्धति।'),
      t('Casting for yourself: the rules change a little; be much more alert.', 'अपने लिए कुंडली: नियम थोड़े बदलते हैं; बहुत अधिक सजग रहें।'),
      t('Check the question is genuine: the Moon or lagna should be tied to the house of the question.', 'जाँचें कि प्रश्न सच्चा है: चंद्र या लग्न प्रश्न के भाव से जुड़ा होना चाहिए।'),
    ],
  },
  {
    id: 'weak-lord', title: t('A weak lagna lord', 'कमज़ोर लग्नेश'),
    intro: t('A lagna lord is not weak just by sitting in the lagna. Find where it sits (with malefics, in a bad house) and that gives the reason. Then one of:', 'लग्न में बैठने से लग्नेश कमज़ोर नहीं होता। देखें वह कहाँ बैठा है (पाप ग्रहों के साथ, बुरे भाव में), उसी से कारण मिलता है। फिर इनमें से एक:'),
    points: [
      t("The querent can't put in the effort.", 'प्रश्नकर्ता प्रयास नहीं कर पाता।'),
      t('His options are very limited.', 'उसके विकल्प बहुत सीमित हैं।'),
      t('He must change his situation, capacity or profile.', 'उसे अपनी स्थिति, क्षमता या प्रोफ़ाइल बदलनी होगी।'),
    ],
  },
  {
    id: 'elements', title: t('The five elements in praśna', 'प्रश्न में पंच तत्व'),
    intro: t('For praśna only; do not apply to birth charts.', 'केवल प्रश्न के लिए; जन्म कुंडली पर लागू न करें।'),
    rows: [
      { term: t('Water (jala)', 'जल'), tone: 'good', text: t('Most favourable: nurturing, flowing, the base of relationships. Like a river that takes in tributaries and then merges into the sea.', 'सबसे शुभ: पोषण, प्रवाह, संबंधों का आधार। नदी जैसा जो सहायक नदियाँ लेकर अंत में सागर में मिलती है।') },
      { term: t('Earth (pṛthvī)', 'पृथ्वी'), tone: 'neutral', text: t('Normal: stability, few changes, an ordinary question.', 'सामान्य: स्थिरता, कम परिवर्तन, साधारण प्रश्न।') },
      { term: t('Fire (agni)', 'अग्नि'), tone: 'mixed', text: t('Aggressive: transformation and destruction, either of which can be good or bad, with inherent struggle.', 'आक्रामक: परिवर्तन और विनाश, दोनों शुभ या अशुभ हो सकते हैं, संघर्ष के साथ।') },
      { term: t('Ether (ākāśa)', 'आकाश'), tone: 'bad', text: t('Worst, unpredictable: directionless, endless, no conclusion. On the lagna the question is nearly worthless; test whether it is genuine.', 'सबसे अशुभ, अनिश्चित: दिशाहीन, अंतहीन, कोई निष्कर्ष नहीं। लग्न पर हो तो प्रश्न लगभग निरर्थक; सच्चाई जाँचें।') },
    ],
    points: [
      t('Ākāśa in the lagna, 10th or 6th on a job question: more effort needed, and the querent does not know his own direction (e.g. earning ₹20,000 and asking when it will be ₹1.5 lakh).', 'नौकरी के प्रश्न में लग्न, दसवें या छठे में आकाश: अधिक प्रयास चाहिए, प्रश्नकर्ता को अपनी दिशा पता नहीं (जैसे ₹20,000 कमाते हुए ₹1.5 लाख कब होगा पूछना)।'),
      t('Then check the 11th (desire, expectation) and the 3rd (effort): a weak 3rd cannot deliver.', 'फिर ग्यारहवाँ (इच्छा, अपेक्षा) और तीसरा (प्रयास) देखें: कमज़ोर तीसरा निभा नहीं पाता।'),
      t('The 12th is tied to ākāśa in this scheme; the 8th is a "pit" (gaḍḍhā).', 'इस पद्धति में बारहवाँ आकाश से जुड़ा है; आठवाँ "गड्ढा" है।'),
    ],
  },
  {
    id: 'aspects', title: t('Tajika aspects', 'ताजिक दृष्टि'),
    intro: t('Used in praśna and varṣaphala only. The planets can be anywhere; only their distance from each other counts.', 'केवल प्रश्न और वर्षफल में। ग्रह कहीं भी हों; केवल आपसी दूरी मायने रखती है।'),
    rows: [
      { term: t('5 and 9', '5 और 9'), tone: 'good', text: t('Friendly: open support.', 'मित्र: खुला सहयोग।') },
      { term: t('3 and 11', '3 और 11'), tone: 'good', text: t('Hidden friend: help from an unexpected source.', 'गुप्त मित्र: अप्रत्याशित स्रोत से सहायता।') },
      { term: t('1 and 7', '1 और 7'), tone: 'bad', text: t('Open enemy. In varṣaphala mutual opposition is not good, unlike the birth chart.', 'खुला शत्रु। वर्षफल में परस्पर विरोध अच्छा नहीं, जन्म कुंडली के विपरीत।') },
      { term: t('4 and 10', '4 और 10'), tone: 'bad', text: t('Hidden enemy: obstacles, sudden or from unknown people (e.g. a less eligible candidate wins through connections).', 'गुप्त शत्रु: बाधाएँ, अचानक या अनजान लोगों से (जैसे कम योग्य उम्मीदवार पहुँच से जीत जाए)।') },
      { term: t('2, 6, 8, 12', '2, 6, 8, 12'), tone: 'neutral', text: t('Neutral: little effect.', 'सम: थोड़ा प्रभाव।') },
    ],
    points: [
      t('To conclude: identify the aspect and its nature, check planet strength, check the question\'s significations, then predict: obstacles with eventual success, a complete block, or delay.', 'निष्कर्ष के लिए: दृष्टि और उसकी प्रकृति पहचानें, ग्रह बल देखें, प्रश्न के कारकत्व देखें, फिर कहें: बाधा के बाद सफलता, पूर्ण रुकावट, या विलंब।'),
      t('Speed, fast to slow: Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn. Rahu and Ketu are not counted.', 'गति, तेज़ से धीमा: चंद्र, बुध, शुक्र, सूर्य, मंगल, गुरु, शनि। राहु-केतु नहीं गिने जाते।'),
    ],
  },
  {
    id: 'deeptamsa', title: t('Deeptāṃśa (orbs)', 'दीप्तांश'),
    intro: t('For two planets add their values and halve: Moon and Mars (12 + 8) / 2 = 10°. Within this distance the aspect works.', 'दो ग्रहों के मान जोड़कर आधा करें: चंद्र और मंगल (12 + 8) / 2 = 10°। इस दूरी के भीतर दृष्टि काम करती है।'),
    rows: (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const).map(id => ({
      term: { Su: t('Sun', 'सूर्य'), Mo: t('Moon', 'चंद्र'), Ma: t('Mars', 'मंगल'), Me: t('Mercury', 'बुध'), Ju: t('Jupiter', 'गुरु'), Ve: t('Venus', 'शुक्र'), Sa: t('Saturn', 'शनि') }[id],
      text: t(`${DEEPTAMSA[id]}°`, `${DEEPTAMSA[id]}°`),
    })),
  },
  {
    id: 'ithasala', title: t('Ithasala and Ishrafa', 'इत्थशाल और ईसराफ़'),
    intro: t('A question comes from a desire; ithasala shows whether the desire is reached, so it is checked on almost every question. Good for exams, competitions, applications and starting anything.', 'प्रश्न इच्छा से उठता है; इत्थशाल दिखाता है कि इच्छा पूरी होगी या नहीं, इसलिए लगभग हर प्रश्न में देखा जाता है। परीक्षा, प्रतियोगिता, आवेदन और किसी भी आरंभ के लिए शुभ।'),
    rows: [
      { term: t('Vartamāna (present)', 'वर्तमान'), tone: 'good', text: t('All conditions met now; the process is active (applied, interviewed, got a call). It says the process has started, not whether the result is good.', 'सभी शर्तें अभी पूरी; प्रक्रिया सक्रिय (आवेदन, साक्षात्कार, कॉल)। यह बताता है प्रक्रिया शुरू हुई, परिणाम अच्छा है या नहीं यह नहीं।') },
      { term: t('Pūrṇa (complete)', 'पूर्ण'), tone: 'good', text: t('Lagna lord and karyesha within about 1°: the event is very near; its nature still needs other factors.', 'लग्नेश और कार्येश लगभग 1° के भीतर: घटना बहुत निकट; उसकी प्रकृति अन्य कारकों से।') },
      { term: t('Bhaviṣyat (future)', 'भविष्यत्'), tone: 'mixed', text: t('Not formed yet but will form soon (a sign change, or the Moon in hours). Quick if in a day or two; obstacles if it needs a sign change.', 'अभी नहीं बना पर जल्द बनेगा (राशि परिवर्तन, या कुछ घंटों में चंद्र)। एक-दो दिन में हो तो शीघ्र; राशि परिवर्तन से हो तो बाधाएँ।') },
      { term: t('Ishrafa (separating)', 'ईसराफ़'), tone: 'bad', text: t('Moving away from the aspect: it won\'t happen, or you are cut off from it (the vacancy is gone, the candidate already decided).', 'दृष्टि से दूर जा रहे: नहीं होगा, या आप उससे कट गए (रिक्ति चली गई, उम्मीदवार तय हो चुका)।') },
    ],
    points: [t('Never conclude from ithasala or ishrafa alone; always check the other factors.', 'केवल इत्थशाल या ईसराफ़ से निष्कर्ष न निकालें; अन्य कारक हमेशा देखें।')],
  },
  {
    id: 'planets', title: t('Planet-specific questions', 'ग्रह-विशेष प्रश्न'),
    rows: [
      { term: t('Theft', 'चोरी'), text: t('Mars is crucial; it is the karyesha for a stolen item.', 'मंगल निर्णायक; चोरी की वस्तु का कार्येश।') },
      { term: t('Fights, quarrels', 'लड़ाई, झगड़े'), text: t('Mars.', 'मंगल।') },
      { term: t('Accidents', 'दुर्घटना'), text: t('Mars and Ketu.', 'मंगल और केतु।') },
      { term: t('Police matters', 'पुलिस के मामले'), text: t('Mars in relation to the 10th house.', 'दसवें भाव से मंगल का संबंध।') },
      { term: t('Servants, labour', 'नौकर, श्रमिक'), text: t('Saturn; retrograde suggests an occasionally called worker.', 'शनि; वक्री कभी-कभार बुलाए गए कर्मचारी का संकेत।') },
      { term: t('Materials', 'पदार्थ'), text: t('Saturn: iron (an iron almirah). Jupiter: wood, wooden furniture.', 'शनि: लोहा (लोहे की अलमारी)। गुरु: लकड़ी, लकड़ी का फ़र्नीचर।') },
    ],
  },
  {
    id: 'lost', title: t('Lost or stolen items', 'खोई या चोरी हुई वस्तु'),
    rows: [
      { term: t('D1 lagna dual', 'D1 लग्न द्विस्वभाव'), text: t('A known person, not family; someone who comes and goes (a maid).', 'परिचित, परिवार से बाहर; आने-जाने वाला (नौकरानी)।') },
      { term: t('D9 lagna movable', 'D9 लग्न चर'), text: t('The item has gone far.', 'वस्तु दूर चली गई।') },
      { term: t('Moon in the 12th', 'चंद्र बारहवें में'), text: t('The question is about loss, so it is valid.', 'प्रश्न हानि का है, इसलिए सच्चा है।') },
      { term: t('Saturn in the 4th', 'शनि चौथे में'), text: t('Theft from the home.', 'घर से चोरी।') },
      { term: t('Weak 10th lord, Venus in the 10th', 'कमज़ोर दशमेश, दसवें में शुक्र'), text: t('Retrograde or debilitated: little legal or police support.', 'वक्री या नीच: कानूनी या पुलिस सहायता कम।') },
      { term: t('Ishrafa of the Moon with Mars or Saturn', 'चंद्र का मंगल या शनि से ईसराफ़'), text: t('What is gone is gone.', 'जो गया सो गया।') },
    ],
    points: [t('Answer insider-or-outsider questions with great care.', 'घर का या बाहर का, इसका उत्तर बहुत सावधानी से दें।')],
  },
  {
    id: 'twelve', title: t('Several questions from one chart', 'एक कुंडली से कई प्रश्न'),
    intro: t('For follow-ups on different topics the reference point moves; count the matter\'s house from it. At most 12, then the chart is finished.', 'अलग विषयों के आगे के प्रश्नों में संदर्भ बिंदु बदलता है; विषय का भाव उसी से गिनें। अधिकतम 12, फिर कुंडली समाप्त।'),
    rows: [
      { term: t('1, 2', '1, 2'), text: t('D1 lagna, D9 lagna', 'D1 लग्न, D9 लग्न') },
      { term: t('3, 4', '3, 4'), text: t('D1 Moon, D9 Moon', 'D1 चंद्र, D9 चंद्र') },
      { term: t('5, 6', '5, 6'), text: t('D1 Sun, D9 Sun', 'D1 सूर्य, D9 सूर्य') },
      { term: t('7, 8', '7, 8'), text: t('D1 Jupiter, D9 Jupiter', 'D1 गुरु, D9 गुरु') },
      { term: t('9, 10', '9, 10'), text: t('Stronger of Venus and Mercury: D1, then D9', 'शुक्र-बुध में बलवान: D1, फिर D9') },
      { term: t('11, 12', '11, 12'), text: t('Weaker of Venus and Mercury: D1, then D9', 'शुक्र-बुध में दुर्बल: D1, फिर D9') },
    ],
  },
]

export interface MethodSectionText {
  id: string
  title: string
  intro?: string
  rows?: Array<{ term: string; text: string; tone?: MethodTone }>
  points?: string[]
}

export function methodEssentials(lang: EngineLang = 'en'): MethodSectionText[] {
  const p = (x: T) => (lang === 'hi' ? x.hi : x.en)
  return METHOD_SECTIONS.map(s => ({
    id: s.id,
    title: p(s.title),
    ...(s.intro ? { intro: p(s.intro) } : {}),
    ...(s.rows ? { rows: s.rows.map(r => ({ term: p(r.term), text: p(r.text), ...(r.tone ? { tone: r.tone } : {}) })) } : {}),
    ...(s.points ? { points: s.points.map(p) } : {}),
  }))
}
