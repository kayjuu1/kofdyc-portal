import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Newspaper,
  FileText,
  MapPin,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { NewsCard } from "@/components/NewsCard"
import { EventCard } from "@/components/EventCard"
import { ScopeFilter } from "@/components/ScopeFilter"
import { getPublishedNews } from "@/functions/news"
import { getUpcomingEvents } from "@/functions/events"

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
  isFeatured: boolean | null
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

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    scope: search.scope as SearchParams["scope"],
  }),
  loaderDeps: ({ search }) => ({ scope: search.scope }),
  loader: async ({ deps }) => {
    const [newsData, eventsData] = await Promise.all([
      getPublishedNews({ data: { limit: 6, scope: deps.scope } }),
      getUpcomingEvents({ data: { limit: 4, scope: deps.scope } }),
    ])
    return { news: newsData, events: eventsData }
  },
  component: HomePage,
})

function HomePage() {
  const { news, events } = Route.useLoaderData()
  const articles = news.articles as NewsArticle[]
  const eventList = events as EventItem[]
  const featured = articles.find((a) => a.isFeatured) ?? articles[0]
  const restArticles = articles.filter((a) => a.id !== featured?.id).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <FeaturedSection article={featured} events={eventList} />
        <NewsSection articles={restArticles} />
        <EventsSection events={eventList} />
        <AboutSection />
      </main>
      <PublicFooter />
    </div>
  )
}

function FeaturedSection({
  article,
  events,
}: {
  article: NewsArticle | undefined
  events: EventItem[]
}) {
  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-4">
          <ScopeFilter />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {article ? (
              <>
                <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
                  {article.isFeatured ? "Pinned" : "Latest"}
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 font-serif">
                  {article.title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {article.body.length > 250 ? article.body.slice(0, 250) + "..." : article.body}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {article.publishedAt && (
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {article.authorName && (
                    <>
                      <span className="text-border">|</span>
                      <span>By {article.authorName}</span>
                    </>
                  )}
                </div>
                {article.slug && (
                  <Button asChild className="mt-6" variant="outline">
                    <Link to="/news/$slug" params={{ slug: article.slug }}>
                      Read Full Story <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">
                <h1 className="text-3xl font-bold text-foreground font-serif mb-4">
                  Welcome to DYC Koforidua
                </h1>
                <p className="text-lg">No news articles published yet. Check back soon!</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-muted/50 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Newspaper, label: "Latest News", href: "/news" },
                  { icon: FileText, label: "Pastoral Letters", href: "/pastoral-letters" },
                  { icon: Newspaper, label: "Submit News", href: "/news/submit" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.href}
                    className="flex items-center gap-3 p-2 -mx-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.label}
                  </Link>
                ))}
              </CardContent>
            </Card>

            {events.length > 0 && (
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.slice(0, 3).map((event) => {
                    const d = new Date(event.startAt)
                    const month = d.toLocaleDateString("en-US", { month: "short" })
                    const day = d.getDate()
                    return (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-primary/10 text-primary shrink-0">
                          <span className="text-xs font-medium">{month}</span>
                          <span className="text-lg font-bold leading-none">{day}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          {event.venue && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {event.venue}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function NewsSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) return null

  return (
    <section id="news" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-serif">Latest News</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Stay informed with updates from across the diocese
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/news">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </section>
  )
}

function EventsSection({ events }: { events: EventItem[] }) {
  if (events.length === 0) return null

  return (
    <section id="events" className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-serif">Upcoming Events</h2>
            <p className="text-sm text-muted-foreground mt-1">Mark your calendar for these gatherings</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section id="about" className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-serif mb-4">About DYC</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Diocesan Youth Council (DYC) of Koforidua is committed to fostering spiritual growth,
              leadership development, and community service among Catholic youth across our diocese.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Through our various programmes and events, we aim to strengthen the faith of our young people
              and prepare them to be active witnesses of Christ's love in their communities.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Faith Formation", "Youth Empowerment", "Community Service"].map((item, i) => (
                <Badge key={i} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
