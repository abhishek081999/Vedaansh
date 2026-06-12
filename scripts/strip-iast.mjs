/**
 * One-off: replace IAST diacritics with plain English romanization in src/.
 * Run: node scripts/strip-iast.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const TARGETS = [
  path.join(ROOT, 'src'),
  path.join(ROOT, 'docs'),
  path.join(ROOT, '__tests__'),
  path.join(ROOT, 'README.md'),
]

/** IAST / extended Sanskrit roman → plain English spelling */
export function stripIast(text) {
  return text
    // Capital / extended forms first
    .replace(/Ā/g, 'A').replace(/Ī/g, 'I').replace(/Ū/g, 'U')
    .replace(/Ṛ/g, 'Ri').replace(/Ṝ/g, 'Ri')
    .replace(/Ḷ/g, 'Li').replace(/Ḹ/g, 'Li')
    .replace(/Ē/g, 'E').replace(/Ō/g, 'O')
    .replace(/Ṃ/g, 'M').replace(/Ḥ/g, 'H')
    .replace(/Ṣ/g, 'Sh').replace(/Ṭ/g, 'T').replace(/Ḍ/g, 'D')
    .replace(/Ṇ/g, 'N').replace(/Ñ/g, 'N')
    .replace(/Ś/g, 'Sh').replace(/Ṁ/g, 'M')
    // Lowercase IAST
    .replace(/ā/g, 'a')
    .replace(/ī/g, 'i')
    .replace(/ū/g, 'u')
    .replace(/ṛ/g, 'ri')
    .replace(/ṝ/g, 'ri')
    .replace(/ḷ/g, 'li')
    .replace(/ḹ/g, 'li')
    .replace(/ē/g, 'e')
    .replace(/ō/g, 'o')
    .replace(/ṃ/g, 'm')
    .replace(/ṁ/g, 'm')
    .replace(/ḥ/g, 'h')
    .replace(/ṣ/g, 'sh')
    .replace(/ś/g, 'sh')
    .replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd')
    .replace(/ṇ/g, 'n')
    .replace(/ñ/g, 'n')
    .replace(/ṅ/g, 'ng')
    // ṅ→ng artifacts in common terms
    .replace(/Manggala/g, 'Mangala')
    .replace(/Manggalavara/g, 'Mangalavara')
    .replace(/Anggirasa/g, 'Angirasa')
    .replace(/Plavangga/g, 'Plavanga')
    .replace(/Shringgara/g, 'Shringara')
}

const EXT = new Set(['.ts', '.tsx', '.css', '.md'])

function walk(target, files = []) {
  if (!fs.existsSync(target)) return files
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (EXT.has(path.extname(target))) files.push(target)
    return files
  }
  for (const ent of fs.readdirSync(target, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.next') continue
    walk(path.join(target, ent.name), files)
  }
  return files
}

const IAST_RE = /[ĀĪŪṚṜḶḸĒŌṂḤṢṬḌṆÑŚṀāīūṛṝḷḹēōṃḥṣṭḍṇñśṅṁ]/
let changed = 0

for (const target of TARGETS) {
  for (const file of walk(target)) {
    const raw = fs.readFileSync(file, 'utf8')
    if (!IAST_RE.test(raw)) continue
    const next = stripIast(raw)
    if (next !== raw) {
      fs.writeFileSync(file, next, 'utf8')
      changed++
      console.log('updated:', path.relative(ROOT, file))
    }
  }
}

console.log(`\nDone — ${changed} file(s) updated.`)
