import { z } from 'zod'
import { isValidObjectId } from '@/lib/security/sanitize'

export const objectIdSchema = z
  .string()
  .min(1)
  .refine(isValidObjectId, 'Invalid id')

export const chartSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
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
