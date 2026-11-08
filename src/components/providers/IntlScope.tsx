// ─────────────────────────────────────────────────────────────
//  IntlScope — server component that sends extra message
//  namespaces to the client components inside it.
//
//  The root layout only ships ROOT_CLIENT_NAMESPACES. A feature page
//  (e.g. /panchang) wraps its client panels like this so its strings
//  load only where they are used:
//
//    <IntlScope namespaces={['panchang']}>
//      <PanchangClient />
//    </IntlScope>
// ─────────────────────────────────────────────────────────────
import type { ReactNode } from 'react'
import type { AbstractIntlMessages } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ROOT_CLIENT_NAMESPACES, pickNamespaces, type Namespace } from '@/i18n/messages'
import { IntlProvider } from './IntlProvider'

export async function IntlScope({ namespaces, children }: { namespaces: Namespace[]; children: ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  const picked = pickNamespaces(messages as Record<string, unknown>, [...ROOT_CLIENT_NAMESPACES, ...namespaces])
  return (
    <IntlProvider locale={locale} messages={picked as AbstractIntlMessages}>
      {children}
    </IntlProvider>
  )
}
