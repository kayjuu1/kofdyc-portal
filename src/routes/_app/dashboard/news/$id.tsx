import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Save, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNewsArticleById, updateNewsArticle, archiveNewsArticle } from "@/functions/news"
import { getDeaneries, getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/dashboard/news/$id")({
  loader: async ({ params }) => {
    const [article, deaneries, parishes] = await Promise.all([
      getNewsArticleById({ data: { id: parseInt(params.id) } }),
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    return { article, deaneries, parishes }
  },
  component: EditNewsPage,
})

function EditNewsPage() {
  const { article, deaneries: deaneriesList, parishes: parishesList } = Route.useLoaderData()
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const roleLevel = getRoleLevel((session.user as { role?: string }).role ?? "member")

  const [formData, setFormData] = useState({
    title: article.title,
    body: article.body,
    scope: article.scope as "diocese" | "deanery" | "parish",
    scopeId: article.scopeId ?? undefined,
    coverImageUrl: article.coverImageUrl ?? "",
    status: article.status as "draft" | "published" | "archived",
  })

  const deaneries = deaneriesList || []
  const parishes = parishesList || []

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateNewsArticle>[0]["data"]) =>
      updateNewsArticle({ data: input }),
    onSuccess: () => {
      toast.success("Article updated")
      navigate({ to: "/dashboard/news" })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update article")
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveNewsArticle({ data: { id: article.id } }),
    onSuccess: () => {
      toast.success("Article archived")
      navigate({ to: "/dashboard/news" })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to archive article")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      id: article.id,
      title: formData.title,
      body: formData.body,
      scope: formData.scope,
      scopeId: formData.scopeId,
      coverImageUrl: formData.coverImageUrl || undefined,
      status: formData.status,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/news">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Article</h1>
            <p className="text-sm text-muted-foreground">Update article details</p>
          </div>
        </div>
        {roleLevel >= 2 && article.status !== "archived" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            <Archive className="w-4 h-4 mr-2" />
            {archiveMutation.isPending ? "Archiving..." : "Archive"}
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter article title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your article content..."
                rows={10}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Scope *</Label>
              <Select
                value={formData.scope}
                onValueChange={(v) => setFormData({ ...formData, scope: v as typeof formData.scope, scopeId: undefined })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diocese">Diocese</SelectItem>
                  <SelectItem value="deanery">Deanery</SelectItem>
                  <SelectItem value="parish">Parish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === "deanery" && (
              <div className="grid gap-2">
                <Label>Deanery</Label>
                <Select
                  value={formData.scopeId?.toString() || ""}
                  onValueChange={(v) => setFormData({ ...formData, scopeId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deanery" />
                  </SelectTrigger>
                  <SelectContent>
                    {deaneries.map((d: { id: number; name: string }) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.scope === "parish" && (
              <div className="grid gap-2">
                <Label>Parish</Label>
                <Select
                  value={formData.scopeId?.toString() || ""}
                  onValueChange={(v) => setFormData({ ...formData, scopeId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parish" />
                  </SelectTrigger>
                  <SelectContent>
                    {parishes.map((p: { id: number; name: string; deaneryId: number | null }) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/dashboard/news" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function getRoleLevel(role: string): number {
  const levels: Record<string, number> = {
    member: 0,
    coordinator: 1,
    dyc_executive: 2,
    diocesan_youth_chaplain: 3,
    system_admin: 4,
  }
  return levels[role] ?? 0
}
