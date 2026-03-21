// src/lib/engine/ashtakoot.ts
// Calculates the 36-point Ashtakoot Milan (Gun Milan) for Vedic Matchmaking

export function getVarnaName(sign: number) {
  if ([4,8,12].includes(sign)) return 'Brahmin';
  if ([1,5,9].includes(sign)) return 'Kshatriya';
  if ([2,6,10].includes(sign)) return 'Vaishya';
  return 'Shudra';
}

export function getVashyaName(sign: number) {
  if ([1,2,9].includes(sign)) return 'Quadruped';
  if ([3,6,7,11].includes(sign)) return 'Human';
  if ([4,10,12].includes(sign)) return 'Water';
  if (sign === 5) return 'Wild';
  return 'Insect'; 
}

export function getTaraName(fromNak: number, toNak: number) {
  const diff = ((toNak - fromNak + 27) % 27) + 1;
  const rem = diff % 9;
  const names = ['Ati-Mitra', 'Janma', 'Sampat', 'Vipat', 'Kshem', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra'];
  return names[rem];
}

const YONIS = [0,1,2,3,4,4,5,6,3,6,7,7,8,9,10,10,11,11,12,13,13,14,14,1,2,8,9,12];
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
  const dev = [1,5,7,8,13,15,17,22,27];
  const man = [2,4,6,9,11,12,20,21,25];
  if (dev.includes(nak)) return 'Deva';
  if (man.includes(nak)) return 'Manushya';
  return 'Rakshasa';
}

export function getNadiName(nak: number) {
  const rem = nak % 9;
  if (rem===1 || rem===6 || rem===7 || rem===0) return 'Aadi (Vata)';
  if (rem===2 || rem===5 || rem===8) return 'Madhya (Pitta)';
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
  if ((b==='Human' && g==='Quadruped') || (b==='Quadruped' && g==='Human')) return 1;
  if (b==='Water' && g==='Human') return 1;
  if (b==='Human' && g==='Water') return 0.5;
  return 0;
}

function calcTara(bNak: number, gNak: number) {
  const bRem = (((bNak - gNak + 27) % 27) + 1) % 9;
  const gRem = (((gNak - bNak + 27) % 27) + 1) % 9;
  const isBad = (r: number) => r===3 || r===5 || r===7;
  const bG = !isBad(bRem), gG = !isBad(gRem);
  if (bG && gG) return 3;
  if (bG || gG) return 1.5;
  return 0;
}

function calcYoni(bNak: number, gNak: number) {
  if (bNak === gNak) return 4;
  const enemies = [[1,9],[2,13],[3,11],[4,14],[5,12],[6,7],[8,10]];
  const yB = YONIS[bNak], yG = YONIS[gNak];
  if (yB === yG) return 4;
  const isEn = enemies.some(p => (p[0]===yB && p[1]===yG) || (p[1]===yB && p[0]===yG));
  if (isEn) return 0;
  return 2;
}

function calcMaitri(bSign: number, gSign: number) {
  if (bSign === gSign) return 5;
  const lB = getLord(bSign), lG = getLord(gSign);
  if (lB === lG) return 5;
  return 2.5; 
}

function calcGana(bNak: number, gNak: number) {
  const b = getGanaName(bNak), g = getGanaName(gNak);
  if (b === g) return 6;
  if (b === 'Deva' && g === 'Manushya') return 6;
  if (b === 'Manushya' && g === 'Deva') return 5;
  if (b === 'Rakshasa' && g === 'Deva') return 1;
  return 0;
}

function calcBhakoot(bSign: number, gSign: number) {
  let diff = ((gSign - bSign + 12) % 12);
  let d = new Set([diff, (12 - diff) % 12]);
  if (d.has(0) || d.has(6) || d.has(2) || d.has(3)) return 7; 
  return 0; 
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
    bhakoot: { points: bhakoot, max: 7 }, // Sign names are handled in frontend directly via RASHI_NAMES
    nadi: { points: nadi, max: 8, p1: getNadiName(boyNak), p2: getNadiName(girlNak) },
    total: varna+vashya+tara+yoni+maitri+gana+bhakoot+nadi
  };
}
