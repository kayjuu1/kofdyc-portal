import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import {
  Calendar,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
  Users,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  DashboardEmptyState,
  DashboardFilterPills,
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteEvent, getEvents } from "@/functions/events"

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

const statusOptions = ["draft", "published", "cancelled", "completed"] as const

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

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

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
    ? eventList.filter((event) => event.title.toLowerCase().includes(search.toLowerCase()))
    : eventList

  const publishedCount = eventList.filter((event) => event.status === "published").length
  const paidCount = eventList.filter((event) => event.registrationType === "paid").length
  const upcomingCount = eventList.filter((event) => new Date(event.startAt) >= new Date()).length

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Events"
        description="Create, manage, and track event registrations."
        action={{
          label: "Create Event",
          href: "/dashboard/events/create",
          icon: Plus,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Published"
          value={publishedCount}
          icon={Calendar}
          tone="emerald"
          detail="Currently visible"
        />
        <DashboardStatCard
          label="Upcoming"
          value={upcomingCount}
          icon={Users}
          tone="sky"
          detail="Future dates"
        />
        <DashboardStatCard
          label="Paid Events"
          value={paidCount}
          icon={Ticket}
          tone="gold"
          detail="With fee collection"
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <DashboardFilterPills
              items={statusOptions}
              value={status}
              onSelect={(nextStatus) =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    status: nextStatus,
                    page: undefined,
                  }),
                })
              }
              formatLabel={formatStatusLabel}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {filteredEvents.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={Calendar}
                title="No events found"
                description="Try a different search or filter to find what you're looking for."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.venue ?? "No venue set"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{event.eventType}</TableCell>
                    <TableCell className="text-sm capitalize">{event.scope}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.startAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
                        className="capitalize"
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/events/$id" params={{ id: String(event.id) }} target="_blank">
                              <Eye className="mr-2 size-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/events/$id" params={{ id: String(event.id) }}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/events/registrants" search={{ eventId: event.id }}>
                              <Users className="mr-2 size-4" />
                              Registrants
                            </Link>
                          </DropdownMenuItem>
                          {event.status === "draft" ? (
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(event.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
