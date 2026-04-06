import { createMiddleware } from "@tanstack/react-start"
import { auth } from "@/lib/auth"
import {
  canonicalizeRole,
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/permissions"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

async function resolveDashboardSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Response("Unauthorized", { status: 401 })
  }

  const rawRole = (session.user as { role?: string }).role
  const userRole = canonicalizeRole(rawRole)
  if (!userRole) {
    throw new Response("Forbidden", { status: 403 })
  }

  if ((session.user as { isActive?: boolean }).isActive === false) {
    throw new Response("Forbidden", { status: 403 })
  }

  if (rawRole !== userRole) {
    await db.update(user).set({ role: userRole }).where(eq(user.id, session.user.id))
    ;(session.user as { role?: string }).role = userRole
  }

  return { session, userRole }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return createMiddleware().server(async ({ next, request }) => {
    const { session, userRole } = await resolveDashboardSession(request.headers)
    if (!allowedRoles.includes(userRole)) {
      throw new Response("Forbidden", { status: 403 })
    }
    return next({ context: { session, userRole } })
  })
}

export function requirePermission(permission: Permission) {
  return createMiddleware().server(async ({ next, request }) => {
    const { session, userRole } = await resolveDashboardSession(request.headers)
    if (!hasPermission(userRole, permission)) {
      throw new Response("Forbidden", { status: 403 })
    }
    return next({ context: { session, userRole } })
  })
}
