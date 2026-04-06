import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Plus, Search, Download, Trash2, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDocuments, getDocumentDownloadUrl, deleteDocument } from "@/functions/documents"
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

type SearchParams = {
  category?: string
  scope?: "diocese" | "deanery" | "parish"
  page?: number
}

export const Route = createFileRoute("/_app/dashboard/documents/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    category: search.category as string | undefined,
    scope: search.scope as "diocese" | "deanery" | "parish" | undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getDocuments({
      data: {
        category: deps.category,
        scope: deps.scope,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: DocumentsPage,
})

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsPage() {
  const data = Route.useLoaderData()
  const { category, scope } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [search, setSearch] = useState("")

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDocument({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted")
      router.invalidate()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleDownload = async (id: number) => {
    try {
      const result = await getDocumentDownloadUrl({ data: { id } })
      window.open(result.url, "_blank")
    } catch {
      toast.error("Failed to generate download link")
    }
  }

  const docs = search
    ? data.documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
      )
    : data.documents

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label ?? cat

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Repository</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage diocesan documents
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/documents/upload">
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={category ?? "all"}
          onValueChange={(v) =>
            navigate({
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                category: v === "all" ? undefined : v,
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={scope ?? "all"}
          onValueChange={(v) =>
            navigate({
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                scope: v === "all" ? undefined : v as "diocese" | "deanery" | "parish",
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All scopes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="diocese">Diocese</SelectItem>
            <SelectItem value="deanery">Deanery</SelectItem>
            <SelectItem value="parish">Parish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabel(doc.category)}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{doc.scope}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.dateIssued
                        ? new Date(doc.dateIssued).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{doc.uploaderName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("Delete this document?")) {
                              deleteMutation.mutate(doc.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === data.page ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({ ...prev, page: p }),
                })
              }
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
