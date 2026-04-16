import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import * as schema from './schema'

type DB = DrizzleD1Database<typeof schema>

// Use a Proxy so that `env.kofdyc_portal` (the D1 binding) is accessed
// lazily on each query instead of being captured once at module-load time.
// This avoids the Cloudflare Workers "Cannot perform I/O on behalf of a
// different request" error that occurs when a cached binding is reused
// across request contexts.
export const db: DB = new Proxy({} as DB, {
  get(_, prop, receiver) {
    const instance = drizzle(env.kofdyc_portal, { schema })
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})
