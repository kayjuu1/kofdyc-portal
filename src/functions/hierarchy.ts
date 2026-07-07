import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq, ne } from "drizzle-orm"
import { db } from "@/db"
import { hierarchyLeaders, hierarchyNodes } from "@/db/schema"
import { logAudit } from "@/functions/audit"
import {
  isValidSlug,
  validateHierarchyStructure,
  type HierarchyNodeType,
} from "@/lib/hierarchy-rules"
import { requirePermission } from "@/middleware/role.middleware"

export type HierarchyNode = typeof hierarchyNodes.$inferSelect
export type HierarchyLeader = typeof hierarchyLeaders.$inferSelect

const byOrder = [asc(hierarchyNodes.sortOrder), asc(hierarchyNodes.id)]

export const getHierarchyIndex = createServerFn({ method: "GET" }).handler(
  async () => {
    const nodes = await db
      .select({
        id: hierarchyNodes.id,
        parentId: hierarchyNodes.parentId,
        type: hierarchyNodes.type,
        name: hierarchyNodes.name,
        slug: hierarchyNodes.slug,
        crestUrl: hierarchyNodes.crestUrl,
      })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.isPublished, true))
      .orderBy(...byOrder)

    const childrenOf = (parentId: number) =>
      nodes.filter((node) => node.parentId === parentId)

    return {
      movements: nodes
        .filter((node) => node.type === "movement")
        .map((movement) => ({ ...movement, subMovements: childrenOf(movement.id) })),
      councils: nodes
        .filter((node) => node.type === "deanery_council")
        .map((council) => ({ ...council, parishCouncils: childrenOf(council.id) })),
    }
  },
)

export const getHierarchyNodeBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const [node] = await db
      .select()
      .from(hierarchyNodes)
      .where(
        and(eq(hierarchyNodes.slug, data.slug), eq(hierarchyNodes.isPublished, true)),
      )
      .limit(1)
    if (!node) return null

    // Walk up the parent chain for the breadcrumb (published ancestors only)
    const ancestors: Array<{ id: number; name: string; slug: string }> = []
    let parentId = node.parentId
    for (let depth = 0; parentId !== null && depth < 5; depth++) {
      const [parent] = await db
        .select({
          id: hierarchyNodes.id,
          name: hierarchyNodes.name,
          slug: hierarchyNodes.slug,
          parentId: hierarchyNodes.parentId,
          isPublished: hierarchyNodes.isPublished,
        })
        .from(hierarchyNodes)
        .where(eq(hierarchyNodes.id, parentId))
        .limit(1)
      if (!parent) break
      if (parent.isPublished) {
        ancestors.unshift({ id: parent.id, name: parent.name, slug: parent.slug })
      }
      parentId = parent.parentId
    }

    const leaders = await db
      .select()
      .from(hierarchyLeaders)
      .where(eq(hierarchyLeaders.nodeId, node.id))
      .orderBy(asc(hierarchyLeaders.sortOrder), asc(hierarchyLeaders.id))

    const children = await db
      .select({
        id: hierarchyNodes.id,
        name: hierarchyNodes.name,
        slug: hierarchyNodes.slug,
        type: hierarchyNodes.type,
        crestUrl: hierarchyNodes.crestUrl,
      })
      .from(hierarchyNodes)
      .where(
        and(
          eq(hierarchyNodes.parentId, node.id),
          eq(hierarchyNodes.isPublished, true),
        ),
      )
      .orderBy(...byOrder)

    return { node, ancestors, leaders, children }
  })

export const getAllHierarchyNodes = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageHierarchy")])
  .handler(async () => {
    const nodes = await db.select().from(hierarchyNodes).orderBy(...byOrder)
    const leaders = await db
      .select()
      .from(hierarchyLeaders)
      .orderBy(asc(hierarchyLeaders.sortOrder), asc(hierarchyLeaders.id))

    return nodes.map((node) => ({
      ...node,
      leaders: leaders.filter((leader) => leader.nodeId === node.id),
    }))
  })

type NodeInput = {
  parentId?: number | null
  type: HierarchyNodeType
  name: string
  slug: string
  crestUrl?: string | null
  briefHistory?: string | null
  deaneryId?: number | null
  parishId?: number | null
  sortOrder?: number
  isPublished?: boolean
}

async function validateNodeInput(data: NodeInput, excludeId?: number) {
  if (!data.name.trim()) throw new Error("Name is required")
  if (!isValidSlug(data.slug)) {
    throw new Error(
      "Slug must contain only lowercase letters, digits and single hyphens",
    )
  }

  let parentType: HierarchyNodeType | null = null
  if (data.parentId != null) {
    const [parent] = await db
      .select({ type: hierarchyNodes.type })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.id, data.parentId))
      .limit(1)
    if (!parent) throw new Error("Parent entry not found")
    parentType = parent.type
  }

  const structureError = validateHierarchyStructure({
    type: data.type,
    parentType,
    deaneryId: data.deaneryId ?? null,
    parishId: data.parishId ?? null,
  })
  if (structureError) throw new Error(structureError)

  const slugConditions = [eq(hierarchyNodes.slug, data.slug)]
  if (excludeId !== undefined) {
    slugConditions.push(ne(hierarchyNodes.id, excludeId))
  }
  const [collision] = await db
    .select({ id: hierarchyNodes.id })
    .from(hierarchyNodes)
    .where(and(...slugConditions))
    .limit(1)
  if (collision) {
    throw new Error(`The slug "${data.slug}" is already in use — pick another`)
  }
}

export const createHierarchyNode = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: NodeInput) => input)
  .handler(async ({ data, context }) => {
    await validateNodeInput(data)
    const now = new Date().toISOString()
    const [row] = await db
      .insert(hierarchyNodes)
      .values({
        parentId: data.parentId ?? null,
        type: data.type,
        name: data.name.trim(),
        slug: data.slug,
        crestUrl: data.crestUrl || null,
        briefHistory: data.briefHistory?.trim() || null,
        deaneryId: data.deaneryId ?? null,
        parishId: data.parishId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_node.create",
      resourceType: "hierarchy_node",
      resourceId: String(row.id),
      metadata: { name: row.name, type: row.type },
    })
    return row
  })

export const updateHierarchyNode = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: NodeInput & { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [existing] = await db
      .select({ type: hierarchyNodes.type })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.id, data.id))
      .limit(1)
    if (!existing) throw new Error("Entry not found")
    if (existing.type !== data.type) {
      throw new Error("The type of an entry cannot be changed after creation")
    }

    await validateNodeInput(data, data.id)
    const [row] = await db
      .update(hierarchyNodes)
      .set({
        parentId: data.parentId ?? null,
        name: data.name.trim(),
        slug: data.slug,
        crestUrl: data.crestUrl || null,
        briefHistory: data.briefHistory?.trim() || null,
        deaneryId: data.deaneryId ?? null,
        parishId: data.parishId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(hierarchyNodes.id, data.id))
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_node.update",
      resourceType: "hierarchy_node",
      resourceId: String(row.id),
      metadata: { name: row.name, isPublished: row.isPublished },
    })
    return row
  })

export const toggleHierarchyPublish = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number; isPublished: boolean }) => input)
  .handler(async ({ data, context }) => {
    const [row] = await db
      .update(hierarchyNodes)
      .set({ isPublished: data.isPublished, updatedAt: new Date().toISOString() })
      .where(eq(hierarchyNodes.id, data.id))
      .returning()
    if (!row) throw new Error("Entry not found")

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_node.publish_toggle",
      resourceType: "hierarchy_node",
      resourceId: String(row.id),
      metadata: { name: row.name, isPublished: row.isPublished },
    })
    return row
  })

export const deleteHierarchyNode = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [child] = await db
      .select({ id: hierarchyNodes.id })
      .from(hierarchyNodes)
      .where(eq(hierarchyNodes.parentId, data.id))
      .limit(1)
    if (child) {
      throw new Error("Delete or move this entry's children first")
    }

    const [row] = await db
      .delete(hierarchyNodes)
      .where(eq(hierarchyNodes.id, data.id))
      .returning()
    if (!row) throw new Error("Entry not found")

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_node.delete",
      resourceType: "hierarchy_node",
      resourceId: String(data.id),
      metadata: { name: row.name },
    })
    return { success: true }
  })

type LeaderInput = {
  nodeId: number
  name: string
  roleTitle: string
  photoUrl?: string | null
  phone?: string | null
  sortOrder?: number
}

export const createHierarchyLeader = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: LeaderInput) => input)
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Name is required")
    if (!data.roleTitle.trim()) throw new Error("Role title is required")
    const [row] = await db
      .insert(hierarchyLeaders)
      .values({
        nodeId: data.nodeId,
        name: data.name.trim(),
        roleTitle: data.roleTitle.trim(),
        photoUrl: data.photoUrl || null,
        phone: data.phone?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        createdAt: new Date().toISOString(),
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_leader.create",
      resourceType: "hierarchy_leader",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const updateHierarchyLeader = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: LeaderInput & { id: number }) => input)
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Name is required")
    if (!data.roleTitle.trim()) throw new Error("Role title is required")
    const [row] = await db
      .update(hierarchyLeaders)
      .set({
        name: data.name.trim(),
        roleTitle: data.roleTitle.trim(),
        photoUrl: data.photoUrl || null,
        phone: data.phone?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
      })
      .where(eq(hierarchyLeaders.id, data.id))
      .returning()
    if (!row) throw new Error("Leader not found")

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_leader.update",
      resourceType: "hierarchy_leader",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const deleteHierarchyLeader = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageHierarchy")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [row] = await db
      .delete(hierarchyLeaders)
      .where(eq(hierarchyLeaders.id, data.id))
      .returning()
    if (!row) throw new Error("Leader not found")

    await logAudit({
      userId: context.session.user.id,
      action: "hierarchy_leader.delete",
      resourceType: "hierarchy_leader",
      resourceId: String(data.id),
      metadata: { name: row.name },
    })
    return { success: true }
  })
