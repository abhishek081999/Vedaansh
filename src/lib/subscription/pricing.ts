export const PLAN_PRICES = {
  gold: {
    monthly: 168,
    yearly: 1443,
    monthlyPaise: 16800,
    yearlyPaise: 144300,
  },
  platinum: {
    monthly: 336,
    yearly: 2888,
    monthlyPaise: 33600,
    yearlyPaise: 288800,
  },
} as const

export type PlanKey = keyof typeof PLAN_PRICES
export type BillingInterval = 'monthly' | 'yearly'
