export type HostAction =
  | { kind: "pass" }
  | { kind: "redirect"; status: 301 | 302; location: string }

export interface HostRoutingEnv {
  publicHost?: string
  adminHost?: string
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
}

export function resolveHostAction(
  rawHost: string | null,
  pathname: string,
  search: string,
  env: HostRoutingEnv,
): HostAction {
  if (!env.publicHost || !env.adminHost || env.publicHost === env.adminHost) {
    return { kind: "pass" }
  }

  const host = (rawHost ?? "").toLowerCase().split(":")[0]
  const publicHost = env.publicHost.toLowerCase().split(":")[0]
  const adminHost = env.adminHost.toLowerCase().split(":")[0]

  // Unknown hosts (localhost, *.workers.dev previews) degrade to path-based routing
  if (host !== publicHost && host !== adminHost) {
    // …except subdomains of the public domain (www., stray custom domains):
    // COOKIE_DOMAIN makes the admin session valid there, so passing them
    // through would serve /dashboard outside the admin host. Canonicalize.
    if (host.endsWith(`.${publicHost}`)) {
      return {
        kind: "redirect",
        status: 301,
        location: `https://${env.publicHost}${pathname}${search}`,
      }
    }
    return { kind: "pass" }
  }

  // API routes and server-fn RPC must stay reachable on both hosts:
  // auth on admin, Paystack webhook + chat SSE on public, media/upload on both
  if (pathname.startsWith("/api/") || pathname.startsWith("/_serverFn")) {
    return { kind: "pass" }
  }

  // File-like paths (sw.js, manifest.json) — normally served as static assets
  // before the worker, but never redirect them if they do reach us
  const lastSegment = pathname.split("/").pop() ?? ""
  if (lastSegment.includes(".")) {
    return { kind: "pass" }
  }

  if (host === adminHost) {
    if (pathname === "/") {
      return { kind: "redirect", status: 302, location: "/dashboard" }
    }
    if (isDashboardPath(pathname)) {
      return { kind: "pass" }
    }
    return {
      kind: "redirect",
      status: 301,
      location: `https://${env.publicHost}${pathname}${search}`,
    }
  }

  if (isDashboardPath(pathname)) {
    return {
      kind: "redirect",
      status: 301,
      location: `https://${env.adminHost}${pathname}${search}`,
    }
  }

  return { kind: "pass" }
}
