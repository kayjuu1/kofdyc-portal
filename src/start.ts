import { createMiddleware, createStart } from "@tanstack/react-start"
import { resolveHostAction } from "@/lib/host-routing"

const hostRouting = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    const url = new URL(request.url)
    const action = resolveHostAction(
      request.headers.get("host") ?? url.host,
      url.pathname,
      url.search,
      {
        publicHost: process.env.PUBLIC_HOSTNAME,
        adminHost: process.env.ADMIN_HOSTNAME,
      },
    )
    if (action.kind === "redirect") {
      return new Response(null, {
        status: action.status,
        headers: { Location: action.location },
      })
    }
    return next()
  },
)

// The Start plugin auto-detects src/start.ts; the export must be named startInstance
export const startInstance = createStart(() => ({
  requestMiddleware: [hostRouting],
}))
