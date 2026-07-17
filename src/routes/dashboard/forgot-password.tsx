import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password | KOFDYC" }],
  }),
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: "/dashboard" })
    }
    return { session }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldError("")

    if (!email.trim()) {
      setFieldError("Email is required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Enter a valid email address")
      return
    }

    setLoading(true)

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/dashboard/reset-password`,
      })

      if (result.error) {
        setError(result.error.message || "Failed to send reset email. Please try again.")
        return
      }

      setSent(true)
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-0 sm:px-6 space-y-4">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Check your email</CardTitle>
              <CardDescription className="text-center text-base">
                If an account with that email exists, we've sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p>The link expires in 1 hour.</p>
                <p>
                  Didn't receive the email? Check your spam folder, or{" "}
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
              <div className="text-center">
                <Link
                  to="/dashboard/login"
                  className="text-sm text-primary hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh">
      <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center p-12">
        <div className="max-w-md space-y-12">
          <div className="flex items-center gap-3">
            <Logo className="size-12" />
            <span className="text-3xl font-bold text-foreground tracking-tight">DYC Portal</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground font-serif leading-tight">
              Reset your<br />
              <span className="text-primary">password</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Password reset link</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The link expires after 1 hour for security.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic font-serif">
            "Ask and it will be given to you" — Matthew 7:7
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Link
            to="/dashboard/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-0 sm:px-6 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
              <CardDescription>
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldError) setFieldError("") }}
                    className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                      fieldError ? "border-destructive" : "border-input"
                    }`}
                    placeholder="admin@dyckoforidua.org"
                    disabled={loading}
                  />
                  {fieldError && (
                    <p className="text-xs text-destructive mt-1">{fieldError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 h-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6 lg:hidden">
            Catholic Diocese of Koforidua &copy; 2026
          </p>
        </div>
      </div>
    </div>
  )
}
