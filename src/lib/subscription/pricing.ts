export const PLAN_PRICES = {
  gold: {
    monthly: 134,
    yearly: 1349,
    monthlyPaise: 13400,
    yearlyPaise: 134900,
  },
  platinum: {
    monthly: 269,
    yearly: 2699,
    monthlyPaise: 26900,
    yearlyPaise: 269900,
  },
} as const

export type PlanKey = keyof typeof PLAN_PRICES
export type BillingInterval = 'monthly' | 'yearly'
