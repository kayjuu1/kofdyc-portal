import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { newsLikes, newsComments } from "@/db/schema"
import { eq, and, asc, sql } from "drizzle-orm"
import crypto from "crypto"

function getVisitorId(): string {
  return crypto.createHash("sha256").update(
    `${typeof window !== "undefined" ? navigator.userAgent : "server"}-unknown`
  ).digest("hex").slice(0, 16)
}

export const likeNews = createServerFn({ method: "POST" })
  .inputValidator((input: { newsId: number; identifier?: string }) => input)
  .handler(async ({ data }) => {
    const identifier = data.identifier || getVisitorId()

    // Check if already liked
    const existing = await db
      .select({ id: newsLikes.id })
      .from(newsLikes)
      .where(and(eq(newsLikes.newsId, data.newsId), eq(newsLikes.identifier, identifier)))
      .limit(1)

    if (existing[0]) {
      // Unlike
      await db.delete(newsLikes).where(eq(newsLikes.id, existing[0].id))
    } else {
      // Like
      await db.insert(newsLikes).values({
        newsId: data.newsId,
        identifier,
        createdAt: new Date().toISOString(),
      })
    }

    // Get updated count
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsLikes)
      .where(eq(newsLikes.newsId, data.newsId))

    return { liked: !existing[0], likeCount: result?.count ?? 0 }
  })

export const getNewsLikes = createServerFn({ method: "GET" })
  .inputValidator((input: { newsId: number; identifier?: string }) => input)
  .handler(async ({ data }) => {
    const identifier = data.identifier || getVisitorId()

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsLikes)
      .where(eq(newsLikes.newsId, data.newsId))

    const [existing] = await db
      .select({ id: newsLikes.id })
      .from(newsLikes)
      .where(and(eq(newsLikes.newsId, data.newsId), eq(newsLikes.identifier, identifier)))
      .limit(1)

    return { likeCount: result?.count ?? 0, liked: !!existing }
  })

export const addNewsComment = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      newsId: number
      commenterName: string
      body: string
    }) => {
      if (!input.commenterName || input.commenterName.trim().length < 1) {
        throw new Error("Name is required")
      }
      if (!input.body || input.body.trim().length < 1) {
        throw new Error("Comment is required")
      }
      if (input.commenterName.length > 80) {
        throw new Error("Name must be 80 characters or less")
      }
      if (input.body.length > 1000) {
        throw new Error("Comment must be 1000 characters or less")
      }
      return input
    }
  )
  .handler(async ({ data }) => {
    const [comment] = await db.insert(newsComments).values({
      newsId: data.newsId,
      commenterName: data.commenterName.trim(),
      body: data.body.trim(),
      createdAt: new Date().toISOString(),
    }).returning()

    return comment
  })

export const getNewsComments = createServerFn({ method: "GET" })
  .inputValidator((input: { newsId: number }) => input)
  .handler(async ({ data }) => {
    const comments = await db
      .select({
        id: newsComments.id,
        newsId: newsComments.newsId,
        commenterName: newsComments.commenterName,
        body: newsComments.body,
        deletedAt: newsComments.deletedAt,
        createdAt: newsComments.createdAt,
      })
      .from(newsComments)
      .where(eq(newsComments.newsId, data.newsId))
      .orderBy(asc(newsComments.createdAt))

    return comments.filter(c => !c.deletedAt)
  })

export const deleteNewsComment = createServerFn({ method: "POST" })
  .inputValidator((input: { commentId: number }) => input)
  .handler(async ({ data }) => {
    await db.update(newsComments).set({
      deletedAt: new Date().toISOString(),
    }).where(eq(newsComments.id, data.commentId))

    return { success: true }
  })