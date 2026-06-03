import { describe, expect, it } from 'vitest'
import { escapeRegex, isValidObjectId, regexFromSearch } from '@/lib/security/sanitize'

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a+b(c)')).toBe('a\\+b\\(c\\)')
  })
})

describe('regexFromSearch', () => {
  it('returns null for blank search', () => {
    expect(regexFromSearch('   ')).toBeNull()
  })

  it('escapes malicious patterns', () => {
    expect(regexFromSearch('(.*)+')).toEqual({ $regex: '\\(\\.\\*\\)\\+', $options: 'i' })
  })
})

describe('isValidObjectId', () => {
  it('accepts valid Mongo ObjectIds', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true)
  })

  it('rejects invalid ids', () => {
    expect(isValidObjectId('not-an-id')).toBe(false)
  })
})
