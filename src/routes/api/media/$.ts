import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { verifySignedUrl } from "@/lib/r2"

export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = params._splat
        if (!key) {
          return new Response("Not found", { status: 404 })
        }

        const url = new URL(request.url)
        const expires = url.searchParams.get("expires")
        const sig = url.searchParams.get("sig")

        if (expires && sig) {
          const valid = await verifySignedUrl(key, expires, sig)
          if (!valid) {
            return new Response("Forbidden: invalid or expired signature", { status: 403 })
          }
        }

        const object = await env.R2_BUCKET.get(key)
        if (!object) {
          return new Response("Not found", { status: 404 })
        }

        const headers = new Headers()
        headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
        headers.set("Cache-Control", "public, max-age=31536000, immutable")
        headers.set("ETag", object.etag)

        return new Response(object.body as ReadableStream, { headers })
      },
    },
  },
})
