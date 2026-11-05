'use client'

import type { CalendarEvent, TemplateParams } from '@/lib/social/templates/types'
import type { FrameId } from '@/lib/social/render/frame'

export type PostStatus = 'idea' | 'draft' | 'ready' | 'posted'
export const POST_STATUSES: PostStatus[] = ['idea', 'draft', 'ready', 'posted']

export interface SocialPostDto {
  _id: string
  templateId: string
  params: Partial<TemplateParams>
  scheduledFor: string
  format: FrameId
  status: PostStatus
  caption: string
  notes?: string
  eventRef?: string
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json as T
}

export const socialApi = {
  listPosts: (q: Record<string, string>) => call<{ posts: SocialPostDto[] }>(`/api/admin/social/posts?${new URLSearchParams(q)}`).then((r) => r.posts),
  createPost: (body: Omit<SocialPostDto, '_id' | 'scheduledFor'> & { scheduledFor: string }) =>
    call<{ post: SocialPostDto }>('/api/admin/social/posts', { method: 'POST', body: JSON.stringify(body) }).then((r) => r.post),
  updatePost: (id: string, body: Partial<Omit<SocialPostDto, '_id' | 'notes'>> & { notes?: string | null }) =>
    call<{ post: SocialPostDto }>(`/api/admin/social/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((r) => r.post),
  deletePost: (id: string) => call<unknown>(`/api/admin/social/posts/${id}`, { method: 'DELETE' }),
  events: (from: string, to: string) => call<{ events: CalendarEvent[] }>(`/api/admin/social/events?${new URLSearchParams({ from, to })}`).then((r) => r.events),
}

/** IST calendar date of a stored scheduledFor instant. */
export function postDate(p: SocialPostDto): string {
  return new Date(new Date(p.scheduledFor).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

export function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const STATUS_LABEL: Record<PostStatus, string> = { idea: 'Idea', draft: 'Draft', ready: 'Ready', posted: 'Posted' }
