'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/ClientNumerologyBar.tsx
//  Platinum — load a CRM client into the numerology inputs and
//  save the snapshot (plus key remedies) back to their record
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import type { Gender } from '@/types/astrology'
import { Button } from '@/components/ui/primitives/Button'
import { Label } from '@/components/ui/primitives/Label'

interface ClientRow {
  _id: string
  name: string
  birthDate: string
  gender?: Gender
}

function localIsoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ClientNumerologyBar({ currentName, onLoad }: {
  currentName: string
  onLoad: (c: { name: string; birthDate: string; gender: Gender }) => void
}) {
  const t = useTranslations('numerology.client')
  const [clients, setClients] = useState<ClientRow[] | null>(null)
  const [clientId, setClientId] = useState('')
  const [includeRemedies, setIncludeRemedies] = useState(true)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/clients')
      .then(r => r.json() as Promise<{ success: boolean; clients?: ClientRow[] }>)
      .then(j => { if (!cancelled) setClients(j.success ? j.clients ?? [] : []) })
      .catch(() => { if (!cancelled) setClients([]) })
    return () => { cancelled = true }
  }, [])

  const selected = clients?.find(c => c._id === clientId) ?? null

  const pick = (id: string) => {
    setClientId(id)
    setStatus(null)
    const c = clients?.find(x => x._id === id)
    if (c) onLoad({ name: c.name, birthDate: c.birthDate, gender: c.gender ?? 'other' })
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/numerology/save-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selected._id,
          name: currentName.trim() || undefined,
          includeRemedies,
          today: localIsoToday(),
        }),
      })
      const json = await res.json() as { success: boolean; error?: string; data?: { remediesAdded: number } }
      if (!res.ok || !json.success) throw new Error(json.error ?? t('fail'))
      const n = json.data?.remediesAdded ?? 0
      setStatus({
        tone: 'ok',
        text: n ? t('savedRemedies', { name: selected.name, n }) : t('saved', { name: selected.name }),
      })
    } catch (err) {
      setStatus({ tone: 'error', text: err instanceof Error ? err.message : t('fail') })
    } finally {
      setSaving(false)
    }
  }

  if (clients && clients.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
      <div style={{ minWidth: 200, flex: '1 1 200px' }}>
        <Label htmlFor="numerology-client" caps>{t('label')}</Label>
        <select id="numerology-client" className="input" value={clientId} onChange={e => pick(e.target.value)} disabled={!clients}>
          <option value="">{clients ? t('load') : t('loading')}</option>
          {clients?.map(c => <option key={c._id} value={c._id}>{c.name} · {c.birthDate}</option>)}
        </select>
      </div>
      <label style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)', paddingBottom: 8 }}>
        <input type="checkbox" checked={includeRemedies} onChange={e => setIncludeRemedies(e.target.checked)} />
        {t('remedies')}
      </label>
      <Button size="sm" variant="ghost" onClick={() => { void save() }} disabled={!selected || saving}>
        <Save size={14} aria-hidden style={{ marginRight: 4 }} />
        {saving ? t('saving') : t('save')}
      </Button>
      {status && (
        <span role="status" style={{ fontSize: '0.74rem', color: status.tone === 'ok' ? 'var(--teal)' : 'var(--rose)', paddingBottom: 8 }}>
          {status.text}
        </span>
      )}
      {selected && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexBasis: '100%' }}>
          {t('note', { name: selected.name })}
        </span>
      )}
    </div>
  )
}
