'use client'

import React, { useId } from 'react'
import { Label } from './Label'
import { Input, type InputProps } from './Input'

export interface FieldProps extends Omit<InputProps, 'id'> {
  label: string
  id?: string
  hint?: string
  error?: string | null
  labelCaps?: boolean
  containerClassName?: string
}

export function Field({
  label,
  id: idProp,
  hint,
  error,
  labelCaps = true,
  containerClassName,
  required,
  invalid,
  ...inputProps
}: FieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={containerClassName}>
      <Label htmlFor={id} caps={labelCaps}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      <Input
        id={id}
        required={required}
        invalid={invalid ?? !!error}
        aria-describedby={describedBy}
        aria-invalid={invalid ?? !!error}
        {...inputProps}
      />
      {hint ? (
        <p id={hintId} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          style={{ fontSize: '0.72rem', color: 'var(--rose)', marginTop: '0.35rem' }}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
