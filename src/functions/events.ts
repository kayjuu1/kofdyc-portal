import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { events } from "@/db/schema"
import { eq, and, gt, asc } from "drizzle-orm"

export const getUpcomingEvents = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      limit?: number
      scope?: "diocese" | "deanery" | "parish"
      scopeId?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const limit = data.limit ?? 4
    const now = new Date().toISOString()

    const conditions = [
      eq(events.status, "published"),
      gt(events.startAt, now),
    ]
    if (data.scope) {
      conditions.push(eq(events.scope, data.scope))
    }
    if (data.scopeId) {
      conditions.push(eq(events.scopeId, data.scopeId))
    }

    const results = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        scope: events.scope,
        startAt: events.startAt,
        endAt: events.endAt,
        venue: events.venue,
        coverImageUrl: events.coverImageUrl,
        registrationType: events.registrationType,
        feeAmount: events.feeAmount,
        feeCurrency: events.feeCurrency,
      })
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.startAt))
      .limit(limit)

    return results
  })
