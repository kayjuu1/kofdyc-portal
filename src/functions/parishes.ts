import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { parishes, user, events, news, programmes, deaneries } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export const getParishProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const [parish] = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        deaneryId: parishes.deaneryId,
        priestName: parishes.priestName,
        deaneryName: deaneries.name,
      })
      .from(parishes)
      .leftJoin(deaneries, eq(parishes.deaneryId, deaneries.id))
      .where(eq(parishes.id, data.id))
      .limit(1)

    if (!parish) throw new Error("Parish not found")

    const [adminCount, eventCount, newsCount, programmeStatus] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.parishId, data.id)),
      db.select({ count: sql<number>`count(*)` }).from(events)
        .where(sql`${events.scope} = 'parish' AND ${events.scopeId} = ${data.id}`),
      db.select({ count: sql<number>`count(*)` }).from(news)
        .where(sql`${news.scope} = 'parish' AND ${news.scopeId} = ${data.id}`),
      db.select({ status: programmes.status, year: programmes.year })
        .from(programmes)
        .where(eq(programmes.parishId, data.id))
        .orderBy(sql`${programmes.year} DESC`)
        .limit(3),
    ])

    return {
      ...parish,
      adminCount: adminCount[0]?.count ?? 0,
      eventCount: eventCount[0]?.count ?? 0,
      newsCount: newsCount[0]?.count ?? 0,
      recentProgrammes: programmeStatus,
    }
  })
