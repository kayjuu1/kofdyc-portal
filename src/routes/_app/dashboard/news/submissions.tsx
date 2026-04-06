import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { Check, X, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getNewsSubmissions, reviewNewsSubmission } from "@/functions/news-submissions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { canonicalizeRole } from "@/lib/permissions"

type StatusFilter = "pending" | "approved" | "rejected"

export const Route = createFileRoute("/_app/dashboard/news/submissions")({
  beforeLoad: ({ context }) => {
    const role = canonicalizeRole((context.session.user as { role?: string }).role)
    if (role !== "diocesan_executive" && role !== "system_admin") {
      throw redirect({ to: "/dashboard/news" })
    }
  },
  component: NewsSubmissionsPage,
})

function NewsSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [page, setPage] = useState(1)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["news-submissions", statusFilter, page],
    queryFn: () => getNewsSubmissions({ data: { status: statusFilter, page, limit: 20 } }),
  })

  const reviewMutation = useMutation({
    mutationFn: (input: Parameters<typeof reviewNewsSubmission>[0]["data"]) =>
      reviewNewsSubmission({ data: input }),
    onSuccess: (_, variables) => {
      toast.success(variables.decision === "approved" ? "Submission approved and published" : "Submission rejected")
      setReviewingId(null)
      setRejectComment("")
      queryClient.invalidateQueries({ queryKey: ["news-submissions"] })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to review submission")
    },
  })

  const submissions = data?.submissions ?? []
  const totalPages = data?.totalPages ?? 1

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">News Submissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and moderate public news submissions</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(status); setPage(1) }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No {statusFilter} submissions found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{sub.title}</CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>By {sub.submitterName}</span>
                      {sub.submitterEmail && <span>{sub.submitterEmail}</span>}
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge className={statusColors[sub.status]}>{sub.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviewingId === sub.id ? (
                  <>
                    <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {sub.body}
                    </div>
                    {sub.imageUrl && (
                      <img src={sub.imageUrl} alt="" className="max-h-48 rounded-md object-cover" />
                    )}

                    {sub.status === "pending" && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="grid gap-2">
                          <Label>Rejection Comment (optional)</Label>
                          <Textarea
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            placeholder="Provide feedback if rejecting..."
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ id: sub.id, decision: "approved" })}
                            disabled={reviewMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve & Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewMutation.mutate({ id: sub.id, decision: "rejected", reviewComment: rejectComment || undefined })}
                            disabled={reviewMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReviewingId(null); setRejectComment("") }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {sub.status !== "pending" && sub.reviewComment && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Review comment:</span> {sub.reviewComment}
                        </p>
                        {sub.reviewerName && (
                          <p className="text-xs text-muted-foreground mt-1">Reviewed by {sub.reviewerName}</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {sub.body.length > 150 ? sub.body.slice(0, 150) + "..." : sub.body}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setReviewingId(sub.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
