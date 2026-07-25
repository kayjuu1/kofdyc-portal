/**
 * `news.images` / `news_submissions.images` are TEXT columns holding a JSON
 * array of upload URLs (see submitPublicNews in functions/news-submissions.ts).
 * Rows written before the gallery existed may hold null, "", or malformed JSON,
 * so parsing always degrades to an empty list instead of throwing.
 */
export function parseImageUrls(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((url): url is string => typeof url === "string" && url.length > 0)
  } catch {
    return []
  }
}

export function serializeImageUrls(urls: string[] | undefined): string | null {
  if (!urls || urls.length === 0) return null
  return JSON.stringify(urls)
}

/**
 * The full ordered gallery for an article: cover first, then every other
 * upload, de-duplicated so a cover that is also in `images` is not shown twice.
 */
export function galleryUrls(
  coverImageUrl: string | null | undefined,
  rawImages: string | null | undefined,
): string[] {
  const all = [...(coverImageUrl ? [coverImageUrl] : []), ...parseImageUrls(rawImages)]
  return [...new Set(all)]
}
