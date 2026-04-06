import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { programmes, programmeActivities, programmeReviews, parishes, user } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"
import { requirePermission } from "@/middleware/role.middleware"
import { sendEmail } from "@/lib/resend"

export const createProgramme = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      parishId: number
      year: number
      activities: Array<{
        title: string
        description?: string
        date: string
        responsiblePerson?: string
      }>
      pdfUrl?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    // Check one-per-parish-per-year
    const existing = await db
      .select({ id: programmes.id })
      .from(programmes)
      .where(and(eq(programmes.parishId, data.parishId), eq(programmes.year, data.year)))
      .limit(1)

    if (existing[0]) {
      throw new Error("A programme already exists for this parish and year. Please edit the existing one.")
    }

    const now = new Date().toISOString()

    const [programme] = await db.insert(programmes).values({
      parishId: data.parishId,
      year: data.year,
      status: "draft",
      submittingOfficer: context.session.user.id,
      pdfUrl: data.pdfUrl ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    if (data.activities.length > 0) {
      await db.insert(programmeActivities).values(
        data.activities.map((a) => ({
          programmeId: programme.id,
          title: a.title,
          description: a.description ?? null,
          date: a.date,
          responsiblePerson: a.responsiblePerson ?? null,
          createdAt: now,
        }))
      )
    }

    return programme
  })

export const updateProgramme = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      id: number
      activities: Array<{
        title: string
        description?: string
        date: string
        responsiblePerson?: string
      }>
      pdfUrl?: string
    }) => input
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, data.id))
      .limit(1)

    if (!existing[0]) throw new Error("Programme not found")
    if (!["draft", "returned"].includes(existing[0].status)) {
      throw new Error("Can only edit draft or returned programmes")
    }

    const now = new Date().toISOString()

    await db.update(programmes).set({
      pdfUrl: data.pdfUrl ?? existing[0].pdfUrl,
      updatedAt: now,
    }).where(eq(programmes.id, data.id))

    // Replace activities
    await db.delete(programmeActivities).where(eq(programmeActivities.programmeId, data.id))

    if (data.activities.length > 0) {
      await db.insert(programmeActivities).values(
        data.activities.map((a) => ({
          programmeId: data.id,
          title: a.title,
          description: a.description ?? null,
          date: a.date,
          responsiblePerson: a.responsiblePerson ?? null,
          createdAt: now,
        }))
      )
    }

    return { success: true }
  })

export const submitProgramme = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, data.id))
      .limit(1)

    if (!existing[0]) throw new Error("Programme not found")
    if (!["draft", "returned"].includes(existing[0].status)) {
      throw new Error("Can only submit draft or returned programmes")
    }

    const now = new Date().toISOString()

    await db.update(programmes).set({
      status: "submitted",
      submissionDate: now,
      updatedAt: now,
    }).where(eq(programmes.id, data.id))

    return { success: true }
  })

export const getProgrammes = createServerFn({ method: "GET" })
  .middleware([requirePermission("viewDashboard")])
  .inputValidator(
    (input: {
      year?: number
      status?: string
      parishId?: number
      page?: number
      limit?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = []
    if (data.year) conditions.push(eq(programmes.year, data.year))
    if (data.status) {
      conditions.push(eq(programmes.status, data.status as typeof programmes.status.enumValues[number]))
    }
    if (data.parishId) conditions.push(eq(programmes.parishId, data.parishId))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [list, countResult] = await Promise.all([
      db
        .select({
          id: programmes.id,
          parishId: programmes.parishId,
          parishName: parishes.name,
          year: programmes.year,
          status: programmes.status,
          submissionDate: programmes.submissionDate,
          finalApprovalDate: programmes.finalApprovalDate,
          submitterName: user.name,
          createdAt: programmes.createdAt,
        })
        .from(programmes)
        .leftJoin(parishes, eq(programmes.parishId, parishes.id))
        .leftJoin(user, eq(programmes.submittingOfficer, user.id))
        .where(where)
        .orderBy(desc(programmes.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(programmes)
        .where(where),
    ])

    return {
      programmes: list,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const getProgramme = createServerFn({ method: "GET" })
  .middleware([requirePermission("viewDashboard")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const [programme] = await db
      .select({
        id: programmes.id,
        parishId: programmes.parishId,
        parishName: parishes.name,
        year: programmes.year,
        status: programmes.status,
        submissionDate: programmes.submissionDate,
        finalApprovalDate: programmes.finalApprovalDate,
        pdfUrl: programmes.pdfUrl,
        submitterName: user.name,
        createdAt: programmes.createdAt,
        updatedAt: programmes.updatedAt,
      })
      .from(programmes)
      .leftJoin(parishes, eq(programmes.parishId, parishes.id))
      .leftJoin(user, eq(programmes.submittingOfficer, user.id))
      .where(eq(programmes.id, data.id))
      .limit(1)

    if (!programme) throw new Error("Programme not found")

    const activities = await db
      .select()
      .from(programmeActivities)
      .where(eq(programmeActivities.programmeId, data.id))
      .orderBy(programmeActivities.date)

    const reviews = await db
      .select({
        id: programmeReviews.id,
        stage: programmeReviews.stage,
        decision: programmeReviews.decision,
        comment: programmeReviews.comment,
        reviewedAt: programmeReviews.reviewedAt,
        reviewerName: user.name,
      })
      .from(programmeReviews)
      .leftJoin(user, eq(programmeReviews.reviewerId, user.id))
      .where(eq(programmeReviews.programmeId, data.id))
      .orderBy(desc(programmeReviews.reviewedAt))

    return { ...programme, activities, reviews }
  })

export const reviewProgramme = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      programmeId: number
      stage: number // 1 = deanery, 2 = executive
      decision: "approved" | "returned"
      comment?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()

    await db.insert(programmeReviews).values({
      programmeId: data.programmeId,
      reviewerId: context.session.user.id,
      stage: data.stage,
      decision: data.decision,
      comment: data.comment ?? null,
      reviewedAt: now,
    })

    let newStatus: string
    if (data.decision === "returned") {
      newStatus = "returned"
    } else if (data.stage === 1) {
      newStatus = "under_review" // Deanery approved, now awaiting executive
    } else {
      newStatus = "approved"
    }

    const updates: Record<string, unknown> = { status: newStatus, updatedAt: now }
    if (newStatus === "approved") {
      updates.finalApprovalDate = now
    }

    await db.update(programmes).set(updates).where(eq(programmes.id, data.programmeId))

    // Notify submitting officer
    const prog = await db
      .select({
        submittingOfficer: programmes.submittingOfficer,
        year: programmes.year,
        parishName: parishes.name,
      })
      .from(programmes)
      .leftJoin(parishes, eq(programmes.parishId, parishes.id))
      .where(eq(programmes.id, data.programmeId))
      .limit(1)

    if (prog[0]?.submittingOfficer) {
      const submitter = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, prog[0].submittingOfficer))
        .limit(1)

      if (submitter[0]?.email) {
        const stageLabel = data.stage === 1 ? "Deanery Coordinator" : "DYC Executive"
        await sendEmail({
          to: submitter[0].email,
          subject: `Programme ${data.decision === "approved" ? "Approved" : "Returned"} — ${prog[0].parishName} ${prog[0].year}`,
          html: `
            <h2>Programme Review Update</h2>
            <p>Dear ${submitter[0].name},</p>
            <p>Your pastoral programme for <strong>${prog[0].parishName} (${prog[0].year})</strong> has been <strong>${data.decision}</strong> by the ${stageLabel}.</p>
            ${data.comment ? `<p><strong>Comment:</strong> ${data.comment}</p>` : ""}
            ${data.decision === "returned" ? "<p>Please review the feedback and resubmit.</p>" : "<p>Congratulations!</p>"}
            <p>God bless,<br/>DYC Koforidua</p>
          `,
        })
      }
    }

    return { success: true }
  })
