import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader"
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
    return { deaneries: deaneries || [], parishes: parishes || [] }
  },
  component: CreateNewsPage,
})

function CreateNewsPage() {
  const { deaneries, parishes } = Route.useLoaderData()
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    scope: "diocese" as "diocese" | "deanery" | "parish",
    scopeId: undefined as number | undefined,
    status: "draft" as "draft" | "published",
    isPinned: false,
    publishDate: new Date().toISOString().split("T")[0],
  })
  const [images, setImages] = useState<UploadedImage[]>([])
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const authorName = session.user.name ?? "Unknown"

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createNewsArticle>[0]["data"]) =>
      createNewsArticle({ data: input }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "published"
          ? "Article published successfully"
          : "Article saved as draft"
      )
      navigate({ to: "/dashboard/news" })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create article")
    },
  })

  const handleSubmit = (status: "draft" | "published") => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!formData.body.trim()) {
      toast.error("Content is required")
      return
    }

    createMutation.mutate({
      title: formData.title,
      body: formData.body,
      scope: formData.scope,
      scopeId: formData.scopeId,
      coverImageUrl: coverUrl ?? undefined,
      status,
      isPinned: formData.isPinned,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/news">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Article</h1>
          <p className="text-sm text-muted-foreground">Create a new news article</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif">Article Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="A descriptive headline for your article"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Scope *</Label>
            <Select
              value={formData.scope}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  scope: v as typeof formData.scope,
                  scopeId: undefined,
                })
              }
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
            <div className="space-y-2">
              <Label>Deanery</Label>
              <Select
                value={formData.scopeId?.toString() || ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, scopeId: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deanery" />
                </SelectTrigger>
                <SelectContent>
                  {deaneries.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.scope === "parish" && (
            <div className="space-y-2">
              <Label>Parish</Label>
              <Select
                value={formData.scopeId?.toString() || ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, scopeId: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parish" />
                </SelectTrigger>
                <SelectContent>
                  {parishes.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">Content *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Write your article content here..."
              rows={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a cover image for your article. Click an image to set it as the cover.
            </p>
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              coverUrl={coverUrl}
              onCoverChange={setCoverUrl}
              maxFiles={5}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Author</Label>
              <Input value={authorName} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Auto-filled from your profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={(e) =>
                  setFormData({ ...formData, publishDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    status: v as typeof formData.status,
                  })
                }
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

            <div className="space-y-2">
              <Label>Featured</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  id="isPinned"
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) =>
                    setFormData({ ...formData, isPinned: e.target.checked })
                  }
                  className="size-4 rounded border-border"
                />
                <Label htmlFor="isPinned" className="font-normal cursor-pointer">
                  Pin to homepage
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : null}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("published")}
              disabled={createMutation.isPending}
            >
              <Send className="size-4 mr-2" />
              {createMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}