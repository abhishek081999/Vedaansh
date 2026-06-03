const MIN_PASSWORD_LENGTH = 12

const COMMON_PASSWORDS = new Set([
  'password1234',
  'password12345',
  '123456789012',
  'qwerty123456',
  'vedaansh1234',
  'jyotish12345',
])

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, and a number'
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Password is too common. Choose a stronger one.'
  }
  return null
}

export const PASSWORD_MIN_LENGTH = MIN_PASSWORD_LENGTH
