import { redirect } from 'next/navigation'

/** Legacy path — canonical hub is /transit/scrubber (also redirected in next.config). */
export default function ScrubberPage() {
  redirect('/transit/scrubber')
}
