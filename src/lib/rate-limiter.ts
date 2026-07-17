const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

const hits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

export function rateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`
}
