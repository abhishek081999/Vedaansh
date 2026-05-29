'use client'

import React from 'react'

type AdminPaginationProps = {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  isMobile?: boolean
}

export function AdminPagination({ page, totalPages, total, onPageChange, isMobile }: AdminPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      flexWrap: 'wrap',
      padding: '0.75rem 0',
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {total} total · page {page} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: isMobile ? '0.4rem 0.65rem' : undefined, fontSize: '0.8rem' }}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: isMobile ? '0.4rem 0.65rem' : undefined, fontSize: '0.8rem' }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
