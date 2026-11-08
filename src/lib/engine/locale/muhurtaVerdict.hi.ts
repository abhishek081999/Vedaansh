// Hindi text for src/lib/engine/muhurtaVerdict.ts
import { fill } from '@/lib/engine/lang'

export const MV_HI = {
  excellentHeadline: '{activity}{when} के लिए अच्छा समय',
  excellentDetail: '{activityLower} हेतु परिस्थितियाँ सहायक हैं। आगे बढ़ने का उपयुक्त समय है।{avoid}',
  goodHeadline: '{activity}{when} के लिए काफी अच्छा',
  goodDetail: '{activityLower} के अधिकांश कारक ठीक हैं। कमज़ोर खिड़कियों पर प्राथमिकता दें।{avoid}',
  neutralHeadline: '{activity}{when} के लिए मिश्रित',
  neutralDetail: 'न तो प्रबल शुभ न निषिद्ध। दैनिक कार्य ठीक; बड़े आरंभ टाल सकते हैं।{avoid}',
  cautionHeadline: '{activity}{when} — प्रतीक्षा बेहतर',
  cautionDetail: 'अनेक कारक कठिन हैं। यदि हो सके तो महत्वपूर्ण आरंभ स्थगित करें।{avoid}',
  avoidHeadline: '{activity}{when} आरंभ टालें',
  avoidDetail: 'शास्त्रीय नियम अभी इस कार्य का आरंभ न करने की सलाह देते हैं। बाद का समय बेहतर रहेगा।{avoid}',
  whenAround: ' लगभग {time}',
  avoidPrefix: ' बचें: {list}।',
} as const

export function buildVerdictHi(
  kind: 'excellent' | 'good' | 'neutral' | 'caution' | 'avoid',
  act: string,
  actLower: string,
  whenSuffix: string,
  avoidSuffix: string,
): { headline: string; detail: string } {
  const t = MV_HI
  const vars = { activity: act, activityLower: actLower, when: whenSuffix, avoid: avoidSuffix }
  switch (kind) {
    case 'excellent':
      return {
        headline: fill(t.excellentHeadline, { ...vars, activity: act }),
        detail: fill(t.excellentDetail, { ...vars, activityLower: actLower }),
      }
    case 'good':
      return {
        headline: fill(t.goodHeadline, vars),
        detail: fill(t.goodDetail, { ...vars, activityLower: actLower }),
      }
    case 'neutral':
      return {
        headline: fill(t.neutralHeadline, vars),
        detail: fill(t.neutralDetail, vars),
      }
    case 'caution':
      return {
        headline: fill(t.cautionHeadline, vars),
        detail: fill(t.cautionDetail, vars),
      }
    default:
      return {
        headline: fill(t.avoidHeadline, vars),
        detail: fill(t.avoidDetail, vars),
      }
  }
}
