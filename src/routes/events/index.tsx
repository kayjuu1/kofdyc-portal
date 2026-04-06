import { createFileRoute, Link } from "@tanstack/react-router"
import { MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { ScopeFilter } from "@/components/ScopeFilter"
import { getEvents } from "@/functions/events"

type SearchParams = {
  page?: number
  scope?: "diocese" | "deanery" | "parish"
  eventType?: string
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

const EVENT_TYPES = ["mass", "rally", "retreat", "congress", "meeting", "other"] as const

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    page: Number(search.page) || 1,
    scope: search.scope as SearchParams["scope"],
    eventType: search.eventType as string | undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getEvents({
      data: {
        status: "published",
        scope: deps.scope,
        eventType: deps.eventType,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: EventsPage,
})

function EventsPage() {
  const data = Route.useLoaderData()
  const { eventType } = Route.useSearch()
  const navigate = Route.useNavigate()
  const eventList = (data.events || []) as EventItem[]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-serif">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upcoming events across the Diocese of Koforidua
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
          <ScopeFilter />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!eventType ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    eventType: undefined,
                  }),
                })
              }
            >
              All Types
            </Button>
            {EVENT_TYPES.map((type) => (
              <Button
                key={type}
                variant={eventType === type ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  navigate({
                    search: (prev: Record<string, unknown>) => ({
                      ...prev,
                      eventType: type,
                    }),
                  })
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {eventList.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No events found.</p>
            <p className="text-sm mt-2">Check back soon for upcoming events.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventList.map((event) => (
              <Link key={event.id} to="/events/$id" params={{ id: String(event.id) }}>
                <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer">
                  {event.coverImageUrl && (
                    <div
                      className="h-40 bg-cover bg-center rounded-t-lg"
                      style={{ backgroundImage: `url(${event.coverImageUrl})` }}
                    />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {event.eventType}
                      </Badge>
                      {event.registrationType === "paid" && (
                        <Badge variant="secondary" className="text-xs">
                          {event.feeCurrency} {event.feeAmount}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.startAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
