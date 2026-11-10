// Hindi overlays for PWA install steps (used by banner + /install).

import type { InstallStep } from './installGuide'

export const ANDROID_PLAY_STORE_NOTE_HI = 'ब्राउज़र से इंस्टॉल करें:'

export const ANDROID_BROWSER_STEPS_HI: InstallStep[] = [
  { text: 'Chrome में vedaansh.com खोलें' },
  { text: '⋮ → ऐप इंस्टॉल करें (या होम स्क्रीन में जोड़ें) टैप करें' },
  { text: 'होम स्क्रीन से Vedaansh खोलें' },
]

export const IOS_STEPS_HI: InstallStep[] = [
  { text: 'Safari में vedaansh.com खोलें' },
  { text: 'शेयर → होम स्क्रीन में जोड़ें टैप करें' },
  { text: 'जोड़ें टैप करें' },
]

export const INSTALL_LABEL_HI = {
  android: 'Android',
  ios: 'iPhone और iPad',
  playStrong: 'Google Play',
  comingSoon: 'जल्द आ रहा है',
} as const
