import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEvent } from "@/functions/events"
import { getDeaneries, getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"

const EVENT_TYPES = ["mass", "rally", "retreat", "congress", "meeting", "other"] as const

export const Route = createFileRoute("/_app/dashboard/events/create")({
  loader: async () => {
    const [deaneries, parishes] = await Promise.all([
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    return { deaneries, parishes }
  },
  component: CreateEventPage,
})

function CreateEventPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "other" as typeof EVENT_TYPES[number],
    scope: "parish" as "diocese" | "deanery" | "parish",
    scopeId: undefined as number | undefined,
    startAt: "",
    endAt: "",
    venue: "",
    googleMapsLink: "",
    coverImageUrl: "",
    registrationDeadline: "",
    capacity: "",
    contactName: "",
    contactPhone: "",
    showRetreatFields: false,
    showTshirtSize: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createEvent>[0]["data"]) => 
      createEvent({ data }),
    onSuccess: () => {
      navigate({ to: "/dashboard/events" })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      eventType: formData.eventType,
      scope: formData.scope,
      scopeId: formData.scopeId,
      startAt: formData.startAt,
      endAt: formData.endAt || undefined,
      venue: formData.venue || undefined,
      googleMapsLink: formData.googleMapsLink || undefined,
      coverImageUrl: formData.coverImageUrl || undefined,
      registrationDeadline: formData.registrationDeadline || undefined,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
      registrationType: "free",
      status: "draft",
    })
  }

  const deaneries = data.deaneries || []
  const parishes = data.parishes || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/events">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
          <p className="text-sm text-muted-foreground">Fill in the event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the event..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(v) => setFormData({ ...formData, eventType: v as typeof formData.eventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v) => setFormData({ ...formData, scope: v as typeof formData.scope, scopeId: undefined })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diocese">Diocese</SelectItem>
                    <SelectItem value="deanery">Deanery</SelectItem>
                    <SelectItem value="parish">Parish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.scope === "deanery" && (
              <div className="grid gap-2">
                <Label>Deanery</Label>
                <Select
                  value={formData.scopeId?.toString() || ""}
                  onValueChange={(v) => setFormData({ ...formData, scopeId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deanery" />
                  </SelectTrigger>
                  <SelectContent>
                    {deaneries.map((d: { id: number; name: string }) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.scope === "parish" && (
              <div className="grid gap-2">
                <Label>Parish</Label>
                <Select
                  value={formData.scopeId?.toString() || ""}
                  onValueChange={(v) => setFormData({ ...formData, scopeId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parish" />
                  </SelectTrigger>
                  <SelectContent>
                    {parishes.map((p: { id: number; name: string; deaneryId: number | null }) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date, Time & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startAt">Start Date & Time *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endAt">End Date & Time</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="googleMapsLink">Google Maps Link</Label>
              <Input
                id="googleMapsLink"
                value={formData.googleMapsLink}
                onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity (0 = unlimited)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactName">Contact Person</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Contact name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+233..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retreat & Camp Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="showRetreatFields"
                type="checkbox"
                checked={formData.showRetreatFields}
                onChange={(e) => setFormData({ ...formData, showRetreatFields: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="showRetreatFields">Show retreat-specific fields on registration</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="showTshirtSize"
                type="checkbox"
                checked={formData.showTshirtSize}
                onChange={(e) => setFormData({ ...formData, showTshirtSize: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="showTshirtSize">Show t-shirt size field on registration</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/dashboard/events" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  )
}
