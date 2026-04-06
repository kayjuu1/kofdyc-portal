import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Plus, Search, Pencil, Eye, Archive, MoreHorizontal } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { getNewsForAdmin, archiveNewsArticle } from "@/functions/news"
import { useMutation } from "@tanstack/react-query"

type SearchParams = {
  status?: "draft" | "published" | "archived"
  page?: number
}

interface NewsItem {
  id: number
  title: string
  slug: string | null
  scope: string
  status: string
  isPinned: boolean | null
  publishedAt: string | null
  createdAt: string
  authorName: string | null
}

export const Route = createFileRoute("/_app/dashboard/news/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    status: (search.status as SearchParams["status"]) || undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => ({
    status: search.status,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    return getNewsForAdmin({
      data: {
        status: deps.status,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: NewsAdminPage,
})

function NewsAdminPage() {
  const data = Route.useLoaderData()
  const { status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const articles = data.articles as NewsItem[]
  const [search, setSearch] = useState("")

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveNewsArticle({ data: { id } }),
    onSuccess: () => {
      router.invalidate()
    },
  })

  const filteredArticles = search
    ? articles.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      )
    : articles

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and manage news articles
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/news/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Article
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["draft", "published", "archived"] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    status: s,
                    page: undefined,
                  }),
                })
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No articles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {article.isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        <span className="font-medium">{article.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{article.scope}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          article.status === "published"
                            ? "default"
                            : article.status === "draft"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.authorName || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString()
                        : new Date(article.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/news/$slug" params={{ slug: article.slug ?? "" }} target="_blank">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/news/$id" params={{ id: String(article.id) }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {article.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() => archiveMutation.mutate(article.id)}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/dashboard/news/submissions">
            View Submissions Queue
          </Link>
        </Button>
      </div>
    </div>
  )
}
