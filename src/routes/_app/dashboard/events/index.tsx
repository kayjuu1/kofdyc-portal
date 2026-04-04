import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Plus, Search, Pencil, Eye, Trash2, MoreHorizontal, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { getEvents, deleteEvent } from "@/functions/events"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

type SearchParams = {
  status?: "draft" | "published" | "cancelled" | "completed"
  page?: number
}

interface EventItem {
  id: number
  title: string
  description: string | null
  eventType: string
  scope: string
  scopeId: number | null
  startAt: string
  endAt: string | null
  venue: string | null
  status: string
  registrationType: string
  createdAt: string
}

export const Route = createFileRoute("/_app/dashboard/events/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    status: (search.status as SearchParams["status"]) || undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({ status: search.status, page: search.page }),
  loader: async ({ deps }) => {
    return getEvents({
      data: {
        status: deps.status,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: EventsAdminPage,
})

function EventsAdminPage() {
  const data = Route.useLoaderData()
  const { status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const eventList = (data.events || []) as EventItem[]
  const [search, setSearch] = useState("")

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEvent({ data: { id } }),
    onSuccess: () => {
      toast.success("Event deleted")
      router.invalidate()
    },
  })

  const filteredEvents = search
    ? eventList.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase())
      )
    : eventList

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage events
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/events/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["draft", "published", "cancelled", "completed"] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    status: s,
                    page: undefined,
                  }),
                })
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{event.title}</span>
                        {event.venue && (
                          <p className="text-xs text-muted-foreground">{event.venue}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{event.eventType}</TableCell>
                    <TableCell className="capitalize">{event.scope}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(event.startAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "published"
                            ? "default"
                            : event.status === "draft"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/events/$id" params={{ id: String(event.id) }} target="_blank">
                              <Eye className="w-4 h-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/events/$id" params={{ id: String(event.id) }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/events/registrants" search={{ eventId: event.id }}>
                              <Users className="w-4 h-4 mr-2" />
                              Registrants
                            </Link>
                          </DropdownMenuItem>
                          {event.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(event.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
