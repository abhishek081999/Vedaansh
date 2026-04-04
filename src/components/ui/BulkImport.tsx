'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/BulkImport.tsx
//  XLSX bulk-import button + modal for the My Charts page
// ─────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback } from 'react'

interface RowResult {
  row:     number
  name:    string
  status:  'success' | 'skipped' | 'error'
  message: string
  chartId?: string
}

interface ImportResult {
  imported: number
  total:    number
  results:  RowResult[]
}

interface Props {
  onImportComplete: () => void  // refresh parent chart list
}

export function BulkImport({ onImportComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [open,         setOpen]         = useState(false)
  const [dragging,     setDragging]     = useState(false)
  const [file,         setFile]         = useState<File | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState<ImportResult | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [downloading,  setDownloading]  = useState(false)

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      const res = await fetch('/api/chart/template')
      if (!res.ok) throw new Error('Failed to generate template')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'vedaansh-charts-template.xlsx'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      // silent fail — browser will show native error
    } finally {
      setDownloading(false)
    }
  }

  // ── File selection ───────────────────────────────────────
  function pickFile(f: File) {
    setFile(f)
    setResult(null)
    setError(null)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
    e.target.value = ''    // reset so user can re-pick same file
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }, [])

  // ── Upload ───────────────────────────────────────────────
  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch('/api/chart/bulk-import', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Import failed')
      } else {
        setResult(json as ImportResult)
        if (json.imported > 0) onImportComplete()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setFile(null)
    setResult(null)
    setError(null)
  }

  const successCount = result?.results.filter(r => r.status === 'success').length ?? 0
  const errorCount   = result?.results.filter(r => r.status === 'error').length   ?? 0
  const skippedCount = result?.results.filter(r => r.status === 'skipped').length ?? 0

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <button
        id="bulk-import-btn"
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        title="Import multiple charts from an XLSX file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import XLSX
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={onFileInput}
      />

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="fade-up"
            style={{
              width: '100%', maxWidth: 560,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl, 16px)',
              padding: '2rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  📊 Bulk Import Charts
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload an <strong>.xlsx</strong> file with multiple birth records
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '1.3rem', lineHeight: 1, padding: '0.25rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Required columns + template download */}
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft, var(--border))',
              borderRadius: 'var(--r-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Required columns:</div>
                <button
                  id="download-template-btn"
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                  title="Download a pre-filled XLSX template"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
                    borderRadius: '6px', padding: '3px 10px',
                    fontSize: '0.72rem', color: 'var(--gold)', cursor: downloading ? 'wait' : 'pointer',
                    fontWeight: 600, transition: 'all 0.15s',
                    opacity: downloading ? 0.6 : 1,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {downloading ? 'Downloading…' : 'Download Template'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {['Name', 'Birth Date', 'Birth Time', 'Birth Place', 'Latitude', 'Longitude', 'Timezone'].map(c => (
                  <span key={c} style={{
                    background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '4px', padding: '1px 8px', color: 'var(--gold)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                  }}>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                Optional: <span style={{ fontFamily: 'var(--font-mono)' }}>isPublic</span>, <span style={{ fontFamily: 'var(--font-mono)' }}>isPersonal</span>
              </div>
            </div>

            {/* Drop zone */}
            {!result && (
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragging ? 'var(--gold)' : file ? 'rgba(78,205,196,0.6)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-lg)',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging
                    ? 'rgba(201,168,76,0.05)'
                    : file
                    ? 'rgba(78,205,196,0.05)'
                    : 'var(--surface-2)',
                  transition: 'all 0.2s',
                }}
              >
                {file ? (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--teal, #4ecdc4)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                      {dragging ? '📂' : '📁'}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {dragging ? 'Drop to upload' : 'Click or drag & drop'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Supports .xlsx, .xls, .csv
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
                background: 'rgba(224,123,142,0.1)', border: '1px solid rgba(224,123,142,0.25)',
                color: 'var(--rose)', fontSize: '0.83rem',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Summary bar */}
                <div style={{
                  display: 'flex', gap: '0.6rem', flexWrap: 'wrap', padding: '0.75rem',
                  background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                }}>
                  <Pill color="teal"  icon="✅" label={`${successCount} imported`} />
                  {errorCount   > 0 && <Pill color="rose"  icon="❌" label={`${errorCount} errors`} />}
                  {skippedCount > 0 && <Pill color="amber" icon="⏭" label={`${skippedCount} skipped`} />}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                    {result.total} rows total
                  </span>
                </div>

                {/* Row-level detail */}
                <div style={{
                  maxHeight: 240, overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  fontSize: '0.78rem',
                }}>
                  {result.results.map((r) => (
                    <div key={r.row} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                      padding: '0.55rem 0.85rem',
                      borderBottom: '1px solid var(--border-soft, var(--border))',
                      background: r.status === 'success'
                        ? 'rgba(78,205,196,0.04)'
                        : r.status === 'error'
                        ? 'rgba(224,123,142,0.04)'
                        : 'transparent',
                    }}>
                      <span style={{ minWidth: 16 }}>
                        {r.status === 'success' ? '✅' : r.status === 'error' ? '❌' : '⏭'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Row {r.row} · {r.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.4 }}>
                          {r.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import another */}
                <button
                  onClick={() => { setResult(null); setFile(null); setError(null) }}
                  className="btn btn-ghost"
                  style={{ alignSelf: 'flex-start', fontSize: '0.82rem' }}
                >
                  ↩ Import another file
                </button>
              </div>
            )}

            {/* Actions */}
            {!result && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button onClick={handleClose} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button
                  id="bulk-import-upload-btn"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', minWidth: 120, justifyContent: 'center' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        width: 14, height: 14,
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block',
                      }} />
                      Importing…
                    </span>
                  ) : 'Import Charts'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// small coloured badge
function Pill({ color, icon, label }: { color: 'teal' | 'rose' | 'amber'; icon: string; label: string }) {
  const bg: Record<string, string> = {
    teal:  'rgba(78,205,196,0.12)',
    rose:  'rgba(224,123,142,0.12)',
    amber: 'rgba(201,168,76,0.12)',
  }
  const cl: Record<string, string> = {
    teal:  'var(--teal, #4ecdc4)',
    rose:  'var(--rose, #e07b8e)',
    amber: 'var(--gold, #c9a84c)',
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: bg[color], borderRadius: '20px',
      padding: '2px 10px', fontSize: '0.78rem', color: cl[color], fontWeight: 600,
    }}>
      {icon} {label}
    </span>
  )
}
