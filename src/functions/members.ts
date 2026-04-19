import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user, parishes } from "@/db/schema"
import { eq, sql, and, desc } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { logAudit } from "@/functions/audit"
import { auth } from "@/lib/auth"
import { type UserRole } from "@/lib/permissions"

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageAdminUsers")])
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

export const createUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator(
    (input: {
      name: string
      email: string
      password: string
      role: UserRole
      phone?: string
      parishId?: number
    }) => input
  )
  .handler(async ({ data, context }) => {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      })

      if (!result?.user?.id) {
        return { success: false, error: "Failed to create user account" }
      }

      await db.update(user)
        .set({
          role: data.role,
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.parishId ? { parishId: data.parishId } : {}),
        })
        .where(eq(user.id, result.user.id))

      await logAudit({
        userId: context.session.user.id,
        action: "user.created",
        resourceType: "user",
        resourceId: result.user.id,
        metadata: { email: data.email, role: data.role },
      })

      return { success: true, userId: result.user.id }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"
      if (message.includes("already exists") || message.includes("USER_ALREADY_EXISTS")) {
        return { success: false, error: "A user with this email already exists" }
      }
      return { success: false, error: message }
    }
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
