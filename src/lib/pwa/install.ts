export const PWA_INSTALL_DISMISS_KEY = 'vedaansh-pwa-install-dismissed'

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isPwaInstallDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === '1'
  } catch {
    return true
  }
}

export function dismissPwaInstallPrompt(): void {
  try {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, '1')
  } catch {
    // localStorage may be unavailable in private mode
  }
}
