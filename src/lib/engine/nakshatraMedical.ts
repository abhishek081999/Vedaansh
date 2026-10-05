// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraMedical.ts
//  Medical astrology reference for all 27 nakshatras:
//  body parts, dosha disease nature, primary diseases,
//  karmic/healing significance, and chart-aware helpers.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'

export type MedicalDosha = 'Vata' | 'Pitta' | 'Kapha'

export interface NakshatraMedicalProfile {
  index: number
  name: string
  lord: GrahaId
  signs: string
  deity: string
  dosha: MedicalDosha
  externalBodyParts: string[]
  internalOrgans: string[]
  glandsSystems: string[]
  primaryDiseases: string[]
  additionalDiseases: string[]
  karmicHealing: string
  diseaseNature: string
  keyTrigger?: string
}

export interface DoshaMedicalInfo {
  dosha: MedicalDosha
  durationClass: string
  nakshatraIndices: number[]
  characteristics: string
  keyAction: string
}

export interface MedicalIndicatorResult {
  key: 'moon' | 'sixthLord' | 'ascendant'
  label: string
  priority: 'PRIMARY' | 'SECONDARY' | 'TERTIARY'
  reveals: string
  planetId: GrahaId | null
  planetName: string
  nakshatraIndex: number
  nakshatraName: string
  profile: NakshatraMedicalProfile
}

const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo',
  5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma',
  9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function rashiOfHouse(house: number, ascRashi: Rashi): Rashi {
  return ((((ascRashi - 1) + (house - 1)) % 12) + 1) as Rashi
}

// ── 27 Medical profiles ───────────────────────────────────────

export const NAKSHATRA_MEDICAL: NakshatraMedicalProfile[] = [
  {
    index: 0, name: 'Ashwini', lord: 'Ke', signs: 'Aries',
    deity: 'Ashwini Kumars (twin doctors)', dosha: 'Vata',
    externalBodyParts: ['Head', 'Both knees', 'Upper brain', 'Upper foot'],
    internalOrgans: ['Brain', 'Cerebrum', 'Upper feet'],
    glandsSystems: ['Adrenal system (quick action)'],
    primaryDiseases: ['Epilepsy', 'Headache', 'Migraine', 'Mental stress/disease'],
    additionalDiseases: ['Mental disorders', 'Mental issues'],
    karmicHealing: 'Incomplete/wrong past-life treatment. Can give TWO diseases simultaneously. Sudden onset but also fast recovery; even cancer if detected early has good prognosis.',
    diseaseNature: 'Quick onset, quick resolution. Can be sudden and fatal.',
    keyTrigger: 'Past-life incomplete treatment',
  },
  {
    index: 1, name: 'Bharani', lord: 'Ve', signs: 'Aries',
    deity: 'Yama (death god)', dosha: 'Pitta',
    externalBodyParts: ['Head', 'Inner eyes', 'Soles of feet', 'Knees', 'Cerebellum area', 'Both feet'],
    internalOrgans: ['Cerebral hemisphere (inner)', 'Lower brain', 'Cerebellum'],
    glandsSystems: ['Reproductive glands'],
    primaryDiseases: ['Sexual diseases', 'Eye diseases', 'Knee pain', 'Tooth decay'],
    additionalDiseases: ['Eye disorders', 'Reproductive issues'],
    karmicHealing: 'Disease from lack of discipline and wrong karma. Moral imbalance = physical suffering; reproductive and toxic diseases. Immoral behavior directly triggers bodily disease.',
    diseaseNature: 'Intense, inflammatory, causes rapid damage.',
    keyTrigger: 'Moral imbalance',
  },
  {
    index: 2, name: 'Krittika', lord: 'Su', signs: 'Aries/Taurus',
    deity: 'Agni (fire god)', dosha: 'Kapha',
    externalBodyParts: ['Waist/lower back', 'Crown of head', 'Eyes', 'Neck', 'Tonsils', 'Upper back', 'Face', 'Hips', 'Throat'],
    internalOrgans: ['Eyes', 'Face', 'Neck', 'Vision centers', 'Brain'],
    glandsSystems: ['Thyroid (indirect)'],
    primaryDiseases: ['Inflammation', 'Fever (Jwara)', 'High temperature'],
    additionalDiseases: ['Burning sensations', 'Pitta disorders'],
    karmicHealing: 'Fire nakshatra — purification diseases. Anger is a major trigger: uncontrolled BP, blood infections, nerve blockages, inflammation, digestive disorders.',
    diseaseNature: 'Slow-building fever/inflammation, can become chronic.',
    keyTrigger: 'Anger',
  },
  {
    index: 3, name: 'Rohini', lord: 'Mo', signs: 'Taurus',
    deity: 'Brahma (creator)', dosha: 'Kapha',
    externalBodyParts: ['Forehead', 'Face', 'Calves', 'Ankles', 'Mouth', 'Tongue', 'Shins', 'Palate', 'Back cervical', 'Nasal area', 'Both legs'],
    internalOrgans: ['Mouth', 'Tongue', 'Tonsils', 'Palate', 'Neck', 'Nasal area', 'Back cervical'],
    glandsSystems: ['Cervical spine', 'Vocal apparatus'],
    primaryDiseases: ['Cold sensitivity', 'Obesity', 'Stress', 'Pneumonia', 'Irregular menstrual cycles', 'Genetic diseases'],
    additionalDiseases: ['PCOD', 'Pollen allergy', 'Sinusitis', 'Allergic cold'],
    karmicHealing: 'Genetic diseases — DNA-linked (Brahma = creation/DNA). Family-linked conditions (BP, diabetes, even cancer) may need deeper/root-level treatment.',
    diseaseNature: 'Slow, cold-type chronic diseases, fluid retention.',
    keyTrigger: 'Genetic / family lineage',
  },
  {
    index: 4, name: 'Mrigashira', lord: 'Ma', signs: 'Taurus/Gemini',
    deity: 'Chandra (Moon)', dosha: 'Pitta',
    externalBodyParts: ['Chin', 'Cheeks', 'Face', 'Eyes', 'Throat', 'Shoulders', 'Shoulder blades', 'Arms', 'Ribs'],
    internalOrgans: ['Throat', 'Vocal cords', 'Arms', 'Shoulders', 'Ribs', 'Thymus gland'],
    glandsSystems: ['Thymus gland (chest behind sternum)'],
    primaryDiseases: ['Dry throat', 'Shoulder pain', 'Excessive water intake disorders', 'Nervous system disorders', 'Allergies', 'Asthma', 'Mental illness', 'Skin sensitivity', 'Paralysis'],
    additionalDiseases: ['Lung problems', 'Digestive looseness from excess water'],
    karmicHealing: 'Moon = medicine — helps identify whether Ayurveda, Homeopathy, or Allopathy is suitable. Multiple diseases possible simultaneously.',
    diseaseNature: 'Intense nerve/inflammation diseases.',
    keyTrigger: 'Multiple simultaneous diseases',
  },
  {
    index: 5, name: 'Ardra', lord: 'Ra', signs: 'Gemini',
    deity: 'Rudra (storm god)', dosha: 'Vata',
    externalBodyParts: ['Hair', 'Throat', 'Arms', 'Shoulders', 'Eyes', 'Chest', 'Back and front of head'],
    internalOrgans: ['Brain blood flow', 'Complete neural control', 'Nerve system', 'Throat', 'Arms', 'Chest'],
    glandsSystems: ['Entire nervous system control'],
    primaryDiseases: ['Asthma', 'Nervous/neurological disorders', 'Trauma', 'Serious and chronic diseases'],
    additionalDiseases: ['Mental illness', 'Skin sensitivity', 'Paralysis'],
    karmicHealing: 'Trauma diseases. Serious and chronic. Nervous system-linked. Rudra — trauma and nervous system involvement.',
    diseaseNature: 'Sudden serious onset; can resolve quickly or worsen fast.',
    keyTrigger: 'Trauma',
  },
  {
    index: 6, name: 'Punarvasu', lord: 'Ju', signs: 'Gemini/Cancer',
    deity: 'Aditi (mother of gods)', dosha: 'Vata',
    externalBodyParts: ['Fingers', 'Nose (ENT)', 'Throat', 'Shoulder blades', 'Respiratory system', 'Chest'],
    internalOrgans: ['Throat', 'Shoulder blades', 'Lungs', 'Stomach', 'Pancreas', 'Diaphragm'],
    glandsSystems: ['Liver (upper lobe)', 'Diaphragm'],
    primaryDiseases: ['Diabetes', 'Asthma', 'TB / tuberculosis', 'Vrukshara (difficult breathing)', 'UTI (common in women)'],
    additionalDiseases: ['Dyspnea', 'Bronchitis'],
    karmicHealing: 'Rise and fall cycle — one disease heals, another comes. Recurring recovery-then-relapse pattern; rebirth energy.',
    diseaseNature: 'Recurring cycle — comes and goes repeatedly.',
    keyTrigger: 'Relapse / rebirth cycle',
  },
  {
    index: 7, name: 'Pushya', lord: 'Sa', signs: 'Cancer',
    deity: 'Brihaspati (Jupiter)', dosha: 'Pitta',
    externalBodyParts: ['Mouth', 'Face'],
    internalOrgans: ['Lungs', 'Stomach', 'Ribs', 'Face'],
    glandsSystems: ['Diaphragm', 'Pancreas'],
    primaryDiseases: ['Eczema', 'Ulcers', 'Liver disease', 'Breast cancer', 'TB', 'Gastric problems', 'Gallbladder stones'],
    additionalDiseases: ['Breast cancer (with planet support)'],
    karmicHealing: 'Good doctor found, correct diagnosis. Ignoring advice → disease becomes long and serious. Follow prescription carefully.',
    diseaseNature: 'Medium-length diseases with good recovery potential.',
    keyTrigger: 'Ignoring medical advice',
  },
  {
    index: 8, name: 'Ashlesha', lord: 'Me', signs: 'Cancer',
    deity: 'Nagas (serpents)', dosha: 'Kapha',
    externalBodyParts: ['Nails (fingers and toes)', 'Bones', 'Joints (elbow, knuckle, kneecap)', 'Ears'],
    internalOrgans: ['Lungs', 'Stomach', 'Diaphragm', 'Pancreas', 'Liver'],
    glandsSystems: ['Bone joints', 'Ears'],
    primaryDiseases: ['Dietary imbalance/malnutrition', 'Obesity', 'Arthritis', 'Jaundice', 'Breathing issues', 'Toxicity', 'Hidden mental disorders', 'Psychosomatic diseases'],
    additionalDiseases: ['Anxiety', 'Digestive issues with anxiety'],
    karmicHealing: 'Hidden toxins and toxic emotions. Psychosomatic / undiagnosed conditions. Nagas — underground energy; detoxification needed.',
    diseaseNature: 'Hidden chronic diseases, hard to diagnose.',
    keyTrigger: 'Hidden toxicity / toxic emotions',
  },
  {
    index: 9, name: 'Magha', lord: 'Ke', signs: 'Leo',
    deity: 'Pitris (ancestors)', dosha: 'Kapha',
    externalBodyParts: ['Nose', 'Lips', 'Right hand', 'Chin'],
    internalOrgans: ['Heart', 'Spine', 'Sexual organs', 'Spinal cord', 'Spleen', 'Back'],
    glandsSystems: ['Spleen', 'Specific spine section'],
    primaryDiseases: ['Heart disease', 'Spine issues', 'Skin problems (around mouth)', 'Mental disorders', 'Stomach-related disorders'],
    additionalDiseases: ['Spinal cord issues', 'Spleen issues'],
    karmicHealing: 'Pitru dosha — genetic/ancestral disease pattern. Diseases come through family lineage.',
    diseaseNature: 'Slow genetic/ancestral diseases.',
    keyTrigger: 'Ancestral / pitru pattern',
  },
  {
    index: 10, name: 'Purva Phalguni', lord: 'Ve', signs: 'Leo',
    deity: 'Bhaga (pleasure)', dosha: 'Pitta',
    externalBodyParts: ['Lips', 'Right hand'],
    internalOrgans: ['Heart', 'Spinal cord', 'Sexual organs'],
    glandsSystems: ['Upper spine'],
    primaryDiseases: ['Addiction', 'Heart issues', 'Blood circulation issues', 'Dental problems', 'High BP', 'Nerve/spine problems', 'Pain in toes', 'Anemia'],
    additionalDiseases: ['Circulation issues'],
    karmicHealing: 'Pleasure-seeking diseases. Lifestyle excess. Bhaga — enjoyment/pleasure → addiction-related diseases.',
    diseaseNature: 'Moderate-severe, circulation/addiction related.',
    keyTrigger: 'Addiction / lifestyle excess',
  },
  {
    index: 11, name: 'Uttara Phalguni', lord: 'Su', signs: 'Leo/Virgo',
    deity: 'Aryaman (Sun\'s rays)', dosha: 'Vata',
    externalBodyParts: ['Left hand', 'Lips'],
    internalOrgans: ['Abdomen', 'Liver', 'Sex organs'],
    glandsSystems: ['Left arm'],
    primaryDiseases: ['Digestive problems', 'Hand/arm skin issues', 'Dental issues', 'Constipation', 'Back pain', 'High BP'],
    additionalDiseases: ['Digestive system disorders'],
    karmicHealing: 'Power zone nakshatra — strong immunity naturally. Aryaman strengthens the body.',
    diseaseNature: 'Quick onset; strong immunity helps fast recovery.',
    keyTrigger: 'Strong immunity zone',
  },
  {
    index: 12, name: 'Hasta', lord: 'Mo', signs: 'Virgo',
    deity: 'Savitar/Aditya (Sun)', dosha: 'Vata',
    externalBodyParts: ['Both hands (all fingers)'],
    internalOrgans: ['Intestines', 'Liver', 'Spine'],
    glandsSystems: ['Spine (thoracic)'],
    primaryDiseases: ['Intestinal problems', 'Arterial blockage', 'Vein issues', 'Hysteria', 'Cholera', 'Allergies', 'Ulcers', 'Sunstroke', 'Frequent urination', 'Kidney problems', 'Stomach ulcers', 'Intestinal worms'],
    additionalDiseases: ['Heat stroke'],
    karmicHealing: 'Sun worship aids all diseases. Watching sunrise helps significantly; treatment responds well; diseases heal faster with sun exposure.',
    diseaseNature: 'Quick digestive upsets; quick healing too.',
    keyTrigger: 'Sun exposure / sunrise practice',
  },
  {
    index: 13, name: 'Chitra', lord: 'Ma', signs: 'Virgo/Libra',
    deity: 'Tvashtri (divine craftsman)', dosha: 'Pitta',
    externalBodyParts: ['Forehead', 'Waist', 'Neck'],
    internalOrgans: ['Belly/lower abdomen', 'Kidneys', 'Lower spine'],
    glandsSystems: ['Motor system (movement control)', 'Lower spine'],
    primaryDiseases: ['Insect bites (very prone)', 'Brain fever', 'Excess urination', 'Kidney and stomach issues', 'Intestinal worms'],
    additionalDiseases: ['Kidney problems', 'Stomach ulcers'],
    karmicHealing: 'Strong willpower — can endure serious illness and self-heal through will; creative healing energy.',
    diseaseNature: 'Inflammatory, kidney, fever-type.',
    keyTrigger: 'Willpower-based recovery',
  },
  {
    index: 14, name: 'Swati', lord: 'Ra', signs: 'Libra',
    deity: 'Vayu (wind god)', dosha: 'Kapha',
    externalBodyParts: ['Teeth', 'Skin'],
    internalOrgans: ['Skin', 'Bladder', 'Kidneys', 'Appendix area', 'Chest'],
    glandsSystems: ['Appendix area', 'Chest'],
    primaryDiseases: ['Urinary tract issues', 'Intestinal problems', 'Eczema', 'Skin disorders', 'Appendicitis', 'Vitiligo (fulwari)', 'Immune disorders'],
    additionalDiseases: ['UTIs'],
    karmicHealing: 'Unstable wind energy — long hard-to-diagnose diseases lasting months/years. Immune disorders.',
    diseaseNature: 'Very long chronic — hardest to diagnose and treat.',
    keyTrigger: 'Immune instability',
  },
  {
    index: 15, name: 'Vishakha', lord: 'Ju', signs: 'Libra/Scorpio',
    deity: 'Indra-Agni (fire+thunder)', dosha: 'Kapha',
    externalBodyParts: ['Upper limbs (arms)', 'Breast'],
    internalOrgans: ['Lower abdomen near bladder', 'Genitals', 'Prostate', 'Bladder area'],
    glandsSystems: ['Arms and breast together'],
    primaryDiseases: ['Prostate problems', 'Piles/hemorrhoids', 'Colon disorders', 'Diabetes', 'Paralysis', 'Uterine problems', 'Testicular issues'],
    additionalDiseases: ['Colon issues'],
    karmicHealing: 'Overeating IMMEDIATELY affects health — dietary discipline essential.',
    diseaseNature: 'Slow-building metabolic (diabetes, piles).',
    keyTrigger: 'Overeating / diet excess',
  },
  {
    index: 16, name: 'Anuradha', lord: 'Sa', signs: 'Scorpio',
    deity: 'Mitra (friendship/contract)', dosha: 'Pitta',
    externalBodyParts: ['Breast', 'Nasal bones', 'Bones near genital area'],
    internalOrgans: ['Heart', 'Bladder', 'Genital organs', 'Womb (uterus)'],
    glandsSystems: ['Womb (uterus)'],
    primaryDiseases: ['Constipation', 'Piles', 'Irregular uterine problems', 'Breast issues', 'Cough and cold', 'Depression', 'Anxiety', 'Brain-related issues', 'Heart-related issues', 'BP issues'],
    additionalDiseases: ['Breast problems'],
    karmicHealing: 'Friendship-related emotional diseases. Excess attachment leads to depression, anxiety, brain issues, heart issues, BP issues.',
    diseaseNature: 'Moderate constipation/reproductive diseases.',
    keyTrigger: 'Excess attachment',
  },
  {
    index: 17, name: 'Jyeshtha', lord: 'Me', signs: 'Scorpio',
    deity: 'Indra (king of gods)', dosha: 'Vata',
    externalBodyParts: ['Tongue', 'Right side of torso', 'Neck'],
    internalOrgans: ['Colon', 'Anus', 'Genitals', 'Ovaries', 'Womb', 'Neck'],
    glandsSystems: ['Right side specifically'],
    primaryDiseases: ['Back pain', 'Neck issues', 'Fertility problems', 'White discharge (leucorrhoea)', 'AIDS-related', 'Anal issues', 'Pain in arms', 'Fistula (internal)'],
    additionalDiseases: ['Fistula-in-ano'],
    karmicHealing: 'Right-side body issues. Leadership stress. Karma-based illness — wrong/immoral actions invite suffering.',
    diseaseNature: 'Quick but strong — spinal and fertility issues.',
    keyTrigger: 'Wrong deeds / indiscipline',
  },
  {
    index: 18, name: 'Mula', lord: 'Ke', signs: 'Sagittarius',
    deity: 'Nirrti (goddess of chaos)', dosha: 'Vata',
    externalBodyParts: ['Both feet', 'Hips', 'Thighs'],
    internalOrgans: ['Sciatic nerve', 'Right side of torso'],
    glandsSystems: ['Hip joints', 'Sacral region'],
    primaryDiseases: ['Mental disorders', 'Obesity', 'Foot problems', 'Joint pain', 'Anxiety', 'Low BP', 'Breathing problems', 'Abscesses'],
    additionalDiseases: ['Sciatica'],
    karmicHealing: 'Long disease cycles — difficult to end. Self-caused illness from ignorance/neglect.',
    diseaseNature: 'Sudden mental/foot issues; can be very severe.',
    keyTrigger: 'Ignorance / neglect',
  },
  {
    index: 19, name: 'Purva Ashadha', lord: 'Ve', signs: 'Sagittarius',
    deity: 'Apas (water deity)', dosha: 'Pitta',
    externalBodyParts: ['Thighs', 'Hips', 'Sacral region', 'Lower back (lumbar)', 'Full back (neck to waist)'],
    internalOrgans: ['Veins (major)', 'Back (neck to waist)'],
    glandsSystems: ['Lower back', 'Lumbar spine'],
    primaryDiseases: ['Bladder problems', 'Kidney problems', 'Lung issues', 'Diabetes', 'Blood poisoning/infection', 'Colds', 'Water retention'],
    additionalDiseases: ['Kidney problems especially with Venus here'],
    karmicHealing: 'Water-element diseases. Fluid imbalance in the body (lymph, edema). Venus affliction here = severe kidney risk.',
    diseaseNature: 'Moderate kidney/blood diseases.',
    keyTrigger: 'Water / fluid imbalance',
  },
  {
    index: 20, name: 'Uttara Ashadha', lord: 'Su', signs: 'Sagittarius/Capricorn',
    deity: 'Vishwe Devatas (all gods)', dosha: 'Kapha',
    externalBodyParts: ['Thighs', 'Knees', 'Waist'],
    internalOrgans: ['Skin (large surface)', 'Arteries'],
    glandsSystems: ['Waist region'],
    primaryDiseases: ['Eye problems', 'Stomach issues', 'Eczema', 'Arthritis', 'Skin dryness', 'Breathing difficulty', 'Paralysis', 'Weak digestion', 'Palpitations'],
    additionalDiseases: ['Multi-system involvement'],
    karmicHealing: 'Universal energy — complex multi-system disease. Body has great strength, but excess protein/strength becomes harmful.',
    diseaseNature: 'Slow multi-system diseases.',
    keyTrigger: 'Over-nutrition / over-strength',
  },
  {
    index: 21, name: 'Shravana', lord: 'Mo', signs: 'Capricorn',
    deity: 'Vishnu (preserver)', dosha: 'Kapha',
    externalBodyParts: ['Both ears'],
    internalOrgans: ['Lymph system', 'Brain', 'Skin', 'Sexual organs'],
    glandsSystems: ['Skin (sensitivity)', 'Lymph'],
    primaryDiseases: ['Hearing problems / hard of hearing', 'Reproductive organ diseases', 'Sensitive skin', 'Urinary problems', 'Weak digestion', 'Knee issues'],
    additionalDiseases: ['Hearing loss'],
    karmicHealing: 'Vishnu = preservation — chronic maintenance diseases. When sick, recovery is very slow; the native may nurture/pamper the illness rather than fight it.',
    diseaseNature: 'Chronic hearing/reproductive issues.',
    keyTrigger: 'Nurturing the disease',
  },
  {
    index: 22, name: 'Dhanishtha', lord: 'Ma', signs: 'Capricorn/Aquarius',
    deity: 'Ashta Vasus (eight elemental gods)', dosha: 'Pitta',
    externalBodyParts: ['Back', 'Kneecap', 'Shin/lower leg', 'Calves', 'Limbs'],
    internalOrgans: ['Spinal cord', 'Anus', 'Limbs'],
    glandsSystems: ['Back (full length)'],
    primaryDiseases: ['High BP', 'Heart disease', 'Arthritis', 'Back problems', 'Piles', 'Broken/fractured limbs (very prone)'],
    additionalDiseases: ['Fractures'],
    karmicHealing: 'Prone to fractures if afflicted. Over-protection of the body can also backfire on health.',
    diseaseNature: 'BP, heart, fracture-prone.',
    keyTrigger: 'Excess caution / over-protection',
  },
  {
    index: 23, name: 'Shatabhisha', lord: 'Ra', signs: 'Aquarius',
    deity: 'Varuna (ocean/cosmic law)', dosha: 'Vata',
    externalBodyParts: ['Both sides of knees', 'Jaws', 'Ankles', 'Calves', 'Jaw/chewing muscles'],
    internalOrgans: ['Heart (indirect)', 'Water retention systems', 'Immune system'],
    glandsSystems: ['Circulation system'],
    primaryDiseases: ['High BP', 'Heart disease', 'Water-related problems', 'Jaw problems', 'Immune system breakdown', 'Fluid-related dysfunction'],
    additionalDiseases: ['Joint problems'],
    karmicHealing: 'Varuna = cosmic law — karmic water diseases. High probability of fluid-related disorders; immunity breaks.',
    diseaseNature: 'Sudden water/BP issues.',
    keyTrigger: 'Fluid / water disorders',
  },
  {
    index: 24, name: 'Purva Bhadrapada', lord: 'Ju', signs: 'Aquarius/Pisces',
    deity: 'Aja Ekapada (one-footed goat)', dosha: 'Vata',
    externalBodyParts: ['Left side: ankles, feet, toes', 'Left thigh', 'Left abdomen', 'Left ribs'],
    internalOrgans: ['Ribs (left side)', 'Left side of abdomen'],
    glandsSystems: ['Left side of entire body'],
    primaryDiseases: ['Liver disease', 'Foot swelling (elephantiasis)', 'Heart problems', 'Enlarged liver', 'Ulcers', 'Low BP', 'Jaundice', 'Hernia'],
    additionalDiseases: ['Elephant foot swelling'],
    karmicHealing: 'Left-side body issues. Liver-centric. Illness becomes a life-transforming event (lifestyle changes drastically).',
    diseaseNature: 'Sudden liver/foot swelling.',
    keyTrigger: 'Life-transforming illness',
  },
  {
    index: 25, name: 'Uttara Bhadrapada', lord: 'Sa', signs: 'Pisces',
    deity: 'Ahir Budhnya (serpent of deep)', dosha: 'Pitta',
    externalBodyParts: ['Right side: feet, legs', 'Right abdomen (armpit area)'],
    internalOrgans: ['Right side of abdomen', 'Intestinal issues'],
    glandsSystems: ['Right side of body'],
    primaryDiseases: ['Cold feet', 'Indigestion', 'Stress disorders', 'Allergies', 'TB', 'Liver problems', 'Intestinal issues'],
    additionalDiseases: ['Stress-led multi-disease cascade'],
    karmicHealing: 'Stress creates multiple diseases. Deep karmic suffering. Dual energy — infections and venom-like inflammations highly likely.',
    diseaseNature: 'Stress-caused inflammatory diseases.',
    keyTrigger: 'Venomous anger / infections',
  },
  {
    index: 26, name: 'Revati', lord: 'Me', signs: 'Pisces',
    deity: 'Pushan (nourisher/guide)', dosha: 'Kapha',
    externalBodyParts: ['Ankles', 'Feet', 'Toes (all)', 'Armpits/sides of body'],
    internalOrgans: ['Lymphatic system (feet/ankles)', 'Intestinal ulcers'],
    glandsSystems: ['Foot bones (tarsal/metatarsal)'],
    primaryDiseases: ['Childhood sinusitis (carries to adult)', 'Insomnia', 'Childhood illnesses persisting', 'Sensitive nervous system', 'Pain in feet', 'Intestinal ulcers', 'Deafness', 'Eye issues'],
    additionalDiseases: ['Toe/foot pain'],
    karmicHealing: 'Childhood diseases persist into adulthood. Past-life nutrition karma. Under affliction, current treatment/medication may need revision.',
    diseaseNature: 'Childhood chronic disease — carries through life.',
    keyTrigger: 'Treatment revision needed',
  },
]

export function getNakshatraMedical(index: number): NakshatraMedicalProfile {
  return NAKSHATRA_MEDICAL[((index % 27) + 27) % 27]
}

// ── Dosha quick reference ─────────────────────────────────────

export const MEDICAL_DOSHA_INFO: Record<MedicalDosha, DoshaMedicalInfo> = {
  Vata: {
    dosha: 'Vata',
    durationClass: '1, 9, 25 days',
    nakshatraIndices: [0, 5, 6, 11, 12, 17, 18, 23, 24],
    characteristics: 'Quick onset & end. Can be suddenly fatal. Anxiety-type. Air/movement disorders.',
    keyAction: 'Requires warming, grounding therapies',
  },
  Pitta: {
    dosha: 'Pitta',
    durationClass: '11, 20, 30 days',
    nakshatraIndices: [1, 4, 7, 10, 13, 16, 19, 22, 25],
    characteristics: 'Intense inflammation. Rapid damage. Fire/heat diseases. Short-medium duration.',
    keyAction: 'Requires cooling, soothing treatments',
  },
  Kapha: {
    dosha: 'Kapha',
    durationClass: 'Months to years',
    nakshatraIndices: [2, 3, 8, 9, 14, 15, 20, 21, 26],
    characteristics: 'Slow, chronic, repeating. Can last years. Mucus/fluid/cold type. Hard to cure.',
    keyAction: 'Requires active, warming, drying therapies',
  },
}

export const DOSHA_COL: Record<MedicalDosha, string> = {
  Vata: '#818cf8',
  Pitta: '#f87171',
  Kapha: '#34d399',
}

// ── Chart-aware helpers ───────────────────────────────────────

export function getMedicalIndicators(chart: ChartOutput): MedicalIndicatorResult[] {
  const asc = chart.lagnas.ascRashi
  const sixthRashi = rashiOfHouse(6, asc)
  const sixthLordId = SIGN_LORD[sixthRashi]
  const sixthLord = chart.grahas.find(g => g.id === sixthLordId) ?? null
  const moon = chart.grahas.find(g => g.id === 'Mo') ?? null

  const ascDeg = chart.lagnas.ascDegree
  const lagNakIdx = Math.floor((((ascDeg % 360) + 360) % 360) / (360 / 27))

  const make = (
    key: MedicalIndicatorResult['key'],
    label: string,
    priority: MedicalIndicatorResult['priority'],
    reveals: string,
    planetId: GrahaId | null,
    nakIdx: number,
  ): MedicalIndicatorResult => {
    const profile = getNakshatraMedical(nakIdx)
    return {
      key, label, priority, reveals,
      planetId,
      planetName: planetId ? GRAHA_NAMES[planetId] : 'Lagna',
      nakshatraIndex: nakIdx,
      nakshatraName: NAKSHATRA_NAMES[nakIdx] ?? profile.name,
      profile,
    }
  }

  return [
    make(
      'moon',
      'Moon',
      'PRIMARY',
      'Body constitution & health vulnerability — emotional/physical vitality signature',
      'Mo',
      moon?.nakshatraIndex ?? 0,
    ),
    make(
      'sixthLord',
      '6th Lord',
      'SECONDARY',
      'Disease blueprint — nature, duration class, and disease behaviour patterns',
      sixthLordId,
      sixthLord?.nakshatraIndex ?? 0,
    ),
    make(
      'ascendant',
      'Lagna',
      'TERTIARY',
      'Physical body vessel — structural body-part sensitivity',
      null,
      lagNakIdx,
    ),
  ]
}

export function getAfflictedMedicalHits(chart: ChartOutput): {
  grahaId: GrahaId
  grahaName: string
  nakshatraIndex: number
  profile: NakshatraMedicalProfile
}[] {
  const core = chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
  // Highlight malefics + nodes in medical-sensitive positions; always include Moon/6L via indicators
  const watch: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke', 'Su']
  return core
    .filter(g => watch.includes(g.id))
    .map(g => ({
      grahaId: g.id,
      grahaName: GRAHA_NAMES[g.id],
      nakshatraIndex: g.nakshatraIndex,
      profile: getNakshatraMedical(g.nakshatraIndex),
    }))
}
