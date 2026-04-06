import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user, events, documents, news, programmes, parishes } from "@/db/schema"
import { sql, eq, gt, and, gte } from "drizzle-orm"

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const now = new Date().toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [members, upcoming, docs, published, newAdminUsers, programmeStats] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user),
      db.select({ count: sql<number>`count(*)` }).from(events)
        .where(and(eq(events.status, "published"), gt(events.startAt, now))),
      db.select({ count: sql<number>`count(*)` }).from(documents),
      db.select({ count: sql<number>`count(*)` }).from(news)
        .where(eq(news.status, "published")),
      // New admin users in the last 30 days
      db.select({ count: sql<number>`count(*)` }).from(user)
        .where(gte(sql`${user.createdAt}`, sql`${thirtyDaysAgo}`)),
      // Programme status counts
      db.select({
        status: programmes.status,
        count: sql<number>`count(*)`,
      }).from(programmes)
        .groupBy(programmes.status),
    ])

    const programmeStatusCounts: Record<string, number> = {}
    for (const row of programmeStats) {
      programmeStatusCounts[row.status] = row.count
    }

    return {
      members: members[0]?.count ?? 0,
      upcomingEvents: upcoming[0]?.count ?? 0,
      documents: docs[0]?.count ?? 0,
      publishedNews: published[0]?.count ?? 0,
      newMembersThisMonth: newAdminUsers[0]?.count ?? 0,
      programmeStatusCounts,
    }
  })

export const getParishLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number }) => input)
  .handler(async ({ data }) => {
    const limit = data.limit ?? 10

    // Get parish stats: programme submissions (40pts), events (10pts), registrations (5pts/10)
    const parishStats = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        programmeCount: sql<number>`(SELECT COUNT(*) FROM programmes WHERE programmes.parish_id = parishes.id AND programmes.status != 'draft')`,
        eventCount: sql<number>`(SELECT COUNT(*) FROM events WHERE events.scope = 'parish' AND events.scope_id = parishes.id)`,
        registrationCount: sql<number>`(SELECT COUNT(*) FROM registrations r JOIN events e ON r.event_id = e.id WHERE e.scope = 'parish' AND e.scope_id = parishes.id)`,
      })
      .from(parishes)
      .limit(50)

    const scored = parishStats.map((p) => ({
      id: p.id,
      name: p.name,
      programmeCount: p.programmeCount,
      eventCount: p.eventCount,
      registrationCount: p.registrationCount,
      score:
        p.programmeCount * 40 +
        p.eventCount * 10 +
        Math.floor(p.registrationCount / 10) * 5,
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, limit)
  })
