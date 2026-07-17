import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getLeadershipMember } from "@/functions/leadership"

import { seo, seoLinks } from "@/lib/seo"

export const Route = createFileRoute("/leadership/$memberId")({
  loader: async ({ params }) => {
    const memberId = Number(params.memberId)
    if (!Number.isInteger(memberId)) throw notFound()
    const result = await getLeadershipMember({ data: { memberId } })
    if (!result) throw notFound()
    return result
  },
  head: ({ loaderData, params }) => ({
    meta: seo({
      title: loaderData ? `${loaderData.member.name} | KOFDYC Leadership` : "Leadership | KOFDYC",
      description: loaderData
        ? `${loaderData.member.name}, ${loaderData.member.roleTitle} — ${loaderData.groupTitle}, Koforidua Diocesan Youth Council.`
        : undefined,
      path: `/leadership/${params.memberId}`,
      image: loaderData?.member.photoUrl ?? undefined,
    }),
    links: seoLinks(`/leadership/${params.memberId}`),
  }),
  staleTime: 300_000,
  component: LeadershipMemberPage,
})

function LeadershipMemberPage() {
  const { member, groupTitle } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link
          to="/leadership"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to leadership
        </Link>

        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div>
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="aspect-[4/5] w-full rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-muted">
                <span className="text-5xl font-bold text-muted-foreground">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div>
            <span className="inline-block rounded-full bg-neutral-800 px-3 py-1 text-xs text-white">
              {member.roleTitle}
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
              {member.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {groupTitle.replace("|", " ")}
            </p>

            {member.bio ? (
              <p className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground/90">
                {member.bio}
              </p>
            ) : null}

            {member.email || member.phone ? (
              <div className="mt-8 space-y-2 border-t border-border pt-6 text-sm">
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="size-4" />
                    {member.email}
                  </a>
                ) : null}
                {member.phone ? (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="size-4" />
                    {member.phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
