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

export function getInstallGuides(platform: InstallPlatform): PlatformInstallGuide[] {
  if (platform === 'ios') {
    return [{ platform: 'ios', label: 'iPhone & iPad', steps: IOS_STEPS }]
  }
  if (platform === 'android') {
    return [{ platform: 'android', label: 'Android', steps: ANDROID_BROWSER_STEPS }]
  }
  return [
    { platform: 'android', label: 'Android', steps: ANDROID_BROWSER_STEPS },
    { platform: 'ios', label: 'iPhone & iPad', steps: IOS_STEPS },
  ]
}
