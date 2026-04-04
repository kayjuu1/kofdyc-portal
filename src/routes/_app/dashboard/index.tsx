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
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/_app/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard | DYC Koforidua" }],
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const firstName = session.user.name?.split(" ")[0] ?? "there"

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
        <Button className="bg-primary hover:bg-primary/90 w-fit">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: "1,247", change: "+12%", icon: Users, color: "text-primary" },
          { label: "Upcoming Events", value: "8", change: "+3 this week", icon: Calendar, color: "text-blue-600" },
          { label: "Active Parishes", value: "23", change: "5 deaneries", icon: MapPin, color: "text-amber-600" },
          { label: "Documents", value: "56", change: "+4 new", icon: FileText, color: "text-emerald-600" },
        ].map((stat, i) => (
          <Card key={i} className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
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
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Monthly Youth Mass",
                  date: "Apr 5, 2026",
                  time: "10:00 AM",
                  location: "All Parishes",
                  type: "Mass",
                },
                {
                  title: "Youth Retreat: Finding Peace in Christ",
                  date: "May 20, 2026",
                  time: "8:00 AM",
                  location: "St. Augustine's Parish Hall",
                  type: "Retreat",
                },
                {
                  title: "Diocesan Youth Day 2026",
                  date: "Jun 15, 2026",
                  time: "9:00 AM",
                  location: "St. Joseph's Cathedral",
                  type: "Rally",
                },
              ].map((event, i) => (
                <div key={i}>
                  <div className="flex items-start gap-4 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">{event.date.split(" ")[0]}</span>
                      <span className="text-lg font-bold text-primary leading-none">{event.date.split(" ")[1].replace(",", "")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {event.location}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                  {i < 2 && <Separator className="mt-4" />}
                </div>
              ))}
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
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { text: "New member registered from St. Peter's Parish", time: "2h ago" },
                { text: "Youth Congress registration opened", time: "5h ago" },
                { text: "Lenten retreat schedule published", time: "1d ago" },
                { text: "March newsletter uploaded", time: "2d ago" },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
