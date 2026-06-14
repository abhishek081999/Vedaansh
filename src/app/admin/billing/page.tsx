'use client'

import { useEffect, useMemo, useState } from 'react'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

type Coupon = {
  code: string
  description: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  newUsersOnly: boolean
  allowedUserEmails: string[]
  expiresAt: string | null
  maxRedemptions: number | null
  redeemedCount: number
  plans: Array<'gold' | 'platinum'>
  intervals: Array<'monthly' | 'yearly'>
}

type BillingPayload = {
  offersEnabled: boolean
  prices: {
    gold: { monthly: number; yearly: number }
    platinum: { monthly: number; yearly: number }
  }
  coupons: Coupon[]
}

const emptyCoupon: Coupon = {
  code: '',
  description: '',
  type: 'percent',
  value: 10,
  active: true,
  newUsersOnly: false,
  allowedUserEmails: [],
  expiresAt: null,
  maxRedemptions: null,
  redeemedCount: 0,
  plans: ['gold', 'platinum'],
  intervals: ['monthly', 'yearly'],
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingPayload | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/billing')
    const json = await res.json()
    if (json.success) {
      const billing = json.billing
      setData({
        offersEnabled: !!billing.offersEnabled,
        prices: {
          gold: { monthly: billing.prices.gold.monthly, yearly: billing.prices.gold.yearly },
          platinum: { monthly: billing.prices.platinum.monthly, yearly: billing.prices.platinum.yearly },
        },
        coupons: (billing.coupons || []).map((c: any) => ({
          ...c,
          newUsersOnly: !!c.newUsersOnly,
          allowedUserEmails: c.allowedUserEmails || [],
          plans: c.plans?.length ? c.plans : ['gold', 'platinum'],
          intervals: c.intervals?.length ? c.intervals : ['monthly', 'yearly'],
          expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
        })),
      })
      setAnalytics(json.analytics ? {
        ...json.analytics,
        totalRevenuePaise: json.analytics.activeSubscriptionValuePaise ?? json.analytics.totalRevenuePaise ?? 0,
        mrrEstimatePaise: json.analytics.mrrEstimatePaise ?? 0,
      } : null)
    } else {
      setMessage(json.error || 'Failed to load billing config')
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const hasInvalidCoupon = useMemo(
    () => (data?.coupons || []).some(c => !c.code.trim() || c.value <= 0),
    [data],
  )

  async function save() {
    if (!data) return
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/admin/billing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      setMessage('Billing settings saved.')
      await load()
    } else {
      setMessage(json.error || 'Failed to save billing config')
    }
  }

  function exportCsv() {
    if (!analytics) return

    const rows: string[] = []
    rows.push('section,key,value')
    rows.push(`totals,total_revenue_inr,${Math.round((analytics.totalRevenuePaise || 0) / 100)}`)
    rows.push(`totals,total_discount_inr,${Math.round((analytics.totalDiscountPaise || 0) / 100)}`)

    rows.push('coupon_stats,code,redemptions')
    for (const s of (analytics.couponStats || [])) {
      rows.push(`coupon_stats,${escapeCsv(s.code)},${s.redeemedCount}`)
    }

    rows.push('daily_redemptions,date,redemptions,discount_inr')
    for (const d of (analytics.dailyRedemptions || [])) {
      rows.push(`daily_redemptions,${d.date},${d.redemptions},${Math.round((d.discountPaise || 0) / 100)}`)
    }

    rows.push('weekly_redemptions,week_start,redemptions,discount_inr')
    for (const w of (analytics.weeklyRedemptions || [])) {
      rows.push(`weekly_redemptions,${w.weekStart},${w.redemptions},${Math.round((w.discountPaise || 0) / 100)}`)
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billing-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !data) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <VedaanshLoader message="Loading billing controls…" />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div className="admin-box">
        <h2 style={{ marginTop: 0 }}>Offer Controls</h2>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={data.offersEnabled}
            onChange={(e) => setData({ ...data, offersEnabled: e.target.checked })}
          />
          <span>Enable offers and coupon redemption globally</span>
        </label>
      </div>

      <div className="admin-box">
        <h2 style={{ marginTop: 0 }}>Coupon Analytics</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.8rem' }}>
          Active subscription value is the sum of current active sub amounts (not lifetime revenue).
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <small>Active Sub Value: ₹{Math.round((analytics?.totalRevenuePaise || 0) / 100)}</small>
          <small>Est. MRR: ₹{Math.round((analytics?.mrrEstimatePaise || 0) / 100)}</small>
          <small>Discount on Active Subs: ₹{Math.round((analytics?.totalDiscountPaise || 0) / 100)}</small>
          <button className="btn btn-secondary" onClick={exportCsv} style={{ marginLeft: 'auto' }}>
            Export CSV Report
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.4rem' }}>
          {(analytics?.couponStats || []).map((s: any) => (
            <div key={s.code} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.25rem' }}>
              <span>{s.code}</span>
              <span>{s.redeemedCount} redemptions</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-box">
        <h2 style={{ marginTop: 0 }}>Coupon Usage Charts</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <TrendBars
            title="Daily redemptions (last 30 days)"
            labels={(analytics?.dailyRedemptions || []).map((d: any) => d.date.slice(5))}
            values={(analytics?.dailyRedemptions || []).map((d: any) => d.redemptions)}
          />
          <TrendBars
            title="Weekly redemptions (last 12 weeks)"
            labels={(analytics?.weeklyRedemptions || []).map((w: any) => w.weekStart)}
            values={(analytics?.weeklyRedemptions || []).map((w: any) => w.redemptions)}
          />
        </div>
      </div>

      <div className="admin-box">
        <h2 style={{ marginTop: 0 }}>Subscription Pricing</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Update prices that are used for checkout and pricing page.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          <PriceInput label="Gold Monthly (INR)" value={data.prices.gold.monthly} onChange={v => setData({ ...data, prices: { ...data.prices, gold: { ...data.prices.gold, monthly: v } } })} />
          <PriceInput label="Gold Yearly (INR)" value={data.prices.gold.yearly} onChange={v => setData({ ...data, prices: { ...data.prices, gold: { ...data.prices.gold, yearly: v } } })} />
          <PriceInput label="Platinum Monthly (INR)" value={data.prices.platinum.monthly} onChange={v => setData({ ...data, prices: { ...data.prices, platinum: { ...data.prices.platinum, monthly: v } } })} />
          <PriceInput label="Platinum Yearly (INR)" value={data.prices.platinum.yearly} onChange={v => setData({ ...data, prices: { ...data.prices, platinum: { ...data.prices.platinum, yearly: v } } })} />
        </div>
      </div>

      <div className="admin-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Offers & Coupons</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Create codes for percent or fixed INR discounts.</p>
          </div>
          <button onClick={() => setData({ ...data, coupons: [...data.coupons, { ...emptyCoupon }] })} className="btn btn-secondary">+ Add Coupon</button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {data.coupons.map((coupon, index) => (
            <div key={`${coupon.code}-${index}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.75rem', display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.5rem' }}>
                <LabeledInput label="Code" value={coupon.code} onChange={v => updateCoupon(data, setData, index, { code: v.toUpperCase() })} />
                <LabeledInput label="Description" value={coupon.description} onChange={v => updateCoupon(data, setData, index, { description: v })} />
                <LabeledSelect label="Type" value={coupon.type} options={[{ label: 'Percent', value: 'percent' }, { label: 'Fixed INR', value: 'fixed' }]} onChange={v => updateCoupon(data, setData, index, { type: v as 'percent' | 'fixed' })} />
                <LabeledInput label={coupon.type === 'percent' ? 'Value (%)' : 'Value (INR)'} type="number" value={String(coupon.value)} onChange={v => updateCoupon(data, setData, index, { value: Number(v || 0) })} />
                <LabeledInput label="Expires At (optional)" type="datetime-local" value={coupon.expiresAt ? toLocalDatetimeInput(coupon.expiresAt) : ''} onChange={v => updateCoupon(data, setData, index, { expiresAt: v ? new Date(v).toISOString() : null })} />
                <LabeledInput label="Max Redemptions (optional)" type="number" value={coupon.maxRedemptions ?? ''} onChange={v => updateCoupon(data, setData, index, { maxRedemptions: v ? Number(v) : null })} />
                <LabeledInput
                  label="Allowed User Emails (comma-separated)"
                  value={coupon.allowedUserEmails.join(',')}
                  onChange={v => updateCoupon(data, setData, index, { allowedUserEmails: v.split(',').map(x => x.trim()).filter(Boolean) })}
                />
              </div>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applies to plans</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {(['gold', 'platinum'] as const).map(plan => (
                    <label key={plan}>
                      <input
                        type="checkbox"
                        checked={coupon.plans.includes(plan)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...new Set([...coupon.plans, plan])]
                            : coupon.plans.filter(p => p !== plan)
                          updateCoupon(data, setData, index, { plans: next.length ? next : [plan] })
                        }}
                      />{' '}{plan}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applies to intervals</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {(['monthly', 'yearly'] as const).map(interval => (
                    <label key={interval}>
                      <input
                        type="checkbox"
                        checked={coupon.intervals.includes(interval)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...new Set([...coupon.intervals, interval])]
                            : coupon.intervals.filter(i => i !== interval)
                          updateCoupon(data, setData, index, { intervals: next.length ? next : [interval] })
                        }}
                      />{' '}{interval}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label><input type="checkbox" checked={coupon.active} onChange={e => updateCoupon(data, setData, index, { active: e.target.checked })} /> Active</label>
                <label><input type="checkbox" checked={coupon.newUsersOnly} onChange={e => updateCoupon(data, setData, index, { newUsersOnly: e.target.checked })} /> New users only</label>
                <button onClick={() => removeCoupon(data, setData, index)} style={{ marginLeft: 'auto' }} className="btn btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={save} disabled={saving || hasInvalidCoupon} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Billing Settings'}
        </button>
        {message && <span style={{ color: 'var(--text-muted)' }}>{message}</span>}
      </div>
    </div>
  )
}

function updateCoupon(data: BillingPayload, setData: (next: BillingPayload) => void, index: number, patch: Partial<Coupon>) {
  const next = data.coupons.map((c, i) => (i === index ? { ...c, ...patch } : c))
  setData({ ...data, coupons: next })
}

function removeCoupon(data: BillingPayload, setData: (next: BillingPayload) => void, index: number) {
  setData({ ...data, coupons: data.coupons.filter((_, i) => i !== index) })
}

function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <LabeledInput label={label} type="number" value={String(value)} onChange={v => onChange(Number(v || 0))} />
}

function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.55rem 0.7rem', color: 'var(--text-primary)' }} />
    </label>
  )
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.55rem 0.7rem', color: 'var(--text-primary)' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function TrendBars({ title, labels, values }: { title: string; labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values)
  const pairs = labels.map((label, i) => ({ label, value: values[i] || 0 }))

  return (
    <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>{title}</div>
      {pairs.length === 0 ? (
        <small style={{ color: 'var(--text-muted)' }}>No coupon redemptions yet.</small>
      ) : (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          {pairs.slice(-10).map((item) => (
            <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
              <small style={{ color: 'var(--text-muted)' }}>{item.label}</small>
              <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.value / max) * 100}%`, background: 'var(--gold)' }} />
              </div>
              <small style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.value}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function escapeCsv(value: string): string {
  const escaped = String(value ?? '').replace(/"/g, '""')
  return `"${escaped}"`
}

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
