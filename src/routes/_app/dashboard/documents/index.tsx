import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Download, FileText, FolderKanban, Plus, Search, Trash2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteDocument, getDocumentDownloadUrl, getDocuments } from "@/functions/documents"

const CATEGORIES = [
  { value: "meeting_minutes", label: "Meeting Minutes" },
  { value: "circulars", label: "Circulars" },
  { value: "pastoral_letters", label: "Pastoral Letters" },
  { value: "reports", label: "Reports" },
  { value: "constitution_guidelines", label: "Constitution & Guidelines" },
  { value: "pastoral_programmes", label: "Pastoral Programmes" },
  { value: "other", label: "Other" },
] as const

type SearchParams = {
  category?: string
  scope?: "diocese" | "deanery" | "parish"
  page?: number
}

type DocumentItem = {
  id: number
  title: string
  category: string
  scope: string
  dateIssued: string | null
  uploaderName: string | null
  fileSize: number | null
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
  if (!bytes) return "-"
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
  const documents = data.documents as DocumentItem[]

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDocument({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted")
      router.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
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
    ? documents.filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase()))
    : documents

  const scopeCount = new Set(documents.map((doc) => doc.scope)).size
  const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize ?? 0), 0)

  const categoryLabel = (value: string) =>
    CATEGORIES.find((categoryOption) => categoryOption.value === value)?.label ?? value

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Documents"
        description="Browse, upload, and manage the document archive."
        action={{
          label: "Upload Document",
          href: "/dashboard/documents/upload",
          icon: Plus,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Total Documents"
          value={documents.length}
          icon={FileText}
          tone="plum"
          detail="In current view"
        />
        <DashboardStatCard
          label="Scopes"
          value={scopeCount}
          icon={FolderKanban}
          tone="emerald"
          detail="Distinct levels"
        />
        <DashboardStatCard
          label="Storage"
          value={formatFileSize(totalSize)}
          icon={Download}
          tone="sky"
          detail="Current page total"
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={category ?? "all"}
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((categoryOption) => (
                    <SelectItem key={categoryOption.value} value={categoryOption.value}>
                      {categoryOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={scope ?? "all"}
                onValueChange={(value) =>
                  navigate({
                    search: (prev: Record<string, unknown>) => ({
                      ...prev,
                      scope: value === "all" ? undefined : (value as "diocese" | "deanery" | "parish"),
                      page: undefined,
                    }),
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={FileText}
                title="No documents found"
                description="Adjust your search or filters to find what you need."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabel(doc.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{doc.scope}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.dateIssued
                        ? new Date(doc.dateIssued).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">{doc.uploaderName || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this document?")) {
                              deleteMutation.mutate(doc.id)
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.totalPages > 1 ? (
        <div className="flex justify-center gap-1">
          {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((page) => (
            <Button
              key={page}
              variant={page === data.page ? "default" : "outline"}
              size="sm"
              className="size-8 p-0"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({ ...prev, page }),
                })
              }
            >
              {page}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
