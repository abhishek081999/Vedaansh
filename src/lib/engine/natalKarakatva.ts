// ─────────────────────────────────────────────────────────────
//  src/lib/engine/natalKarakatva.ts
//  House × planet significations (karakatva), Natal tag only.
//  Mundane rows of the source sheet are deliberately left out.
//
//  Pure data: no React / DB. Hindi labels sit next to English so
//  the two never drift apart.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'

export type KarakatvaHouse = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface NatalKarakatva {
  id: string
  house: KarakatvaHouse
  planet: GrahaId
  en: string
  hi: string
  source?: 'BPHS'
}

type Row = [KarakatvaHouse, GrahaId, string, string, string, ('BPHS')?]

const ROWS: Row[] = [
  // 1st
  [1, 'Su', 'body', 'Body', 'शरीर', 'BPHS'],
  [1, 'Su', 'head', 'Head', 'सिर', 'BPHS'],
  [1, 'Mo', 'infancy', 'Infancy', 'शैशव'],
  [1, 'Mo', 'birthplace', 'Place of birth', 'जन्म स्थान'],
  [1, 'Ma', 'earlyYears', 'Early years (age 1–3)', 'आरंभिक वर्ष (1–3 वर्ष)'],
  [1, 'Sa', 'hair', 'Hair', 'बाल'],
  // 2nd
  [2, 'Su', 'dynasty', 'Dynasty', 'वंश'],
  [2, 'Mo', 'food', 'Food', 'भोजन'],
  [2, 'Mo', 'faceMouth', 'Face / mouth', 'चेहरा / मुख'],
  [2, 'Me', 'earlyChildhood', 'Early childhood (age 3–12)', 'बाल्यकाल (3–12 वर्ष)'],
  [2, 'Me', 'smell', 'Smell / nose', 'गंध / नाक'],
  [2, 'Me', 'speech', 'Speech', 'वाणी'],
  [2, 'Ju', 'wealth', 'Wealth / bank balance', 'धन / बैंक जमा'],
  [2, 'Ve', 'jewellery', 'Jewellery', 'आभूषण'],
  [2, 'Ve', 'upperNeck', 'Upper neck / throat', 'ऊपरी गर्दन / गला'],
  [2, 'Ve', 'poetry', 'Poetry', 'काव्य'],
  [2, 'Sa', 'teeth', 'Teeth', 'दाँत'],
  // 3rd
  [3, 'Mo', 'shortJourneys', 'Short journeys', 'छोटी यात्राएँ'],
  [3, 'Mo', 'upperLungs', 'Upper half of lungs', 'फेफड़ों का ऊपरी भाग'],
  [3, 'Ma', 'courage', 'Courage', 'साहस'],
  [3, 'Ma', 'youngerSibling', 'Younger sibling', 'छोटे भाई-बहन'],
  [3, 'Me', 'communication', 'Communication / letters', 'संचार / पत्र'],
  [3, 'Me', 'writing', 'Writing', 'लेखन'],
  [3, 'Ve', 'musicDance', 'Music / dance', 'संगीत / नृत्य'],
  [3, 'Ve', 'sports', 'Sports', 'खेल'],
  [3, 'Ve', 'lowerNeck', 'Lower neck', 'निचली गर्दन'],
  [3, 'Ra', 'illusion', 'Illusion', 'भ्रम'],
  [3, 'Ra', 'photography', 'Photography', 'फ़ोटोग्राफ़ी'],
  // 4th
  [4, 'Su', 'heart', 'Heart', 'हृदय'],
  [4, 'Mo', 'lowerLungs', 'Lower half of lungs', 'फेफड़ों का निचला भाग'],
  [4, 'Mo', 'breast', 'Breast', 'स्तन'],
  [4, 'Mo', 'mind', 'Mind', 'मन'],
  [4, 'Mo', 'mother', 'Mother', 'माता'],
  [4, 'Mo', 'home', 'Place of residence / home', 'निवास / घर'],
  [4, 'Ma', 'immovableProperty', 'Immovable property', 'अचल संपत्ति'],
  [4, 'Me', 'education', 'Education', 'शिक्षा'],
  [4, 'Me', 'clan', 'Clan', 'कुल'],
  [4, 'Me', 'friends', 'Friends', 'मित्र'],
  [4, 'Me', 'relatives', 'Relatives', 'संबंधी'],
  [4, 'Ju', 'happiness', 'Happiness', 'सुख'],
  [4, 'Ve', 'pleasure', 'Pleasure', 'आनंद'],
  [4, 'Ve', 'vehicle', 'Vehicle', 'वाहन'],
  [4, 'Sa', 'agriculture', 'Agriculture', 'कृषि'],
  [4, 'Sa', 'commonMan', 'Common man / the masses', 'आम जन / जनसमूह'],
  [4, 'Sa', 'discomfort', 'Discomfort', 'असुविधा'],
  [4, 'Ra', 'riots', 'Riots', 'दंगे'],
  // 5th
  [5, 'Su', 'stomach', 'Stomach / abdomen', 'पेट / उदर'],
  [5, 'Mo', 'emotions', 'Emotions', 'भावनाएँ'],
  [5, 'Me', 'amusement', 'Amusement', 'आमोद-प्रमोद'],
  [5, 'Me', 'intelligence', 'Intelligence', 'बुद्धि'],
  [5, 'Ju', 'loveOfDivine', 'Love of the divine', 'ईश्वर-प्रेम'],
  [5, 'Ju', 'creativity', 'Creativity', 'सृजनशीलता'],
  [5, 'Ju', 'children', 'Children', 'संतान'],
  [5, 'Ju', 'gallBladder', 'Gall bladder', 'पित्ताशय'],
  [5, 'Ju', 'scholarship', 'Scholarship', 'विद्वत्ता'],
  [5, 'Ve', 'romance', 'Romance', 'प्रेम-संबंध'],
  [5, 'Ve', 'entertainment', 'Entertainment', 'मनोरंजन'],
  [5, 'Ra', 'diplomacy', 'Diplomacy / diplomat', 'कूटनीति / राजनयिक'],
  [5, 'Ra', 'gambling', 'Games of chance / gambling', 'जुआ / सट्टा'],
  [5, 'Ra', 'paternalGrandfather', 'Paternal grandfather', 'दादा'],
  [5, 'Ke', 'mantra', 'Mantra recitation', 'मंत्र जप'],
  // 6th
  [6, 'Su', 'inflammation', 'Fire / inflammation', 'अग्नि / सूजन'],
  [6, 'Ma', 'enemies', 'Enemies / disputes / litigation', 'शत्रु / विवाद / मुकदमा'],
  [6, 'Ma', 'accident', 'Accident', 'दुर्घटना'],
  [6, 'Ma', 'competition', 'Competition', 'प्रतियोगिता'],
  [6, 'Ma', 'injury', 'Injury', 'चोट'],
  [6, 'Me', 'smallIntestine', 'Small intestine', 'छोटी आँत'],
  [6, 'Me', 'maternalUncle', 'Maternal uncle', 'मामा'],
  [6, 'Ju', 'pancreas', 'Pancreas', 'अग्न्याशय'],
  [6, 'Ve', 'kidney', 'Kidney', 'गुर्दा'],
  [6, 'Sa', 'debts', 'Debts', 'ऋण'],
  [6, 'Sa', 'disease', 'Disease / obstacle', 'रोग / बाधा'],
  [6, 'Sa', 'service', 'Service / servants / subordinates', 'सेवा / सेवक / अधीनस्थ'],
  [6, 'Sa', 'bodyExertion', 'Bodily exertion', 'शारीरिक परिश्रम'],
  [6, 'Sa', 'worries', 'Worries', 'चिंताएँ'],
  [6, 'Ra', 'fraud', 'Fraud', 'धोखाधड़ी'],
  [6, 'Ke', 'astralBeings', 'Astral beings / poltergeist', 'सूक्ष्म जीव / प्रेत-बाधा'],
  // 7th
  [7, 'Mo', 'ovariesUterus', 'Ovaries / uterus', 'अंडाशय / गर्भाशय'],
  [7, 'Mo', 'pregnancy', 'Pregnancy / conception', 'गर्भ / गर्भधारण'],
  [7, 'Mo', 'distantResidence', 'Residence at a distant place', 'दूर स्थान पर निवास'],
  [7, 'Ma', 'maleGenitals', 'Male genitals', 'पुरुष जननांग'],
  [7, 'Me', 'business', 'Business', 'व्यवसाय'],
  [7, 'Me', 'trade', 'Trade', 'व्यापार'],
  [7, 'Ju', 'husband', 'Husband', 'पति'],
  [7, 'Ju', 'prominence', 'Prominence in society', 'समाज में प्रतिष्ठा'],
  [7, 'Ve', 'ureter', 'Ureter', 'मूत्रवाहिनी'],
  [7, 'Ve', 'bladder', 'Bladder', 'मूत्राशय'],
  [7, 'Ve', 'partnership', 'Partnership', 'साझेदारी'],
  [7, 'Ve', 'marriagePartner', 'Marriage partner', 'जीवनसाथी'],
  [7, 'Ra', 'stranger', 'Stranger', 'अजनबी'],
  [7, 'Ra', 'maternalGrandfather', 'Maternal grandfather', 'नाना'],
  // 8th
  [8, 'Mo', 'seaCruise', 'Sea voyage', 'समुद्री यात्रा'],
  [8, 'Ma', 'killing', 'Killing', 'हत्या'],
  [8, 'Ju', 'suddenIncome', 'Sudden unearned income', 'अचानक अनर्जित आय'],
  [8, 'Ve', 'sexuality', 'Sexuality', 'कामुकता'],
  [8, 'Ve', 'femaleGenitals', 'Female genitals', 'स्त्री जननांग'],
  [8, 'Sa', 'danger', 'Danger / death', 'संकट / मृत्यु'],
  [8, 'Sa', 'humiliation', 'Break / setback / humiliation', 'टूटन / झटका / अपमान'],
  [8, 'Sa', 'history', 'History', 'इतिहास'],
  [8, 'Sa', 'longevity', 'Longevity', 'आयु'],
  [8, 'Sa', 'colon', 'Colon', 'बड़ी आँत'],
  [8, 'Sa', 'sorrow', 'Sorrow / setback', 'शोक / आघात'],
  [8, 'Ra', 'malignantDisease', 'Malignant / undiagnosable or untreatable disease', 'घातक / पकड़ में न आने वाला या असाध्य रोग'],
  [8, 'Ra', 'secret', 'Secrets', 'रहस्य'],
  [8, 'Ra', 'research', 'Research', 'शोध'],
  [8, 'Ra', 'vice', 'Vice / filth / sin', 'दुर्व्यसन / मलिनता / पाप'],
  [8, 'Ke', 'psychicPowers', 'Psychic / occult powers', 'अलौकिक / गुप्त शक्तियाँ'],
  // 9th
  [9, 'Su', 'father', 'Father', 'पिता'],
  [9, 'Ju', 'goodFortune', 'Good fortune', 'सौभाग्य'],
  [9, 'Ju', 'pilgrimage', 'Pilgrimage / long inland journey', 'तीर्थयात्रा / देश के भीतर लंबी यात्रा'],
  [9, 'Ju', 'higherEducation', 'Higher education', 'उच्च शिक्षा'],
  [9, 'Ju', 'religious', 'Religious inclination', 'धार्मिक झुकाव'],
  [9, 'Sa', 'legalAffairs', 'Legal affairs', 'कानूनी मामले'],
  [9, 'Ra', 'foreignTravel', 'Journey abroad / foreign travel', 'विदेश यात्रा'],
  // 10th
  [10, 'Su', 'rankFame', 'Rank / status / fame', 'पद / प्रतिष्ठा / यश'],
  [10, 'Ma', 'executiveAuthority', 'Executive authority', 'कार्यकारी अधिकार'],
  [10, 'Ju', 'managerial', 'Managerial ability', 'प्रबंधन क्षमता'],
  [10, 'Sa', 'knees', 'Knees', 'घुटने'],
  [10, 'Sa', 'profession', 'Profession / deeds / livelihood', 'पेशा / कर्म / आजीविका'],
  // 11th
  [11, 'Ju', 'elderSiblings', 'Elder siblings', 'बड़े भाई-बहन'],
  [11, 'Ju', 'income', 'Income / gain / success', 'आय / लाभ / सफलता'],
  [11, 'Sa', 'ankles', 'Ankles / shins', 'टखने / पिंडलियाँ'],
  // 12th
  [12, 'Su', 'placeOfWorship', 'Place of worship', 'पूजा स्थल'],
  [12, 'Mo', 'sleep', 'Sleep', 'नींद'],
  [12, 'Mo', 'consciousness', 'Consciousness', 'चेतना'],
  [12, 'Mo', 'dreams', 'Dreams / subconscious', 'स्वप्न / अवचेतन'],
  [12, 'Ve', 'bedPleasure', 'Sexual pleasure', 'शय्या सुख'],
  [12, 'Sa', 'feet', 'Feet', 'पैर'],
  [12, 'Sa', 'loss', 'Loss / separation / expenditure / change', 'हानि / वियोग / व्यय / परिवर्तन'],
  [12, 'Ra', 'imprisonment', 'Imprisonment / physical restraint', 'कारावास / शारीरिक बंधन'],
]

export const NATAL_KARAKATVA: readonly NatalKarakatva[] = ROWS.map(([house, planet, id, en, hi, source]) => ({
  id,
  house,
  planet,
  en,
  hi,
  ...(source ? { source } : {}),
}))

/** Natal karakatvas a planet signifies inside one house. */
export function karakatvasFor(planet: GrahaId, house: number): NatalKarakatva[] {
  return NATAL_KARAKATVA.filter((k) => k.planet === planet && k.house === house)
}

/** Every natal karakatva of a planet, across houses. */
export function karakatvasOfPlanet(planet: GrahaId): NatalKarakatva[] {
  return NATAL_KARAKATVA.filter((k) => k.planet === planet)
}

export function karakatvaLabel(k: NatalKarakatva, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? k.hi : k.en
}
