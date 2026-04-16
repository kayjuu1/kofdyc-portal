import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { ArrowLeft, CheckCircle, Upload, Loader2, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getActiveSubmissionPrompt, submitPublicResponses } from "@/functions/submission-prompts"
import { toast } from "sonner"

interface PromptField {
  id: number
  label: string
  placeholder: string | null
  isRequired: boolean
  fieldType: string
  sortOrder: number
}

interface ActivePrompt {
  id: number
  title: string
  fields: PromptField[]
}

export const Route = createFileRoute("/programmes/submit")({
  loader: async () => {
    const prompt = await getActiveSubmissionPrompt()
    return { prompt: prompt as ActivePrompt | null }
  },
  component: PublicSubmitPage,
})

function FileUploadField({
  accept,
  label,
  value,
  onChange,
  placeholder,
  fileTypeLabel,
}: {
  accept: string
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  fileTypeLabel: string
}) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("category", "programmes")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json()) as { error?: string; files: { url: string; filename: string }[] }
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed")
        return
      }
      if (data.files.length > 0) {
        onChange(data.files[0].url)
        setFileName(data.files[0].filename)
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {accept.startsWith("image") ? (
            <img src={value} alt={label} className="w-16 h-16 rounded object-cover" />
          ) : (
            <FileText className="w-10 h-10 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || value}</p>
            <p className="text-xs text-muted-foreground">{fileTypeLabel} uploaded</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => { onChange(""); setFileName("") }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="w-6 h-6" />
              <span className="text-sm">{placeholder || `Upload ${fileTypeLabel}`}</span>
              <span className="text-xs">
                {accept.startsWith("image") ? "JPEG, PNG, WebP, GIF" : "PDF files"} — max 20MB
              </span>
            </div>
          )}
        </button>
      )}
    </div>
  )
}

function PublicSubmitPage() {
  const { prompt } = Route.useLoaderData()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState<Record<number, string>>({})

  if (!prompt) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Active Submission Prompt</h1>
          <p className="text-muted-foreground mb-6">
            There is currently no open submission prompt. Please check back later.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </main>
        <PublicFooter />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate required fields
    const missingRequired = prompt!.fields
      .filter((f) => f.isRequired && !responses[f.id]?.trim())
      .map((f) => f.label)

    if (missingRequired.length > 0) {
      setError(`Please fill in: ${missingRequired.join(", ")}`)
      return
    }

    setLoading(true)
    try {
      const responseArray = prompt!.fields
        .filter((f) => responses[f.id]?.trim())
        .map((f) => ({
          fieldId: f.id,
          value: responses[f.id].trim(),
        }))

      await submitPublicResponses({
        data: {
          promptId: prompt!.id,
          responses: responseArray,
        },
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function renderField(field: PromptField) {
    const fieldType = field.fieldType || "text"

    if (fieldType === "image") {
      return (
        <FileUploadField
          accept="image/jpeg,image/png,image/webp,image/gif"
          label={field.label}
          value={responses[field.id] || ""}
          onChange={(url) => setResponses((prev) => ({ ...prev, [field.id]: url }))}
          placeholder={field.placeholder || `Upload image for ${field.label.toLowerCase()}`}
          fileTypeLabel="Image"
        />
      )
    }

    if (fieldType === "pdf") {
      return (
        <FileUploadField
          accept="application/pdf"
          label={field.label}
          value={responses[field.id] || ""}
          onChange={(url) => setResponses((prev) => ({ ...prev, [field.id]: url }))}
          placeholder={field.placeholder || `Upload PDF for ${field.label.toLowerCase()}`}
          fileTypeLabel="PDF"
        />
      )
    }

    return (
      <Textarea
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        value={responses[field.id] || ""}
        onChange={(e) => setResponses((prev) => ({ ...prev, [field.id]: e.target.value }))}
        rows={3}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {submitted ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Submission Received!</h2>
              <p className="text-muted-foreground mb-6">
                Your programme submission has been received successfully. Thank you!
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">{prompt.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in the details below. Fields marked with * are required.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {error}
                  </div>
                )}

                {prompt.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
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
