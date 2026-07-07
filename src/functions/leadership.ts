import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { leadershipGroups, leadershipMembers } from "@/db/schema"
import { logAudit } from "@/functions/audit"
import { requirePermission } from "@/middleware/role.middleware"

export const getPublishedLeadership = createServerFn({ method: "GET" }).handler(
  async () => {
    const groups = await db
      .select()
      .from(leadershipGroups)
      .where(eq(leadershipGroups.isPublished, true))
      .orderBy(asc(leadershipGroups.sortOrder), asc(leadershipGroups.id))

    const members = await db
      .select()
      .from(leadershipMembers)
      .where(eq(leadershipMembers.isPublished, true))
      .orderBy(asc(leadershipMembers.sortOrder), asc(leadershipMembers.id))

    return groups.map((group) => ({
      ...group,
      members: members
        .filter((member) => member.groupId === group.id)
        .map(({ bio: _bio, email: _email, phone: _phone, ...card }) => card),
    }))
  },
)

export const getLeadershipMember = createServerFn({ method: "GET" })
  .inputValidator((input: { memberId: number }) => input)
  .handler(async ({ data }) => {
    const [row] = await db
      .select({
        member: leadershipMembers,
        groupTitle: leadershipGroups.title,
      })
      .from(leadershipMembers)
      .innerJoin(leadershipGroups, eq(leadershipMembers.groupId, leadershipGroups.id))
      .where(
        and(
          eq(leadershipMembers.id, data.memberId),
          eq(leadershipMembers.isPublished, true),
          eq(leadershipGroups.isPublished, true),
        ),
      )
      .limit(1)

    return row ?? null
  })

export const getAllLeadership = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageLeadership")])
  .handler(async () => {
    const groups = await db
      .select()
      .from(leadershipGroups)
      .orderBy(asc(leadershipGroups.sortOrder), asc(leadershipGroups.id))
    const members = await db
      .select()
      .from(leadershipMembers)
      .orderBy(asc(leadershipMembers.sortOrder), asc(leadershipMembers.id))

    return groups.map((group) => ({
      ...group,
      members: members.filter((member) => member.groupId === group.id),
    }))
  })

type GroupInput = {
  title: string
  eyebrow?: string | null
  intro?: string | null
  sortOrder?: number
  isPublished?: boolean
}

export const createLeadershipGroup = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: GroupInput) => input)
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Title is required")
    const now = new Date().toISOString()
    const [row] = await db
      .insert(leadershipGroups)
      .values({
        title: data.title.trim(),
        eyebrow: data.eyebrow?.trim() || null,
        intro: data.intro?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_group.create",
      resourceType: "leadership_group",
      resourceId: String(row.id),
      metadata: { title: row.title },
    })
    return row
  })

export const updateLeadershipGroup = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: GroupInput & { id: number }) => input)
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Title is required")
    const [row] = await db
      .update(leadershipGroups)
      .set({
        title: data.title.trim(),
        eyebrow: data.eyebrow?.trim() || null,
        intro: data.intro?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(leadershipGroups.id, data.id))
      .returning()
    if (!row) throw new Error("Group not found")

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_group.update",
      resourceType: "leadership_group",
      resourceId: String(row.id),
      metadata: { title: row.title, isPublished: row.isPublished },
    })
    return row
  })

export const deleteLeadershipGroup = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [row] = await db
      .delete(leadershipGroups)
      .where(eq(leadershipGroups.id, data.id))
      .returning()
    if (!row) throw new Error("Group not found")

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_group.delete",
      resourceType: "leadership_group",
      resourceId: String(data.id),
      metadata: { title: row.title },
    })
    return { success: true }
  })

type MemberInput = {
  groupId: number
  name: string
  roleTitle: string
  photoUrl?: string | null
  bio?: string | null
  email?: string | null
  phone?: string | null
  sortOrder?: number
  isPublished?: boolean
}

export const createLeadershipMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: MemberInput) => input)
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Name is required")
    if (!data.roleTitle.trim()) throw new Error("Role title is required")
    const now = new Date().toISOString()
    const [row] = await db
      .insert(leadershipMembers)
      .values({
        groupId: data.groupId,
        name: data.name.trim(),
        roleTitle: data.roleTitle.trim(),
        photoUrl: data.photoUrl || null,
        bio: data.bio?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_member.create",
      resourceType: "leadership_member",
      resourceId: String(row.id),
      metadata: { name: row.name },
    })
    return row
  })

export const updateLeadershipMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: MemberInput & { id: number }) => input)
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Name is required")
    if (!data.roleTitle.trim()) throw new Error("Role title is required")
    const [row] = await db
      .update(leadershipMembers)
      .set({
        groupId: data.groupId,
        name: data.name.trim(),
        roleTitle: data.roleTitle.trim(),
        photoUrl: data.photoUrl || null,
        bio: data.bio?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isPublished: data.isPublished ?? true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(leadershipMembers.id, data.id))
      .returning()
    if (!row) throw new Error("Member not found")

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_member.update",
      resourceType: "leadership_member",
      resourceId: String(row.id),
      metadata: { name: row.name, isPublished: row.isPublished },
    })
    return row
  })

export const deleteLeadershipMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageLeadership")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [row] = await db
      .delete(leadershipMembers)
      .where(eq(leadershipMembers.id, data.id))
      .returning()
    if (!row) throw new Error("Member not found")

    await logAudit({
      userId: context.session.user.id,
      action: "leadership_member.delete",
      resourceType: "leadership_member",
      resourceId: String(data.id),
      metadata: { name: row.name },
    })
    return { success: true }
  })
