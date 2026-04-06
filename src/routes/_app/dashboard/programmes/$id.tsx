import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProgramme, reviewProgramme } from "@/functions/programmes"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "secondary",
  approved: "default",
  returned: "destructive",
}

export const Route = createFileRoute("/_app/dashboard/programmes/$id")({
  loader: async ({ params }) => {
    return getProgramme({ data: { id: parseInt(params.id) } })
  },
  component: ProgrammeDetailPage,
})

function ProgrammeDetailPage() {
  const programme = Route.useLoaderData()
  const router = useRouter()
  const [reviewComment, setReviewComment] = useState("")

  const reviewMutation = useMutation({
    mutationFn: (data: Parameters<typeof reviewProgramme>[0]["data"]) =>
      reviewProgramme({ data }),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "approved" ? "Programme approved" : "Programme returned")
      router.invalidate()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const canReviewStage1 = programme.status === "submitted"
  const canReviewStage2 = programme.status === "under_review"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/programmes">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {programme.parishName} — {programme.year}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={STATUS_COLORS[programme.status] ?? "outline"}>
              {programme.status.replace("_", " ")}
            </Badge>
            {programme.submitterName && (
              <span className="text-sm text-muted-foreground">
                by {programme.submitterName}
              </span>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities ({programme.activities.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Responsible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programme.activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {activity.description || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{activity.responsiblePerson || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {programme.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {programme.reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start gap-3 p-3 rounded-md border"
              >
                {review.decision === "approved" ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      Stage {review.stage} — {review.decision}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by {review.reviewerName}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(review.reviewedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(canReviewStage1 || canReviewStage2) && (
        <Card>
          <CardHeader>
            <CardTitle>
              Review — Stage {canReviewStage1 ? "1 (Deanery)" : "2 (Executive)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Comment (optional)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  reviewMutation.mutate({
                    programmeId: programme.id,
                    stage: canReviewStage1 ? 1 : 2,
                    decision: "approved",
                    comment: reviewComment || undefined,
                  })
                }
                disabled={reviewMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  reviewMutation.mutate({
                    programmeId: programme.id,
                    stage: canReviewStage1 ? 1 : 2,
                    decision: "returned",
                    comment: reviewComment || undefined,
                  })
                }
                disabled={reviewMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Return for Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
