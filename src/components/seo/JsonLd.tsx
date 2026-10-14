import { headers } from 'next/headers'
import { createHash } from 'crypto'

/** JSON-LD via native <script> (SSR). Avoid next/script — it client-chunks every layout. */
export async function JsonLd({ data, id }: { data: object; id?: string }) {
  const nonce = (await headers()).get('x-nonce') ?? ''
  const json = JSON.stringify(data)
  const scriptId =
    id ??
    `jsonld-${createHash('sha256').update(json).digest('hex').slice(0, 16)}`

  return (
    <script
      id={scriptId}
      type="application/ld+json"
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
