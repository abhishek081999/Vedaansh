#!/usr/bin/env node
/**
 * One-off helper: extract D10 practical prose into D10P_TEXT_EN key catalog.
 * Parent wiring uses pick(D10P_TEXT_EN, D10P_TEXT_HI, lang).
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')
const srcPath = path.join(root, 'src/lib/engine/dashamsaPractical.ts')
const src = fs.readFileSync(srcPath, 'utf8')

const en = {}

function set(key, value) {
  if (key in en && en[key] !== value) {
    // allow template normalization
    if (en[key].replace(/\$\{[^}]+\}/g, '{x}') !== value.replace(/\$\{[^}]+\}/g, '{x}')) {
      console.warn('dup key diff', key)
    }
  }
  en[key] = value
}

// PLANET_CHARITY
const charityBlock = src.match(/const PLANET_CHARITY[^=]+=\s*\{([^}]+)\}/s)
if (charityBlock) {
  for (const m of charityBlock[1].matchAll(/\s*(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke|Ur|Ne|Pl):\s*'([^']*)'/g)) {
    set(`charity${m[1]}`, m[2])
  }
}
set('charityDefault', "Dana matching the planet's nature to the needy.")

// PLANET_CHARITY already in file — also export as D10P_CHARITY keys handled separately

// Combos
const comboSec = src.slice(src.indexOf('function buildCombos'), src.indexOf('function sectorMeta'))
const comboObjs = [...comboSec.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?detail:\s*([\s\S]*?)\n\s*\}/g)]
for (const [, id, title, detailRaw] of comboObjs) {
  const camel = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  set(`combo${camel.charAt(0).toUpperCase() + camel.slice(1)}Title`, title)
  const strings = [...detailRaw.matchAll(/'([^']*)'/g)].map((x) => x[1])
  if (strings.length === 1) {
    set(`combo${camel.charAt(0).toUpperCase() + camel.slice(1)}Detail`, strings[0])
  } else if (strings.length >= 2) {
    set(`combo${camel.charAt(0).toUpperCase() + camel.slice(1)}DetailYes`, strings[0])
    set(`combo${camel.charAt(0).toUpperCase() + camel.slice(1)}DetailNo`, strings[strings.length - 1])
  }
}

// INHERITED_META
const inh = [...src.matchAll(/id:\s*'(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)'\s*,\s*source:\s*'([^']*)'/g)]
// better parse INHERITED_META array
const inhBlock = src.match(/const INHERITED_META[\s\S]*?\n\]/m)
if (inhBlock) {
  const entries = [...inhBlock[0].matchAll(/id:\s*'(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)'\s*,\s*source:\s*'([^']*)'\s*,\s*detail:\s*\n\s*'([^']*)'\s*,\s*toolHow:\s*'([^']*)'/g)]
  for (const [, id, source, detail, toolHow] of entries) {
    set(`inherited${id}Source`, source)
    set(`inherited${id}Detail`, detail)
    set(`inherited${id}ToolHow`, toolHow)
  }
}

// LAGNA_RECHARGE
const rechargeBlock = src.match(/const LAGNA_RECHARGE[^=]+=\s*\{([\s\S]*?)\n\}/m)
if (rechargeBlock) {
  for (const m of rechargeBlock[1].matchAll(/\s*(\d+):\s*'([^']*)'/g)) {
    set(`lagnaRecharge${m[1]}`, m[2])
  }
}

// ELEMENT_LABEL
const elBlock = src.match(/const ELEMENT_LABEL[^=]+=\s*\{([^}]+)\}/s)
if (elBlock) {
  for (const m of elBlock[1].matchAll(/(fire|earth|air|water):\s*'([^']*)'/g)) {
    set(`elementLabel${m[1].charAt(0).toUpperCase() + m[1].slice(1)}`, m[2])
  }
}

// job loss flavors
const flav = [...src.matchAll(/\{\s*id:\s*'(Su|Ma|Me|Sa)',\s*name:\s*'([^']*)',\s*nature:\s*'([^']*)'/g)]
for (const [, id, name, nature] of flav) {
  set(`jobLoss${id}Name`, name)
  set(`jobLoss${id}Nature`, nature)
}

const outPath = path.join(root, 'tmp/d10p-text-en-draft.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(en, null, 2))
console.log('keys:', Object.keys(en).length, '->', outPath)
