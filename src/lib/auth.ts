import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { admin } from "better-auth/plugins"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { canonicalizeRole, type UserRole } from "@/lib/permissions"
import { hashPassword, verifyPassword } from "@/lib/password"

// Re-exported so existing importers (and src/db/seed.ts) keep working.
// The implementations live in @/lib/password so that scripts/seed-admin.ts can
// reuse them outside the Workers runtime — see the note in that module.
export { hashPassword, verifyPassword }

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendEmail } = await import("@/lib/resend")
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      })
    },
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerification: async ({ user, url }) => {
      const { sendEmail } = await import("@/lib/resend")
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click <a href="${url}">here</a> to verify your email address.</p>`,
      })
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
    // workers.dev stays as a failsafe until we disable it entirely
    "https://kofdyc-portal.owusu.workers.dev",
    ...(process.env.PUBLIC_HOSTNAME ? [`https://${process.env.PUBLIC_HOSTNAME}`] : []),
    ...(process.env.ADMIN_HOSTNAME ? [`https://${process.env.ADMIN_HOSTNAME}`] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  // COOKIE_DOMAIN must only be set once real custom domains are attached;
  // never on *.workers.dev (public-suffix domain, cookies would be rejected).
  // Skipped in dev too: COOKIE_DOMAIN comes from wrangler.jsonc vars, which are
  // loaded locally as well, and a `Domain=kofdyc.org` cookie is silently
  // dropped by the browser on localhost — sign-in succeeds, no session is
  // stored, and every dashboard route bounces straight back to the login page.
  ...(process.env.COOKIE_DOMAIN && !import.meta.env.DEV
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.COOKIE_DOMAIN,
          },
        },
      }
    : {}),
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const user = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  })
  return canonicalizeRole(user?.role) ?? null
}
