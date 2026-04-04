import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { events, registrations } from "@/db/schema"
import { eq, and, gt, asc, desc, sql } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"
import { sendEmail } from "@/lib/resend"
import { env } from "cloudflare:workers"

export const getUpcomingEvents = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      limit?: number
      scope?: "diocese" | "deanery" | "parish"
      scopeId?: number
    }) => input
  )
  .handler(async ({ data }) => {
    const limit = data.limit ?? 4
    const now = new Date().toISOString()

    const conditions = [
      eq(events.status, "published"),
      gt(events.startAt, now),
    ]
    if (data.scope) {
      conditions.push(eq(events.scope, data.scope))
    }
    if (data.scopeId) {
      conditions.push(eq(events.scopeId, data.scopeId))
    }

    const results = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        scope: events.scope,
        startAt: events.startAt,
        endAt: events.endAt,
        venue: events.venue,
        coverImageUrl: events.coverImageUrl,
        registrationType: events.registrationType,
        feeAmount: events.feeAmount,
        feeCurrency: events.feeCurrency,
      })
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.startAt))
      .limit(limit)

    return results
  })

export const getEvents = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      status?: "draft" | "published" | "cancelled" | "completed"
      scope?: "diocese" | "deanery" | "parish"
      scopeId?: number
      eventType?: string
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
      conditions.push(eq(events.status, data.status))
    }
    if (data.scope) {
      conditions.push(eq(events.scope, data.scope))
    }
    if (data.scopeId) {
      conditions.push(eq(events.scopeId, data.scopeId))
    }
    if (data.eventType) {
      conditions.push(eq(events.eventType, data.eventType as "mass" | "rally" | "retreat" | "congress" | "meeting" | "other"))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [eventList, countResult] = await Promise.all([
      db
        .select()
        .from(events)
        .where(where)
        .orderBy(desc(events.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(where),
    ])

    return {
      events: eventList,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    }
  })

export const getEvent = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.id, data.id))
      .limit(1)

    return result[0] ?? null
  })

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      title: string
      description?: string
      eventType: "mass" | "rally" | "retreat" | "congress" | "meeting" | "other"
      scope: "diocese" | "deanery" | "parish"
      scopeId?: number
      startAt: string
      endAt?: string
      venue?: string
      googleMapsLink?: string
      coverImageUrl?: string
      registrationDeadline?: string
      capacity?: number
      registrationType: "free" | "paid"
      feeAmount?: number
      feeCurrency?: string
      contactName?: string
      contactPhone?: string
      status: "draft" | "published"
    }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()

    const result = await db.insert(events).values({
      title: data.title,
      description: data.description,
      eventType: data.eventType,
      scope: data.scope,
      scopeId: data.scopeId,
      startAt: data.startAt,
      endAt: data.endAt,
      venue: data.venue,
      googleMapsLink: data.googleMapsLink,
      coverImageUrl: data.coverImageUrl,
      registrationDeadline: data.registrationDeadline,
      capacity: data.capacity,
      registrationType: data.registrationType,
      feeAmount: data.feeAmount,
      feeCurrency: data.feeCurrency ?? "GHS",
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      status: data.status,
      authorId: context.session.user.id,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return result[0]
  })

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      id: number
      title?: string
      description?: string
      eventType?: string
      scope?: string
      scopeId?: number
      startAt?: string
      endAt?: string
      venue?: string
      googleMapsLink?: string
      coverImageUrl?: string
      registrationDeadline?: string
      capacity?: number
      contactName?: string
      contactPhone?: string
      status?: "draft" | "published" | "cancelled" | "completed"
    }) => input
  )
  .handler(async ({ data }) => {
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = { updatedAt: now }

    const fields: (keyof typeof data)[] = [
      "title", "description", "eventType", "scope", "scopeId",
      "startAt", "endAt", "venue", "googleMapsLink", "coverImageUrl",
      "registrationDeadline", "capacity", "contactName", "contactPhone", "status"
    ]

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates[field] = data[field]
      }
    }

    await db.update(events).set(updates).where(eq(events.id, data.id))
    return { success: true }
  })

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(events).where(eq(events.id, data.id))
    return { success: true }
  })

export const registerGuest = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      eventId: number
      guestName: string
      guestEmail?: string
      guestPhone: string
      parish?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      dietaryRequirements?: string
      medicalConditions?: string
      tshirtSize?: string
    }) => input
  )
  .handler(async ({ data }) => {
    const event = await db.select().from(events).where(eq(events.id, data.eventId)).limit(1)
    if (!event[0]) {
      throw new Error("Event not found")
    }

    if (event[0].registrationType === "paid") {
      throw new Error("This event requires payment. Please log in to register.")
    }

    if (event[0].registrationDeadline) {
      const deadline = new Date(event[0].registrationDeadline)
      if (new Date() > deadline) {
        throw new Error("Registration deadline has passed")
      }
    }

    if (event[0].capacity && event[0].capacity > 0) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(registrations)
        .where(and(
          eq(registrations.eventId, data.eventId),
          eq(registrations.registrationStatus, "confirmed")
        ))
      if (countResult[0]?.count >= event[0].capacity) {
        throw new Error("Event is full. You have been added to the waitlist.")
      }
    }

    const cancellationToken = crypto.randomUUID()
    const now = new Date().toISOString()

    const result = await db.insert(registrations).values({
      eventId: data.eventId,
      guestName: data.guestName,
      guestEmail: data.guestEmail ?? null,
      guestPhone: data.guestPhone,
      parish: data.parish ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      dietaryRequirements: data.dietaryRequirements ?? null,
      medicalConditions: data.medicalConditions ?? null,
      tshirtSize: data.tshirtSize ?? null,
      paymentStatus: "not_required",
      registrationStatus: "confirmed",
      cancellationToken,
      createdAt: now,
    }).returning()

    const registration = result[0]

    if (data.guestEmail) {
      await sendEmail({
        to: data.guestEmail,
        subject: `Registration Confirmed — ${event[0].title}`,
        html: `
          <h2>Registration Confirmed!</h2>
          <p>Dear ${data.guestName},</p>
          <p>You have successfully registered for <strong>${event[0].title}</strong>.</p>
          <p><strong>Date:</strong> ${new Date(event[0].startAt).toLocaleDateString()}</p>
          <p><strong>Venue:</strong> ${event[0].venue || "TBA"}</p>
          <p>Keep this email for your records.</p>
          <p>To cancel your registration, use this link:<br/>
          ${env.BETTER_AUTH_URL ?? "http://localhost:3000"}/events/${data.eventId}/cancel?token=${cancellationToken}</p>
          <p>God bless,<br/>DYC Koforidua</p>
        `,
      })
    }

    return { success: true, registrationId: registration.id, waitlisted: false }
  })

export const cancelRegistration = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { eventId: number; token: string }) => input
  )
  .handler(async ({ data }) => {
    const registration = await db
      .select()
      .from(registrations)
      .where(and(
        eq(registrations.eventId, data.eventId),
        eq(registrations.cancellationToken, data.token)
      ))
      .limit(1)

    if (!registration[0]) {
      throw new Error("Registration not found")
    }

    await db
      .update(registrations)
      .set({ registrationStatus: "cancelled" })
      .where(eq(registrations.id, registration[0].id))

    return { success: true }
  })

export const getRegistrants = createServerFn({ method: "GET" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: { eventId: number; status?: string }) => input
  )
  .handler(async ({ data }) => {
    const conditions = [eq(registrations.eventId, data.eventId)]
    if (data.status) {
      conditions.push(eq(registrations.registrationStatus, data.status as "confirmed" | "cancelled" | "waitlisted"))
    }

    const result = await db
      .select()
      .from(registrations)
      .where(and(...conditions))
      .orderBy(desc(registrations.createdAt))

    return result
  })

export const toggleAttendance = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: { registrationId: number; attended: boolean }) => input
  )
  .handler(async ({ data }) => {
    await db
      .update(registrations)
      .set({ attended: data.attended })
      .where(eq(registrations.id, data.registrationId))

    return { success: true }
  })
