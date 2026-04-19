import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { DocumentPreview } from "@/components/DocumentPreview"
import { getDocuments } from "@/functions/documents"
import { Search, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react"

type SearchParams = {
  page?: number
  search?: string
  category?: string
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

interface DocItem {
  id: number
  title: string
  category: string
  scope: string
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  issuingAuthority: string | null
  dateIssued: string | null
  uploaderName: string | null
  createdAt: string
}

export const Route = createFileRoute("/documents/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || undefined,
    category: (search.category as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getDocuments({
      data: {
        page: deps.page,
        limit: 20,
        search: deps.search,
        category: deps.category as "pastoral_letters" | "circulars" | "meeting_minutes" | "reports" | "constitution_guidelines" | "pastoral_programmes" | "other" | undefined,
      },
    })
  },
  component: DocumentsPage,
})

function DocumentsPage() {
  const data = Route.useLoaderData()
  const { page, search, category } = Route.useSearch()
  const navigate = Route.useNavigate()
  const docs = data.documents as DocItem[]
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null)

  const handlePreview = (doc: DocItem) => {
    setPreviewDoc(doc)
    setPreviewOpen(true)
  }

  const canPreview = (doc: DocItem) => {
    const type = doc.mimeType
    if (!type) return false
    return type === "application/pdf" || type.startsWith("image/") || type.includes("officedocument")
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <DocumentPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-serif">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official documents, letters, and reports from the Diocese
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form
            className="relative w-full sm:w-80"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              navigate({
                search: (prev: Record<string, unknown>) => ({
                  ...prev,
                  search: (form.get("search") as string) || undefined,
                  page: undefined,
                }),
              })
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search documents..."
              defaultValue={search}
              className="pl-9"
            />
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <Select
              value={category || "all"}
              onValueChange={(value) =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    category: value === "all" ? undefined : value,
                    page: undefined,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No documents found.</p>
            {(search || category) && (
              <p className="text-sm mt-2">Try different filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {docs.map((doc: DocItem) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </Badge>
                        {doc.issuingAuthority && (
                          <>
                            <span className="text-border">·</span>
                            <span>{doc.issuingAuthority}</span>
                          </>
                        )}
                        {doc.dateIssued && (
                          <>
                            <span className="text-border">·</span>
                            <span>
                              {new Date(doc.dateIssued).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {canPreview(doc) && (
                        <Button variant="outline" size="sm" onClick={() => handlePreview(doc)} className="hidden sm:inline-flex">
                          Preview
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!page || page <= 1}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({ ...prev, page: ((page ?? 1) as number) - 1 }),
                    })
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page ?? 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page ?? 1) >= data.totalPages}
                  onClick={() =>
                    navigate({
                      search: (prev: Record<string, unknown>) => ({ ...prev, page: ((page ?? 1) as number) + 1 }),
                    })
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}