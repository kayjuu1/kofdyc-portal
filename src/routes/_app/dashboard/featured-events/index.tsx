import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader"
import {
  createFeaturedEvent,
  deleteFeaturedEvent,
  getAllFeaturedEvents,
  toggleFeaturedEventActive,
  updateFeaturedEvent,
} from "@/functions/featured-events"
import { getUpcomingEvents } from "@/functions/events"
import { hasPermission, type UserRole } from "@/lib/permissions"

const MAX_ARTWORK_BYTES = 5 * 1024 * 1024
const MIN_ARTWORK_WIDTH = 1200

async function validateArtwork(file: File): Promise<string | null> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Artwork must be a JPG, PNG or WebP image"
  }
  if (file.size > MAX_ARTWORK_BYTES) {
    return "Artwork must be 5 MB or smaller"
  }
  try {
    const bitmap = await createImageBitmap(file)
    const { width } = bitmap
    bitmap.close()
    if (width < MIN_ARTWORK_WIDTH) {
      return `Artwork must be at least ${MIN_ARTWORK_WIDTH}px wide (got ${width}px)`
    }
  } catch {
    return "Could not read the image — is the file valid?"
  }
  return null
}

type FeaturedRow = Awaited<ReturnType<typeof getAllFeaturedEvents>>[number]
type UpcomingEvent = { id: number; title: string; startAt: string }

type FormState = {
  id: number | null
  eventId: number | null
  displayTitle: string
  artworkUrl: string
  targetDate: string
  ctaLabel: string
  ctaUrl: string
  supportLine: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: FormState = {
  id: null,
  eventId: null,
  displayTitle: "",
  artworkUrl: "",
  targetDate: "",
  ctaLabel: "Event details",
  ctaUrl: "",
  supportLine: "",
  isActive: false,
  sortOrder: 0,
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const Route = createFileRoute("/_app/dashboard/featured-events/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ??
      "coordinator") as UserRole
    if (!hasPermission(role, "manageFeaturedEvents")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    const [featured, upcoming] = await Promise.all([
      getAllFeaturedEvents(),
      getUpcomingEvents({ data: { limit: 50 } }),
    ])
    return { featured, upcoming: upcoming as UpcomingEvent[] }
  },
  component: FeaturedEventsAdminPage,
})

function FeaturedEventsAdminPage() {
  const { featured, upcoming } = Route.useLoaderData()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const saveMutation = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = {
        eventId: state.eventId,
        displayTitle: state.displayTitle,
        artworkUrl: state.artworkUrl,
        targetDate: new Date(state.targetDate).toISOString(),
        ctaLabel: state.ctaLabel,
        ctaUrl: state.ctaUrl || null,
        supportLine: state.supportLine || null,
        isActive: state.isActive,
        sortOrder: state.sortOrder,
      }
      if (state.id !== null) {
        return updateFeaturedEvent({ data: { ...payload, id: state.id } })
      }
      return createFeaturedEvent({ data: payload })
    },
    onSuccess: () => {
      toast.success(form.id !== null ? "Featured event updated" : "Featured event created")
      setDialogOpen(false)
      router.invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const toggleMutation = useMutation({
    mutationFn: (row: FeaturedRow) =>
      toggleFeaturedEventActive({
        data: { id: row.id, isActive: !row.isActive },
      }),
    onSuccess: () => {
      toast.success("Featured event updated")
      router.invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFeaturedEvent({ data: { id } }),
    onSuccess: () => {
      toast.success("Featured event deleted")
      router.invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreate() {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(row: FeaturedRow) {
    setForm({
      id: row.id,
      eventId: row.eventId,
      displayTitle: row.displayTitle,
      artworkUrl: row.artworkUrl,
      targetDate: toDatetimeLocal(row.targetDate),
      ctaLabel: row.ctaLabel,
      ctaUrl: row.ctaUrl ?? "",
      supportLine: row.supportLine ?? "",
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })
    setDialogOpen(true)
  }

  function handleEventSelect(value: string) {
    if (value === "none") {
      setForm((state) => ({ ...state, eventId: null }))
      return
    }
    const event = upcoming.find((candidate) => candidate.id === Number(value))
    if (!event) return
    setForm((state) => ({
      ...state,
      eventId: event.id,
      displayTitle: state.displayTitle || event.title,
      targetDate: state.targetDate || toDatetimeLocal(event.startAt),
    }))
  }

  const artworkImages: UploadedImage[] = form.artworkUrl
    ? [{ key: form.artworkUrl, url: form.artworkUrl, filename: "artwork", size: 0 }]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="size-6 text-primary" />
            Featured Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Hero banners shown at the top of the public homepage.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Add featured event
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Artwork</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Target date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Order</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featured.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No featured events yet. Add one to show a hero on the homepage.
                  </TableCell>
                </TableRow>
              ) : (
                featured.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <img
                        src={row.artworkUrl}
                        alt=""
                        className="h-12 w-20 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{row.displayTitle}</p>
                      {row.eventTitle ? (
                        <p className="text-xs text-muted-foreground">
                          Linked: {row.eventTitle}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(row.targetDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(row)}
                        disabled={toggleMutation.isPending}
                      >
                        <Badge variant={row.isActive ? "default" : "secondary"}>
                          {row.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>{row.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${row.displayTitle}"?`)) {
                            deleteMutation.mutate(row.id)
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {form.id !== null ? "Edit featured event" : "Add featured event"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!form.artworkUrl) {
                toast.error("Upload the event artwork first")
                return
              }
              if (!form.targetDate) {
                toast.error("Choose a countdown target date")
                return
              }
              saveMutation.mutate(form)
            }}
          >
            <div className="space-y-2">
              <Label>Link internal event (optional)</Label>
              <Select
                value={form.eventId !== null ? String(form.eventId) : "none"}
                onValueChange={handleEventSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="External event (no link)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">External event (no link)</SelectItem>
                  {upcoming.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking an event pre-fills the title and date, and points the button at the
                event page.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayTitle">Display title</Label>
              <Input
                id="displayTitle"
                required
                value={form.displayTitle}
                onChange={(event) =>
                  setForm((state) => ({ ...state, displayTitle: event.target.value }))
                }
                placeholder="West Africa Youth Days · Accra 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Artwork (min {MIN_ARTWORK_WIDTH}px wide, max 5 MB)</Label>
              <ImageUploader
                images={artworkImages}
                onImagesChange={(images) =>
                  setForm((state) => ({ ...state, artworkUrl: images[0]?.url ?? "" }))
                }
                coverUrl={form.artworkUrl || null}
                onCoverChange={() => {}}
                maxFiles={1}
                validateFile={validateArtwork}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetDate">Countdown target</Label>
                <Input
                  id="targetDate"
                  type="datetime-local"
                  required
                  value={form.targetDate}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, targetDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ctaLabel">Button label</Label>
                <Input
                  id="ctaLabel"
                  value={form.ctaLabel}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, ctaLabel: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">Button URL</Label>
                <Input
                  id="ctaUrl"
                  value={form.ctaUrl}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, ctaUrl: event.target.value }))
                  }
                  placeholder="/events/12 or https://…"
                  disabled={form.eventId !== null}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportLine">Support line (optional)</Label>
              <Textarea
                id="supportLine"
                value={form.supportLine}
                onChange={(event) =>
                  setForm((state) => ({ ...state, supportLine: event.target.value }))
                }
                placeholder="Dial ***713*8534#** and select Option 1 to support…"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Wrap the USSD code in ** to render it bold, e.g. **&#42;713&#42;8534#**.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((state) => ({ ...state, isActive: event.target.checked }))
                }
              />
              Active (visible on the homepage)
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {form.id !== null ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
