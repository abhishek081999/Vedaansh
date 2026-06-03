import { Types } from 'mongoose'

/**
 * Escapes user text before use in MongoDB $regex to prevent ReDoS / operator injection.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isValidObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value
}

export function regexFromSearch(input: string): { $regex: string; $options: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  return { $regex: escapeRegex(trimmed), $options: 'i' }
}
