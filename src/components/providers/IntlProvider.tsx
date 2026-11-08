'use client'
// Client-side next-intl provider. Lives in a client file so the error
// handler and fallback (functions) never cross the server boundary.
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl'
import type { ReactNode } from 'react'

interface IntlProviderProps {
  locale: string
  messages: AbstractIntlMessages
  children: ReactNode
}

export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Kolkata"
      onError={(error) => {
        if (process.env.NODE_ENV === 'development') console.warn('[i18n]', error.message)
      }}
      getMessageFallback={({ namespace, key }) => (namespace ? `${namespace}.${key}` : key)}
    >
      {children}
    </NextIntlClientProvider>
  )
}
