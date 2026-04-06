import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { documents, user } from "@/db/schema"
import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { getSignedUrl } from "@/lib/r2"
import { env } from "cloudflare:workers"

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

export const getDocuments = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      category?: string
      scope?: "diocese" | "deanery" | "parish"
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

    const conditions = []
    if (data.category) {
      conditions.push(eq(documents.category, data.category as typeof documents.category.enumValues[number]))
    }
    if (data.scope) {
      conditions.push(eq(documents.scope, data.scope))
    }
    if (data.search) {
      conditions.push(like(documents.title, `%${data.search}%`))
    }
    if (data.dateFrom) {
      conditions.push(gte(documents.dateIssued, data.dateFrom))
    }
    if (data.dateTo) {
      conditions.push(lte(documents.dateIssued, data.dateTo))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [docs, countResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          title: documents.title,
          category: documents.category,
          scope: documents.scope,
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
      documents: docs,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const uploadDocument = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageDocuments")])
  .inputValidator(
    (input: {
      title: string
      category: string
      scope: "diocese" | "deanery" | "parish"
      scopeId?: number
      dateIssued?: string
      issuingAuthority?: string
      fileUrl: string
      fileName?: string
      fileSize?: number
      mimeType?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()
    const [doc] = await db.insert(documents).values({
      title: data.title,
      category: data.category as typeof documents.category.enumValues[number],
      scope: data.scope,
      scopeId: data.scopeId,
      dateIssued: data.dateIssued,
      issuingAuthority: data.issuingAuthority,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: context.session.user.id,
      createdAt: now,
    }).returning()

    return doc
  })

export const getDocumentDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const doc = await db
      .select({ fileUrl: documents.fileUrl })
      .from(documents)
      .where(eq(documents.id, data.id))
      .limit(1)

    if (!doc[0]) throw new Error("Document not found")

    // Extract R2 key from the fileUrl (e.g., /api/media/documents/xxx.pdf -> documents/xxx.pdf)
    const key = doc[0].fileUrl.replace(/^\/api\/media\//, "")
    const signedUrl = await getSignedUrl(key)
    return { url: signedUrl }
  })

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageDocuments")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const doc = await db
      .select({ fileUrl: documents.fileUrl })
      .from(documents)
      .where(eq(documents.id, data.id))
      .limit(1)

    if (!doc[0]) throw new Error("Document not found")

    // Delete from R2
    const key = doc[0].fileUrl.replace(/^\/api\/media\//, "")
    try {
      await env.R2_BUCKET.delete(key)
    } catch {
      // Ignore R2 delete errors - file may already be gone
    }

    await db.delete(documents).where(eq(documents.id, data.id))
    return { success: true }
  })
