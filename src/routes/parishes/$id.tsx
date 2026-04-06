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
    { label: "Members", value: parish.memberCount, icon: Users },
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

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
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
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{prog.year}</span>
                  <Badge variant={STATUS_COLORS[prog.status] ?? "outline"}>
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
