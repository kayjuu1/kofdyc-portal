import { createFileRoute } from "@tanstack/react-router"
import { resolveCallerIdentity } from "@/functions/chaplain"
import { env } from "cloudflare:workers"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

export const Route = createFileRoute("/api/chat/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const token = url.searchParams.get("token")

          // Verify auth
          try {
            await resolveCallerIdentity(request, token)
          } catch {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            })
          }

          const contentType = request.headers.get("content-type") ?? ""
          if (!contentType.includes("multipart/form-data")) {
            return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }

          const formData = await request.formData()
          const file = formData.get("file") as File | null

          if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }

          if (!ALLOWED_TYPES.includes(file.type)) {
            return new Response(
              JSON.stringify({
                error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, PDF`,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            )
          }

          if (file.size > MAX_FILE_SIZE) {
            return new Response(
              JSON.stringify({ error: `File exceeds 5MB limit` }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            )
          }

          const ext = file.name.split(".").pop() ?? "bin"
          const key = `chat/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

          await env.R2_BUCKET.put(key, file.stream(), {
            httpMetadata: { contentType: file.type },
          })

          return new Response(
            JSON.stringify({
              key,
              filename: file.name,
              size: file.size,
              mimeType: file.type,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          )
        } catch (err) {
          console.error("Chat upload error:", err)
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      },
    },
  },
})
