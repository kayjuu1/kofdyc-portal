import { createMiddleware } from "@tanstack/react-start"
import { auth, type UserRole, ROLE_HIERARCHY } from "@/lib/auth"

export function requireRole(...allowedRoles: UserRole[]) {
  return createMiddleware().server(async ({ next, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      throw new Response("Unauthorized", { status: 401 })
    }
    const userRole = (session.user as { role?: string }).role as UserRole | undefined
    if (!userRole) {
      throw new Response("Forbidden", { status: 403 })
    }
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1
    const hasAccess = allowedRoles.some(r => userLevel >= ROLE_HIERARCHY[r])
    if (!hasAccess) {
      throw new Response("Forbidden", { status: 403 })
    }
    return next({ context: { session, userRole } })
  })
}
