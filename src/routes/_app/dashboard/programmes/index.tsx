import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus, ClipboardList } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProgrammes } from "@/functions/programmes"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

const STATUS_COLORS: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "secondary",
  approved: "default",
  returned: "destructive",
}

type SearchParams = {
  year?: number
  status?: string
  page?: number
}

export const Route = createFileRoute("/_app/dashboard/programmes/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    year: Number(search.year) || currentYear,
    status: search.status as string | undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getProgrammes({
      data: {
        year: deps.year,
        status: deps.status,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: ProgrammesPage,
})

function ProgrammesPage() {
  const data = Route.useLoaderData()
  const { year, status } = Route.useSearch()
  const navigate = Route.useNavigate()

  const isOverdue = (prog: { status: string; submissionDate: string | null }) => {
    if (prog.status !== "draft" && prog.submissionDate) return false
    const deadline = new Date(year ?? currentYear, 2, 31) // March 31
    return new Date() > deadline && prog.status === "draft"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pastoral Programmes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage parish programme submissions and reviews
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/programmes/create">
            <Plus className="w-4 h-4 mr-2" />
            New Programme
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={String(year ?? currentYear)}
          onValueChange={(v) =>
            navigate({
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                year: parseInt(v),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {(["draft", "submitted", "under_review", "approved", "returned"] as const).map(
            (s) => (
              <Button
                key={s}
                variant={status === s ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  navigate({
                    search: (prev: Record<string, unknown>) => ({
                      ...prev,
                      status: status === s ? undefined : s,
                      page: undefined,
                    }),
                  })
                }
              >
                {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            )
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parish</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.programmes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No programmes found
                  </TableCell>
                </TableRow>
              ) : (
                data.programmes.map((prog) => (
                  <TableRow
                    key={prog.id}
                    className={isOverdue(prog) ? "bg-red-50 dark:bg-red-950/20" : ""}
                  >
                    <TableCell className="font-medium">
                      {prog.parishName}
                      {isOverdue(prog) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Overdue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{prog.year}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[prog.status] ?? "outline"}>
                        {prog.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{prog.submitterName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {prog.submissionDate
                        ? new Date(prog.submissionDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/programmes/$id" params={{ id: String(prog.id) }}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === data.page ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({ ...prev, page: p }),
                })
              }
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
