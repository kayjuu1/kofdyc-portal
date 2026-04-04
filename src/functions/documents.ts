import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { documents, user } from "@/db/schema"
import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm"

export const getPastoralLetters = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      search?: string
      dateFrom?: string
      dateTo?: string
      page?: number
      limit?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = [eq(documents.category, "pastoral_letters")]
    if (data.search) {
      conditions.push(like(documents.title, `%${data.search}%`))
    }
    if (data.dateFrom) {
      conditions.push(gte(documents.dateIssued, data.dateFrom))
    }
    if (data.dateTo) {
      conditions.push(lte(documents.dateIssued, data.dateTo))
    }

    const where = and(...conditions)

    const [letters, countResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          title: documents.title,
          fileUrl: documents.fileUrl,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          issuingAuthority: documents.issuingAuthority,
          dateIssued: documents.dateIssued,
          uploaderName: user.name,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .leftJoin(user, eq(documents.uploadedBy, user.id))
        .where(where)
        .orderBy(desc(documents.dateIssued))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(where),
    ])

    return {
      letters,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })
