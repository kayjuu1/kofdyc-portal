import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { Church, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/_auth/sign-in")({
  head: () => ({
    meta: [{ title: "Sign In | DYC Koforidua" }],
  }),
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: "/dashboard" })
    }
    return { session }
  },
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message ?? "Sign in failed")
        return
      }

      router.navigate({ to: "/dashboard" })
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh">
      <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center p-12">
        <div className="max-w-md space-y-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Church className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-foreground tracking-tight">DYC Portal</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground font-serif leading-tight">
              Welcome to the<br />
              <span className="text-primary">Diocesan Youth Council</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Access your dashboard, manage events, and stay connected with the Catholic youth community in Koforidua.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Events", desc: "Register for activities" },
              { title: "News", desc: "Stay informed" },
              { title: "Documents", desc: "Access resources" },
              { title: "Community", desc: "Connect with youth" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-card border border-border"
              >
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
            <CardHeader className="px-0 sm:px-6 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-11 bg-muted/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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

              <p className="text-sm text-muted-foreground text-center mt-6">
                Need help? Contact your{" "}
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  system administrator
                </a>
              </p>
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
