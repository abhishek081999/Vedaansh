// src/lib/engine/ashtakoot.ts
// Calculates the 36-point Ashtakoot Milan (Gun Milan) for Vedic Matchmaking

export function getVarnaName(sign: number) {
  if ([4, 8, 12].includes(sign)) return 'Brahmin';
  if ([1, 5, 9].includes(sign)) return 'Kshatriya';
  if ([2, 6, 10].includes(sign)) return 'Vaishya';
  return 'Shudra';
}

export function getVashyaName(sign: number) {
  if ([1, 2, 9].includes(sign)) return 'Quadruped';
  if ([3, 6, 7, 11].includes(sign)) return 'Human';
  if ([4, 10, 12].includes(sign)) return 'Water';
  if (sign === 5) return 'Wild';
  return 'Insect';
}

export function getRashiName(sign: number) {
  const names = ['Unknown', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return names[sign] || 'Unknown';
}

export function getTaraName(fromNak: number, toNak: number) {
  const diff = ((toNak - fromNak + 27) % 27) + 1;
  const rem = diff % 9;
  const names = ['Ati-Mitra', 'Janma', 'Sampat', 'Vipat', 'Kshem', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra'];
  return names[rem];
}

const YONIS = [0, 1, 2, 3, 4, 4, 5, 6, 3, 6, 7, 7, 8, 9, 10, 10, 11, 11, 12, 13, 13, 14, 14, 1, 2, 8, 9, 12];
export function getYoniName(nak: number) {
  const animals = ['Unknown', 'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Hare', 'Monkey', 'Lion', 'Mongoose'];
  return animals[YONIS[nak] || 1];
}

export function getLord(sign: number) {
  if (sign === 5) return 'Sun';
  if (sign === 4) return 'Moon';
  if (sign === 1 || sign === 8) return 'Mars';
  if (sign === 3 || sign === 6) return 'Mercury';
  if (sign === 9 || sign === 12) return 'Jupiter';
  if (sign === 2 || sign === 7) return 'Venus';
  return 'Saturn';
}

export function getGanaName(nak: number) {
  const dev = [1, 5, 7, 8, 13, 15, 17, 22, 27];
  const man = [2, 4, 6, 11, 12, 20, 21, 25, 26];
  if (dev.includes(nak)) return 'Deva';
  if (man.includes(nak)) return 'Manushya';
  return 'Rakshasa';
}

export function getNadiName(nak: number) {
  const aadi   = [1, 6, 7, 12, 13, 18, 19, 24, 25];
  const madhya = [2, 5, 8, 11, 14, 17, 20, 23, 26];
  if (aadi.includes(nak)) return 'Aadi (Vata)';
  if (madhya.includes(nak)) return 'Madhya (Pitta)';
  return 'Antya (Kapha)';
}

function calcVarna(bSign: number, gSign: number) {
  const vals = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
  const b = vals[getVarnaName(bSign) as keyof typeof vals];
  const g = vals[getVarnaName(gSign) as keyof typeof vals];
  return b >= g ? 1 : 0;
}

function calcVashya(bSign: number, gSign: number) {
  const b = getVashyaName(bSign), g = getVashyaName(gSign);
  if (b === g) return 2;
  // Specific Vashya rules
  const compatibility: Record<string, Record<string, number>> = {
    Quadruped: { Human: 1, Water: 1, Wild: 0, Insect: 1 },
    Human: { Quadruped: 1, Water: 1, Wild: 0, Insect: 1 },
    Water: { Quadruped: 1, Human: 1, Wild: 0, Insect: 1 },
    Wild: { Quadruped: 0, Human: 0, Water: 0, Insect: 0 },
    Insect: { Quadruped: 1, Human: 1, Water: 1, Wild: 0 },
  };
  return compatibility[b]?.[g] ?? 0;
}

function calcTara(bNak: number, gNak: number) {
  const bRem = (((gNak - bNak + 27) % 27) + 1) % 9;
  const gRem = (((bNak - gNak + 27) % 27) + 1) % 9;
  const isBad = (r: number) => r === 3 || r === 5 || r === 7;
  const bG = !isBad(bRem), gG = !isBad(gRem);
  if (bG && gG) return 3;
  if (bG || gG) return 1.5;
  return 0;
}

function calcYoni(bNak: number, gNak: number) {
  const yB = YONIS[bNak], yG = YONIS[gNak];
  if (yB === yG) return 4;
  
  // Natural Enemies
  const enemies = [
    [1, 9], // Horse - Buffalo
    [2, 13], // Elephant - Lion
    [3, 11], // Sheep - Monkey
    [4, 14], // Serpent - Mongoose
    [5, 12], // Dog - Hare
    [6, 7], // Cat - Rat
    [8, 10], // Cow - Tiger
  ];
  const isEn = enemies.some(p => (p[0] === yB && p[1] === yG) || (p[1] === yB && p[0] === yG));
  if (isEn) return 0;
  
  // Friendly/Neutral logic can be expanded, but 2 is standard for non-enemies
  return 2;
}

const RELATIONSHIPS: Record<string, Record<string, string>> = {
  Sun: { Moon: 'Friend', Mars: 'Friend', Jupiter: 'Friend', Mercury: 'Neutral', Venus: 'Enemy', Saturn: 'Enemy' },
  Moon: { Sun: 'Friend', Mercury: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Venus: 'Neutral', Saturn: 'Neutral' },
  Mars: { Sun: 'Friend', Moon: 'Friend', Jupiter: 'Friend', Venus: 'Neutral', Saturn: 'Neutral', Mercury: 'Enemy' },
  Mercury: { Sun: 'Friend', Venus: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Saturn: 'Neutral', Moon: 'Enemy' },
  Jupiter: { Sun: 'Friend', Moon: 'Friend', Mars: 'Friend', Saturn: 'Neutral', Mercury: 'Enemy', Venus: 'Enemy' },
  Venus: { Mercury: 'Friend', Saturn: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Sun: 'Enemy', Moon: 'Enemy' },
  Saturn: { Mercury: 'Friend', Venus: 'Friend', Jupiter: 'Neutral', Sun: 'Enemy', Moon: 'Enemy', Mars: 'Enemy' },
};

function calcMaitri(bSign: number, gSign: number) {
  const lB = getLord(bSign), lG = getLord(gSign);
  if (lB === lG) return 5;
  
  const relB = RELATIONSHIPS[lB]?.[lG] || 'Neutral';
  const relG = RELATIONSHIPS[lG]?.[lB] || 'Neutral';
  
  if (relB === 'Friend' && relG === 'Friend') return 5;
  if ((relB === 'Friend' && relG === 'Neutral') || (relB === 'Neutral' && relG === 'Friend')) return 4;
  if (relB === 'Neutral' && relG === 'Neutral') return 3;
  if ((relB === 'Friend' && relG === 'Enemy') || (relB === 'Enemy' && relG === 'Friend')) return 1;
  if ((relB === 'Neutral' && relG === 'Enemy') || (relB === 'Enemy' && relG === 'Neutral')) return 0.5;
  return 0;
}

function calcGana(bNak: number, gNak: number) {
  const b = getGanaName(bNak), g = getGanaName(gNak);
  if (b === g) return 6;
  if (b === 'Deva' && g === 'Manushya') return 6;
  if (b === 'Manushya' && g === 'Deva') return 5;
  if (b === 'Deva' && g === 'Rakshasa') return 1;
  if (b === 'Manushya' && g === 'Rakshasa') return 0;
  if (b === 'Rakshasa' && g === 'Manushya') return 0;
  if (b === 'Rakshasa' && g === 'Deva') return 0;
  return 0;
}

function calcBhakoot(bSign: number, gSign: number) {
  const diff = ((gSign - bSign + 12) % 12) + 1; // 1 to 12
  const bad = [2, 12, 6, 8, 5, 9];
  if (bad.includes(diff) || bad.includes((14 - diff) % 12)) {
    // There are exceptions for same lord, but simple rule is 0
    return 0;
  }
  return 7;
}

function calcNadi(bNak: number, gNak: number) {
  return getNadiName(bNak) === getNadiName(gNak) ? 0 : 8;
}

export function calculateAshtakoot(boyNak: number, boySign: number, girlNak: number, girlSign: number) {
  const varna = calcVarna(boySign, girlSign);
  const vashya = calcVashya(boySign, girlSign);
  const tara = calcTara(boyNak, girlNak);
  const yoni = calcYoni(boyNak, girlNak);
  const maitri = calcMaitri(boySign, girlSign);
  const gana = calcGana(boyNak, girlNak);
  const bhakoot = calcBhakoot(boySign, girlSign);
  const nadi = calcNadi(boyNak, girlNak);

  return {
    varna: { points: varna, max: 1, p1: getVarnaName(boySign), p2: getVarnaName(girlSign) },
    vashya: { points: vashya, max: 2, p1: getVashyaName(boySign), p2: getVashyaName(girlSign) },
    tara: { points: tara, max: 3, p1: getTaraName(girlNak, boyNak), p2: getTaraName(boyNak, girlNak) },
    yoni: { points: yoni, max: 4, p1: getYoniName(boyNak), p2: getYoniName(girlNak) },
    maitri: { points: maitri, max: 5, p1: getLord(boySign), p2: getLord(girlSign) },
    gana: { points: gana, max: 6, p1: getGanaName(boyNak), p2: getGanaName(girlNak) },
    bhakoot: { points: bhakoot, max: 7, p1: getRashiName(boySign), p2: getRashiName(girlSign) },
    nadi: { points: nadi, max: 8, p1: getNadiName(boyNak), p2: getNadiName(girlNak) },
    total: varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi
  };
}
