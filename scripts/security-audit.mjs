#!/usr/bin/env node
/**
 * Production dependency audit with retries for npm registry outages.
 * Still fails hard on real high+ CVEs (npm audit exit 1 with findings).
 *
 * Usage:
 *   node scripts/security-audit.mjs              # --omit=dev --audit-level=high
 *   node scripts/security-audit.mjs --dev        # full tree, moderate
 *   node scripts/security-audit.mjs --summary    # plain npm audit
 */
import { spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const MAX_ATTEMPTS = Number(process.env.NPM_AUDIT_RETRIES || 4)
const BASE_DELAY_MS = Number(process.env.NPM_AUDIT_RETRY_MS || 4000)

const mode = process.argv.includes('--dev')
  ? 'dev'
  : process.argv.includes('--summary')
    ? 'summary'
    : 'prod'

const auditArgs =
  mode === 'dev'
    ? ['audit', '--audit-level=moderate']
    : mode === 'summary'
      ? ['audit']
      : ['audit', '--omit=dev', '--audit-level=high']

const TRANSIENT = [
  /network timeout/i,
  /audit endpoint returned an error/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /socket hang up/i,
  /fetch failed/i,
  /503 Service Unavailable/i,
  /502 Bad Gateway/i,
  /gateway timeout/i,
]

function isTransient(combined) {
  return TRANSIENT.some((re) => re.test(combined))
}

function runOnce() {
  const result = spawnSync('npm', auditArgs, {
    encoding: 'utf8',
    env: process.env,
    shell: false,
  })
  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
  return {
    status: result.status ?? 1,
    error: result.error,
    combined: `${stdout}\n${stderr}\n${result.error?.message ?? ''}`,
  }
}

async function main() {
  let last = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    last = runOnce()

    if (last.status === 0) {
      process.exit(0)
    }

    // Real vulnerability findings: npm exits 1 and reports counts / advisories.
    // Do not retry those.
    const looksLikeFindings =
      /found \d+ vulnerabilit/i.test(last.combined)
      || /\d+\s+(critical|high|moderate|low)\s+vulnerabilit/i.test(last.combined)
      || /npm audit report/i.test(last.combined)

    if (looksLikeFindings && !isTransient(last.combined)) {
      process.exit(last.status || 1)
    }

    if (!isTransient(last.combined) && !last.error) {
      process.exit(last.status || 1)
    }

    if (attempt < MAX_ATTEMPTS) {
      const waitMs = BASE_DELAY_MS * attempt
      console.warn(
        `[security-audit] transient npm audit failure (attempt ${attempt}/${MAX_ATTEMPTS}); retrying in ${waitMs}ms…`,
      )
      await delay(waitMs)
    }
  }

  console.error(
    `[security-audit] npm audit failed after ${MAX_ATTEMPTS} attempts (registry/network). Re-run the job when registry.npmjs.org is reachable.`,
  )
  process.exit(last?.status || 1)
}

main().catch((err) => {
  console.error('[security-audit] unexpected error:', err)
  process.exit(1)
})
