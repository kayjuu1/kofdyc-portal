import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Download, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getRegistrants, getEvent, toggleAttendance } from "@/functions/events"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { toast } from "sonner"

type SearchParams = {
  eventId: number
  status?: string
}

export const Route = createFileRoute("/_app/dashboard/events/registrants")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    eventId: Number(search.eventId) || 0,
    status: (search.status as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ eventId: search.eventId, status: search.status }),
  loader: async ({ deps }) => {
    const [registrants, event] = await Promise.all([
      getRegistrants({ data: { eventId: deps.eventId, status: deps.status } }),
      getEvent({ data: { id: deps.eventId } }),
    ])
    return { registrants, event }
  },
  component: RegistrantsPage,
})

function RegistrantsPage() {
  const { registrants, event } = Route.useLoaderData()
  const { eventId, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()

  const attendanceMutation = useMutation({
    mutationFn: (params: { registrationId: number; attended: boolean }) =>
      toggleAttendance({ data: params }),
    onSuccess: () => {
      toast.success("Attendance updated")
      router.invalidate()
    },
  })

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Parish", "Status", "Attended", "Registered At"]
    const rows = registrants.map((r: Record<string, unknown>) => [
      r.guestName,
      r.guestEmail ?? "",
      r.guestPhone,
      r.parish ?? "",
      r.registrationStatus,
      r.attended ? "Yes" : "No",
      r.createdAt ? new Date(r.createdAt as string).toLocaleDateString() : "",
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell: unknown) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `registrants-${eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Confirmed", value: "confirmed" },
    { label: "Waitlisted", value: "waitlisted" },
    { label: "Cancelled", value: "cancelled" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/events">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registrants</h1>
            <p className="text-sm text-muted-foreground">
              {event?.title ?? "Event"} — {registrants.length} registrant{registrants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <Button
            key={f.label}
            variant={status === f.value ? "default" : "outline"}
            size="sm"
            onClick={() =>
              navigate({
                search: { eventId, status: f.value },
              })
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Parish</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Attended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No registrants found
                  </TableCell>
                </TableRow>
              ) : (
                registrants.map((r: Record<string, unknown>) => (
                  <TableRow key={r.id as number}>
                    <TableCell className="font-medium">{r.guestName as string}</TableCell>
                    <TableCell className="text-sm">{(r.guestEmail as string) ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.guestPhone as string}</TableCell>
                    <TableCell className="text-sm">{(r.parish as string) ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.registrationStatus === "confirmed"
                            ? "default"
                            : r.registrationStatus === "waitlisted"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {r.registrationStatus as string}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={!!r.attended}
                        onChange={(e) =>
                          attendanceMutation.mutate({
                            registrationId: r.id as number,
                            attended: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                        disabled={r.registrationStatus === "cancelled"}
                      />
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
