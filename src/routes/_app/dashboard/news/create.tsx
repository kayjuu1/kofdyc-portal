import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Save, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNewsArticle } from "@/functions/news"
import { getDeaneries, getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/dashboard/news/create")({
  loader: async () => {
    const [deaneries, parishes] = await Promise.all([
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    return { deaneries, parishes }
  },
  component: CreateNewsPage,
})

function CreateNewsPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    scope: "diocese" as "diocese" | "deanery" | "parish",
    scopeId: undefined as number | undefined,
    coverImageUrl: "",
  })

  const deaneries = data.deaneries || []
  const parishes = data.parishes || []

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createNewsArticle>[0]["data"]) =>
      createNewsArticle({ data: input }),
    onSuccess: (_, variables) => {
      toast.success(variables.status === "published" ? "Article published" : "Article saved as draft")
      navigate({ to: "/dashboard/news" })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create article")
    },
  })

  const submitWithStatus = (status: "draft" | "published") => {
    createMutation.mutate({
      title: formData.title,
      body: formData.body,
      scope: formData.scope,
      scopeId: formData.scopeId,
      coverImageUrl: formData.coverImageUrl || undefined,
      status,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitWithStatus("draft")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/news">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Article</h1>
          <p className="text-sm text-muted-foreground">Write a new news article</p>
        </div>
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
          <Button type="submit" variant="outline" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => {
              const form = document.querySelector("form") as HTMLFormElement
              if (form?.reportValidity()) submitWithStatus("published")
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Publishing..." : "Save & Publish"}
          </Button>
        </div>
      </form>
    </div>
  )
}
