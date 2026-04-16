import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import {
  Archive,
  Eye,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Pin,
  Plus,
  Search,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import {
  DashboardEmptyState,
  DashboardFilterPills,
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { archiveNewsArticle, getNewsForAdmin } from "@/functions/news"

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

const statusOptions = ["draft", "published", "archived"] as const

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

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

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
    ? articles.filter((article) => article.title.toLowerCase().includes(search.toLowerCase()))
    : articles

  const publishedCount = articles.filter((article) => article.status === "published").length
  const draftCount = articles.filter((article) => article.status === "draft").length
  const featuredCount = articles.filter((article) => article.isPinned).length

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="News"
        description="Draft, publish, and manage articles."
        action={{
          label: "Create Article",
          href: "/dashboard/news/create",
          icon: Plus,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Published"
          value={publishedCount}
          icon={Newspaper}
          tone="gold"
          detail="Visible to public"
        />
        <DashboardStatCard
          label="Drafts"
          value={draftCount}
          icon={Pencil}
          tone="sky"
          detail="In progress"
        />
        <DashboardStatCard
          label="Featured"
          value={featuredCount}
          icon={Pin}
          tone="emerald"
          detail="Pinned articles"
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <DashboardFilterPills
              items={statusOptions}
              value={status}
              onSelect={(nextStatus) =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    status: nextStatus,
                    page: undefined,
                  }),
                })
              }
              formatLabel={formatStatusLabel}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {filteredArticles.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={Newspaper}
                title="No articles found"
                description="Adjust the search or filter to find what you're looking for."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{article.title}</span>
                        {article.isPinned ? (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{article.scope}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          article.status === "published"
                            ? "default"
                            : article.status === "draft"
                              ? "outline"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{article.authorName || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(article.publishedAt
                        ? new Date(article.publishedAt)
                        : new Date(article.createdAt)
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/news/$slug" params={{ slug: article.slug ?? "" }} target="_blank">
                              <Eye className="mr-2 size-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/news/$id" params={{ id: String(article.id) }}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {article.status !== "archived" ? (
                            <DropdownMenuItem onClick={() => archiveMutation.mutate(article.id)}>
                              <Archive className="mr-2 size-4" />
                              Archive
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
