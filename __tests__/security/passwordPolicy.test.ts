import { describe, expect, it } from 'vitest'
import { validatePassword } from '@/lib/security/passwordPolicy'

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab1short')).not.toBeNull()
  })

  it('rejects passwords without mixed character classes', () => {
    expect(validatePassword('alllowercase12')).not.toBeNull()
  })

  it('accepts strong passwords', () => {
    expect(validatePassword('Vedaansh!2026')).toBeNull()
  })
})
