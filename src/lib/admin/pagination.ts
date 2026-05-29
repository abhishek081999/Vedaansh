export type PaginationParams = {
  page: number
  limit: number
  search: string
  skip: number
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
): PaginationParams {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || String(defaults.page ?? 1), 10) || 1)
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get('limit') || String(defaults.limit ?? 50), 10) || 50),
  )
  const search = (searchParams.get('search') || '').trim()
  const skip = (page - 1) * limit
  return { page, limit, search, skip }
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}
