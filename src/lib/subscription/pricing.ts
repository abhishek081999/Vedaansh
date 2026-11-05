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

/**
 * International list prices, charged in USD through Razorpay (PayPal / international cards).
 * Amounts are whole dollars; the *Cents fields are what Razorpay is charged.
 */
export const PLAN_PRICES_USD = {
  gold: {
    monthly: 5,
    yearly: 48,
    monthlyCents: 500,
    yearlyCents: 4800,
  },
  platinum: {
    monthly: 10,
    yearly: 96,
    monthlyCents: 1000,
    yearlyCents: 9600,
  },
} as const

export type PlanKey = keyof typeof PLAN_PRICES
export type BillingInterval = 'monthly' | 'yearly'
export type PaymentCurrency = 'INR' | 'USD'

export const PAYMENT_CURRENCIES: readonly PaymentCurrency[] = ['INR', 'USD'] as const

type InrPrices = { [P in PlanKey]: { monthly: number; yearly: number; monthlyPaise: number; yearlyPaise: number } }
type UsdPrices = { [P in PlanKey]: { monthly: number; yearly: number; monthlyCents: number; yearlyCents: number } }

/** Price in the smallest currency unit (paise or cents). */
export function planAmountMinor(
  prices: { inr: InrPrices; usd: UsdPrices },
  currency: PaymentCurrency,
  plan: PlanKey,
  interval: BillingInterval,
): number {
  if (currency === 'USD') {
    return prices.usd[plan][interval === 'monthly' ? 'monthlyCents' : 'yearlyCents']
  }
  return prices.inr[plan][interval === 'monthly' ? 'monthlyPaise' : 'yearlyPaise']
}

/** Formats a price given in the smallest unit, e.g. 500 USD → "$5", 499 → "$4.99", 16800 INR → "₹168". */
export function formatMinorAmount(amountMinor: number, currency: PaymentCurrency): string {
  const major = amountMinor / 100
  const symbol = currency === 'USD' ? '$' : '₹'
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2)
  return `${symbol}${text}`
}

export function currencySymbol(currency: PaymentCurrency): string {
  return currency === 'USD' ? '$' : '₹'
}
