import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { version } = require('eslint/package.json')
const major = Number.parseInt(version.split('.')[0], 10)

if (major === 10) {
  console.warn(
    `eslint@${version} detected — eslint-plugin-react (via eslint-config-next) is not compatible with ESLint 10 yet. Pin eslint@9.39.4 in package.json overrides and run npm ci.`,
  )
}

if (major !== 9 && major !== 10) {
  console.error(`Unexpected eslint@${version}; expected 9.x (preferred) or 10.x with react version pinned.`)
  process.exit(1)
}

console.log(`eslint@${version}`)
