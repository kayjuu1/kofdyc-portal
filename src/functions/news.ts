import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { news, user } from "@/db/schema"
import { eq, desc, and, sql, like } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { generateSlug } from "@/lib/slug"

export const getPublishedNews = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      page?: number
      limit?: number
      scope?: "diocese" | "deanery" | "parish"
      scopeId?: number
      search?: string
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 12
    const offset = (page - 1) * limit

    const conditions = [eq(news.status, "published")]
    if (data.scope) {
      conditions.push(eq(news.scope, data.scope))
    }
    if (data.scopeId) {
      conditions.push(eq(news.scopeId, data.scopeId))
    }
    if (data.search) {
      conditions.push(like(news.title, `%${data.search}%`))
    }

    const where = and(...conditions)

    const [articles, countResult] = await Promise.all([
      db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          body: news.body,
          scope: news.scope,
          scopeId: news.scopeId,
          coverImageUrl: news.coverImageUrl,
          isPinned: news.isPinned,
          publishedAt: news.publishedAt,
          createdAt: news.createdAt,
          authorName: user.name,
          authorId: news.authorId,
        })
        .from(news)
        .leftJoin(user, eq(news.authorId, user.id))
        .where(where)
        .orderBy(desc(news.isPinned), desc(news.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(where),
    ])

    return {
      articles,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const result = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        body: news.body,
        scope: news.scope,
        scopeId: news.scopeId,
        coverImageUrl: news.coverImageUrl,
        isPinned: news.isPinned,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        authorName: user.name,
        authorId: news.authorId,
      })
      .from(news)
      .leftJoin(user, eq(news.authorId, user.id))
      .where(and(eq(news.slug, data.slug), eq(news.status, "published")))
      .limit(1)

    return result[0] ?? null
  })

export const getNewsArticleById = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageNews")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const result = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        body: news.body,
        scope: news.scope,
        scopeId: news.scopeId,
        coverImageUrl: news.coverImageUrl,
        isPinned: news.isPinned,
        status: news.status,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        authorName: user.name,
        authorId: news.authorId,
      })
      .from(news)
      .leftJoin(user, eq(news.authorId, user.id))
      .where(eq(news.id, data.id))
      .limit(1)

    if (!result[0]) throw new Error("Article not found")
    return result[0]
  })

export const getNewsForAdmin = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageNews")])
  .inputValidator(
    (input: {
      status?: "draft" | "published" | "archived"
      page?: number
      limit?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = []
    if (data.status) {
      conditions.push(eq(news.status, data.status))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [articles, countResult] = await Promise.all([
      db
        .select({
          id: news.id,
          title: news.title,
          slug: news.slug,
          scope: news.scope,
          status: news.status,
          isPinned: news.isPinned,
          publishedAt: news.publishedAt,
          createdAt: news.createdAt,
          authorName: user.name,
          authorId: news.authorId,
        })
        .from(news)
        .leftJoin(user, eq(news.authorId, user.id))
        .where(where)
        .orderBy(desc(news.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(where),
    ])

    return {
      articles,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const createNewsArticle = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageNews")])
  .inputValidator(
    (input: {
      title: string
      body: string
      scope: "diocese" | "deanery" | "parish"
      scopeId?: number
      coverImageUrl?: string
      status: "draft" | "published"
      isPinned?: boolean
    }) => input
  )
  .handler(async ({ data, context }) => {
    const slug = generateSlug(data.title) + "-" + Date.now().toString(36)
    const now = new Date().toISOString()

    const result = await db.insert(news).values({
      title: data.title,
      slug,
      body: data.body,
      scope: data.scope,
      scopeId: data.scopeId,
      coverImageUrl: data.coverImageUrl,
      status: data.status,
      isPinned: data.isPinned ?? false,
      authorId: context.session.user.id,
      publishedAt: data.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return result[0]
  })

export const updateNewsArticle = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageNews")])
  .inputValidator(
    (input: {
      id: number
      title?: string
      body?: string
      scope?: "diocese" | "deanery" | "parish"
      scopeId?: number
      coverImageUrl?: string
      status?: "draft" | "published" | "archived"
      isPinned?: boolean
    }) => input
  )
  .handler(async ({ data }) => {
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = { updatedAt: now }

    if (data.title !== undefined) {
      updates.title = data.title
      updates.slug = generateSlug(data.title) + "-" + Date.now().toString(36)
    }
    if (data.body !== undefined) updates.body = data.body
    if (data.scope !== undefined) updates.scope = data.scope
    if (data.scopeId !== undefined) updates.scopeId = data.scopeId
    if (data.coverImageUrl !== undefined) updates.coverImageUrl = data.coverImageUrl
    if (data.isPinned !== undefined) updates.isPinned = data.isPinned
    if (data.status !== undefined) {
      updates.status = data.status
      if (data.status === "published") {
        updates.publishedAt = now
      }
    }

    await db.update(news).set(updates).where(eq(news.id, data.id))
    return { success: true }
  })

export const archiveNewsArticle = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageNews")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db
      .update(news)
      .set({ status: "archived", updatedAt: new Date().toISOString() })
      .where(eq(news.id, data.id))
    return { success: true }
  })
