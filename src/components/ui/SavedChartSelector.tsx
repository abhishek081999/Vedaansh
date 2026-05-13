'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SavedChart {
  _id:        string
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  isClient?:  boolean
}

interface SavedChartSelectorProps {
  onSelect: (chart: SavedChart) => void
  onClose: () => void
}

export function SavedChartSelector({ onSelect, onClose }: SavedChartSelectorProps) {
  const { data: session } = useSession()
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [clients, setClients] = useState<SavedChart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'charts' | 'clients'>('charts')

  const userPlan = (session?.user as any)?.plan ?? 'free'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [chartRes, clientRes] = await Promise.all([
        fetch('/api/chart/list?limit=100'),
        userPlan === 'platinum' ? fetch('/api/clients') : Promise.resolve(null)
      ])

      const chartJson = await chartRes.json()
      if (chartJson.success) setCharts(chartJson.charts)

      if (clientRes) {
        const clientJson = await clientRes.json()
        if (clientJson.success) {
          setClients(clientJson.clients.map((c: any) => ({ ...c, isClient: true })))
          if (clientJson.clients.length > 0 && chartJson.charts.length === 0) {
            setTab('clients')
          }
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userPlan])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentList = tab === 'charts' ? charts : clients
  const filtered = currentList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.birthPlace.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', width: '100%', maxWidth: '500px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Select Chart</h3>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-gold)', letterSpacing: '0.1em', fontWeight: 700 }}>VEDAANSH LIBRARY</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: '50%', fontSize: '1rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {userPlan === 'platinum' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
            <button 
              onClick={() => setTab('charts')}
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === 'charts' ? 'var(--gold)' : 'transparent'}`, color: tab === 'charts' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: tab === 'charts' ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              My Charts ({charts.length})
            </button>
            <button 
              onClick={() => setTab('clients')}
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === 'clients' ? 'var(--gold)' : 'transparent'}`, color: tab === 'clients' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: tab === 'clients' ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              CRM Clients ({clients.length})
            </button>
          </div>
        )}

        <div style={{ padding: '1rem', background: 'var(--surface-1)' }}>
          <div style={{ position: 'relative' }}>
            <input 
              className="input"
              placeholder={`Search ${tab === 'charts' ? 'saved charts' : 'clients'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: 'var(--r-md)' }}
              autoFocus
            />
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1.25rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
               <div className="spin-loader" style={{ width: 28, height: 28, margin: '0 auto', borderTopColor: 'var(--gold)' }} />
               <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetching your library...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', color: 'var(--rose)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
              <div>{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>📂</div>
              <p>No results found matching &quot;{search}&quot;</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filtered.map(c => (
                <button
                  key={c._id}
                  onClick={() => onSelect(c)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    padding: '0.85rem 1rem', background: 'var(--surface-2)',
                    border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--gold)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-soft)'
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{c.name}</span>
                    {c.isClient && <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>CLIENT</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <span>📅 {c.birthDate}</span>
                    <span>🕐 {c.birthTime.slice(0, 5)}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>📍 {c.birthPlace}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
