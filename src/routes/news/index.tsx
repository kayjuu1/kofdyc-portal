import { createFileRoute, Link } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { NewsCard } from "@/components/NewsCard"
import { ScopeFilter } from "@/components/ScopeFilter"
import { getPublishedNews } from "@/functions/news"
import { ChevronLeft, ChevronRight, Search, PenLine } from "lucide-react"

type SearchParams = {
  page?: number
  scope?: "diocese" | "deanery" | "parish"
  q?: string
}

interface NewsArticle {
  id: number
  title: string
  slug: string | null
  body: string
  scope: string
  coverImageUrl: string | null
  publishedAt: string | null
  authorName: string | null
  isPinned: boolean | null
}

export const Route = createFileRoute("/news/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    page: Number(search.page) || 1,
    scope: search.scope as SearchParams["scope"],
    q: (search.q as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getPublishedNews({
      data: {
        page: deps.page,
        limit: 12,
        scope: deps.scope,
        search: deps.q,
      },
    })
  },
  component: NewsListPage,
})

function NewsListPage() {
  const data = Route.useLoaderData()
  const { page, q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const articles = data.articles as NewsArticle[]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif">News</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Updates from across the Diocese of Koforidua
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/news/submit">
              <PenLine className="w-4 h-4 mr-2" />
              Submit a Story
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <ScopeFilter />
          <form
            className="relative w-full sm:w-64"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              navigate({
                search: (prev: Record<string, unknown>) => ({
                  ...prev,
                  q: (form.get("q") as string) || undefined,
                  page: undefined,
                }),
              })
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search news..."
              defaultValue={q}
              className="pl-9"
            />
          </form>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No news articles found.</p>
            {q && <p className="text-sm mt-2">Try a different search term.</p>}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: NewsArticle) => (
                <NewsCard key={article.id} {...article} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!page || page <= 1}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({ ...prev, page: ((page ?? 1) as number) - 1 }),
                    })
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page ?? 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page ?? 1) >= data.totalPages}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({ ...prev, page: ((page ?? 1) as number) + 1 }),
                    })
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
