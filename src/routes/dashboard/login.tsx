import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/login")({
  head: () => ({
    meta: [{ title: "Admin Login | KOFDYC" }],
  }),
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: "/dashboard" })
    }
    return { session }
  },
  component: DashboardLoginPage,
})

function DashboardLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const errorMessages: Record<string, string> = {
    InvalidEmailOrPassword: "Invalid email or password",
    UserNotVerified: "Please verify your email before signing in. Check your inbox for a verification link.",
    AccountBanned: "This account has been deactivated. Contact your system administrator.",
    AccountNotLinked: "No account found with these credentials.",
    RateLimitExceeded: "Too many attempts. Please try again later.",
    NetworkError: "Unable to connect. Please check your internet connection and try again.",
  }

  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setError(""), 10000)
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [error])

  function validateFields(): boolean {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address"
    if (!password) errors.password = "Password is required"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    if (!validateFields()) return

    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (result.error) {
        const code = result.error.code ?? result.error.message ?? ""
        setError(errorMessages[code] || result.error.message || "Sign in failed. Please check your credentials and try again.")
        return
      }

      router.navigate({ to: "/dashboard" })
    } catch (err) {
      const isNetwork = err instanceof TypeError && err.message === "Failed to fetch"
      setError(isNetwork ? errorMessages.NetworkError : "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
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
              Admin access for the<br />
              <span className="text-primary">Diocesan Youth Council</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Sign in to manage diocesan news, events, documents, programmes, and internal coordination tools.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "News", desc: "Publish updates" },
              { title: "Documents", desc: "Manage archives" },
              { title: "Programmes", desc: "Review submissions" },
              { title: "Inbox", desc: "Handle contacts" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground italic font-serif">
            "Go therefore and make disciples of all nations" — Matthew 28:19
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="px-4 sm:px-6 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
              <CardDescription>Enter your admin credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className={`px-4 py-3 rounded-lg text-sm animate-fade-in ${
                    error.includes("verify")
                      ? "bg-amber-50 border border-amber-200 text-amber-800"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}>
                    <p>{error}</p>
                    {error.includes("verify") && (
                      <p className="mt-1 text-xs opacity-80">
                        Didn't receive the email? Check your spam folder or contact your administrator.
                      </p>
                    )}
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
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })) }}
                      className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        fieldErrors.email ? "border-destructive" : "border-input"
                      }`}
                      placeholder="admin@dyckoforidua.org"
                      disabled={loading}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Link
                      to="/dashboard/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })) }}
                      className={`w-full px-4 py-2.5 pr-11 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
                        fieldErrors.password ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Enter your password"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 h-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
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
