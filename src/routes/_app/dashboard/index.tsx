import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Newspaper,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react"

import {
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getDashboardStats, getParishLeaderboard } from "@/functions/dashboard"
import { getUpcomingEvents } from "@/functions/events"
import { hasPermission, type UserRole } from "@/lib/permissions"

export const Route = createFileRoute("/_app/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard | DYC Koforidua" }],
  }),
  loader: async () => {
    const [stats, upcomingEvents, leaderboard] = await Promise.all([
      getDashboardStats(),
      getUpcomingEvents({ data: { limit: 5 } }),
      getParishLeaderboard({ data: { limit: 5 } }),
    ])
    return { stats, upcomingEvents, leaderboard }
  },
  component: DashboardPage,
})

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const { stats, upcomingEvents, leaderboard } = Route.useLoaderData()
  const firstName = session.user.name?.split(" ")[0] ?? "there"
  const role = ((session.user as { role?: string }).role ?? "coordinator") as UserRole
  const canManageAdminUsers = hasPermission(role, "manageAdminUsers")

  const statCards = [
    {
      label: "Active Members",
      value: stats.members,
      icon: Users,
      tone: "emerald" as const,
      detail: "Registered profiles",
    },
    {
      label: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Calendar,
      tone: "sky" as const,
      detail: "Scheduled gatherings",
    },
    {
      label: "Published News",
      value: stats.publishedNews,
      icon: Newspaper,
      tone: "gold" as const,
      detail: "Live articles",
    },
    {
      label: "Documents",
      value: stats.documents,
      icon: FileText,
      tone: "plum" as const,
      detail: "Archived files",
    },
  ]

  const quickLinks = [
    { label: "Create Event", href: "/dashboard/events/create", icon: Calendar },
    { label: "Post News", href: "/dashboard/news/create", icon: Newspaper },
    { label: "Upload Document", href: "/dashboard/documents/upload", icon: FileText },
    ...(canManageAdminUsers
      ? [{ label: "Manage Users", href: "/dashboard/admin-users", icon: Users }]
      : []),
  ]

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((p: { score: number }) => p.score)) : 1

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Here's what's happening across the diocese today."
        action={{
          label: "Create Event",
          href: "/dashboard/events/create",
          icon: Plus,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Events - takes 2 cols */}
        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/events">
                View all
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 py-8 text-center">
                <Calendar className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingEvents.map((event: { id: number; title: string; startAt: string; venue: string | null; eventType: string }) => {
                  const date = new Date(event.startAt)
                  const monthStr = date.toLocaleDateString("en-US", { month: "short" })
                  const dayStr = date.getDate().toString()
                  const timeStr = date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })

                  return (
                    <Link
                      key={event.id}
                      to="/events/$id"
                      params={{ id: String(event.id) }}
                      className="group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <span className="text-[10px] font-medium uppercase tracking-wider">{monthStr}</span>
                        <span className="text-lg font-bold leading-none">{dayStr}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {event.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {timeStr}
                          </span>
                          {event.venue ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              <span className="truncate">{event.venue}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {event.eventType}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {quickLinks.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  asChild
                  className="h-auto justify-start gap-3 px-3 py-2.5"
                >
                  <Link to={action.href}>
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <action.icon className="size-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Parish Leaderboard */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Parish Rankings</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((parish: { id: number; name: string; score: number; programmeCount: number; eventCount: number; registrationCount: number }, index: number) => (
                    <div key={parish.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded text-xs font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="font-medium">{parish.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">{parish.score} pts</span>
                      </div>
                      <Progress
                        value={(parish.score / maxScore) * 100}
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
