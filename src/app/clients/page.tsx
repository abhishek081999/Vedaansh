'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/clients/page.tsx
//  CRM Client Management Dashboard (Platinum)
// ─────────────────────────────────────────────────────────────

import { Link, useRouter } from '@/i18n/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { BirthForm } from '@/components/ui/BirthForm'

interface ClientNote {
  content:   string
  category:  'general' | 'remedy' | 'prediction' | 'session'
  createdAt: string
}

interface ClientRemedy {
  _id?:        string
  title:       string
  description: string
  status:      'suggested' | 'started' | 'completed' | 'abandoned'
  prescribedAt: string
}

interface Client {
  _id:       string
  name:      string
  email?:    string
  phone?:    string
  birthDate: string
  birthTime: string
  birthPlace:string
  latitude:  number
  longitude: number
  timezone:  string
  tags:      string[]
  notes:     ClientNote[]
  remedies:  ClientRemedy[]
  status:    'active' | 'inactive' | 'prospective'
  lastSessionAt?: string
  nextSessionAt?: string
  totalSessions:  number
  activeDasha?:   string
  activeDashaStart?: string
  activeDashaEnd?: string
  dashaAlert?: { type: 'MD_CHANGE' | 'AD_CHANGE'; date: string; lord: string } | null
  followUpAt?: string
  createdAt:  string
}


function ClientCard({ 
  client, onOpen, onUpdate, onEdit, onDelete 
}: { 
  client: Client
  onOpen: (c: Client) => void
  onUpdate: (c: Client) => void
  onEdit: (c: Client) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('clients')
  const { tag } = useLang()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [showNotes, setShowNotes] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'remedies'>('notes')
  const [newNote, setNewNote] = useState('')
  const [newRemedy, setNewRemedy] = useState({ title: '', status: 'suggested' })
  const [submitting, setSubmitting] = useState(false)

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', content: newNote, category: 'session' })
      })
      const json = await res.json()
      if (json.success) {
        onUpdate(json.client)
        setNewNote('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddRemedy() {
    if (!newRemedy.title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'remedy', ...newRemedy })
      })
      const json = await res.json()
      if (json.success) {
        onUpdate(json.client)
        setNewRemedy({ title: '', status: 'suggested' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCycleRemedyStatus(remedyId: string, current: string) {
    const statuses = ['suggested', 'started', 'completed', 'abandoned']
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length]
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remedyAction: 'update', remedyId, remedyStatus: next })
      })
      const json = await res.json()
      if (json.success) onUpdate(json.client)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddTag(tag: string) {
    if (!tag.trim() || client.tags.includes(tag)) return
    const newTags = [...client.tags, tag.trim()]
    const res = await fetch(`/api/clients/${client._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags })
    })
    const json = await res.json()
    if (json.success) onUpdate(json.client)
  }

  async function handleRemoveTag(tag: string) {
    const newTags = client.tags.filter(t => t !== tag)
    const res = await fetch(`/api/clients/${client._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: newTags })
    })
    const json = await res.json()
    if (json.success) onUpdate(json.client)
  }

  const dashaPct = useMemo(() => {
    if (!client.activeDashaStart || !client.activeDashaEnd) return 0
    const start = new Date(client.activeDashaStart).getTime()
    const end = new Date(client.activeDashaEnd).getTime()
    const now = new Date().getTime()
    const total = end - start
    const current = now - start
    return Math.max(0, Math.min(100, (current / total) * 100))
  }, [client.activeDashaStart, client.activeDashaEnd])

  const dashaParts = client.activeDasha?.split('-') || []

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--gold-soft)'
      e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', justifyContent: 'space-between', gap: isMobile ? '0.75rem' : '0' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.1rem' : '1.15rem', fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: '0.15rem'
          }}>
            {client.name}
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {client.tags.map(tagLabel => (
              <span key={tagLabel} className="badge" style={{ 
                fontSize: '0.62rem', padding: '0.1rem 0.45rem', 
                background: 'rgba(201,168,76,0.06)', color: 'var(--gold)',
                border: '1px solid rgba(201,168,76,0.12)',
                display: 'flex', alignItems: 'center', gap: '0.2rem'
              }}>
                {tagLabel}
                <button 
                  onClick={() => handleRemoveTag(tagLabel)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
            <button 
              className="btn btn-ghost btn-xs" 
              style={{ fontSize: '0.6rem', padding: '0 0.3rem' }}
              onClick={() => {
                const untagged = prompt(t('card.tagPrompt'))
                if (untagged) handleAddTag(untagged)
              }}
            >
              {t('card.addTag')}
            </button>
          </div>
        </div>
        
        {/* Follow-up / Dasha Track */}
        <div style={{ 
          textAlign: isMobile ? 'left' : 'right', 
          display: 'flex', 
          flexDirection: isMobile ? 'row' : 'column', 
          gap: isMobile ? '1.5rem' : '0.3rem', 
          width: isMobile ? '100%' : 90,
          alignItems: isMobile ? 'center' : 'flex-end'
        }}>
          {client.followUpAt && (
             <div style={{ marginBottom: isMobile ? '0' : '0.2rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--rose)', textTransform: 'uppercase', fontWeight: 800 }}>{t('card.followUp')}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {new Date(client.followUpAt).toLocaleDateString(tag, { month: 'short', day: 'numeric' })}
                </div>
             </div>
          )}
          <div style={{ flex: isMobile ? 1 : 'none', display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: '0.1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t('card.dasha')}</div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'flex-end', fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--gold)' }}>
              <span style={{ fontWeight: 800 }}>{dashaParts[0]}</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ fontWeight: 400 }}>{dashaParts[1]}</span>
            </div>
            <div style={{ height: '3px', width: '100%', minWidth: 60, background: 'var(--border-soft)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.2rem' }}>
              <div style={{ height: '100%', width: `${dashaPct}%`, background: 'var(--gold)', boxShadow: '0 0 4px var(--gold-soft)', transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      </div>


      {/* Dasha Transition Alert */}
      {client.dashaAlert && (
        <div style={{
          padding: '0.6rem 0.8rem',
          borderRadius: 'var(--r-lg)',
          background: client.dashaAlert.type === 'MD_CHANGE' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${client.dashaAlert.type === 'MD_CHANGE' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginTop: '0.2rem'
        }}>
          <span style={{ fontSize: '1rem' }}>{client.dashaAlert.type === 'MD_CHANGE' ? '🚨' : '⚡'}</span>
          <div style={{ fontSize: '0.72rem', color: client.dashaAlert.type === 'MD_CHANGE' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
            {t(client.dashaAlert.type === 'MD_CHANGE' ? 'card.mdShift' : 'card.adShift', {
              lord: client.dashaAlert.lord,
              days: Math.floor((new Date(client.dashaAlert.date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            })}
          </div>
        </div>
      )}

      <div style={{ 
        height: '1px', background: 'linear-gradient(90deg, var(--border-soft), transparent)', 
        margin: '0.25rem 0'
      }} />

      <div style={{ 
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '1rem' : '0.75rem',
        fontSize: '0.75rem', color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t('card.location')}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            📍 {client.birthPlace}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: isMobile ? '0.25rem' : '0.4rem' }}>{t('card.birthInfo')}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            📅 {new Date(client.birthDate).toLocaleDateString(tag, { day:'2-digit', month:'short', year:'numeric' })} {isMobile ? '' : <br/>} | ⏰ {client.birthTime.slice(0, 5)}
          </span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'right', justifyContent: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{t('card.lastSession')}</span>
            <span style={{ fontWeight: 500 }}>{client.lastSessionAt ? new Date(client.lastSessionAt).toLocaleDateString(tag) : t('card.never')}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button 
          onClick={() => onOpen(client)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, borderRadius: 'var(--r-md)', fontSize: '0.75rem' }}
        >
          {t('card.viewChart')}
        </button>
        <button 
          onClick={() => onEdit(client)}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--r-md)', padding: '0 0.75rem' }}
          title={t('card.editTitle')}
        >
          ✎
        </button>
        <button 
          onClick={() => setShowNotes(!showNotes)}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--r-md)', padding: '0 0.75rem' }}
          title={t('card.notesTitle')}
        >
          {client.notes.length} 📝
        </button>
        <button 
          onClick={() => onDelete(client._id)}
          className="btn btn-ghost btn-sm"
          style={{ borderRadius: 'var(--r-md)', padding: '0 0.75rem', color: 'var(--rose)' }}
          title={t('card.deleteTitle')}
        >
          🗑️
        </button>
      </div>

      {showNotes && (
        <div style={{ 
          marginTop: '0.5rem', padding: '0.75rem', background: 'var(--surface-2)',
          borderRadius: 'var(--r-lg)', fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-soft)', marginBottom: '0.75rem' }}>
            <button 
              onClick={() => setActiveTab('notes')}
              style={{ 
                padding: '0.3rem 0', borderBottom: activeTab === 'notes' ? '2px solid var(--gold)' : 'none',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              {t('card.sessionLogs', { count: client.notes.length })}
            </button>
            <button 
              onClick={() => setActiveTab('remedies')}
              style={{ 
                padding: '0.3rem 0', borderBottom: activeTab === 'remedies' ? '2px solid var(--gold)' : 'none',
                background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                color: activeTab === 'remedies' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              {t('card.remedies', { count: client.remedies.length })}
            </button>
          </div>

          {activeTab === 'notes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input 
                  className="input" 
                  placeholder={t('card.notePh')} 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '2rem' }}
                />
                <button 
                  onClick={handleAddNote}
                  disabled={submitting}
                  className="btn btn-primary btn-xs"
                >
                  {t('card.save')}
                </button>
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {client.notes.slice().reverse().map((n, idx) => (
                  <div key={idx} style={{ padding: '0.4rem', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(n.createdAt).toLocaleDateString(tag)}</div>
                    <div>{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input 
                  className="input" 
                  placeholder={t('card.remedyPh')} 
                  value={newRemedy.title}
                  onChange={(e) => setNewRemedy({...newRemedy, title: e.target.value})}
                  style={{ fontSize: '0.75rem', height: '2rem' }}
                />
                <button 
                  onClick={handleAddRemedy}
                  disabled={submitting}
                  className="btn btn-primary btn-xs"
                >
                  {t('card.add')}
                </button>
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {client.remedies.slice().reverse().map((r, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.4rem', background: 'var(--surface-1)', borderRadius: 'var(--r-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(r.prescribedAt).toLocaleDateString(tag)}</div>
                    </div>
                    <button 
                      onClick={() => handleCycleRemedyStatus(r._id!, r.status)}
                      disabled={submitting}
                      className="badge" 
                      style={{ 
                        fontSize: '0.6rem', opacity: 0.8, cursor: 'pointer', border: 'none',
                        background: r.status === 'completed' ? 'var(--teal-soft)' : 'var(--surface-3)'
                      }}
                    >
                      {t(`card.remedyStatus.${r.status}`)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ClientsPage() {
  const t = useTranslations('clients')
  const { tag } = useLang()
  const { status } = useSession()
  const router = useRouter()
  const { setActiveTab } = useAppLayout()
  const { setChart } = useChart()

  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [adding, setAdding] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 403) throw new Error('PLATINUM_REQUIRED')
        throw new Error(json.error || t('errors.fetchFailed'))
      }
      setClients(json.clients)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [t])

  async function handleQuickAdd(data: any) {
    setAdding(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       data.meta.name,
          birthDate:  data.meta.birthDate,
          birthTime:  data.meta.birthTime,
          birthPlace: data.meta.birthPlace,
          latitude:   data.meta.latitude,
          longitude:  data.meta.longitude,
          timezone:   data.meta.timezone,
          status:     'active'
        })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setShowAddModal(false)
        fetchClients()
      } else {
        alert(json.error || t('errors.addFailed'))
      }
    } catch (e) {
      console.error('Quick add failed', e)
    } finally {
      setAdding(false)
    }
  }

  async function handleSaveEdit(data: any) {
    if (!editingClient) return
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${editingClient._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       data.meta.name,
          birthDate:  data.meta.birthDate,
          birthTime:  data.meta.birthTime,
          birthPlace: data.meta.birthPlace,
          latitude:   data.meta.latitude,
          longitude:  data.meta.longitude,
          timezone:   data.meta.timezone,
        })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setShowEditModal(false)
        fetchClients()
      } else {
        alert(json.error || t('errors.updateFailed'))
      }
    } catch (e) {
      console.error('Update failed', e)
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteClient(id: string) {
    if (!confirm(t('confirmDelete'))) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) fetchClients()
    } catch (e) {
      console.error('Delete failed', e)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/clients')
    } else if (status === 'authenticated') {
      fetchClients()
    }
  }, [status, router, fetchClients])

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.tags.some(tagName => tagName.toLowerCase().includes(q)) ||
      c.notes.some(n => n.content.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }, [clients, search])


  const stats = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      prospects: clients.filter(c => c.status === 'prospective').length
    }
  }, [clients])

  const transitioning = useMemo(() => {
    return clients.filter(c => !!c.dashaAlert).sort((a,b) => (a.dashaAlert?.date || '0') > (b.dashaAlert?.date || '0') ? 1 : -1)
  }, [clients])

  const sortedBySession = useMemo(() => {
    return [...clients].sort((a,b) => (b.lastSessionAt || '0') > (a.lastSessionAt || '0') ? 1 : -1).slice(0, 5)
  }, [clients])

  async function handleOpenClient(c: Client) {
    setActiveTab('dashboard')
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: c.name,
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          birthPlace: c.birthPlace,
          latitude: c.latitude,
          longitude: c.longitude,
          timezone: c.timezone,
          gender: 'male',
          _t: Date.now(),
        }),
      })
      const json = await res.json()
      if (!json.success) return

      setChart(json.data)
      const params = new URLSearchParams({
        name:       c.name,
        birthDate:  c.birthDate,
        birthTime:  c.birthTime,
        birthPlace: c.birthPlace,
        lat:        c.latitude.toString(),
        lng:        c.longitude.toString(),
        tz:         c.timezone,
      })
      router.push(`/?${params.toString()}`)
    } catch (e) {
      console.error('Open client chart failed', e)
    }
  }

  if (error === 'PLATINUM_REQUIRED') {
    return (
      <main style={{ maxWidth: 800, margin: '8rem auto', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</h1>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>
          {t('gate.title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.2rem' }}>
          {t('gate.body')}
        </p>
        <Link href="/pricing" className="btn btn-primary btn-lg">{t('gate.cta')}</Link>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2.5rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', 
        marginBottom: isMobile ? '1.5rem' : '2rem', flexWrap: 'wrap', gap: '1rem' 
      }}>
        <div style={{ flex: isMobile ? '1 1 100%' : 'none' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.2rem', lineHeight: 1.1
          }}>
            {t('header.title')} <span style={{ color: 'var(--gold)' }}>{t('header.titleHighlight')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
            {t('header.subtitle')}
          </p>

        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ flex: isMobile ? 1 : 'none' }}>{t('header.add')}</button>
          {!isMobile && <Link href="/" className="btn btn-secondary">{t('header.calculator')}</Link>}
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '1.5rem' : '2.5rem' 
      }}>
        {[
          { label: t('stats.total'), value: stats.total, color: 'var(--gold)' },
          { label: t('stats.active'), value: stats.active, color: 'var(--teal)' },
          { label: t('stats.prospects'), value: stats.prospects, color: 'var(--accent)' }
        ].map((s, i) => (
          <div key={i} style={{ 
            background: 'var(--surface-2)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.15rem'
          }}>
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="clients-shell-grid">
        
        {/* Main List */}
        <section>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <input 
              className="input"
              placeholder={t('filterPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {loading ? (
             <div style={{ padding: '6rem', textAlign: 'center' }}>
                <div className="spin-loader" style={{ width: 40, height: 40, margin: '0 auto' }} />
             </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--surface-1)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                {search ? t('emptyFilter') : t('emptyLibrary')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredClients.map(c => (
                <ClientCard 
                  key={c._id} 
                  client={c} 
                  onOpen={handleOpenClient}
                  onEdit={(c) => {
                    setEditingClient(c)
                    setShowEditModal(true)
                  }}
                  onDelete={handleDeleteClient}
                  onUpdate={(updated) => {
                    setClients(prev => prev.map(old => old._id === updated._id ? updated : old))
                  }} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Sidebar: Recent Activity + Dasha Alerts */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {transitioning.length > 0 && (
            <div style={{ 
              padding: '1.5rem', borderRadius: 'var(--r-xl)',
              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <h4 style={{ 
                fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, 
                color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                {t('alerts.title', { count: transitioning.length })}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {transitioning.map(c => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', background: c.dashaAlert?.type === 'MD_CHANGE' ? '#ef4444' : '#f59e0b',
                      fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t(c.dashaAlert?.type === 'MD_CHANGE' ? 'alerts.major' : 'alerts.sub')} {t('alerts.shift', { lord: c.dashaAlert?.lord ?? '' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ 
            background: 'var(--surface-1)', border: '1px solid var(--border)', 
            borderRadius: 'var(--r-xl)', padding: '1.5rem' 
          }}>
            <h4 style={{ 
              fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, 
              color: 'var(--text-primary)', marginBottom: '1rem' 
            }}>
              {t('sessions.title')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedBySession.filter(c => c.lastSessionAt).length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('sessions.none')}</div>
              ) : (
                sortedBySession.filter(c => c.lastSessionAt).map(c => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)',
                      fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
                    }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.lastSessionAt!).toLocaleDateString(tag)}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gold-soft)', fontWeight: 600 }}>{c.activeDasha}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1), transparent)', 
            border: '1px solid rgba(201,168,76,0.2)', 
            borderRadius: 'var(--r-xl)', padding: '1.5rem' 
          }}>
            <h4 style={{ 
              fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, 
              color: 'var(--gold)', marginBottom: '0.5rem' 
            }}>
              {t('perk.title')}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t.rich('perk.body', { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
          </div>
        </aside>

      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="clients-modal-shell">
          <div className="clients-modal-card">
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ×
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>{t('modal.addTitle')}</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0.25rem' }}>
              <BirthForm onResult={handleQuickAdd} onLoading={setAdding} />
            </div>
            {adding && (
              <div style={{ 
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit'
              }}>
                <div className="spin-loader" />
              </div>
            )}
          </div>
        </div>
      )}
      {showEditModal && editingClient && (
        <div className="clients-modal-shell">
          <div className="clients-modal-card">
            <button 
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ×
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>{t('modal.editTitle')}</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0.25rem' }}>
              <BirthForm 
                onResult={handleSaveEdit} 
                onLoading={setAdding} 
                initialData={{
                  name:       editingClient.name,
                  birthDate:  editingClient.birthDate,
                  birthTime:  editingClient.birthTime.slice(0, 5),
                  birthPlace: editingClient.birthPlace,
                  latitude:   editingClient.latitude,
                  longitude:  editingClient.longitude,
                  timezone:   editingClient.timezone
                }}
              />
            </div>
            {adding && (
              <div style={{ 
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit'
              }}>
                <div className="spin-loader" />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
