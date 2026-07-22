import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function successResponse<T>(
  data: T,
  meta?: Partial<PaginationMeta>,
  status = 200
): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status })
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status })
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return errorResponse(err.code, err.message, err.status, err.details)
  }
  if (err instanceof ZodError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      422,
      { issues: err.issues }
    )
  }
  console.error('[API Error]', err)
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500)
}

export function paginationParams(searchParams: URLSearchParams): {
  page: number
  pageSize: number
  skip: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  return { page, pageSize, skip: (page - 1) * pageSize }
}
