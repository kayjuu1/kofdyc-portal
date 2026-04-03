import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getNewsArticle } from "@/functions/news"
import { ArrowLeft } from "lucide-react"

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const article = await getNewsArticle({ data: { slug: params.slug } })
    if (!article) {
      throw new Error("Article not found")
    }
    return article
  },
  component: NewsDetailPage,
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The article you are looking for does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link to="/news">Back to News</Link>
        </Button>
      </main>
      <PublicFooter />
    </div>
  ),
})

function NewsDetailPage() {
  const article = Route.useLoaderData()

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  const paragraphs = article.body.split("\n").filter((p: string) => p.trim())

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Link>
        </Button>

        <article>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="capitalize">
              {article.scope}
            </Badge>
            {article.isFeatured && <Badge>Pinned</Badge>}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {date && <span>{date}</span>}
            {article.authorName && (
              <>
                <span className="text-border">|</span>
                <span>By {article.authorName}</span>
              </>
            )}
          </div>

          {article.coverImageUrl && (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full rounded-lg mb-8 object-cover max-h-96"
            />
          )}

          <div className="prose prose-neutral max-w-none">
            {paragraphs.map((paragraph: string, i: number) => (
              <p key={i} className="text-foreground leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}
