import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getNewsForAdmin } from "@/functions/news"
import { getNewsSubmissions, reviewNewsSubmission } from "@/functions/news-submissions"
import { archiveNewsArticle } from "@/functions/news"
import {
  CheckCircle,
  XCircle,
  Eye,
  Archive,
  Loader2,
} from "lucide-react"

export const Route = createFileRoute("/_app/dashboard/news")({
  head: () => ({
    meta: [{ title: "News Management | DYC Koforidua" }],
  }),
  loader: async () => {
    const [published, drafts, submissions] = await Promise.all([
      getNewsForAdmin({ data: { status: "published" } }),
      getNewsForAdmin({ data: { status: "draft" } }),
      getNewsSubmissions({ data: { status: "pending" } }),
    ])
    return { published, drafts, submissions }
  },
  component: AdminNewsPage,
})

function AdminNewsPage() {
  const data = Route.useLoaderData()

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">News Management</h1>
        <p className="text-muted-foreground mt-1">Manage articles and review public submissions.</p>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions" className="gap-2">
            Submissions
            {data.submissions.total > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {data.submissions.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="published">Published ({data.published.total})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({data.drafts.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
          <SubmissionsTab submissions={data.submissions.submissions} />
        </TabsContent>

        <TabsContent value="published" className="mt-6">
          <ArticlesTab articles={data.published.articles} type="published" />
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <ArticlesTab articles={data.drafts.articles} type="draft" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SubmissionsTab({
  submissions,
}: {
  submissions: Array<{
    id: number
    submitterName: string
    submitterEmail: string | null
    submitterPhone: string | null
    title: string
    body: string
    imageUrl: string | null
    status: string
    createdAt: string
  }>
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState("")
  const [loading, setLoading] = useState<number | null>(null)
  const [processed, setProcessed] = useState<Set<number>>(new Set())

  async function handleReview(id: number, decision: "approved" | "rejected") {
    setLoading(id)
    try {
      await reviewNewsSubmission({
        data: {
          id,
          decision,
          reviewComment: decision === "rejected" ? rejectComment : undefined,
        },
      })
      setProcessed((prev) => new Set(prev).add(id))
      setRejectId(null)
      setRejectComment("")
    } catch (err) {
      console.error("Review failed:", err)
    } finally {
      setLoading(null)
    }
  }

  const pending = submissions.filter((s) => !processed.has(s.id))

  if (pending.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No pending submissions.</p>
        <p className="text-sm mt-1">All caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pending.map((sub) => (
        <Card key={sub.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{sub.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{sub.submitterName}</span>
                  <span className="text-border">·</span>
                  <span>
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {sub.submitterEmail && (
                    <>
                      <span className="text-border">·</span>
                      <span>{sub.submitterEmail}</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {expandedId === sub.id ? "Hide" : "Preview"}
              </Button>
            </div>

            {expandedId === sub.id && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap mb-4">
                  {sub.body}
                </div>

                {rejectId === sub.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Reason for rejection</Label>
                      <Textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Explain why this submission is being rejected..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!rejectComment.trim() || loading === sub.id}
                        onClick={() => handleReview(sub.id, "rejected")}
                      >
                        {loading === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Confirm Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectId(null)
                          setRejectComment("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={loading === sub.id}
                      onClick={() => handleReview(sub.id, "approved")}
                    >
                      {loading === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve & Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectId(sub.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ArticlesTab({
  articles,
  type,
}: {
  articles: Array<{
    id: number
    title: string
    slug: string | null
    scope: string
    status: string
    isFeatured: boolean | null
    publishedAt: string | null
    createdAt: string
    authorName: string | null
  }>
  type: "published" | "draft"
}) {
  const [archiving, setArchiving] = useState<number | null>(null)
  const [archived, setArchived] = useState<Set<number>>(new Set())

  async function handleArchive(id: number) {
    setArchiving(id)
    try {
      await archiveNewsArticle({ data: { id } })
      setArchived((prev) => new Set(prev).add(id))
    } catch (err) {
      console.error("Archive failed:", err)
    } finally {
      setArchiving(null)
    }
  }

  const visible = articles.filter((a) => !archived.has(a.id))

  if (visible.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No {type} articles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visible.map((article) => (
        <Card key={article.id}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">{article.title}</h3>
                {article.isFeatured && (
                  <Badge variant="default" className="text-xs shrink-0">
                    Pinned
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs capitalize">
                  {article.scope}
                </Badge>
                {article.authorName && <span>by {article.authorName}</span>}
                <span className="text-border">·</span>
                <span>
                  {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            {type === "published" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={archiving === article.id}
                onClick={() => handleArchive(article.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                {archiving === article.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
