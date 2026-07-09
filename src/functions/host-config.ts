import { createServerFn } from "@tanstack/react-start"

// Single source of truth for cross-host links: the same runtime env the
// hostname-routing middleware reads (src/start.ts), not a build-time VITE_
// mirror that can silently fall out of sync with the deployed wrangler vars
export const getPublicSiteUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    return process.env.PUBLIC_HOSTNAME
      ? `https://${process.env.PUBLIC_HOSTNAME}/`
      : "/"
  },
)
