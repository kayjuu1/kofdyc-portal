import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { Calendar, ClipboardList } from "lucide-react"
import { getPublicProgrammes } from "@/functions/programmes"

type SearchParams = {
  year?: number
}

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

interface ProgrammeItem {
  id: number
  parishName: string
  year: number
  status: string
  submissionDate: string | null
}

export const Route = createFileRoute("/programmes/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    year: Number(search.year) || currentYear,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      return await getPublicProgrammes({
        data: {
          year: deps.year,
          limit: 50,
        },
      })
    } catch (error) {
      console.error("Failed to load programmes:", error)
      return { programmes: [], page: 1 }
    }
  },
  component: ProgrammesPage,
})

function ProgrammesPage() {
  const data = Route.useLoaderData()
  const { year } = Route.useSearch()
  const navigate = Route.useNavigate()
  const programmes = data.programmes as ProgrammeItem[]

  const statusColors: Record<string, string> = {
    draft: "outline",
    submitted: "secondary",
    under_review: "secondary",
    approved: "default",
    returned: "destructive",
  }

  const submittedCount = programmes.filter((p) => p.status !== "draft").length
  const approvedCount = programmes.filter((p) => p.status === "approved").length

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-serif">Pastoral Programmes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Annual parish pastoral programmes and activities for the Diocese
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Select
            value={String(year ?? currentYear)}
            onValueChange={(value) =>
              navigate({
                search: (prev: Record<string, unknown>) => ({
                  ...prev,
                  year: Number.parseInt(value, 10),
                }),
              })
            }
          >
            <SelectTrigger className="w-[140px]">
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

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClipboardList className="size-4" />
              {submittedCount} submitted
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {approvedCount} approved
            </span>
          </div>
        </div>

        {programmes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No programmes found for {year ?? currentYear}.</p>
            <p className="text-sm mt-2">Parish coordinators have not yet submitted their programmes.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {programmes.map((programme) => (
              <Card key={programme.id} className={programme.status === "draft" ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{programme.parishName}</h3>
                      <Badge variant={statusColors[programme.status] as "default" | "outline" | "secondary" | "destructive"} className="capitalize">
                        {programme.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {programme.year}
                      {programme.submissionDate && (
                        <> · Submitted {new Date(programme.submissionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                      )}
                    </p>
                  </div>
                  {programme.status === "approved" && (
                    <Button variant="outline" size="sm">
                      View Programme
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}