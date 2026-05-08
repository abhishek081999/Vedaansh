export const PLAN_PRICES = {
  gold: {
    monthly: 99,
    yearly: 999,
    monthlyPaise: 9900,
    yearlyPaise: 99900,
  },
  platinum: {
    monthly: 199,
    yearly: 1999,
    monthlyPaise: 19900,
    yearlyPaise: 199900,
  },
} as const

export type PlanKey = keyof typeof PLAN_PRICES
export type BillingInterval = 'monthly' | 'yearly'
