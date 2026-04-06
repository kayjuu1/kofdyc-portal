import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { ArrowLeft, Save, Send, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEvent, checkEventConflicts } from "@/functions/events"
import { getDeaneries, getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

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

  const [conflicts, setConflicts] = useState<{ id: number; title: string; startAt: string; isDiocesanPriority: boolean }[]>([])

  useEffect(() => {
    if (!formData.startAt) {
      setConflicts([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const result = await checkEventConflicts({
          data: {
            startAt: new Date(formData.startAt).toISOString(),
            endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
            scope: formData.scope,
          },
        })
        setConflicts(result.conflicts)
      } catch {
        // ignore
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.startAt, formData.endAt, formData.scope])

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createEvent>[0]["data"]) =>
      createEvent({ data }),
    onSuccess: (_, variables) => {
      toast.success(variables.status === "published" ? "Event published" : "Event saved as draft")
      navigate({ to: "/dashboard/events" })
    },
  })

  const submitWithStatus = (status: "draft" | "published") => {
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
      status,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitWithStatus("draft")
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

            {conflicts.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">
                    {conflicts.some(c => c.isDiocesanPriority)
                      ? "Conflicts with a diocesan priority event!"
                      : "Potential scheduling conflict"}
                  </p>
                  <ul className="mt-1 list-disc list-inside">
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        {c.title} — {new Date(c.startAt).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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
          <Button type="submit" variant="outline" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => {
              const form = document.querySelector("form") as HTMLFormElement
              if (form?.reportValidity()) submitWithStatus("published")
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Publishing..." : "Save & Publish"}
          </Button>
        </div>
      </form>
    </div>
  )
}
