import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { startAnonymousConversation } from "@/functions/chaplain"

export const Route = createFileRoute("/chaplain-contact")({
  component: ChaplainContactPage,
})

function ChaplainContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      await startAnonymousConversation({
        data: {
          email: form.get("email") as string,
          message: form.get("message") as string,
        },
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {submitted ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Private Chat Started</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a private magic link to your email so you can continue the conversation anonymously.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Anonymous Chat with the Chaplain</CardTitle>
              <p className="text-sm text-muted-foreground">
                Start a private 2-way conversation. We&apos;ll email you a secure link so you can return and read replies.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required placeholder="your@email.com" />
                  <p className="text-xs text-muted-foreground">
                    This is only used to deliver your private chat link. The chaplain sees only your anonymous alias.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    rows={8}
                    placeholder="Share your message here..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Starting chat..." : "Start Private Chat"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
