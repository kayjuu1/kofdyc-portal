import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  ImageIcon,
  MapPin,
  Newspaper,
  PenLine,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import LiturgicalBanner from "@/components/liturgical-banner/LiturgicalBanner"
import { NewsCard } from "@/components/NewsCard"
import { EventCard } from "@/components/EventCard"
import { ScopeFilter } from "@/components/ScopeFilter"
import { getPublishedNews } from "@/functions/news"
import { getUpcomingEvents } from "@/functions/events"
import { getDocuments, getDocumentDownloadUrl } from "@/functions/documents"
import { getActiveSubmissionPrompt } from "@/functions/submission-prompts"

type SearchParams = {
  scope?: "diocese" | "deanery" | "parish"
}

interface NewsArticle {
  id: number
  title: string
  slug: string | null
  body: string
  scope: string
  scopeId: number | null
  coverImageUrl: string | null
  isPinned: boolean | null
  publishedAt: string | null
  createdAt: string
  authorName: string | null
  authorId: string | null
}

interface EventItem {
  id: number
  title: string
  description: string | null
  eventType: string
  scope: string
  startAt: string
  endAt: string | null
  venue: string | null
  coverImageUrl: string | null
  registrationType: string
  feeAmount: number | null
  feeCurrency: string
}

interface DocumentItem {
  id: number
  title: string
  category: string
  scope: string
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  issuingAuthority: string | null
  dateIssued: string | null
  uploaderName: string | null
  createdAt: string
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    scope: search.scope as SearchParams["scope"],
  }),
  loaderDeps: ({ search }) => ({ scope: search.scope }),
  loader: async ({ deps }) => {
    const [newsData, eventsData, docsData, activePrompt] = await Promise.all([
      getPublishedNews({ data: { limit: 6, scope: deps.scope } }),
      getUpcomingEvents({ data: { limit: 4, scope: deps.scope } }),
      getDocuments({ data: { limit: 6 } }),
      getActiveSubmissionPrompt(),
    ])
    return { news: newsData, events: eventsData, documents: docsData, activePrompt }
  },
  component: HomePage,
})

function HomePage() {
  const { news, events, documents, activePrompt } = Route.useLoaderData()
  const articles = news.articles as NewsArticle[]
  const eventList = events as EventItem[]
  const docList = documents.documents as DocumentItem[]
  const featured = articles.find((a) => a.isPinned) ?? articles[0]
  const restArticles = articles.filter((a) => a.id !== featured?.id).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <LiturgicalBanner />
        <DarkHero
          newsCount={news.total ?? articles.length}
          eventsCount={eventList.length}
          docsCount={docList.length}
        />
        <FeaturedSection article={featured} events={eventList} />
        {activePrompt && <SubmissionPromptBanner title={activePrompt.title} />}
        <NewsSection articles={restArticles} />
        <EventsSection events={eventList} />
        <DocumentsSection documents={docList} />
        <AboutSection />
      </main>
      <PublicFooter />
    </div>
  )
}

/* ─── Dark Marketing Hero with light rays ─── */

function DarkHero({
  newsCount,
  eventsCount,
  docsCount,
}: {
  newsCount: number
  eventsCount: number
  docsCount: number
}) {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-slate-900">
      {/* Light rays backdrop */}
      <div
        className="pointer-events-none absolute inset-0 isolate overflow-hidden"
        style={{
          ["--light-rays-color" as string]: "color-mix(in srgb, var(--primary) 60%, transparent)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--primary) 45%, transparent), transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 85% 10%, color-mix(in srgb, var(--primary) 35%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 110%, color-mix(in srgb, var(--primary) 40%, transparent), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col justify-center space-y-8">
            <span className="w-fit text-xs font-semibold uppercase tracking-[0.35em] text-slate-300/70">
              Catholic Diocese of Koforidua
            </span>
            <div>
              <h1 className="mb-6 text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
                Youth in Faith,{" "}
                <span className="text-primary">Made Alive.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-400">
                The official portal of the Koforidua Diocesan Youth Council. News, events,
                programmes, and formation resources for young Catholics across the diocese.
              </p>
            </div>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                to="/news"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50 sm:text-lg"
              >
                Explore News
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/events"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800/70 sm:text-lg"
              >
                Upcoming Events
                <Calendar className="size-5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 border-t border-slate-800 pt-12">
              <div>
                <p className="text-3xl font-bold text-primary">{newsCount}+</p>
                <p className="mt-2 text-sm text-slate-400">Published Stories</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{eventsCount}+</p>
                <p className="mt-2 text-sm text-slate-400">Upcoming Events</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{docsCount}+</p>
                <p className="mt-2 text-sm text-slate-400">Resources & Docs</p>
              </div>
            </div>
          </div>

          {/* Right column - feature cards */}
          <div className="relative hidden flex-col items-center justify-center space-y-6 lg:flex">
            <FeatureCard
              icon={<Newspaper className="size-6 text-primary" />}
              title="Diocesan News"
              description="Stay updated on happenings across the diocese, deaneries, and parishes."
            />
            <FeatureCard
              icon={<Calendar className="size-6 text-primary" />}
              title="Events & Programmes"
              description="Find retreats, rallies, formation programmes, and register online."
            />
            <FeatureCard
              icon={<Sparkles className="size-6 text-primary" />}
              title="Faith Formation"
              description="Access pastoral documents, guidelines, and resources for youth ministry."
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-slate-800/70">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Featured Article + Sidebar (light section) ─── */

function FeaturedSection({
  article,
  events,
}: {
  article: NewsArticle | undefined
  events: EventItem[]
}) {
  return (
    <section className="border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Featured
            </span>
            <ScopeFilter />
          </div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link to="/news/submit">
              <PenLine className="mr-1.5 size-3.5" />
              Submit a Story
            </Link>
          </Button>
        </div>

        {article ? (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Featured article - 3 cols */}
            <div className="lg:col-span-3">
              <Link
                to={article.slug ? "/news/$slug" : "/news"}
                params={article.slug ? { slug: article.slug } : undefined}
                className="group block"
              >
                {/* Cover image */}
                <div className="relative mb-5 overflow-hidden rounded-xl bg-muted">
                  {article.coverImageUrl ? (
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="aspect-[2/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <ImageIcon className="size-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge className="border-0 bg-background/90 text-xs capitalize shadow-sm backdrop-blur-sm">
                      {article.isPinned ? "Pinned" : "Latest"}
                    </Badge>
                    <Badge className="border-0 bg-background/90 text-xs capitalize shadow-sm backdrop-blur-sm">
                      {article.scope}
                    </Badge>
                  </div>
                </div>

                <h2 className="mb-3 text-2xl font-black leading-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl lg:text-4xl">
                  {article.title}
                </h2>
                <p className="mb-4 line-clamp-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {article.body.length > 220 ? article.body.slice(0, 220) + "..." : article.body}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {article.publishedAt ? (
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                  {article.authorName ? (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <span>By {article.authorName}</span>
                    </>
                  ) : null}
                </div>
              </Link>
            </div>

            {/* Sidebar - 2 cols */}
            <div className="space-y-5 lg:col-span-2">
              {/* Quick Links */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { icon: Newspaper, label: "All News", href: "/news" },
                    { icon: FileText, label: "Documents", href: "/documents" },
                    { icon: PenLine, label: "Submit a Story", href: "/news/submit" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <item.icon className="size-4 text-primary/70" />
                      {item.label}
                      <ChevronRight className="ml-auto size-3.5 text-muted-foreground/40" />
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Events sidebar */}
              {events.length > 0 ? (
                <Card className="border-border/50">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Upcoming Events
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-auto p-0 text-xs text-primary">
                      <a href="#events">See all</a>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {events.slice(0, 3).map((event) => {
                      const d = new Date(event.startAt)
                      const month = d.toLocaleDateString("en-US", { month: "short" })
                      const day = d.getDate()
                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="text-[10px] font-semibold uppercase">{month}</span>
                            <span className="text-base font-bold leading-none">{day}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                            {event.venue ? (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">{event.venue}</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Newspaper className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">No stories yet</h2>
            <p className="text-muted-foreground">Check back soon for the latest news.</p>
          </div>
        )}
      </div>
    </section>
  )
}

/* ─── Submission Prompt Banner ─── */

function SubmissionPromptBanner({ title }: { title: string }) {
  return (
    <section className="border-b border-border/40 bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Submissions are now open. Fill in the required details to submit your programme.
            </p>
          </div>
          <Link
            to="/programmes/submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
          >
            Submit Now <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Latest News Grid ─── */

function NewsSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null

  return (
    <section id="news" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Latest
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              News across the diocese
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Stories from parishes, deaneries, and youth groups.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/news">
              View all <ChevronRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Upcoming Events ─── */

function EventsSection({ events }: { events: EventItem[] }) {
  if (events.length === 0) return null

  return (
    <section id="events" className="border-t border-border/40 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Events
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              What's coming up
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Mark your calendar and register early.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Documents ─── */

function DocumentsSection({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) return null

  async function handleDownload(id: number) {
    try {
      const { url } = await getDocumentDownloadUrl({ data: { id } })
      window.open(url, "_blank")
    } catch {
      // fallback
    }
  }

  const categoryLabels: Record<string, string> = {
    pastoral_letters: "Pastoral Letter",
    circulars: "Circular",
    meeting_minutes: "Minutes",
    reports: "Report",
    constitution_guidelines: "Guidelines",
    pastoral_programmes: "Programme",
    forms: "Form",
    other: "Document",
  }

  return (
    <section id="documents" className="border-t border-border/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Resources
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Documents & Resources
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pastoral letters, programmes, guidelines, and more.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/documents">
              View all <ChevronRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="group border-border/50 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {categoryLabels[doc.category] ?? doc.category}
                    </Badge>
                    {doc.dateIssued ? (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(doc.dateIssued).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-primary"
                  onClick={() => handleDownload(doc.id)}
                >
                  <Download className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── About ─── */

function AboutSection() {
  return (
    <section id="about" className="border-t border-border/40 bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            About DYC
          </span>
          <h2 className="mb-6 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Forming young disciples across{" "}
            <span className="text-primary">the diocese.</span>
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            The Diocesan Youth Council (DYC) of Koforidua is committed to fostering spiritual growth,
            leadership development, and community service among Catholic youth across our diocese.
          </p>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            Through our various programmes and events, we aim to strengthen the faith of our young people
            and prepare them to be active witnesses of Christ's love in their communities.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Faith Formation", "Youth Empowerment", "Community Service"].map((item) => (
              <Badge key={item} variant="secondary" className="rounded-full px-3 py-1">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
