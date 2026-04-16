import { useState } from "react"
import { Download, Loader2, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface DocumentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: number
    title: string
    category: string
    fileUrl: string
    mimeType: string | null
    dateIssued: string | null
    uploaderName: string | null
  } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  pastoral_letters: "Pastoral Letters",
  circulars: "Circulars",
  meeting_minutes: "Meeting Minutes",
  reports: "Reports",
  constitution_guidelines: "Constitution & Guidelines",
  pastoral_programmes: "Pastoral Programmes",
  other: "Other",
}

export function DocumentPreview({ open, onOpenChange, document }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  if (!document) return null

  const isPdf = document.mimeType === "application/pdf"
  const isImage = document.mimeType?.startsWith("image/")
  const isOffice = document.mimeType?.includes("officedocument") || 
    document.mimeType?.includes("ms-excel") ||
    document.mimeType?.includes("ms-word") ||
    document.mimeType?.includes("vnd.openxmlformats")

  const getPreviewUrl = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/documents/${document.id}/download`)
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        setSignedUrl(data.url)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    if (!signedUrl && !error) {
      getPreviewUrl()
    }
  }

  const renderViewer = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (error || !signedUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-muted-foreground mb-4">Unable to preview this document.</p>
          <Button asChild>
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download instead
            </a>
          </Button>
        </div>
      )
    }

    if (isPdf) {
      return (
        <iframe
          src={signedUrl}
          className="w-full h-[70vh]"
          title={document.title}
        />
      )
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-[70vh] overflow-auto">
          <img
            src={signedUrl}
            alt={document.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )
    }

    if (isOffice) {
      const encodedUrl = encodeURIComponent(signedUrl)
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`}
          className="w-full h-[70vh]"
          title={document.title}
        />
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">This file type cannot be previewed.</p>
        <Button asChild>
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
            <Download className="w-4 h-4 mr-2" />
            Download instead
          </a>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg font-medium truncate flex-1 mr-4">
              {document.title}
            </DialogTitle>
            <Button asChild variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            <Badge variant="secondary">
              {CATEGORY_LABELS[document.category] || document.category}
            </Badge>
            {document.dateIssued && (
              <span>{new Date(document.dateIssued).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
            {document.uploaderName && (
              <>
                <span>·</span>
                <span>{document.uploaderName}</span>
              </>
            )}
          </div>
        </DialogHeader>

        {!loading && !error && !signedUrl && (
          <div className="mb-4">
            <Button onClick={handlePreview}>
              Preview Document
            </Button>
          </div>
        )}

        {renderViewer()}
      </DialogContent>
    </Dialog>
  )
}