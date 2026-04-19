// import { createFileRoute } from "@tanstack/react-router"
// import { env } from "cloudflare:workers"
// import { db } from "@/db"
// import { payments, registrations, events } from "@/db/schema"
// import { eq } from "drizzle-orm"
// import { sendEmail } from "@/lib/resend"
//
// async function verifySignature(body: string, signature: string): Promise<boolean> {
//   const secret = env.PAYSTACK_SECRET_KEY
//   if (!secret) return false
//
//   const encoder = new TextEncoder()
//   const key = await crypto.subtle.importKey(
//     "raw",
//     encoder.encode(secret),
//     { name: "HMAC", hash: "SHA-512" },
//     false,
//     ["sign"],
//   )
//   const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
//   const expected = Array.from(new Uint8Array(sig))
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("")
//
//   return expected === signature
// }
//
// export const Route = createFileRoute("/api/paystack-webhook")({
//   server: {
//     handlers: {
//       POST: async ({ request }) => {
//         try {
//           const body = await request.text()
//           const signature = request.headers.get("x-paystack-signature") ?? ""
//
//           if (!await verifySignature(body, signature)) {
//             return new Response("Invalid signature", { status: 401 })
//           }
//
//           const payload = JSON.parse(body) as {
//             event: string
//             data: {
//               reference: string
//               status: string
//               amount: number
//               metadata?: { eventId?: number; registrationId?: number; userName?: string }
//             }
//           }
//
//           if (payload.event === "charge.success") {
//             const ref = payload.data.reference
//
//             await db
//               .update(payments)
//               .set({
//                 status: "successful",
//                 webhookPayload: body,
//               })
//               .where(eq(payments.paystackReference, ref))
//
//             const payment = await db
//               .select()
//               .from(payments)
//               .where(eq(payments.paystackReference, ref))
//               .limit(1)
//
//             if (payment[0]) {
//               await db
//                 .update(registrations)
//                 .set({
//                   paymentStatus: "paid",
//                   registrationStatus: "confirmed",
//                   paidAt: new Date().toISOString(),
//                 })
//                 .where(eq(registrations.id, payment[0].registrationId))
//
//               // Send receipt email
//               const reg = await db
//                 .select()
//                 .from(registrations)
//                 .where(eq(registrations.id, payment[0].registrationId))
//                 .limit(1)
//
//               if (reg[0]?.guestEmail) {
//                 const event = await db
//                   .select({ title: events.title, startAt: events.startAt, venue: events.venue })
//                   .from(events)
//                   .where(eq(events.id, reg[0].eventId))
//                   .limit(1)
//
//                 const eventInfo = event[0]
//                 await sendEmail({
//                   to: reg[0].guestEmail,
//                   subject: `Payment Confirmed — ${eventInfo?.title ?? "Event"}`,
//                   html: `
//                     <h2>Payment Successful!</h2>
//                     <p>Dear ${reg[0].guestName},</p>
//                     <p>Your payment of GHS ${(payment[0].amountGhs).toFixed(2)} for <strong>${eventInfo?.title}</strong> has been confirmed.</p>
//                     <p><strong>Reference:</strong> ${ref}</p>
//                     ${eventInfo ? `<p><strong>Date:</strong> ${new Date(eventInfo.startAt).toLocaleDateString()}</p>` : ""}
//                     ${eventInfo?.venue ? `<p><strong>Venue:</strong> ${eventInfo.venue}</p>` : ""}
//                     <p>Your registration is now confirmed. See you there!</p>
//                     <p>God bless,<br/>KOFDYC</p>
//                   `,
//                 })
//               }
//             }
//           }
//
//           return new Response(JSON.stringify({ received: true }), {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//           })
//         } catch (err) {
//           console.error("Webhook error:", err)
//           return new Response("Server error", { status: 500 })
//         }
//       },
//     },
//   },
// })
