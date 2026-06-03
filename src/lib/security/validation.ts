import { z } from 'zod'
import { isValidObjectId } from '@/lib/security/sanitize'

/** URL query params often send "" — treat as absent for optional fields. */
export function emptyQueryToUndefined(value: unknown): unknown {
  if (value == null || value === '') return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

export const objectIdSchema = z
  .string()
  .min(1)
  .refine(isValidObjectId, 'Invalid id')

export const chartSearchQuerySchema = z.object({
  q: z.preprocess(emptyQueryToUndefined, z.string().trim().max(200).optional()),
  gender: z.preprocess(
    emptyQueryToUndefined,
    z.enum(['male', 'female', 'other', 'all']).optional(),
  ),
  startDate: z.preprocess(
    emptyQueryToUndefined,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ),
  endDate: z.preprocess(
    emptyQueryToUndefined,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ),
  year: z.preprocess(
    emptyQueryToUndefined,
    z.string().regex(/^\d{4}$/).optional(),
  ),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})

export const chartNotePostSchema = z.object({
  chartId: objectIdSchema,
  content: z.string().trim().min(1).max(5000),
})

export const chartNoteDeleteQuerySchema = z.object({
  chartId: objectIdSchema,
  noteId: objectIdSchema,
})

export const chartNoteGetQuerySchema = z.object({
  chartId: objectIdSchema,
})

export const relocateBodySchema = z.object({
  jd: z.number().finite(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const defaultChartBodySchema = z.object({
  chartId: objectIdSchema,
})
