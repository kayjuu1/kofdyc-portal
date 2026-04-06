import { auth } from "@/lib/auth"
import { createMiddleware } from "@tanstack/react-start"
import { redirect } from "@tanstack/react-router"
import { canonicalizeRole } from "@/lib/permissions"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    if (!session) {
      throw redirect({ to: "/dashboard/login" })
    }

    const rawRole = (session.user as { role?: string }).role
    const userRole = canonicalizeRole(rawRole)
    if (!userRole) {
      throw redirect({ to: "/dashboard/login" })
    }

    if ((session.user as { isActive?: boolean }).isActive === false) {
      throw redirect({ to: "/dashboard/login" })
    }

    if (rawRole !== userRole) {
      await db.update(user).set({ role: userRole }).where(eq(user.id, session.user.id))
      ;(session.user as { role?: string }).role = userRole
    }

    return next({
      context: { session, userRole },
    })
  },
)
