import { createServerFn } from "@tanstack/react-start"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { events, featuredEvents } from "@/db/schema"
import { logAudit } from "@/functions/audit"
import { requirePermission } from "@/middleware/role.middleware"

export type FeaturedEventItem = {
  id: number
  displayTitle: string
  artworkUrl: string
  targetDate: string
  ctaLabel: string
  ctaUrl: string | null
  supportLine: string | null
  eventId: number | null
  eventEndAt: string | null
}

export const getActiveFeaturedEvents = createServerFn({ method: "GET" }).handler(
  async () => {
    const rows = await db
      .select({
        id: featuredEvents.id,
        displayTitle: featuredEvents.displayTitle,
        artworkUrl: featuredEvents.artworkUrl,
        targetDate: featuredEvents.targetDate,
        ctaLabel: featuredEvents.ctaLabel,
        ctaUrl: featuredEvents.ctaUrl,
        supportLine: featuredEvents.supportLine,
        eventId: featuredEvents.eventId,
        eventEndAt: events.endAt,
      })
      .from(featuredEvents)
      .leftJoin(events, eq(featuredEvents.eventId, events.id))
      .where(eq(featuredEvents.isActive, true))
      .orderBy(asc(featuredEvents.sortOrder), asc(featuredEvents.id))

    const items: FeaturedEventItem[] = rows.map((row) => ({
      ...row,
      ctaUrl: row.eventId ? `/events/${row.eventId}` : row.ctaUrl,
    }))

    // serverNow lets the countdown render identical values on server and client
    return { items, serverNow: new Date().toISOString() }
  },
)

export const getAllFeaturedEvents = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageFeaturedEvents")])
  .handler(async () => {
    return db
      .select({
        id: featuredEvents.id,
        eventId: featuredEvents.eventId,
        displayTitle: featuredEvents.displayTitle,
        artworkUrl: featuredEvents.artworkUrl,
        targetDate: featuredEvents.targetDate,
        ctaLabel: featuredEvents.ctaLabel,
        ctaUrl: featuredEvents.ctaUrl,
        supportLine: featuredEvents.supportLine,
        isActive: featuredEvents.isActive,
        sortOrder: featuredEvents.sortOrder,
        createdAt: featuredEvents.createdAt,
        eventTitle: events.title,
      })
      .from(featuredEvents)
      .leftJoin(events, eq(featuredEvents.eventId, events.id))
      .orderBy(asc(featuredEvents.sortOrder), asc(featuredEvents.id))
  })

type FeaturedEventInput = {
  eventId?: number | null
  displayTitle: string
  artworkUrl: string
  targetDate: string
  ctaLabel?: string
  ctaUrl?: string | null
  supportLine?: string | null
  isActive?: boolean
  sortOrder?: number
}

function assertValidInput(data: FeaturedEventInput) {
  if (!data.displayTitle.trim()) throw new Error("Display title is required")
  if (!data.artworkUrl.trim()) throw new Error("Artwork is required")
  if (Number.isNaN(Date.parse(data.targetDate))) {
    throw new Error("Target date must be a valid date")
  }
  if (!data.eventId && !data.ctaUrl?.trim()) {
    throw new Error("Provide a CTA URL or link an internal event")
  }
}

export const createFeaturedEvent = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageFeaturedEvents")])
  .inputValidator((input: FeaturedEventInput) => input)
  .handler(async ({ data, context }) => {
    assertValidInput(data)
    const now = new Date().toISOString()
    const [row] = await db
      .insert(featuredEvents)
      .values({
        eventId: data.eventId ?? null,
        displayTitle: data.displayTitle.trim(),
        artworkUrl: data.artworkUrl,
        targetDate: data.targetDate,
        ctaLabel: data.ctaLabel?.trim() || "Event details",
        ctaUrl: data.ctaUrl?.trim() || null,
        supportLine: data.supportLine?.trim() || null,
        isActive: data.isActive ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdBy: context.session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await logAudit({
      userId: context.session.user.id,
      action: "featured_event.create",
      resourceType: "featured_event",
      resourceId: String(row.id),
      metadata: { displayTitle: row.displayTitle },
    })

    return row
  })

export const updateFeaturedEvent = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageFeaturedEvents")])
  .inputValidator((input: FeaturedEventInput & { id: number }) => input)
  .handler(async ({ data, context }) => {
    assertValidInput(data)
    const [row] = await db
      .update(featuredEvents)
      .set({
        eventId: data.eventId ?? null,
        displayTitle: data.displayTitle.trim(),
        artworkUrl: data.artworkUrl,
        targetDate: data.targetDate,
        ctaLabel: data.ctaLabel?.trim() || "Event details",
        ctaUrl: data.ctaUrl?.trim() || null,
        supportLine: data.supportLine?.trim() || null,
        isActive: data.isActive ?? false,
        sortOrder: data.sortOrder ?? 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(featuredEvents.id, data.id))
      .returning()
    if (!row) throw new Error("Featured event not found")

    await logAudit({
      userId: context.session.user.id,
      action: "featured_event.update",
      resourceType: "featured_event",
      resourceId: String(row.id),
      metadata: { displayTitle: row.displayTitle, isActive: row.isActive },
    })

    return row
  })

export const deleteFeaturedEvent = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageFeaturedEvents")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data, context }) => {
    const [row] = await db
      .delete(featuredEvents)
      .where(eq(featuredEvents.id, data.id))
      .returning()
    if (!row) throw new Error("Featured event not found")

    await logAudit({
      userId: context.session.user.id,
      action: "featured_event.delete",
      resourceType: "featured_event",
      resourceId: String(data.id),
      metadata: { displayTitle: row.displayTitle },
    })

    return { success: true }
  })
