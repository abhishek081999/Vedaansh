import { redirect } from 'next/navigation'

/** Legacy path — canonical hub is /transit/roadmap (also redirected in next.config). */
export default function RoadmapPage() {
  redirect('/transit/roadmap')
}
