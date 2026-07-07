import { marked } from "marked"
import { filterXSS } from "xss"
import { cn } from "@/lib/utils"

// Tight allowlist: marked passes raw HTML through, so everything outside
// this list (script, style, iframe, event handlers, …) is stripped.
const ALLOWED_TAGS: Record<string, string[]> = {
  p: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  ul: [],
  ol: [],
  li: [],
  h3: [],
  h4: [],
  a: ["href"],
  blockquote: [],
  br: [],
  code: [],
  pre: [],
  hr: [],
}

export function renderMarkdownSafe(source: string): string {
  const html = marked.parse(source, { async: false }) as string
  return filterXSS(html, {
    whiteList: ALLOWED_TAGS,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe"],
  })
}

/**
 * Renders untrusted markdown (e.g. hierarchy brief histories) as sanitised
 * HTML. Sanitisation runs at render time on both server and client, so the
 * stored markdown is never trusted as HTML.
 */
export function MarkdownContent({
  source,
  className,
}: {
  source: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "space-y-3 leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(source) }}
    />
  )
}
