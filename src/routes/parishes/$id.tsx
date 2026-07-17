import { createFileRoute } from "@tanstack/react-router"
import { Users, Calendar, Newspaper, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getParishProfile } from "@/functions/parishes"

const STATUS_COLORS: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "secondary",
  approved: "default",
  returned: "destructive",
}

export const Route = createFileRoute("/parishes/$id")({
  loader: async ({ params }) => {
    return getParishProfile({ data: { id: parseInt(params.id) } })
  },
  component: ParishProfilePage,
})

function ParishProfilePage() {
  const parish = Route.useLoaderData()

  const stats = [
    { label: "Admin Contacts", value: parish.adminCount, icon: Users },
    { label: "Events", value: parish.eventCount, icon: Calendar },
    { label: "News", value: parish.newsCount, icon: Newspaper },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-serif">{parish.name}</h1>
          {parish.deaneryName && (
            <p className="text-muted-foreground mt-1">{parish.deaneryName} Deanery</p>
          )}
          {parish.priestName && (
            <p className="text-sm text-muted-foreground">Parish Priest: {parish.priestName}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-8 sm:gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center sm:pt-6">
                <stat.icon className="mx-auto mb-2 size-5 text-primary sm:size-6" />
                <p className="text-xl font-bold sm:text-2xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {parish.recentProgrammes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Programme History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parish.recentProgrammes.map((prog, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <span className="font-medium text-sm sm:text-base">{prog.year}</span>
                  <Badge variant={STATUS_COLORS[prog.status] ?? "outline"} className="shrink-0">
                    {prog.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
