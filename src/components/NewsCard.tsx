import { Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

interface NewsCardProps {
  title: string
  slug: string | null
  body: string
  scope: string
  coverImageUrl?: string | null
  publishedAt: string | null
  authorName: string | null
  isFeatured: boolean | null
}

export function NewsCard({ title, slug, body, scope, coverImageUrl, publishedAt, authorName, isFeatured }: NewsCardProps) {
  const excerpt = body.length > 120 ? body.slice(0, 120) + "..." : body
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <Link to="/news/$slug" params={{ slug: slug ?? String(Date.now()) }} className="group">
      <Card className="h-full hover:border-primary/30 transition-colors overflow-hidden">
        {coverImageUrl && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardContent className={coverImageUrl ? "pt-4" : "pt-6"}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs capitalize">
              {scope}
            </Badge>
            {isFeatured && (
              <Badge variant="default" className="text-xs">
                Pinned
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{excerpt}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {date}
              {authorName && ` · ${authorName}`}
            </span>
            <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Read more <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
