// Set VITE_APP_URL=https://kofdyc.org (in .env.production / build env) once the
// custom domain is attached; canonical and og URLs flip automatically.
export const SITE_URL: string =
  import.meta.env.VITE_APP_URL ?? "https://kofdyc-portal.owusu.workers.dev"

export const SITE_NAME = "KOFDYC Portal"

export const DEFAULT_DESCRIPTION =
  "Official portal of the Koforidua Diocesan Youth Council (KOFDYC) — news, events, programmes, and formation resources for young Catholics across the Diocese of Koforidua."

// hex of --primary (oklch(0.525 0.131 247)); used for theme-color + manifest
export const BRAND_COLOR = "#126fb1"

type SeoInput = {
  title: string
  description?: string
  /** Path for the canonical URL, e.g. "/news". Omit to skip canonical/og:url. */
  path?: string
  /** Absolute URL or public/ path for the share image. Defaults to the site og image. */
  image?: string
}

function absolute(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`
}

/** Meta tags for a route's head(). Spread into `meta`; use seoLinks() for canonical. */
export function seo({ title, description = DEFAULT_DESCRIPTION, path, image = "/og-image.png" }: SeoInput) {
  const img = absolute(image)
  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: img },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: img },
  ]
  if (path !== undefined) {
    meta.push({ property: "og:url", content: absolute(path) })
  }
  return meta
}

/** Canonical link for a route's head() `links` array. */
export function seoLinks(path: string) {
  return [{ rel: "canonical", href: absolute(path) }]
}

/** Plain-text excerpt from markdown/HTML body for meta descriptions. */
export function excerpt(text: string, maxLength = 155): string {
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (plain.length <= maxLength) return plain
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, "")}…`
}
