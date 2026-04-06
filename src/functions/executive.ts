import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { dycExecutive } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"

export const getExecutiveMembers = createServerFn({ method: "GET" })
  .inputValidator((input: { currentOnly?: boolean }) => input)
  .handler(async ({ data }) => {
    const conditions = data.currentOnly !== false
      ? [eq(dycExecutive.isCurrent, true)]
      : []

    return db
      .select()
      .from(dycExecutive)
      .where(conditions[0])
      .orderBy(desc(dycExecutive.createdAt))
  })

export const createExecutiveMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator(
    (input: {
      name: string
      portfolio: string
      photoUrl?: string
      email?: string
      phone?: string
      termYear: string
      isCurrent?: boolean
    }) => input
  )
  .handler(async ({ data }) => {
    const [member] = await db.insert(dycExecutive).values({
      name: data.name,
      portfolio: data.portfolio,
      photoUrl: data.photoUrl ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      termYear: data.termYear,
      isCurrent: data.isCurrent ?? true,
      createdAt: new Date().toISOString(),
    }).returning()
    return member
  })

export const updateExecutiveMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator(
    (input: {
      id: number
      name?: string
      portfolio?: string
      photoUrl?: string
      email?: string
      phone?: string
      termYear?: string
      isCurrent?: boolean
    }) => input
  )
  .handler(async ({ data }) => {
    const { id, ...updates } = data
    const fields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) fields[key] = value
    }
    await db.update(dycExecutive).set(fields).where(eq(dycExecutive.id, id))
    return { success: true }
  })

export const deleteExecutiveMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageAdminUsers")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(dycExecutive).where(eq(dycExecutive.id, data.id))
    return { success: true }
  })
