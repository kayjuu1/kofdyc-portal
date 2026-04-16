import { createFileRoute, Link } from "@tanstack/react-router"
import { seedAdminUser } from "@/functions/seed-admin-user"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/_auth/init-admin" as any)({
  component: InitAdminPage,
})

function InitAdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSeed = async () => {
    setStatus("loading")
    try {
      const result = await seedAdminUser()

      if (!result) {
        throw new Error("Server returned empty response")
      }

      if (result.success) {
        setStatus("success")
      } else {
        if (result.isDuplicate) {
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMsg(result.error || "Unknown error")
        }
      }
    } catch (err: unknown) {
      setStatus("error")
      const msg = err instanceof Error ? err.message : "Server unavailable. Please try again."
      setErrorMsg(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Initialize Admin User</CardTitle>
          <CardDescription>
            This will create the initial system administrator account for the KOFDYC Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Default credentials:</p>
            <p><span className="text-muted-foreground">Email:</span> admin@dyckoforidua.org</p>
            <p><span className="text-muted-foreground">Password:</span> admin123</p>
          </div>

          {status === "idle" && (
            <Button onClick={handleSeed} className="w-full">
              Create Admin User
            </Button>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Creating user...</span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
                {errorMsg.includes("already exists")
                  ? "Admin user already exists. You can sign in now."
                  : "Admin user created successfully!"}
              </div>
              <Button asChild className="w-full">
                <Link to="/dashboard/login">Go to Admin Login</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{errorMsg}</p>
              </div>
              <Button onClick={handleSeed} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
