import { Resend } from "resend"
import { env } from "cloudflare:workers"

function getResendClient(): Resend {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not set")
  return new Resend(apiKey)
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = env.RESEND_FROM_EMAIL ?? "noreply@dyckoforidua.org"
    const resend = getResendClient()
    await resend.emails.send({
      from: `KOFDYC <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error: String(error) }
  }
}
