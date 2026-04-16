import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getNewsArticle } from "@/functions/news"
import { getNewsLikes, getNewsComments, likeNews, addNewsComment } from "@/functions/news-engagement"
import { ArrowLeft, Heart, Share2, MessageCircle, Send, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

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
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Article Not Found</h1>
        <p className="mb-6 text-muted-foreground">
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

interface Comment {
  id: number
  commenterName: string
  body: string
  createdAt: string
}

function NewsDetailPage() {
  const article = Route.useLoaderData()
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentName, setCommentName] = useState("")
  const [commentBody, setCommentBody] = useState("")
  const [commenting, setCommenting] = useState(false)
  const visitorId = typeof window !== "undefined" ? localStorage.getItem("visitor_id") || "" : ""

  useEffect(() => {
    getNewsLikes({ data: { newsId: article.id, identifier: visitorId } })
      .then((result) => {
        setLikeCount(result.likeCount)
        setLiked(result.liked)
      })
      .catch(() => {})
    getNewsComments({ data: { newsId: article.id } })
      .then(setComments)
      .catch(() => {})
  }, [article.id, visitorId])

  const handleLike = async () => {
    setLiking(true)
    const newId = visitorId || Math.random().toString(36).slice(2)
    if (!visitorId) localStorage.setItem("visitor_id", newId)
    
    const result = await likeNews({ data: { newsId: article.id, identifier: newId } })
    setLikeCount(result.likeCount)
    setLiked(result.liked)
    setLiking(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentName.trim() || !commentBody.trim()) return
    
    setCommenting(true)
    try {
      const comment = await addNewsComment({
        data: { newsId: article.id, commenterName: commentName, body: commentBody }
      })
      setComments([...comments, comment])
      setCommentName("")
      setCommentBody("")
      toast.success("Comment posted!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment")
    } finally {
      setCommenting(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to News
          </Link>
        </Button>

        <article>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {article.scope}
            </Badge>
            {article.isPinned ? <Badge>Pinned</Badge> : null}
          </div>

          <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {article.title}
          </h1>

          <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
            {date ? <span>{date}</span> : null}
            {article.authorName ? (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>By {article.authorName}</span>
              </>
            ) : null}
          </div>

          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="mb-8 w-full rounded-lg object-cover"
              style={{ maxHeight: "24rem" }}
            />
          ) : null}

          <div className="space-y-4">
            {paragraphs.map((paragraph: string, i: number) => (
              <p key={i} className="leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Engagement Bar */}
          <div className="mt-8 flex items-center gap-4 border-t border-b border-border py-4">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={liking}
              className="gap-2"
            >
              {liking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
              )}
              {likeCount}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              {shareCopied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  Share
                </>
              )}
            </Button>

            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="size-4" />
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Button>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>

            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm mb-6">Be the first to leave a comment.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{comment.commenterName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleComment} className="space-y-4">
              <Input
                placeholder="Your name"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                maxLength={80}
                required
              />
              <Textarea
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                maxLength={1000}
                required
                rows={3}
              />
              <Button type="submit" disabled={commenting} className="gap-2">
                {commenting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Post Comment
              </Button>
            </form>
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}