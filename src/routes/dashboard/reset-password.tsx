import { createFileRoute, Link, redirect, useRouter, useSearch } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password | KOFDYC" }],
  }),
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: "/dashboard" })
    }
    return { session }
  },
  validateSearch: (search: Record<string, string | undefined>) => ({
    token: search.token as string | undefined,
    error: search.error as string | undefined,
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const router = useRouter()
  const { token, error: tokenError } = useSearch({ from: "/dashboard/reset-password" })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const tokenErrorMessages: Record<string, string> = {
    INVALID_TOKEN: "This password reset link is invalid. It may have already been used.",
    EXPIRED_TOKEN: "This password reset link has expired. Please request a new one.",
  }

  function validateFields(): boolean {
    const errors: { password?: string; confirm?: string } = {}
    if (!password) errors.password = "New password is required"
    else if (password.length < 8) errors.password = "Password must be at least 8 characters"
    if (!confirmPassword) errors.confirm = "Please confirm your new password"
    else if (password !== confirmPassword) errors.confirm = "Passwords do not match"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    if (!validateFields() || !token) return

    setLoading(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        const code = result.error.code ?? ""
        if (code === "INVALID_TOKEN" || code === "EXPIRED_TOKEN") {
          setError(tokenErrorMessages[code] || "This reset link is no longer valid. Please request a new one.")
        } else {
          setError(result.error.message || "Failed to reset password. Please try again.")
        }
        return
      }

      setSuccess(true)
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-0 sm:px-6 space-y-4">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Password reset successful</CardTitle>
              <CardDescription className="text-center text-base">
                Your password has been reset successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Link to="/dashboard/login">
                <Button className="w-full py-2.5 h-auto">
                  Sign in with new password
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (tokenError || (!token && !success)) {
    const displayError = tokenError
      ? (tokenErrorMessages[tokenError] || "This password reset link is not valid.")
      : "No reset token found. Please request a new password reset link."

    return (
      <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Link
            to="/dashboard/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-0 sm:px-6 space-y-4">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Invalid or expired link</CardTitle>
              <CardDescription className="text-center text-base">
                {displayError}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 space-y-3">
              <Link to="/dashboard/forgot-password">
                <Button variant="outline" className="w-full py-2.5 h-auto">
                  Request new reset link
                </Button>
              </Link>
              <div className="text-center">
                <Link
                  to="/dashboard/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
              Set a new<br />
              <span className="text-primary">password</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Choose a strong, unique password that you don't use on other sites.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border space-y-3">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Password requirements</h3>
              <ul className="text-xs text-muted-foreground mt-1.5 space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-muted-foreground shrink-0" />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-muted-foreground shrink-0" />
                  Should not match a previously used password
                </li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic font-serif">
            "I can do all things through Him who strengthens me." — Philippians 4:13
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
              <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })) }}
                      className={`w-full px-4 py-2.5 pr-11 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        fieldErrors.password ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirm) setFieldErrors(p => ({ ...p, confirm: undefined })) }}
                      className={`w-full px-4 py-2.5 pr-11 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        fieldErrors.confirm ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirm && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.confirm}</p>
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
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
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
