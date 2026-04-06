import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Users,
  Calendar,
  FileText,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  Newspaper,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getDashboardStats, getParishLeaderboard } from "@/functions/dashboard"
import { getUpcomingEvents } from "@/functions/events"

export const Route = createFileRoute("/_app/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard | DYC Koforidua" }],
  }),
  loader: async () => {
    const [stats, upcomingEvents, leaderboard] = await Promise.all([
      getDashboardStats(),
      getUpcomingEvents({ data: { limit: 3 } }),
      getParishLeaderboard({ data: { limit: 5 } }),
    ])
    return { stats, upcomingEvents, leaderboard }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const { stats, upcomingEvents, leaderboard } = Route.useLoaderData()
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  const statCards = [
    { label: "Total Members", value: stats.members, icon: Users, color: "text-primary" },
    { label: "Upcoming Events", value: stats.upcomingEvents, icon: Calendar, color: "text-blue-600" },
    { label: "Published News", value: stats.publishedNews, icon: Newspaper, color: "text-amber-600" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-emerald-600" },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in the diocese today.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 w-fit" asChild>
          <Link to="/dashboard/events/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events">
                  View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
              ) : (
                upcomingEvents.map((event, i) => {
                  const date = new Date(event.startAt)
                  const monthStr = date.toLocaleDateString("en-US", { month: "short" })
                  const dayStr = date.getDate().toString()
                  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

                  return (
                    <div key={event.id}>
                      <Link
                        to="/events/$id"
                        params={{ id: String(event.id) }}
                        className="flex items-start gap-4 group p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-primary">{monthStr}</span>
                          <span className="text-lg font-bold text-primary leading-none">{dayStr}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {event.title}
                            </p>
                            <Badge variant="outline" className="shrink-0 text-xs capitalize">
                              {event.eventType}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {timeStr}
                            </span>
                            {event.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {event.venue}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </Link>
                      {i < upcomingEvents.length - 1 && <Separator className="mt-4" />}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Create Event", icon: Calendar, href: "/dashboard/events/create" },
                { label: "Post News", icon: Newspaper, href: "/dashboard/news/create" },
                { label: "Upload Document", icon: FileText, href: "/dashboard/documents/upload" },
                { label: "View Members", icon: Users, href: "/dashboard/members" },
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <action.icon className="w-4 h-4" />
                  </div>
                  {action.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Parish Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              ) : (
                leaderboard.map((parish, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null
                  return (
                    <div key={parish.id} className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-sm">
                        {medal ?? `${i + 1}.`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{parish.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {parish.programmeCount} prog · {parish.eventCount} events · {parish.registrationCount} reg
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">{parish.score} pts</span>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
