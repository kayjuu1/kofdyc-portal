import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user, events, documents, news } from "@/db/schema"
import { sql, eq, gt, and } from "drizzle-orm"

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const now = new Date().toISOString()
    const [members, upcoming, docs, published] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user),
      db.select({ count: sql<number>`count(*)` }).from(events)
        .where(and(eq(events.status, "published"), gt(events.startAt, now))),
      db.select({ count: sql<number>`count(*)` }).from(documents),
      db.select({ count: sql<number>`count(*)` }).from(news)
        .where(eq(news.status, "published")),
    ])
    return {
      members: members[0]?.count ?? 0,
      upcomingEvents: upcoming[0]?.count ?? 0,
      documents: docs[0]?.count ?? 0,
      publishedNews: published[0]?.count ?? 0,
    }
  })
