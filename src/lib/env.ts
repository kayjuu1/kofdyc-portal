const REQUIRED_VARS = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] as const
const OPTIONAL_VARS = ["RESEND_API_KEY", "RESEND_FROM_EMAIL"] as const

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
  for (const v of OPTIONAL_VARS) {
    if (!process.env[v]) {
      console.warn(`Optional env var ${v} is not set`)
    }
  }
}
