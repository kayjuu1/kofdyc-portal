import { Link } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ImageIcon } from "lucide-react"

interface NewsCardProps {
  title: string
  slug: string | null
  body: string
  scope: string
  coverImageUrl?: string | null
  publishedAt: string | null
  authorName: string | null
  isPinned: boolean | null
}

export function NewsCard({
  title,
  slug,
  body,
  scope,
  coverImageUrl,
  publishedAt,
  authorName,
  isPinned,
}: NewsCardProps) {
  const excerpt = body.length > 120 ? body.slice(0, 120) + "..." : body
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const content = (
    <Card className="group h-full overflow-hidden border-border/50 transition-all hover:border-primary/20 hover:shadow-md">
      {/* Image area - always visible */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <ImageIcon className="size-8 text-primary/25" />
          </div>
        )}
        {/* Scope badge overlay */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <Badge className="border-0 bg-background/90 text-xs capitalize text-foreground shadow-sm backdrop-blur-sm">
            {scope}
          </Badge>
          {isPinned ? (
            <Badge className="border-0 bg-primary text-xs text-primary-foreground shadow-sm">
              Pinned
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="mb-1.5 line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {date}
            {authorName ? ` · ${authorName}` : ""}
          </span>
          <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read <ArrowRight className="size-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (slug) {
    return (
      <Link to="/news/$slug" params={{ slug }}>
        {content}
      </Link>
    )
  }

  return content
}
