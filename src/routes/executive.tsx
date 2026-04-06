import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getExecutiveMembers } from "@/functions/executive"

export const Route = createFileRoute("/executive")({
  loader: async () => {
    return getExecutiveMembers({ data: { currentOnly: true } })
  },
  component: ExecutivePage,
})

function ExecutivePage() {
  const members = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground font-serif">DYC Executive</h1>
          <p className="text-muted-foreground mt-2">
            Meet the current leadership team of the Diocesan Youth Council
          </p>
        </div>

        {members.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Executive team details coming soon.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">
                      {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                )}
                <CardContent className="pt-4">
                  <h3 className="font-bold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary font-medium">{member.portfolio}</p>
                  <p className="text-xs text-muted-foreground mt-1">Term: {member.termYear}</p>
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-xs text-primary hover:underline block mt-1">
                      {member.email}
                    </a>
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
