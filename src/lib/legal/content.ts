export type LegalSection = {
  title: string
  paragraphs?: readonly string[]
  list?: readonly string[]
}

export type LegalPageKey = 'terms' | 'privacy' | 'refund'

export type LegalPageData = {
  key: LegalPageKey
  title: string
  subtitle: string
  effectiveDate: string
  intro?: string
  sections: readonly LegalSection[]
}

const CONTACT_EMAIL = 'vedaanshlife@gmail.com'
const SUPPORT_EMAIL = 'abhishekbhoranj@gmail.com'

export const LEGAL_CONTACT = {
  primary: CONTACT_EMAIL,
  support: SUPPORT_EMAIL,
} as const

export const TERMS_PAGE: LegalPageData = {
  key: 'terms',
  title: 'Terms of Service',
  subtitle: 'Rules for using Vedaansh',
  effectiveDate: '30 May 2026',
  intro:
    'These Terms of Service ("Terms") govern your access to and use of Vedaansh (vedaansh.com) and related services operated by Vedaansh. By creating an account or using the platform, you agree to these Terms and our Privacy Policy.',
  sections: [
    {
      title: '1. The Service',
      paragraphs: [
        'Vedaansh provides Vedic astrology software tools — including birth charts (kundali), divisional charts, dasha systems, Panchang, Nakshatra analysis, Muhurta, and related features — for personal study, planning, and professional consultation support.',
        'Core calculations use Swiss Ephemeris with Lahiri (Chitrapaksha) ayanamsha unless otherwise stated on a given screen. Some features require a free or paid account; plan limits are described on the Pricing page.',
      ],
    },
    {
      title: '2. Eligibility & Accounts',
      list: [
        'You must be at least 13 years old to use the service. If you are under 18, you should use Vedaansh with a parent or guardian’s permission.',
        'You are responsible for keeping your login credentials secure and for all activity under your account.',
        'You agree to provide accurate registration information and to update it when it changes.',
        'We may suspend or terminate accounts that violate these Terms, abuse the platform, or attempt to compromise security or availability.',
      ],
    },
    {
      title: '3. Subscriptions & Payments',
      paragraphs: [
        'Paid plans (e.g. Gold, Platinum) are billed in Indian Rupees (INR) through our payment partner Razorpay. Prices, billing intervals, and included features are shown at checkout and on the Pricing page. Applicable taxes (including GST) may be added as shown before payment.',
        'Subscriptions renew automatically for the selected interval unless cancelled before the renewal date. Monthly plans are non-refundable once billed; annual plans include a 7-day refund window as described in our Refund Policy.',
      ],
    },
    {
      title: '4. Acceptable Use',
      list: [
        'Do not scrape, reverse engineer, or overload our systems; do not use automated access except via documented APIs we explicitly provide.',
        'Do not upload unlawful, harassing, or infringing content, or birth data you do not have permission to store.',
        'Do not resell or white-label the service without written permission.',
        'Do not present Vedaansh outputs as guaranteed predictions of future events; you remain responsible for how you use and share chart information with others.',
      ],
    },
    {
      title: '5. Intellectual Property',
      paragraphs: [
        'The Vedaansh name, branding, software, and original content are owned by Vedaansh or its licensors. You receive a limited, non-exclusive licence to use the platform for personal or internal professional use in accordance with these Terms.',
        'You retain rights to birth data and notes you enter. By saving charts or enabling public sharing, you grant us the licence needed to host, display, and back up that content on your behalf.',
      ],
    },
    {
      title: '6. Educational & Informational Disclaimer',
      paragraphs: [
        'Vedaansh is a calculation and reference tool rooted in traditional Jyotish methods. It does not provide medical, legal, financial, or other regulated professional advice. Outputs are for informational and educational purposes; important life decisions should involve qualified human judgement and, where appropriate, licensed professionals.',
        'We do not warrant uninterrupted or error-free operation. Ephemeris precision depends on correct birth time, place, and settings you supply.',
      ],
    },
    {
      title: '7. Limitation of Liability',
      paragraphs: [
        'To the fullest extent permitted by applicable law, Vedaansh and its operators are not liable for indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability for any claim relating to the service is limited to the amount you paid us in the twelve (12) months before the claim, or INR 1,000 if you use only free features.',
      ],
    },
    {
      title: '8. Changes & Governing Law',
      paragraphs: [
        'We may update these Terms from time to time. The "Effective" date at the top will change when we do. Continued use after changes constitutes acceptance of the revised Terms.',
        'These Terms are governed by the laws of India. Courts in India shall have exclusive jurisdiction, subject to applicable consumer protection rules that may give you rights in your place of residence.',
        `Questions: ${CONTACT_EMAIL} or ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
}

export const PRIVACY_PAGE: LegalPageData = {
  key: 'privacy',
  title: 'Privacy Policy',
  subtitle: 'How we collect, use, and protect your data',
  effectiveDate: '30 May 2026',
  intro:
    'This Privacy Policy explains what information Vedaansh collects when you use our website and services, how we use it, and the choices you have. It applies to visitors, registered users, and subscribers.',
  sections: [
    {
      title: '1. Information We Collect',
      list: [
        'Account data: name, email address, password hash, and authentication identifiers (e.g. when you sign in with Google).',
        'Birth & chart data: date, time, place of birth, timezone, saved chart names, client records you choose to store, and optional public chart settings.',
        'Usage data: pages visited, features used, device/browser type, approximate location derived from IP, and referral information.',
        'Payment data: subscription plan, billing interval, and transaction references processed by Razorpay. We do not store full card numbers on our servers.',
        'Communications: emails you send us and support correspondence.',
      ],
    },
    {
      title: '2. How We Use Information',
      list: [
        'Provide and improve charts, Panchang, saved charts, exports, and subscription features.',
        'Authenticate you, prevent fraud, and secure the platform.',
        'Process payments and send billing-related notices.',
        'Respond to support requests and send service announcements (you may opt out of non-essential marketing where offered).',
        'Measure aggregate usage via analytics (e.g. Google Analytics) to understand how features are used.',
      ],
    },
    {
      title: '3. Sharing & Processors',
      paragraphs: [
        'We use trusted service providers to operate Vedaansh — including hosting, database, email delivery, payment processing (Razorpay), and analytics. They process data only to perform services for us and under appropriate confidentiality and security obligations.',
        'We may disclose information if required by law, to protect rights and safety, or in connection with a merger or acquisition with notice where practicable.',
        'Public charts: if you enable public sharing, chart metadata and results you designate may be visible to anyone with the link or slug.',
      ],
    },
    {
      title: '4. Retention & Security',
      paragraphs: [
        'We retain account and chart data while your account is active and for a reasonable period afterward for backups, legal compliance, and dispute resolution.',
        'You can delete your account at any time from Account → Billing & privacy (type DELETE to confirm). Deletion removes your profile, saved charts, client records, and subscription records from our active systems, subject to legal retention requirements (e.g. payment records we must keep for tax or fraud prevention).',
        'We use industry-standard measures such as HTTPS, access controls, and hashed passwords. No online service can guarantee absolute security; please use a strong, unique password.',
      ],
    },
    {
      title: '5. Cookies & Similar Technologies',
      paragraphs: [
        'We use cookies and local storage for session management, theme preferences, and analytics. You can control cookies through your browser settings; disabling some cookies may limit functionality.',
      ],
    },
    {
      title: '6. Your Rights',
      paragraphs: [
        'Depending on applicable law (including India’s Digital Personal Data Protection Act where it applies to you), you may request access, correction, or deletion of personal data, or withdraw consent for optional processing.',
        'In the app: export a copy of your data (Account → Billing & privacy → Download my data) or delete your account in the same section. You can also email us at the addresses below; we will respond within a reasonable timeframe.',
      ],
    },
    {
      title: '7. Children',
      paragraphs: [
        'Vedaansh is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us data, contact us so we can delete it.',
      ],
    },
    {
      title: '8. International Users',
      paragraphs: [
        'Our primary operations and data processing are oriented toward users in India. If you access Vedaansh from other regions, you understand that data may be processed in jurisdictions where our providers operate.',
      ],
    },
    {
      title: '9. Updates & Contact',
      paragraphs: [
        'We may update this Privacy Policy; the effective date above will change when we do. Material changes may be highlighted on the site or by email where appropriate.',
        `Privacy questions: ${CONTACT_EMAIL} or ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
}

export const REFUND_PAGE: LegalPageData = {
  key: 'refund',
  title: 'Refund & Cancellation Policy',
  subtitle: 'Fair, simple rules for monthly and annual plans',
  effectiveDate: '30 May 2026',
  intro:
    'Vedaansh subscriptions are billed in INR through Razorpay. This policy is designed to be fair to you and sustainable for us: monthly access is consumed as soon as you pay; annual plans include a short no-questions refund window. If something is wrong, contact us first — we resolve most issues quickly and it is better for everyone than a bank chargeback.',
  sections: [
    {
      title: '1. Summary',
      list: [
        'Monthly plans (Gold / Platinum): no refunds — the billing period is treated as consumed when charged.',
        'Annual plans: full refund within 7 calendar days of the purchase date, no questions asked.',
        'After 7 days on an annual plan: no refund, but you may cancel anytime and keep paid features until the end of the annual period.',
        'All plans: cancel renewal so you are not charged again; your account and saved charts remain unless you delete them.',
      ],
    },
    {
      title: '2. Monthly Subscriptions',
      paragraphs: [
        'Monthly billing (e.g. Gold or Platinum billed every month) gives immediate access to paid features for that month. Because the service is delivered for the full period, monthly payments are not refundable — including partial-month use after cancellation.',
        'You may still cancel before the next renewal so you are not charged again. Paid features stay active until the current month ends.',
      ],
    },
    {
      title: '3. Annual Subscriptions',
      paragraphs: [
        'Annual billing is a one-year commitment at a discounted rate compared to paying monthly twelve times.',
      ],
      list: [
        'Within 7 calendar days of your annual purchase date: email us for a full refund, no questions asked. We will process it via Razorpay to your original payment method.',
        'After 7 days: annual fees are non-refundable. You may cancel renewal and continue using paid features until your annual period ends.',
        'Annual renewals: the 7-day refund window applies only to a new annual purchase or renewal charge, starting from that charge date. It does not apply to months already used on a prior term.',
      ],
    },
    {
      title: '4. Cancellations',
      list: [
        'Cancellation stops future charges; it does not delete your account or saved charts.',
        'Use account or billing controls where available, or email us from your registered address with your plan name (Gold / Platinum) and billing interval (monthly / yearly).',
        'After cancellation, access continues until the end of the period you have already paid for.',
      ],
    },
    {
      title: '5. Billing Errors',
      paragraphs: [
        'Duplicate charges or clear processing errors reported within 7 days of the charge will be corrected with a full refund where verified. Contact us with your Razorpay payment ID or receipt.',
      ],
    },
    {
      title: '6. How to Request a Refund',
      paragraphs: [
        `Email ${CONTACT_EMAIL} or ${SUPPORT_EMAIL} from your registered account with: plan (Gold / Platinum), billing interval (monthly / yearly), payment date, and Razorpay payment ID or receipt. For eligible annual refunds within 7 days, you do not need to justify the request.`,
        'We aim to respond within 3–5 business days. Approved refunds go back through Razorpay; banks typically take 5–10 business days to show the credit in India.',
      ],
    },
    {
      title: '7. Chargebacks & Disputes',
      paragraphs: [
        'If you dispute a charge with your bank instead of contacting us, Razorpay and your bank may process a chargeback independently of this policy. You may still lose access to the disputed amount and we may be charged a dispute fee (commonly ₹500–₹900 per case).',
        'Please email us first for any billing concern — especially within the annual 7-day window. We will honour eligible refunds promptly. That protects you, us, and keeps your account in good standing.',
        'Repeated or abusive chargebacks on ineligible charges (e.g. monthly plans after use, or annual plans after the 7-day window) may result in account suspension, as permitted by law and Razorpay’s terms.',
      ],
    },
    {
      title: '8. Policy Changes',
      paragraphs: [
        'We may update this policy; the effective date above will change. Changes apply to purchases made after the update unless applicable law requires otherwise.',
      ],
    },
  ],
}

export const LEGAL_PAGES: Record<LegalPageKey, LegalPageData> = {
  terms: TERMS_PAGE,
  privacy: PRIVACY_PAGE,
  refund: REFUND_PAGE,
}

export const LEGAL_NAV_LINKS: { href: string; label: string }[] = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refunds' },
]
