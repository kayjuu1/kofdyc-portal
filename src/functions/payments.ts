import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { payments } from "@/db/schema"
import { eq } from "drizzle-orm"

export const initiatePayment = createServerFn({ method: "POST" })
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
    }) => input,
  )
  .handler(async () => {
    throw new Error("Paid event registration is currently unavailable.")
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
