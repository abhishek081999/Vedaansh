import { Resend } from 'resend'
import type { EngineLang } from '@/lib/engine/lang'
import { EMAIL_HI } from '@/lib/emailLocale'

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Vedaansh'
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'

/**
 * Shared Premium Layout Wrapper
 */
const createLayout = (content: string, lang: EngineLang = 'en') => `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7;">
  <div style="background-color: #f7f7f7; padding: 40px 10px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1b1e 0%, #2d2e32 100%); padding: 32px; text-align: center;">
        <div style="color: #c9a84c; font-size: 28px; font-weight: bold; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 12px;">
          <img src="${baseUrl}/veda-icon.png" width="32" height="32" style="display: block;" />
          ${appName}
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px; color: #1f2937;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="padding: 32px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">© 2026 ${appName} · ${lang === 'hi' ? EMAIL_HI.footerPlatform : 'Professional Jyotisha Platform'}</p>
        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">${lang === 'hi' ? EMAIL_HI.footerTagline : 'Providing precise Vedic insights through ancient wisdom and modern technology.'}</p>
      </div>
    </div>
  </div>
</body>
</html>
`

export async function sendVerificationEmail(email: string, token: string, lang: EngineLang = 'en') {
  const verifyLink = `${baseUrl}/verify-email?token=${token}`
  const hi = lang === 'hi'

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: hi ? EMAIL_HI.verifySubject(appName) : `Verify your email — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">${hi ? EMAIL_HI.verifyTitle(appName) : `Welcome to ${appName}!`}</h2>
      <p style="font-size: 16px; color: #4b5563;">${hi ? EMAIL_HI.verifyBody : 'Thank you for joining our community of seekers. To ensure the security of your account, please verify your email address below.'}</p>
      
      <div style="margin: 32px 0;">
        <a href="${verifyLink}" 
           style="background-color: #c9a84c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          ${hi ? EMAIL_HI.verifyButton : 'Verify Email Address'}
        </a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af;">${hi ? EMAIL_HI.verifyFoot : "This link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email."}</p>
    `, lang),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

function planLabel(plan: string, lang: EngineLang): string {
  const en = plan.charAt(0).toUpperCase() + plan.slice(1)
  if (lang !== 'hi') return en
  return EMAIL_HI.plans[plan] ?? en
}

function intervalLabel(interval: string, lang: EngineLang): string {
  if (lang !== 'hi') return interval
  return EMAIL_HI.intervals[interval] ?? interval
}

export async function sendWelcomeEmail(email: string, plan: string, expiresAt: Date, lang: EngineLang = 'en') {
  const accountLink = `${baseUrl}/account`
  const planName = planLabel(plan, lang)
  const expiryStr = expiresAt.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const hi = lang === 'hi'

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: hi ? EMAIL_HI.welcomeSubject(planName, appName) : `Welcome to ${planName} Access — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0; text-align: center;">${hi ? EMAIL_HI.welcomeTitle : 'Subscription Activated! ✨'}</h2>
      <p style="font-size: 16px; color: #4b5563;">${hi ? EMAIL_HI.welcomeBody(planName) : `Your <strong>${planName}</strong> membership is now active. You have unlocked full access to professional grade divisional charts, advanced dashas, and precision calculations.`}</p>
      
      <div style="background: #fefcf5; border: 1px solid #f2e9d1; padding: 24px; border-radius: 12px; margin: 32px 0;">
        <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 14px; text-transform: uppercase;">${hi ? EMAIL_HI.welcomeDetails : 'Subscription Details'}</p>
        <div style="margin-top: 12px; font-size: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">${hi ? EMAIL_HI.welcomeTier : 'Tier:'}</span>
            <strong style="color: #c9a84c;">${planName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">${hi ? EMAIL_HI.welcomeRenewal : 'Renewal Date:'}</span>
            <strong>${expiryStr}</strong>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${accountLink}" 
           style="background-color: #1a1b1e; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          ${hi ? EMAIL_HI.welcomeButton : 'Launch Dashboard'}
        </a>
      </div>

      <p style="font-size: 15px; color: #4b5563;">${hi ? EMAIL_HI.welcomeClose : "We're honored to assist you on your astrological journey."}</p>
    `, lang),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export async function sendPasswordResetEmail(email: string, token: string, lang: EngineLang = 'en') {
  const resetLink = `${baseUrl}/reset-password?token=${token}`
  const hi = lang === 'hi'

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: hi ? EMAIL_HI.resetSubject(appName) : `Reset your password — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">${hi ? EMAIL_HI.resetTitle : 'Password Reset Request'}</h2>
      <p style="font-size: 16px; color: #4b5563;">${hi ? EMAIL_HI.resetBody : 'We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.'}</p>
      
      <div style="margin: 32px 0;">
        <a href="${resetLink}"
           style="background-color: #c9a84c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          ${hi ? EMAIL_HI.resetButton : 'Reset My Password'}
        </a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af;">${hi ? EMAIL_HI.resetFoot : "If you didn't request this change, you can safely ignore this email. Your password will remain the same."}</p>
    `, lang),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export async function sendChartEmail(toEmail: string, chartName: string, htmlContent: string, senderName: string = appName, lang: EngineLang = 'en') {
  const hi = lang === 'hi'
  return resend.emails.send({
    from: `${senderName} <${fromEmail}>`,
    to: [toEmail],
    subject: hi ? EMAIL_HI.chartSubject(chartName) : `Your Jyotish Master Dossier — ${chartName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1b1e;">${hi ? EMAIL_HI.chartHello : 'Hello,'}</h2>
        <p>${hi ? EMAIL_HI.chartBody(escapeHtml(chartName)) : `Please find attached your professional <strong>Jyotish Master Dossier</strong> for <strong>${chartName}</strong>.`}</p>
        <p>${hi ? EMAIL_HI.chartDetail : 'This comprehensive report includes your Rashi and Navamsha charts, Vimshottari Dasha timeline, planetary strengths (Shadbala), and specialized Astro-Vastu insights.'}</p>
        <p style="margin-top: 30px;">${hi ? EMAIL_HI.chartRegards : 'Best regards,'}<br/><strong>${hi ? escapeHtml(senderName) : senderName}</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">${hi ? EMAIL_HI.chartSent : 'Sent via Vedaansh Jyotish Platform.'}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${chartName.replace(/[^a-z0-9]/gi, '_')}-jyotish.html`,
        content: Buffer.from(htmlContent).toString('base64'),
      }
    ]
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const BROADCAST_BATCH_SIZE = 50

export async function sendAdminBroadcastEmails(params: {
  recipients: string[]
  subject: string
  message: string
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!isEmailConfigured()) {
    return {
      sent: 0,
      failed: params.recipients.length,
      errors: ['RESEND_API_KEY is not configured'],
    }
  }

  if (params.recipients.length === 0) {
    return { sent: 0, failed: 0, errors: [] }
  }

  const html = createLayout(`
    <h2 style="color: #111827; margin-top: 0;">${escapeHtml(params.subject)}</h2>
    <div style="font-size: 16px; color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(params.message)}</div>
    <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">You received this announcement from ${appName}.</p>
  `)

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < params.recipients.length; i += BROADCAST_BATCH_SIZE) {
    const chunk = params.recipients.slice(i, i + BROADCAST_BATCH_SIZE)
    try {
      const result = await resend.batch.send(
        chunk.map(to => ({
          from: `${appName} <${fromEmail}>`,
          to: [to],
          subject: params.subject,
          html,
        })),
      )

      if (result.error) {
        failed += chunk.length
        errors.push(String((result.error as { message?: string }).message || result.error))
      } else {
        sent += chunk.length
      }
    } catch (err) {
      failed += chunk.length
      errors.push(String(err))
    }
  }

  return { sent, failed, errors }
}


// ── Manual payment requests ─────────────────────────────────

export type PaymentRequestEmailData = {
  requestId: string
  name: string
  email: string
  plan: string
  interval: string
  currency: string
  country: string
  method: string
  reason: string
  message: string
  failureNote: string
}

const METHOD_LABELS: Record<string, string> = {
  paypal: 'PayPal',
  wise: 'Wise transfer',
  upi: 'UPI',
  bank: 'Bank transfer',
  other: 'Other',
}

/** Tells the Vedaansh team someone needs a subscription set up by hand. */
export async function sendPaymentRequestTeamEmail(to: string[], data: PaymentRequestEmailData) {
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1)
  const rows: Array<[string, string]> = [
    ['Name', data.name],
    ['Email', data.email],
    ['Plan', `${planLabel} (${data.interval})`],
    ['Currency', data.currency],
    ['Country', data.country || '—'],
    ['Preferred method', METHOD_LABELS[data.method] ?? data.method],
    ['Reason', data.reason === 'checkout_failed' ? 'Checkout failed' : data.reason === 'international' ? 'International payment' : 'Other'],
    ['Checkout error', data.failureNote || '—'],
    ['Message', data.message || '—'],
  ]
  const table = rows.map(([k, v]) => `
    <tr>
      <td style="padding: 6px 12px 6px 0; color: #6b7280; vertical-align: top; white-space: nowrap;">${k}</td>
      <td style="padding: 6px 0; color: #111827;">${escapeHtml(v).replace(/\n/g, '<br/>')}</td>
    </tr>`).join('')

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to,
    reply_to: data.email,
    subject: `Payment request: ${planLabel} ${data.interval} — ${data.email}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">New subscription payment request</h2>
      <p style="font-size: 15px; color: #4b5563;">Send the user an invoice or payment details, then mark it paid in the admin panel to activate their plan.</p>
      <table style="font-size: 14px; border-collapse: collapse; margin: 24px 0;">${table}</table>
      <a href="${baseUrl}/admin/payment-requests"
         style="background-color: #1a1b1e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
        Open payment requests
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Request ID: ${escapeHtml(data.requestId)}</p>
    `),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

/** Confirms to the user that the team has their request. */
export async function sendPaymentRequestReceivedEmail(email: string, data: Pick<PaymentRequestEmailData, 'plan' | 'interval' | 'method'>, lang: EngineLang = 'en') {
  const label = planLabel(data.plan, lang)
  const method = lang === 'hi'
    ? (EMAIL_HI.methods[data.method] ?? METHOD_LABELS[data.method] ?? data.method)
    : (METHOD_LABELS[data.method] ?? data.method)
  const interval = intervalLabel(data.interval, lang)
  const hi = lang === 'hi'

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: hi ? EMAIL_HI.paymentSubject(label, appName) : `We received your ${label} request — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">${hi ? EMAIL_HI.paymentTitle : "We've got your request"}</h2>
      <p style="font-size: 16px; color: #4b5563;">${hi ? EMAIL_HI.paymentBody(label, escapeHtml(interval), escapeHtml(method)) : `Thanks for choosing <strong>${label}</strong> (${escapeHtml(data.interval)}). Our team will email you payment details for <strong>${escapeHtml(method)}</strong>, usually within 1–2 business days.`}</p>
      <p style="font-size: 16px; color: #4b5563;">${hi ? EMAIL_HI.paymentNext : "As soon as your payment is confirmed, we'll activate your plan and you'll get a confirmation email."}</p>
      <p style="font-size: 14px; color: #9ca3af;">${hi ? EMAIL_HI.paymentFoot : "You don't need to pay anything until you hear from us. If you didn't make this request, you can ignore this email."}</p>
    `, lang),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}
