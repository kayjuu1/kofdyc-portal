import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { auditLog, user } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"

export async function logAudit(params: {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    userId: params.userId ?? null,
    action: params.action,
    resourceType: params.resourceType ?? null,
    resourceId: params.resourceId ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    createdAt: new Date().toISOString(),
  })
}

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireRole("system_admin")])
  .inputValidator(
    (input: {
      page?: number
      limit?: number
      resourceType?: string
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 50
    const offset = (page - 1) * limit

    const conditions = data.resourceType
      ? [eq(auditLog.resourceType, data.resourceType)]
      : []

    const where = conditions.length > 0 ? conditions[0] : undefined

    const [logs, countResult] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          resourceType: auditLog.resourceType,
          resourceId: auditLog.resourceId,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.userId, user.id))
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLog)
        .where(where),
    ])

    return {
      logs,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })
