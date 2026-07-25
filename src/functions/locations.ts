import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { deaneries, parishes, hierarchyNodes, programmes } from "@/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { logAudit } from "@/functions/audit"

export const getDeaneries = createServerFn({ method: "GET" })
  .inputValidator((input: { dioceseId?: number }) => input)
  .handler(async ({ data }) => {
    const conditions = []
    if (data?.dioceseId) {
      conditions.push(eq(deaneries.dioceseId, data.dioceseId))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const results = await db
      .select({
        id: deaneries.id,
        name: deaneries.name,
        deanName: deaneries.deanName,
        dioceseId: deaneries.dioceseId,
      })
      .from(deaneries)
      .where(where)
      .orderBy(asc(deaneries.name))

    return results
  })

export const getParishes = createServerFn({ method: "GET" })
  .inputValidator((input: { deaneryId?: number }) => input)
  .handler(async ({ data }) => {
    const where = data?.deaneryId ? eq(parishes.deaneryId, data.deaneryId) : undefined

    const results = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        priestName: parishes.priestName,
        deaneryId: parishes.deaneryId,
      })
      .from(parishes)
      .where(where)
      .orderBy(asc(parishes.name))

    return results
  })

export const getParish = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const result = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        priestName: parishes.priestName,
        deaneryId: parishes.deaneryId,
      })
      .from(parishes)
      .where(eq(parishes.id, data.id))
      .limit(1)

    return result[0] ?? null
  })

// ---------------------------------------------------------------- admin CRUD
//
// Deaneries and parishes are managed from the Hierarchy dashboard page, since a
// deanery/parish youth council cannot be created until its location exists —
// so they share the `manageHierarchy` permission rather than defining a new one.

export const createDeanery = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { name: string; deanName?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const name = data.name.trim()
    if (!name) throw new Error("Deanery name is required")

    const [row] = await db
      .insert(deaneries)
      .values({
        name,
        deanName: data.deanName?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "deanery.create",
      resourceType: "deanery",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const updateDeanery = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number; name: string; deanName?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const name = data.name.trim()
    if (!name) throw new Error("Deanery name is required")

    const [row] = await db
      .update(deaneries)
      .set({ name, deanName: data.deanName?.trim() || null })
      .where(eq(deaneries.id, data.id))
      .returning()
    if (!row) throw new Error("Deanery not found")

    await logAudit({
      userId: context.session.user.id,
      action: "deanery.update",
      resourceType: "deanery",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const deleteDeanery = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    // The FKs are ON DELETE no action, so check first to explain *why* instead
    // of surfacing a raw SQLite constraint error.
    const [parish] = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.deaneryId, data.id))
      .limit(1)
    if (parish) {
      throw new Error("Delete or move this deanery's parishes first")
    }
    const [council] = await db
      .select({ id: hierarchyNodes.id })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.deaneryId, data.id))
      .limit(1)
    if (council) {
      throw new Error("A deanery youth council is linked to this deanery — delete it first")
    }

    await db.delete(deaneries).where(eq(deaneries.id, data.id))
    await logAudit({
      userId: context.session.user.id,
      action: "deanery.delete",
      resourceType: "deanery",
      resourceId: String(data.id),
    })
    return { success: true }
  })

export const createParish = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator(
    (input: { name: string; deaneryId: number; priestName?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    const name = data.name.trim()
    if (!name) throw new Error("Parish name is required")
    if (!data.deaneryId) throw new Error("A parish must belong to a deanery")

    const [deanery] = await db
      .select({ id: deaneries.id })
      .from(deaneries)
      .where(eq(deaneries.id, data.deaneryId))
      .limit(1)
    if (!deanery) throw new Error("Deanery not found")

    const [row] = await db
      .insert(parishes)
      .values({
        name,
        deaneryId: data.deaneryId,
        priestName: data.priestName?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "parish.create",
      resourceType: "parish",
      resourceId: String(row.id),
      metadata: { name: row.name, deaneryId: row.deaneryId },
    })
    return row
  })

export const updateParish = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator(
    (input: { id: number; name: string; deaneryId: number; priestName?: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    const name = data.name.trim()
    if (!name) throw new Error("Parish name is required")
    if (!data.deaneryId) throw new Error("A parish must belong to a deanery")

    const [row] = await db
      .update(parishes)
      .set({
        name,
        deaneryId: data.deaneryId,
        priestName: data.priestName?.trim() || null,
      })
      .where(eq(parishes.id, data.id))
      .returning()
    if (!row) throw new Error("Parish not found")

    await logAudit({
      userId: context.session.user.id,
      action: "parish.update",
      resourceType: "parish",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const deleteParish = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [council] = await db
      .select({ id: hierarchyNodes.id })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.parishId, data.id))
      .limit(1)
    if (council) {
      throw new Error("A parish youth council is linked to this parish — delete it first")
    }
    const [programme] = await db
      .select({ id: programmes.id })
      .from(programmes)
      .where(eq(programmes.parishId, data.id))
      .limit(1)
    if (programme) {
      throw new Error("This parish has programmes — reassign or delete them first")
    }

    await db.delete(parishes).where(eq(parishes.id, data.id))
    await logAudit({
      userId: context.session.user.id,
      action: "parish.delete",
      resourceType: "parish",
      resourceId: String(data.id),
    })
    return { success: true }
  })
