import { headers } from 'next/headers'

/** JSON-LD script with CSP nonce from middleware (document routes only). */
export async function JsonLd({ data }: { data: object }) {
  const nonce = (await headers()).get('x-nonce') ?? ''
  return (
    <script
      type="application/ld+json"
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
