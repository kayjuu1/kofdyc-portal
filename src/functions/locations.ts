import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { deaneries, parishes } from "@/db/schema"
import { eq, asc, and } from "drizzle-orm"

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
