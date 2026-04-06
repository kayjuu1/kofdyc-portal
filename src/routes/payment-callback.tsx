import { createFileRoute, Link } from "@tanstack/react-router"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { verifyPayment } from "@/functions/payments"

type SearchParams = { reference?: string }

export const Route = createFileRoute("/payment-callback")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    reference: search.reference as string | undefined,
  }),
  loaderDeps: ({ search }) => ({ reference: search.reference }),
  loader: async ({ deps }) => {
    if (!deps.reference) return { status: "not_found" as const }
    return verifyPayment({ data: { reference: deps.reference } })
  },
  component: PaymentCallbackPage,
})

function PaymentCallbackPage() {
  const result = Route.useLoaderData()

  const isSuccess = result.status === "successful"
  const isNotFound = result.status === "not_found"

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {isSuccess ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
                <p className="text-muted-foreground">
                  Your payment has been confirmed and your registration is complete. A receipt has been sent to your email.
                </p>
              </>
            ) : isNotFound ? (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">Payment Not Found</h1>
                <p className="text-muted-foreground">
                  We could not find a payment with this reference. Please contact support if you believe this is an error.
                </p>
              </>
            ) : result.status === "initiated" ? (
              <>
                <Loader2 className="w-16 h-16 text-yellow-500 mx-auto animate-spin" />
                <h1 className="text-2xl font-bold text-foreground">Payment Processing</h1>
                <p className="text-muted-foreground">
                  Your payment is still being processed. Please check back in a few minutes.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
                <p className="text-muted-foreground">
                  Your payment could not be completed. Please try again or contact support.
                </p>
              </>
            )}
            <Button asChild className="mt-4">
              <Link to="/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  )
}
