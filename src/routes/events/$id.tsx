import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { MapPin, Users, Calendar, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getEvent, registerGuest } from "@/functions/events"
import { useMutation } from "@tanstack/react-query"

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const

export const Route = createFileRoute("/events/$id")({
  loader: async ({ params }) => {
    const event = await getEvent({ data: { id: parseInt(params.id) } })
    if (!event || event.status !== "published") {
      throw new Response("Event not found", { status: 404 })
    }
    return event
  },
  component: EventDetailPage,
})

function EventDetailPage() {
  const event = Route.useLoaderData()
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    parish: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    dietaryRequirements: "",
    medicalConditions: "",
    tshirtSize: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const isRetreat = event.eventType === "retreat"

  const registerMutation = useMutation({
    mutationFn: (data: Parameters<typeof registerGuest>[0]["data"]) =>
      registerGuest({ data }),
    onSuccess: () => {
      setSubmitted(true)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate({
      eventId: event.id,
      guestName: formData.guestName,
      guestEmail: formData.guestEmail || undefined,
      guestPhone: formData.guestPhone,
      parish: formData.parish || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      dietaryRequirements: formData.dietaryRequirements || undefined,
      medicalConditions: formData.medicalConditions || undefined,
      tshirtSize: formData.tshirtSize || undefined,
    })
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Complete!</h1>
          <p className="text-muted-foreground mb-6">
            You have successfully registered for {event.title}.
            {formData.guestEmail && (
              <span> A confirmation email has been sent to {formData.guestEmail}.</span>
            )}
          </p>
          <Button asChild>
            <a href="/events">View More Events</a>
          </Button>
        </main>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" asChild className="mb-4">
          <a href="/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </a>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {event.coverImageUrl && (
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{event.eventType}</Badge>
                <Badge variant="secondary" className="capitalize">{event.scope}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground font-serif mb-4">
                {event.title}
              </h1>
              {event.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.endAt && (
                        <> — {new Date(event.endAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</>
                      )}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                      {event.googleMapsLink && (
                        <a
                          href={event.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View on Maps →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {event.contactName && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">{event.contactName}</p>
                      {event.contactPhone && (
                        <p className="text-sm text-muted-foreground">{event.contactPhone}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Register</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="guestName">Full Name *</Label>
                    <Input
                      id="guestName"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="guestPhone">Phone Number *</Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                      placeholder="+233..."
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="parish">Parish</Label>
                    <Input
                      id="parish"
                      value={formData.parish}
                      onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                      placeholder="Your parish"
                    />
                  </div>

                  {isRetreat && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-4">Emergency Contact</p>
                        <div className="grid gap-2">
                          <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                          <Input
                            id="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                            required={isRetreat}
                          />
                        </div>
                        <div className="grid gap-2 mt-2">
                          <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                          <Input
                            id="emergencyContactPhone"
                            type="tel"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                            required={isRetreat}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                        <Textarea
                          id="dietaryRequirements"
                          value={formData.dietaryRequirements}
                          onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                          placeholder="Any dietary restrictions..."
                          rows={2}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="medicalConditions">Medical Conditions</Label>
                        <Textarea
                          id="medicalConditions"
                          value={formData.medicalConditions}
                          onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                          placeholder="Any medical conditions we should know about..."
                          rows={2}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>T-Shirt Size</Label>
                        <Select
                          value={formData.tshirtSize}
                          onValueChange={(v) => setFormData({ ...formData, tshirtSize: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {TSHIRT_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register Now"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
