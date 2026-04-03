import { createFileRoute } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { getPastoralLetters } from "@/functions/documents"
import { Search, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react"

type SearchParams = {
  page?: number
  search?: string
}

interface PastoralLetter {
  id: number
  title: string
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  issuingAuthority: string | null
  dateIssued: string | null
  uploaderName: string | null
  createdAt: string
}

export const Route = createFileRoute("/pastoral-letters")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getPastoralLetters({
      data: {
        page: deps.page,
        limit: 20,
        search: deps.search,
      },
    })
  },
  component: PastoralLettersPage,
})

function PastoralLettersPage() {
  const data = Route.useLoaderData()
  const { page, search } = Route.useSearch()
  const navigate = Route.useNavigate()
  const letters = data.letters as PastoralLetter[]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-serif">Pastoral Letters & Circulars</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official letters, circulars, and communications from the Diocese
          </p>
        </div>

        <form
          className="relative w-full sm:w-80 mb-8"
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
            placeholder="Search by title or authority..."
            defaultValue={search}
            className="pl-9"
          />
        </form>

        {letters.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No pastoral letters found.</p>
            {search && <p className="text-sm mt-2">Try a different search term.</p>}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {letters.map((letter: PastoralLetter) => (
                <Card key={letter.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{letter.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {letter.issuingAuthority && <span>{letter.issuingAuthority}</span>}
                        {letter.dateIssued && (
                          <>
                            {letter.issuingAuthority && <span className="text-border">·</span>}
                            <span>
                              {new Date(letter.dateIssued).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        )}
                        {letter.mimeType && (
                          <Badge variant="outline" className="text-[10px]">
                            {letter.mimeType === "application/pdf" ? "PDF" : letter.mimeType.split("/")[1]?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* TODO: Replace with signed R2 URL when lib/r2.ts is built */}
                    <Button asChild variant="outline" size="sm">
                      <a href={letter.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </Button>
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
