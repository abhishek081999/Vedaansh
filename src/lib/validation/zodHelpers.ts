import type { ZodError } from 'zod'

/** First validation message (Zod 3/4 use `.issues`; Zod 4 removed `.errors`). */
export function zodFirstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Validation failed'
}
