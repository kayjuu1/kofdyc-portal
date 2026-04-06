import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user, parishes } from "@/db/schema"
import { eq, sql, and, desc } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { logAudit } from "@/functions/audit"
import { type UserRole } from "@/lib/permissions"

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requirePermission("viewDashboard")])
  .inputValidator(
    (input: {
      search?: string
      role?: UserRole
      parishId?: number
      page?: number
      limit?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = []
    if (data.search) {
      conditions.push(
        sql`(${user.name} LIKE ${'%' + data.search + '%'} OR ${user.email} LIKE ${'%' + data.search + '%'})`
      )
    }
    if (data.role) {
      conditions.push(eq(user.role, data.role))
    }
    if (data.parishId) {
      conditions.push(eq(user.parishId, data.parishId))
    }
    conditions.push(sql`${user.role} != 'member'`)

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [adminUsers, countResult] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          parishId: user.parishId,
          parishName: parishes.name,
          isActive: user.isActive,
          createdAt: user.createdAt,
        })
        .from(user)
        .leftJoin(parishes, eq(user.parishId, parishes.id))
        .where(where)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(where),
    ])

    return {
      adminUsers,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator(
    (input: {
      userId: string
      role: UserRole
    }) => input
  )
  .handler(async ({ data, context }) => {
    await db.update(user).set({ role: data.role }).where(eq(user.id, data.userId))

    await logAudit({
      userId: context.session.user.id,
      action: "user.role.updated",
      resourceType: "user",
      resourceId: data.userId,
      metadata: { newRole: data.role },
    })

    return { success: true }
  })

export const toggleUserActive = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator(
    (input: { userId: string; isActive: boolean }) => input
  )
  .handler(async ({ data, context }) => {
    await db.update(user).set({ isActive: data.isActive }).where(eq(user.id, data.userId))

    await logAudit({
      userId: context.session.user.id,
      action: data.isActive ? "user.activated" : "user.deactivated",
      resourceType: "user",
      resourceId: data.userId,
    })

    return { success: true }
  })
