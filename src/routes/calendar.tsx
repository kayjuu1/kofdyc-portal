import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, List, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getCalendarEvents, getFeastDays } from "@/functions/calendar"
import { getCurrentLiturgicalSeason } from "@/lib/liturgical"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const SEASON_COLORS: Record<string, string> = {
  Advent: "bg-purple-50 dark:bg-purple-950/20",
  Christmas: "bg-amber-50 dark:bg-amber-950/20",
  Lent: "bg-purple-50 dark:bg-purple-950/20",
  Easter: "bg-yellow-50 dark:bg-yellow-950/20",
  "Ordinary Time": "bg-green-50 dark:bg-green-950/20",
}

type SearchParams = {
  year?: number
  month?: number
  scope?: "diocese" | "deanery" | "parish"
}

export const Route = createFileRoute("/calendar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const now = new Date()
    return {
      year: Number(search.year) || now.getFullYear(),
      month: Number(search.month) || now.getMonth() + 1,
      scope: search.scope as "diocese" | "deanery" | "parish" | undefined,
    }
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const year = deps.year ?? new Date().getFullYear()
    const month = deps.month ?? new Date().getMonth() + 1
    const events = await getCalendarEvents({
      data: { year, month, scope: deps.scope },
    })
    const feastDays = getFeastDays(year)
    return { events, feastDays }
  },
  component: CalendarPage,
})

function CalendarPage() {
  const { events, feastDays } = Route.useLoaderData()
  const { year, month, scope } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const y = year ?? new Date().getFullYear()
  const m = month ?? new Date().getMonth() + 1

  const daysInMonth = new Date(y, m, 0).getDate()
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay()

  const eventsByDay = useMemo(() => {
    const map: Record<number, typeof events> = {}
    for (const ev of events) {
      const d = new Date(ev.startAt).getDate()
      if (!map[d]) map[d] = []
      map[d].push(ev)
    }
    return map
  }, [events])

  const feastsByDay = useMemo(() => {
    const map: Record<number, typeof feastDays[0]> = {}
    for (const fd of feastDays) {
      const d = new Date(fd.date + "T00:00:00")
      if (d.getMonth() + 1 === m) {
        map[d.getDate()] = fd
      }
    }
    return map
  }, [feastDays, m])

  const goToMonth = (offset: number) => {
    let newMonth = m + offset
    let newYear = y
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    navigate({ search: { year: newYear, month: newMonth, scope } })
  }

  const allItems = [
    ...events.map((e) => ({
      date: new Date(e.startAt),
      title: e.title,
      type: "event" as const,
      id: e.id,
      scope: e.scope,
      venue: e.venue,
    })),
    ...feastDays
      .filter((fd) => new Date(fd.date + "T00:00:00").getMonth() + 1 === m)
      .map((fd) => ({
        date: new Date(fd.date + "T00:00:00"),
        title: fd.name,
        type: "feast" as const,
        id: 0,
        scope: null,
        venue: null,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground font-serif">Diocesan Calendar</h1>
          <div className="flex items-center gap-2">
            <Select
              value={scope ?? "all"}
              onValueChange={(v) =>
                navigate({ search: { year: y, month: m, scope: v === "all" ? undefined : v as "diocese" | "deanery" | "parish" } })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="diocese">Diocese</SelectItem>
                <SelectItem value="deanery">Deanery</SelectItem>
                <SelectItem value="parish">Parish</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => goToMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {MONTHS[m - 1]} {y}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => goToMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {viewMode === "grid" ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-muted">
              {DAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-t border-r" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateObj = new Date(y, m - 1, day)
                const season = getCurrentLiturgicalSeason(dateObj)
                const dayEvents = eventsByDay[day] || []
                const feast = feastsByDay[day]
                const isToday =
                  dateObj.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] border-t border-r p-1 ${SEASON_COLORS[season.season] ?? ""} ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                      {day}
                    </span>
                    {feast && (
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate mt-0.5" title={feast.name}>
                        {feast.name}
                      </div>
                    )}
                    {dayEvents.slice(0, 2).map((ev) => (
                      <Link
                        key={ev.id}
                        to="/events/$id"
                        params={{ id: String(ev.id) }}
                        className="block text-[10px] bg-primary/10 text-primary rounded px-1 mt-0.5 truncate hover:bg-primary/20"
                        title={ev.title}
                      >
                        {ev.title}
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {allItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No events or feast days this month.
                </CardContent>
              </Card>
            ) : (
              allItems.map((item, i) => (
                <Card key={i}>
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="w-12 text-center shrink-0">
                      <span className="text-lg font-bold">{item.date.getDate()}</span>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {item.date.toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.type === "event" ? (
                        <Link
                          to="/events/$id"
                          params={{ id: String(item.id) }}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {item.title}
                        </span>
                      )}
                      {item.venue && (
                        <p className="text-xs text-muted-foreground">{item.venue}</p>
                      )}
                    </div>
                    <Badge variant={item.type === "feast" ? "secondary" : "outline"}>
                      {item.type === "feast" ? "Feast" : item.scope}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
