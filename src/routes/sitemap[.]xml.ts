import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { events, hierarchyNodes, news } from "@/db/schema"
import { SITE_URL } from "@/lib/seo"

const STATIC_PATHS = [
  "/",
  "/news",
  "/events",
  "/leadership",
  "/hierarchy",
  "/programmes",
  "/documents",
  "/calendar",
  "/pastoral-letters",
  "/chaplain-contact",
  "/news/submit",
]

function urlEntry(path: string, lastmod?: string | null): string {
  const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ""
  return `<url><loc>${SITE_URL}${path}</loc>${lastmodTag}</url>`
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [newsRows, eventRows, hierarchyRows] = await Promise.all([
          db
            .select({ slug: news.slug, updatedAt: news.updatedAt })
            .from(news)
            .where(eq(news.status, "published")),
          db
            .select({ id: events.id, updatedAt: events.updatedAt })
            .from(events)
            .where(eq(events.status, "published")),
          db
            .select({ slug: hierarchyNodes.slug, updatedAt: hierarchyNodes.updatedAt })
            .from(hierarchyNodes)
            .where(eq(hierarchyNodes.isPublished, true)),
        ])

        const entries = [
          ...STATIC_PATHS.map((p) => urlEntry(p)),
          ...newsRows.filter((r) => r.slug).map((r) => urlEntry(`/news/${r.slug}`, r.updatedAt)),
          ...eventRows.map((r) => urlEntry(`/events/${r.id}`, r.updatedAt)),
          ...hierarchyRows.map((r) => urlEntry(`/hierarchy/${r.slug}`, r.updatedAt)),
        ]

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
