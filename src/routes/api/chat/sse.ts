import { createFileRoute } from "@tanstack/react-router"
import {
  resolveConversationAccess,
  resolveCallerIdentity,
  getMessageUpdates,
  getTypingStatus,
} from "@/functions/chaplain"

export const Route = createFileRoute("/api/chat/sse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get("token")
        const conversationIdParam = url.searchParams.get("conversationId")
        const lastMessageIdParam = url.searchParams.get("lastMessageId")

        let conversationId: number
        let myRole: "member" | "chaplain"

        try {
          if (token) {
            const access = await resolveConversationAccess(token)
            conversationId = access.conversationId
            myRole = "member"
          } else if (conversationIdParam) {
            const identity = await resolveCallerIdentity(request)
            if (identity.senderRole !== "chaplain") {
              return new Response("Forbidden", { status: 403 })
            }
            conversationId = parseInt(conversationIdParam)
            if (isNaN(conversationId)) {
              return new Response("Invalid conversationId", { status: 400 })
            }
            myRole = "chaplain"
          } else {
            return new Response("Missing token or conversationId", { status: 400 })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unauthorized"
          return new Response(message, { status: 401 })
        }

        let lastMessageId = parseInt(lastMessageIdParam ?? "0") || 0
        let lastPollTime = new Date().toISOString()
        const startTime = Date.now()
        const MAX_DURATION_MS = 55_000
        const POLL_INTERVAL_MS = 2_000
        const HEARTBEAT_INTERVAL_MS = 15_000

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()

            function send(event: string, data: unknown) {
              controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
            }

            function heartbeat() {
              controller.enqueue(encoder.encode(":\n\n"))
            }

            let lastHeartbeat = Date.now()

            async function poll() {
              if (Date.now() - startTime > MAX_DURATION_MS) {
                send("reconnect", {})
                controller.close()
                return
              }

              try {
                const updates = await getMessageUpdates(conversationId, lastMessageId, lastPollTime)
                const now = new Date().toISOString()

                for (const msg of updates.newMessages) {
                  send("message", msg)
                  if (msg.id > lastMessageId) {
                    lastMessageId = msg.id
                  }
                }

                for (const edit of updates.editedMessages) {
                  send("edit", edit)
                }

                for (const del of updates.deletedMessages) {
                  send("delete", { id: del.id })
                }

                lastPollTime = now

                const isTyping = await getTypingStatus(conversationId, myRole)
                if (isTyping) {
                  send("typing", { isTyping: true })
                }
              } catch {
                // If conversation access is revoked or DB error, close stream
                send("error", { message: "Connection lost" })
                controller.close()
                return
              }

              if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
                heartbeat()
                lastHeartbeat = Date.now()
              }

              setTimeout(poll, POLL_INTERVAL_MS)
            }

            // Send initial heartbeat
            heartbeat()
            // Start polling
            poll()
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        })
      },
    },
  },
})
