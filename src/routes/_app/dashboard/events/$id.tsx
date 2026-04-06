import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Save, Send, XCircle, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEvent, updateEvent } from "@/functions/events"
import { getDeaneries, getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { canonicalizeRole } from "@/lib/permissions"

const EVENT_TYPES = ["mass", "rally", "retreat", "congress", "meeting", "other"] as const

export const Route = createFileRoute("/_app/dashboard/events/$id")({
  beforeLoad: ({ context }) => {
    const role = canonicalizeRole((context.session.user as { role?: string }).role)
    if (role !== "coordinator") {
      throw redirect({ to: "/dashboard/events" })
    }
  },
  loader: async ({ params }) => {
    const [event, deaneries, parishes] = await Promise.all([
      getEvent({ data: { id: parseInt(params.id) } }),
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    if (!event) {
      throw new Response("Event not found", { status: 404 })
    }
    return { event, deaneries, parishes }
  },
  component: EditEventPage,
})

function EditEventPage() {
  const { event, deaneries: deaneryList, parishes: parishList } = Route.useLoaderData()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description ?? "",
    eventType: event.eventType as typeof EVENT_TYPES[number],
    scope: event.scope as "diocese" | "deanery" | "parish",
    scopeId: event.scopeId ?? undefined as number | undefined,
    startAt: event.startAt?.slice(0, 16) ?? "",
    endAt: event.endAt?.slice(0, 16) ?? "",
    venue: event.venue ?? "",
    googleMapsLink: event.googleMapsLink ?? "",
    coverImageUrl: event.coverImageUrl ?? "",
    registrationDeadline: event.registrationDeadline?.slice(0, 16) ?? "",
    capacity: event.capacity?.toString() ?? "",
    contactName: event.contactName ?? "",
    contactPhone: event.contactPhone ?? "",
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateEvent>[0]["data"]) =>
      updateEvent({ data }),
    onSuccess: (_, variables) => {
      if (variables.status === "cancelled") {
        toast.success("Event cancelled")
      } else if (variables.status === "published") {
        toast.success("Event published")
      } else {
        toast.success("Event updated")
      }
      navigate({ to: "/dashboard/events" })
    },
  })

  const submitUpdate = (status?: "draft" | "published" | "cancelled") => {
    updateMutation.mutate({
      id: event.id,
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
      ...(status ? { status } : {}),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitUpdate()
  }

  const deaneries = deaneryList || []
  const parishes = parishList || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/events">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
              <Badge variant={event.status === "published" ? "default" : event.status === "draft" ? "outline" : "secondary"}>
                {event.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Update event details</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/events/registrants" search={{ eventId: event.id }}>
            <Users className="w-4 h-4 mr-2" />
            View Registrants
          </Link>
        </Button>
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

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/dashboard/events" })}>
            Cancel
          </Button>

          {event.status !== "cancelled" && (
            <Button
              type="button"
              variant="destructive"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (confirm("Are you sure you want to cancel this event?")) {
                  submitUpdate("cancelled")
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Event
            </Button>
          )}

          {event.status === "published" ? (
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <>
              <Button type="submit" variant="outline" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => {
                  const form = document.querySelector("form") as HTMLFormElement
                  if (form?.reportValidity()) submitUpdate("published")
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Publishing..." : "Publish"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
