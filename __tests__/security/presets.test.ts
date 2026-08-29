import { describe, expect, it } from 'vitest'
import { routeSecurityPresets } from '@/lib/security/presets'

describe('routeSecurityPresets', () => {
  it('adminRead is rate-limit only', () => {
    const preset = routeSecurityPresets.adminRead()
    expect(preset.rateLimit?.bucket).toBe('admin-read')
    expect(preset.requireSameOrigin).toBeUndefined()
  })

  it('adminMutate requires same-origin', () => {
    const preset = routeSecurityPresets.adminMutate()
    expect(preset.requireSameOrigin).toBe(true)
    expect(preset.rateLimit?.bucket).toBe('admin-mutate')
  })

  it('webhook allows high volume', () => {
    const preset = routeSecurityPresets.webhook()
    expect(preset.rateLimit?.limit).toBe(500)
    expect(preset.rateLimit?.bucket).toBe('webhook')
  })

  it('chartImport caps upload size', () => {
    const preset = routeSecurityPresets.chartImport()
    expect(preset.maxBodyBytes).toBe(2 * 1024 * 1024)
  })

  it('authSignup enforces same-origin and body cap', () => {
    const preset = routeSecurityPresets.authSignup()
    expect(preset.requireSameOrigin).toBe(true)
    expect(preset.maxBodyBytes).toBe(32 * 1024)
    expect(preset.rateLimit?.bucket).toBe('auth-signup')
  })

  it('authForgotPassword uses a dedicated cooldown message', () => {
    const preset = routeSecurityPresets.authForgotPassword()
    expect(preset.rateLimit?.bucket).toBe('auth-forgot-password')
    expect(preset.rateLimit?.message).toBe(
      'Too many password reset requests. Please try again in a few minutes.',
    )
  })
})
