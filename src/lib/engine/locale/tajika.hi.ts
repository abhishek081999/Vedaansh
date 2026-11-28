// Hindi text for src/lib/engine/tajika.ts (Varshaphal Tajika yogas).
// Keys are the English yoga names / types the engine emits.

export const TAJIKA_YOGA_NAME_HI: Record<string, string> = {
  Ithasala: 'इत्थशाल',
  Ishrafa: 'ईसराफ़',
  Ikkabala: 'इक्कबाल',
  Induvara: 'इन्दुवार',
}

export const TAJIKA_TYPE_HI: Record<string, string> = {
  auspicious: 'शुभ',
  inauspicious: 'अशुभ',
  neutral: 'सम',
}

export const TAJIKA_TEXT_HI = {
  /** Same facts as the English Ithasala description. */
  ithasala: '{fast} (तेज़) {slow} (मंद) की ओर अग्रसर है — फल शीघ्र मिलने का संकेत।',
  aspecting: '{a} की {b} पर दृष्टि।',
  /** Description per yoga name, same facts as the English. */
  byName: {
    Ithasala: '{fast} (तेज़) {slow} (मंद) की ओर अग्रसर है — फल शीघ्र मिलने का संकेत।',
    Ishrafa: '{fast} (तेज़) {slow} (मंद) से अलग हो रहा है — क्षण बीत चुका है।',
    Ikkabala: 'सातों ग्रह केंद्र और पणफर में हैं: बलवान वर्ष।',
    Induvara: 'सातों ग्रह आपोक्लिम में हैं: दुर्बल वर्ष।',
  } as Record<string, string | undefined>,
}
