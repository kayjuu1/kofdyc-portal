import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { admin } from "better-auth/plugins"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { canonicalizeRole, isAdminRole, type UserRole } from "@/lib/permissions"

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Workers-compatible password hashing using Web Crypto PBKDF2
// Replaces bcryptjs which exceeds Cloudflare Workers CPU limits
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  )
  const saltB64 = uint8ArrayToBase64(salt)
  const hashB64 = uint8ArrayToBase64(new Uint8Array(hash))
  return `pbkdf2:100000:${saltB64}:${hashB64}`
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (hash.startsWith("pbkdf2:")) {
    const [, iterations, saltB64, hashB64] = hash.split(":")
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    )
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: parseInt(iterations), hash: "SHA-256" },
      keyMaterial, 256
    )
    const derivedB64 = uint8ArrayToBase64(new Uint8Array(derived))
    return derivedB64 === hashB64
  }
  const { compare } = await import("bcryptjs")
  return compare(password, hash)
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  plugins: [
    admin(),
    tanstackStartCookies(),
  ],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://dyckoforidua.org",
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

export function canAccessDashboard(role: UserRole | null): boolean {
  return isAdminRole(role)
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const user = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  })
  return canonicalizeRole(user?.role) ?? null
}
