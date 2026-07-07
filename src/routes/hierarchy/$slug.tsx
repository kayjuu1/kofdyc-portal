import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { Church } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { LeaderCard } from "@/components/leadership/LeaderCard"
import { MarkdownContent } from "@/components/MarkdownContent"
import { getHierarchyNodeBySlug } from "@/functions/hierarchy"
import { HIERARCHY_TYPE_LABELS } from "@/lib/hierarchy-rules"

export const Route = createFileRoute("/hierarchy/$slug")({
  loader: async ({ params }) => {
    const result = await getHierarchyNodeBySlug({ data: { slug: params.slug } })
    if (!result) throw notFound()
    return result
  },
  staleTime: 300_000,
  component: HierarchyNodePage,
})

function HierarchyNodePage() {
  const { node, ancestors, leaders, children } = Route.useLoaderData()
  const childLabel =
    node.type === "movement"
      ? "Sub-movements"
      : node.type === "deanery_council"
        ? "Parish Youth Councils"
        : null

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/hierarchy">Hierarchy</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {ancestors.map((ancestor) => (
              <BreadcrumbItem key={ancestor.id} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbLink asChild>
                  <Link to="/hierarchy/$slug" params={{ slug: ancestor.slug }}>
                    {ancestor.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{node.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {node.crestUrl ? (
            <img
              src={node.crestUrl}
              alt={`${node.name} crest`}
              className="size-20 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Church className="size-9" />
            </div>
          )}
          <div>
            <Badge variant="secondary">{HIERARCHY_TYPE_LABELS[node.type]}</Badge>
            <h1 className="mt-2 font-serif text-3xl font-bold text-foreground md:text-4xl">
              {node.name}
            </h1>
          </div>
        </header>

        {node.briefHistory ? (
          <section className="mt-12">
            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
              Brief History
            </h2>
            <MarkdownContent source={node.briefHistory} />
          </section>
        ) : null}

        {leaders.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">
              Leadership Structure
            </h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {leaders.map((leader) => (
                <LeaderCard
                  key={leader.id}
                  name={leader.name}
                  roleTitle={leader.roleTitle}
                  photoUrl={leader.photoUrl}
                  footer={
                    leader.phone ? (
                      <p className="mt-1 text-sm text-muted-foreground">{leader.phone}</p>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {childLabel && children.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
              {childLabel}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {children.map((child) => (
                <Card key={child.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="py-4">
                    <Link
                      to="/hierarchy/$slug"
                      params={{ slug: child.slug }}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {child.name}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <PublicFooter />
    </div>
  )
}
