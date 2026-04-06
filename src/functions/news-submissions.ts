import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { newsSubmissions, news, user } from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"
import { generateSlug } from "@/lib/slug"
import { sendEmail } from "@/lib/resend"

export const submitPublicNews = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      submitterName: string
      submitterEmail?: string
      submitterPhone?: string
      title: string
      body: string
      imageUrl?: string
      images?: string[]
    }) => {
      if (!input.submitterName || input.submitterName.length < 2) {
        throw new Error("Name is required (min 2 characters)")
      }
      if (!input.submitterEmail && !input.submitterPhone) {
        throw new Error("At least one contact method (email or phone) is required")
      }
      if (!input.title || input.title.length < 5) {
        throw new Error("Title is required (min 5 characters)")
      }
      if (!input.body || input.body.length < 20) {
        throw new Error("Body is required (min 20 characters)")
      }
      if (input.images && input.images.length > 10) {
        throw new Error("Maximum 10 images allowed")
      }
      return input
    }
  )
  .handler(async ({ data }) => {
    const imagesJson = data.images && data.images.length > 0 
      ? JSON.stringify(data.images) 
      : null

    const result = await db.insert(newsSubmissions).values({
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail ?? null,
      submitterPhone: data.submitterPhone ?? null,
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl ?? null,
      images: imagesJson,
      status: "pending",
      createdAt: new Date().toISOString(),
    }).returning()

    if (data.submitterEmail) {
      await sendEmail({
        to: data.submitterEmail,
        subject: "News Submission Received — DYC Koforidua",
        html: `
          <h2>Thank you for your submission!</h2>
          <p>Dear ${data.submitterName},</p>
          <p>We have received your news story: <strong>${data.title}</strong></p>
          <p>Our editorial team will review your submission and get back to you soon.</p>
          <p>God bless,<br/>DYC Koforidua Communications</p>
        `,
      })
    }

    return result[0]
  })

export const getNewsSubmissions = createServerFn({ method: "GET" })
  .middleware([requireRole("diocesan_executive", "system_admin")])
  .inputValidator(
    (input: {
      status?: "pending" | "approved" | "rejected"
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
      conditions.push(eq(newsSubmissions.status, data.status))
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [submissions, countResult] = await Promise.all([
      db
        .select({
          id: newsSubmissions.id,
          submitterName: newsSubmissions.submitterName,
          submitterEmail: newsSubmissions.submitterEmail,
          submitterPhone: newsSubmissions.submitterPhone,
          title: newsSubmissions.title,
          body: newsSubmissions.body,
          imageUrl: newsSubmissions.imageUrl,
          images: newsSubmissions.images,
          status: newsSubmissions.status,
          reviewedAt: newsSubmissions.reviewedAt,
          reviewComment: newsSubmissions.reviewComment,
          createdAt: newsSubmissions.createdAt,
          reviewerName: user.name,
        })
        .from(newsSubmissions)
        .leftJoin(user, eq(newsSubmissions.reviewedBy, user.id))
        .where(where)
        .orderBy(desc(newsSubmissions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(newsSubmissions)
        .where(where),
    ])

    return {
      submissions,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const reviewNewsSubmission = createServerFn({ method: "POST" })
  .middleware([requireRole("diocesan_executive", "system_admin")])
  .inputValidator(
    (input: {
      id: number
      decision: "approved" | "rejected"
      reviewComment?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()

    const submission = await db
      .select()
      .from(newsSubmissions)
      .where(eq(newsSubmissions.id, data.id))
      .limit(1)

    if (!submission[0]) {
      throw new Error("Submission not found")
    }

    const sub = submission[0]

    await db
      .update(newsSubmissions)
      .set({
        status: data.decision,
        reviewedBy: context.session.user.id,
        reviewedAt: now,
        reviewComment: data.reviewComment ?? null,
      })
      .where(eq(newsSubmissions.id, data.id))

    if (data.decision === "approved") {
      const slug = generateSlug(sub.title) + "-" + Date.now().toString(36)
      await db.insert(news).values({
        title: sub.title,
        slug,
        body: sub.body,
        scope: "diocese",
        coverImageUrl: sub.imageUrl,
        images: sub.images,
        status: "published",
        authorId: context.session.user.id,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (sub.submitterEmail) {
      const isApproved = data.decision === "approved"
      await sendEmail({
        to: sub.submitterEmail,
        subject: isApproved
          ? "Your News Story Has Been Published — DYC Koforidua"
          : "Update on Your News Submission — DYC Koforidua",
        html: isApproved
          ? `
            <h2>Your story has been published!</h2>
            <p>Dear ${sub.submitterName},</p>
            <p>We're pleased to inform you that your news story "<strong>${sub.title}</strong>" has been approved and published on the DYC Koforidua portal.</p>
            <p>Thank you for your contribution!</p>
            <p>God bless,<br/>DYC Koforidua Communications</p>
          `
          : `
            <h2>Update on your submission</h2>
            <p>Dear ${sub.submitterName},</p>
            <p>Thank you for submitting your news story "<strong>${sub.title}</strong>".</p>
            <p>After review, our editorial team was unable to publish it at this time.</p>
            ${data.reviewComment ? `<p><strong>Feedback:</strong> ${data.reviewComment}</p>` : ""}
            <p>You are welcome to submit again in the future.</p>
            <p>God bless,<br/>DYC Koforidua Communications</p>
          `,
      })
    }

    return { success: true }
  })
