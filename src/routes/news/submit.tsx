import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader"
import { submitPublicNews } from "@/functions/news-submissions"
import { ArrowLeft, CheckCircle } from "lucide-react"

export const Route = createFileRoute("/news/submit")({
  component: NewsSubmitPage,
})

function NewsSubmitPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      submitterName: form.get("submitterName") as string,
      submitterEmail: (form.get("submitterEmail") as string) || undefined,
      submitterPhone: (form.get("submitterPhone") as string) || undefined,
      title: form.get("title") as string,
      body: form.get("body") as string,
      imageUrl: coverUrl ?? undefined,
      images: images.map((img) => img.url),
    }

    try {
      await submitPublicNews({ data })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Link>
        </Button>

        {submitted ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your news story has been submitted successfully. Our editorial team will review it shortly.
              </p>
              <Button asChild variant="outline">
                <Link to="/news">Browse News</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Submit a News Story</CardTitle>
              <p className="text-sm text-muted-foreground">
                Share news from your parish or community. All submissions are reviewed before publishing.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="submitterName">Your Name *</Label>
                  <Input
                    id="submitterName"
                    name="submitterName"
                    required
                    minLength={2}
                    placeholder="Full name"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submitterEmail">Email</Label>
                    <Input
                      id="submitterEmail"
                      name="submitterEmail"
                      type="email"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submitterPhone">Phone</Label>
                    <Input
                      id="submitterPhone"
                      name="submitterPhone"
                      type="tel"
                      placeholder="+233 XXX XXX XXX"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-4">
                  At least one contact method (email or phone) is required.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="title">Story Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    minLength={5}
                    placeholder="A descriptive headline for your story"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Story Content *</Label>
                  <Textarea
                    id="body"
                    name="body"
                    required
                    minLength={20}
                    rows={8}
                    placeholder="Write your news story here..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Images (optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload photos to accompany your story. Click an image to set it as the cover photo.
                  </p>
                  <ImageUploader
                    images={images}
                    onImagesChange={setImages}
                    coverUrl={coverUrl}
                    onCoverChange={setCoverUrl}
                    maxFiles={5}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Story"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
