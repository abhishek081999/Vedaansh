import type { EngineLang } from '@/lib/engine/lang'
import {
  ANDROID_BROWSER_STEPS_HI,
  ANDROID_PLAY_STORE_NOTE_HI,
  INSTALL_LABEL_HI,
  IOS_STEPS_HI,
} from './installGuide.hi'

export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'unknown'

export interface InstallStep {
  text: string
}

export interface PlatformInstallGuide {
  platform: InstallPlatform
  label: string
  steps: InstallStep[]
}

export const ANDROID_PLAY_STORE_NOTE = 'install from your browser:'

export const ANDROID_BROWSER_STEPS: InstallStep[] = [
  { text: 'Open vedaansh.com in Chrome' },
  { text: 'Tap ⋮ → Install app (or Add to Home screen)' },
  { text: 'Open Vedaansh from your home screen' },
]

export const IOS_STEPS: InstallStep[] = [
  { text: 'Open vedaansh.com in Safari' },
  { text: 'Tap Share → Add to Home Screen' },
  { text: 'Tap Add' },
]

export function playStoreNote(lang: EngineLang = 'en'): string {
  return lang === 'hi' ? ANDROID_PLAY_STORE_NOTE_HI : ANDROID_PLAY_STORE_NOTE
}

export function playStoreChrome(lang: EngineLang = 'en'): { strong: string; soon: string } {
  if (lang === 'hi') return { strong: INSTALL_LABEL_HI.playStrong, soon: INSTALL_LABEL_HI.comingSoon }
  return { strong: 'Google Play', soon: 'Coming soon' }
}

export function detectInstallPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  const ua = userAgent
  const isIos =
    /iPad|iPhone|iPod/i.test(ua) ||
    (ua.includes('Mac') && maxTouchPoints > 1)
  if (isIos) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Mobi|Mobile/i.test(ua)) return 'unknown'
  return 'desktop'
}

export function isMobileInstallEligible(userAgent: string, maxTouchPoints = 0): boolean {
  const platform = detectInstallPlatform(userAgent, maxTouchPoints)
  return platform === 'ios' || platform === 'android'
}

export function getInstallGuides(
  platform: InstallPlatform,
  lang: EngineLang = 'en',
): PlatformInstallGuide[] {
  const hi = lang === 'hi'
  const android: PlatformInstallGuide = {
    platform: 'android',
    label: hi ? INSTALL_LABEL_HI.android : 'Android',
    steps: hi ? ANDROID_BROWSER_STEPS_HI : ANDROID_BROWSER_STEPS,
  }
  const ios: PlatformInstallGuide = {
    platform: 'ios',
    label: hi ? INSTALL_LABEL_HI.ios : 'iPhone & iPad',
    steps: hi ? IOS_STEPS_HI : IOS_STEPS,
  }
  if (platform === 'ios') return [ios]
  if (platform === 'android') return [android]
  return [android, ios]
}
