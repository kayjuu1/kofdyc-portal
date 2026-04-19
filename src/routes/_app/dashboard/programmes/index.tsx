import { createFileRoute, Link } from "@tanstack/react-router"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Plus,
  ScrollText,
  Send,
} from "lucide-react"

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
import { getProgrammes } from "@/functions/programmes"
import { canonicalizeRole } from "@/lib/permissions"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "outline" | "secondary" | "destructive"; icon: typeof Clock }
> = {
  draft: { variant: "outline", icon: FileText },
  submitted: { variant: "secondary", icon: Send },
  under_review: { variant: "secondary", icon: Eye },
  approved: { variant: "default", icon: CheckCircle2 },
  returned: { variant: "destructive", icon: AlertTriangle },
}

const statusOptions = ["draft", "submitted", "under_review", "approved", "returned"] as const

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
  const { session } = Route.useRouteContext()
  const data = Route.useLoaderData()
  const { year, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const role = canonicalizeRole((session.user as { role?: string }).role)
  const canCreateProgramme = role === "coordinator"

  const programmes = data.programmes
  const stats = data.stats as Record<string, number>
  const totalForYear = Object.values(stats).reduce((sum, n) => sum + n, 0)

  const deadline = new Date(year ?? currentYear, 2, 31) // March 31
  const isPastDeadline = new Date() > deadline

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Programmes"
        description={`Parish programme submissions for ${year ?? currentYear}.`}
        action={
          canCreateProgramme
            ? {
                label: "New Programme",
                href: "/dashboard/programmes/create",
                icon: Plus,
              }
            : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Total"
          value={totalForYear}
          icon={ClipboardList}
          tone="sky"
          detail={`All submissions in ${year ?? currentYear}`}
        />
        <DashboardStatCard
          label="Submitted"
          value={(stats.submitted ?? 0) + (stats.under_review ?? 0)}
          icon={ScrollText}
          tone="gold"
          detail="Awaiting review"
        />
        <DashboardStatCard
          label="Approved"
          value={stats.approved ?? 0}
          icon={CheckCircle2}
          tone="emerald"
          detail="Signed off"
        />
        <DashboardStatCard
          label={isPastDeadline ? "Overdue Drafts" : "Drafts"}
          value={stats.draft ?? 0}
          icon={isPastDeadline ? AlertTriangle : FileText}
          tone={isPastDeadline && (stats.draft ?? 0) > 0 ? "rose" : "plum"}
          detail={isPastDeadline ? "Past Mar 31 deadline" : "Not yet submitted"}
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={String(year ?? currentYear)}
              onValueChange={(value) =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    year: Number.parseInt(value, 10),
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((optionYear) => (
                  <SelectItem key={optionYear} value={optionYear.toString()}>
                    {optionYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DashboardFilterPills
              items={statusOptions}
              value={status as (typeof statusOptions)[number] | undefined}
              onSelect={(nextStatus) =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    status: status === nextStatus ? undefined : nextStatus,
                    page: undefined,
                  }),
                })
              }
              formatLabel={(value) =>
                value.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {programmes.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={ClipboardList}
                title="No programmes found"
                description={
                  status
                    ? `No ${status.replace("_", " ")} programmes for ${year ?? currentYear}.`
                    : `No submissions for ${year ?? currentYear} yet.`
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parish</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programmes.map((programme) => {
                      const isDraft = programme.status === "draft"
                      const isOverdue = isDraft && isPastDeadline
                      const statusConf = STATUS_CONFIG[programme.status]
                      const StatusIcon = statusConf?.icon ?? Clock

                      return (
                        <TableRow
                          key={programme.id}
                          className={isOverdue ? "bg-destructive/5" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{programme.parishName}</span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusConf?.variant ?? "outline"}
                              className="gap-1 capitalize"
                            >
                              <StatusIcon className="size-3" />
                              {programme.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {programme.submitterName || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {programme.submissionDate ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Date(programme.submissionDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {programme.finalApprovalDate ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="size-3" />
                                {new Date(programme.finalApprovalDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                to="/dashboard/programmes/$id"
                                params={{ id: String(programme.id) }}
                              >
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {data.total > 0 && (
                <div className="border-t px-4 py-3 text-xs text-muted-foreground">
                  Showing {(data.page - 1) * 20 + 1}–
                  {Math.min(data.page * 20, data.total)} of {data.total}{" "}
                  {status ? status.replace("_", " ") + " " : ""}programme
                  {data.total !== 1 ? "s" : ""}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === data.page ? "default" : "outline"}
              size="sm"
              className="size-8 p-0"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({ ...prev, page }),
                })
              }
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
