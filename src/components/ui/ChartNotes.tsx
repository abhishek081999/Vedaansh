'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { Trash2, Plus, Loader2, MessageSquare } from 'lucide-react'

interface Note {
  _id: string
  content: string
  createdAt: string
}

export function ChartNotes({ chartId }: { chartId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mounted ref to prevent state updates after unmount
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/chart/notes?chartId=${chartId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (isMounted.current) setNotes(json.notes)
    } catch (e: unknown) {
      if (isMounted.current) setError(e instanceof Error ? e.message : 'Failed to load notes')
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [chartId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function handleAdd() {
    if (!newNote.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/chart/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, content: newNote.trim() })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (isMounted.current) {
        setNotes(json.notes)
        setNewNote('')
      }
    } catch (e: unknown) {
      if (isMounted.current) setError(e instanceof Error ? e.message : 'Failed to save note')
    } finally {
      if (isMounted.current) setSaving(false)
    }
  }

  async function handleDelete(noteId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/chart/notes?chartId=${chartId}&noteId=${noteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (isMounted.current) setNotes(json.notes)
    } catch (e: unknown) {
      if (isMounted.current) setError(e instanceof Error ? e.message : 'Failed to delete note')
    }
  }

  return (
    <div className="space-y-3 font-display">
      {error && (
        <div className="text-[0.8rem] text-rose bg-rose/10 border border-rose/20 px-3 py-2 rounded-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-gold text-[0.65rem] uppercase tracking-widest font-bold opacity-80 mb-1">
        <MessageSquare className="w-3 h-3" />
        <span>Chart Observations</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[0.8rem] text-muted animate-pulse py-4 justify-center bg-surface-1/30 rounded border border-dashed border-border/40">
          <Loader2 className="w-4 h-4 animate-spin text-gold" />
          <span>Syncing celestial notes...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-[0.8rem] text-muted italic opacity-60 py-8 text-center bg-surface-1/20 rounded border border-dashed border-border/40">
          No observations recorded for this chart.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {notes.map(note => (
            <div 
              key={note._id} 
              className="p-3 bg-surface-2 border border-border/60 rounded-sm text-[0.85rem] flex gap-3 group transition-all hover:border-gold/30 hover:bg-surface-3"
            >
              <div className="flex-1 whitespace-pre-wrap text-secondary leading-relaxed">{note.content}</div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[0.65rem] text-muted opacity-70 italic">{format(new Date(note.createdAt), 'MMM d, p')}</span>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="text-rose opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all p-1 hover:scale-110"
                  title="Delete observation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2 pt-3 border-t border-border/30">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Record a new observation..."
          className="input flex-1 resize-none text-[0.85rem] min-h-[44px] py-2 px-3 bg-surface-1 border-border/40 focus:border-gold/50"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newNote.trim()}
          className="btn btn-primary h-auto py-1.5 px-3 disabled:opacity-30 self-end transition-all hover:scale-105 active:scale-95"
          title="Add Note (Cmd/Ctrl + Enter)"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      <div className="text-[0.6rem] text-muted text-right opacity-40">
        Press <kbd className="font-sans">Cmd/Ctrl + Enter</kbd> to save
      </div>
    </div>
  )
}
