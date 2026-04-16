import { createFileRoute, Link } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { NewsCard } from "@/components/NewsCard"
import { ScopeFilter } from "@/components/ScopeFilter"
import { getPublishedNews } from "@/functions/news"
import { ChevronLeft, ChevronRight, Newspaper, PenLine, Search } from "lucide-react"

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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">News</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Updates from across the Diocese of Koforidua
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/news/submit">
              <PenLine className="mr-1.5 size-4" />
              Submit a Story
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" placeholder="Search news..." defaultValue={q} className="pl-9" />
          </form>
        </div>

        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">No news articles found.</p>
            {q ? <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p> : null}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: NewsArticle) => (
                <NewsCard key={article.id} {...article} />
              ))}
            </div>

            {data.totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!page || page <= 1}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        page: ((page ?? 1) as number) - 1,
                      }),
                    })
                  }
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {page ?? 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page ?? 1) >= data.totalPages}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        page: ((page ?? 1) as number) + 1,
                      }),
                    })
                  }
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
