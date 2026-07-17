import { createFileRoute, Link } from "@tanstack/react-router"
import { Church, Network } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getHierarchyIndex } from "@/functions/hierarchy"

import { seo, seoLinks } from "@/lib/seo"

export const Route = createFileRoute("/hierarchy/")({
  head: () => ({
    meta: seo({
      title: "Hierarchy | KOFDYC",
      description:
        "Explore the structure of the Koforidua Diocesan Youth Council — deaneries, parish councils, movements, and societies.",
      path: "/hierarchy",
    }),
    links: seoLinks("/hierarchy"),
  }),
  loader: async () => getHierarchyIndex(),
  staleTime: 300_000,
  component: HierarchyPage,
})

function Crest({ crestUrl }: { crestUrl: string | null }) {
  if (crestUrl) {
    return (
      <img src={crestUrl} alt="" className="size-12 rounded-full object-cover" />
    )
  }
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Church className="size-5" />
    </div>
  )
}

function HierarchyPage() {
  const { movements, councils } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="flex items-center justify-center gap-2.5 font-serif text-3xl font-bold text-foreground md:text-4xl">
            <Network className="size-8 text-primary" />
            Our Structure
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            How youth ministry is organised across the diocese — the movements and
            societies young people belong to, and the deanery and parish youth
            councils that coordinate them.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              Movements &amp; Societies
            </h2>
            {movements.length === 0 ? (
              <p className="text-muted-foreground">Details coming soon.</p>
            ) : (
              <div className="space-y-4">
                {movements.map((movement) => (
                  <Card key={movement.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 py-4">
                      <Crest crestUrl={movement.crestUrl} />
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/hierarchy/$slug"
                          params={{ slug: movement.slug }}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {movement.name}
                        </Link>
                        {movement.subMovements.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {movement.subMovements.length} sub-movement
                            {movement.subMovements.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                        {movement.subMovements.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                            {movement.subMovements.map((sub) => (
                              <Link
                                key={sub.id}
                                to="/hierarchy/$slug"
                                params={{ slug: sub.slug }}
                                className="text-sm text-primary hover:underline"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              Councils
            </h2>
            {councils.length === 0 ? (
              <p className="text-muted-foreground">Details coming soon.</p>
            ) : (
              <Accordion type="multiple" className="rounded-lg border px-4">
                {councils.map((council) => (
                  <AccordionItem key={council.id} value={String(council.id)}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-3">
                        <Crest crestUrl={council.crestUrl} />
                        <span className="font-semibold">{council.name}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="ml-4 space-y-2 border-l border-border pl-6">
                        <Link
                          to="/hierarchy/$slug"
                          params={{ slug: council.slug }}
                          className="block text-sm text-primary hover:underline"
                        >
                          About this council →
                        </Link>
                        {council.parishCouncils.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No parish youth councils listed yet.
                          </p>
                        ) : (
                          council.parishCouncils.map((parish) => (
                            <Link
                              key={parish.id}
                              to="/hierarchy/$slug"
                              params={{ slug: parish.slug }}
                              className="block text-sm text-foreground hover:text-primary hover:underline"
                            >
                              {parish.name}
                            </Link>
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
