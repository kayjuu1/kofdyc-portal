import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { payments, registrations, events } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"
import { env } from "cloudflare:workers"

export const initiatePayment = createServerFn({ method: "POST" })
  .middleware([requireRole("member")])
  .inputValidator(
    (input: {
      eventId: number
      guestName: string
      guestEmail: string
      guestPhone: string
      parish?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      dietaryRequirements?: string
      medicalConditions?: string
      tshirtSize?: string
    }) => input
  )
  .handler(async ({ data, context }) => {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1)

    if (!event[0]) throw new Error("Event not found")
    if (event[0].registrationType !== "paid") throw new Error("This event is free — use direct registration")
    if (!event[0].feeAmount) throw new Error("Event fee not configured")

    if (event[0].registrationDeadline) {
      if (new Date() > new Date(event[0].registrationDeadline)) {
        throw new Error("Registration deadline has passed")
      }
    }

    const now = new Date().toISOString()
    const reference = `dyc-${data.eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const [registration] = await db.insert(registrations).values({
      eventId: data.eventId,
      userId: context.session.user.id,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      parish: data.parish ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      dietaryRequirements: data.dietaryRequirements ?? null,
      medicalConditions: data.medicalConditions ?? null,
      tshirtSize: data.tshirtSize ?? null,
      paymentStatus: "pending",
      registrationStatus: "pending",
      paystackReference: reference,
      createdAt: now,
    }).returning()

    await db.insert(payments).values({
      registrationId: registration.id,
      paystackReference: reference,
      amountGhs: event[0].feeAmount,
      status: "initiated",
      createdAt: now,
    })

    const paystackSecretKey = env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) throw new Error("Payment system not configured")

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.guestEmail,
        amount: Math.round(event[0].feeAmount * 100), // Paystack expects pesewas
        reference,
        currency: event[0].feeCurrency || "GHS",
        callback_url: `${env.BETTER_AUTH_URL ?? "http://localhost:3000"}/payment-callback?reference=${reference}`,
        metadata: {
          eventId: data.eventId,
          eventTitle: event[0].title,
          registrationId: registration.id,
          userName: data.guestName,
        },
      }),
    })

    const result = (await response.json()) as {
      status: boolean
      data?: { authorization_url: string; reference: string }
      message?: string
    }

    if (!result.status || !result.data) {
      throw new Error(result.message ?? "Failed to initialize payment")
    }

    return {
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      registrationId: registration.id,
    }
  })

export const verifyPayment = createServerFn({ method: "GET" })
  .inputValidator((input: { reference: string }) => input)
  .handler(async ({ data }) => {
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, data.reference))
      .limit(1)

    if (!payment[0]) return { status: "not_found" as const }

    return {
      status: payment[0].status,
      registrationId: payment[0].registrationId,
    }
  })
