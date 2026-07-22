import { redis } from './redis'
import { ApiError } from './api-response'

export async function rateLimit(
  ip: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const key = `ratelimit:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds)
    if (count > limit) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests')
  } catch (err) {
    if (err instanceof ApiError) throw err
    // Redis down — allow the request through
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}
