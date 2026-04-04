import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getEvent, cancelRegistration } from "@/functions/events"
import { useMutation } from "@tanstack/react-query"

type SearchParams = {
  token: string
}

export const Route = createFileRoute("/events/$id/cancel")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    token: (search.token as string) || "",
  }),
  loader: async ({ params }) => {
    const event = await getEvent({ data: { id: parseInt(params.id) } })
    return { event }
  },
  component: CancelRegistrationPage,
})

function CancelRegistrationPage() {
  const { event } = Route.useLoaderData()
  const { token } = Route.useSearch()
  const { id } = Route.useParams()
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelRegistration({ data: { eventId: parseInt(id), token } }),
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error"),
  })

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        {status === "success" ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Registration Cancelled</h1>
            <p className="text-muted-foreground mb-6">
              Your registration for {event?.title ?? "this event"} has been cancelled.
            </p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        ) : status === "error" ? (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Cancellation Failed</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find your registration. The link may be invalid or your registration was already cancelled.
            </p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <CardTitle>Cancel Registration</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to cancel your registration for{" "}
                <strong>{event?.title ?? "this event"}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Button variant="outline" asChild>
                  <Link to="/events/$id" params={{ id }}>
                    Keep Registration
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
