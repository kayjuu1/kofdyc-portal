import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { Eyebrow, GoldTitle, LeaderCard } from "@/components/leadership/LeaderCard"
import { getPublishedLeadership } from "@/functions/leadership"

import { seo, seoLinks } from "@/lib/seo"

export const Route = createFileRoute("/leadership/")({
  head: () => ({
    meta: seo({
      title: "Leadership | KOFDYC",
      description:
        "Meet the leadership of the Koforidua Diocesan Youth Council — executives, patrons, and chaplains.",
      path: "/leadership",
    }),
    links: seoLinks("/leadership"),
  }),
  loader: async () => getPublishedLeadership(),
  staleTime: 300_000,
  component: LeadershipPage,
})

function LeadershipPage() {
  const groups = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {groups.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Leadership details coming soon.
          </p>
        ) : (
          <div className="space-y-20">
            {groups.map((group) => (
              <section key={group.id}>
                {group.eyebrow ? <Eyebrow>{group.eyebrow}</Eyebrow> : null}
                <GoldTitle
                  title={group.title}
                  className="font-serif text-3xl font-bold text-foreground md:text-4xl"
                />
                {group.intro ? (
                  <p className="mt-3 max-w-2xl text-muted-foreground">{group.intro}</p>
                ) : null}
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                  {group.members.map((member) => (
                    <LeaderCard
                      key={member.id}
                      name={member.name}
                      roleTitle={member.roleTitle}
                      photoUrl={member.photoUrl}
                      footer={
                        <Link
                          to="/leadership/$memberId"
                          params={{ memberId: String(member.id) }}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          View profile
                          <ArrowRight className="size-3.5" />
                        </Link>
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
