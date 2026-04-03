import { Resend } from "resend"

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not set")
  return new Resend(apiKey)
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@dyckoforidua.org"

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient()
    await resend.emails.send({
      from: `DYC Koforidua <${FROM_EMAIL}>`,
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
