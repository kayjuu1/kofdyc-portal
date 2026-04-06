import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { ArrowLeft, Upload, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { uploadDocument } from "@/functions/documents"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "meeting_minutes", label: "Meeting Minutes" },
  { value: "circulars", label: "Circulars" },
  { value: "pastoral_letters", label: "Pastoral Letters" },
  { value: "reports", label: "Reports" },
  { value: "constitution_guidelines", label: "Constitution & Guidelines" },
  { value: "pastoral_programmes", label: "Pastoral Programmes" },
  { value: "other", label: "Other" },
]

const MAX_FILE_SIZE = 20 * 1024 * 1024

export const Route = createFileRoute("/_app/dashboard/documents/upload")({
  component: UploadDocumentPage,
})

function UploadDocumentPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    category: "other",
    scope: "diocese" as "diocese" | "deanery" | "parish",
    dateIssued: "",
    issuingAuthority: "",
  })

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof uploadDocument>[0]["data"]) =>
      uploadDocument({ data }),
    onSuccess: () => {
      toast.success("Document uploaded successfully")
      navigate({ to: "/dashboard/documents" })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File exceeds 20MB limit")
      return
    }
    setFile(selected)
    if (!formData.title) {
      setFormData({ ...formData, title: selected.name.replace(/\.[^.]+$/, "") })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file")
      return
    }

    setUploading(true)
    try {
      // Step 1: Upload file to R2
      const uploadFormData = new FormData()
      uploadFormData.append("files", file)
      uploadFormData.append("category", "documents")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? "Upload failed")
      }

      const result = await res.json() as { files: Array<{ key: string; url: string; filename: string; size: number }> }
      const uploaded = result.files[0]

      // Step 2: Save document metadata
      saveMutation.mutate({
        title: formData.title,
        category: formData.category,
        scope: formData.scope,
        dateIssued: formData.dateIssued || undefined,
        issuingAuthority: formData.issuingAuthority || undefined,
        fileUrl: uploaded.url,
        fileName: uploaded.filename,
        fileSize: uploaded.size,
        mimeType: file.type,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/documents">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Document</h1>
          <p className="text-sm text-muted-foreground">Add a new document to the repository</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>File</CardTitle>
          </CardHeader>
          <CardContent>
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/50">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a file (PDF, DOCX, XLSX, or images — max 20MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v) =>
                    setFormData({ ...formData, scope: v as typeof formData.scope })
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateIssued">Date Issued</Label>
              <Input
                id="dateIssued"
                type="date"
                value={formData.dateIssued}
                onChange={(e) => setFormData({ ...formData, dateIssued: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="issuingAuthority">Issuing Authority</Label>
              <Input
                id="issuingAuthority"
                value={formData.issuingAuthority}
                onChange={(e) =>
                  setFormData({ ...formData, issuingAuthority: e.target.value })
                }
                placeholder="e.g., Bishop's Office, DYC Executive"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate({ to: "/dashboard/documents" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={uploading || saveMutation.isPending || !file}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading || saveMutation.isPending ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </form>
    </div>
  )
}
