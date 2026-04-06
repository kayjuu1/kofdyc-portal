import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const contentType = request.headers.get("content-type") ?? ""
          if (!contentType.includes("multipart/form-data")) {
            return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }

          const formData = await request.formData()
          const files = formData.getAll("files") as File[]
          const category = (formData.get("category") as string) || "uploads"

          if (files.length === 0) {
            return new Response(JSON.stringify({ error: "No files provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }

          if (files.length > 10) {
            return new Response(JSON.stringify({ error: "Maximum 10 files per upload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            })
          }

          const uploaded: Array<{ key: string; url: string; filename: string; size: number }> = []

          for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
              return new Response(
                JSON.stringify({ error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, PDF, DOCX, XLSX` }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              )
            }

            if (file.size > MAX_FILE_SIZE) {
              return new Response(
                JSON.stringify({ error: `File "${file.name}" exceeds 20MB limit` }),
                { status: 400, headers: { "Content-Type": "application/json" } },
              )
            }

            const ext = file.name.split(".").pop() ?? "bin"
            const folder = ["uploads", "documents", "programmes"].includes(category) ? category : "uploads"
            const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

            await env.R2_BUCKET.put(key, file.stream(), {
              httpMetadata: { contentType: file.type },
            })

            uploaded.push({
              key,
              url: `/api/media/${key}`,
              filename: file.name,
              size: file.size,
            })
          }

          return new Response(JSON.stringify({ files: uploaded }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        } catch (err) {
          console.error("Upload error:", err)
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        }
      },
    },
  },
})
