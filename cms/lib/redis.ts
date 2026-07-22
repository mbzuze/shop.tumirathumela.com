import { Redis } from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Redis] connection error:', err.message)
  }
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
