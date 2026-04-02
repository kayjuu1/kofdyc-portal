import { auth } from "@/lib/auth"
import { authMiddleware } from "@/middleware/auth.middleware"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.session
  })

export const getSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const request = getRequest()
    return await auth.api.getSession({
      headers: request.headers,
    })
  })
