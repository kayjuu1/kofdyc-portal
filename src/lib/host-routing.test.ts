import { describe, expect, it } from "vitest"
import { resolveHostAction, type HostRoutingEnv } from "./host-routing"

const env: HostRoutingEnv = {
  publicHost: "kofdyc.org",
  adminHost: "admin.kofdyc.org",
}

describe("resolveHostAction", () => {
  it("passes everything when hostnames are not configured", () => {
    expect(resolveHostAction("kofdyc.org", "/dashboard", "", {})).toEqual({ kind: "pass" })
    expect(
      resolveHostAction("kofdyc.org", "/dashboard", "", { publicHost: "kofdyc.org" }),
    ).toEqual({ kind: "pass" })
  })

  it("passes everything when both hostnames are identical", () => {
    expect(
      resolveHostAction("kofdyc.org", "/dashboard", "", {
        publicHost: "kofdyc.org",
        adminHost: "kofdyc.org",
      }),
    ).toEqual({ kind: "pass" })
  })

  it("passes unknown hosts (localhost, workers.dev previews)", () => {
    expect(resolveHostAction("localhost", "/dashboard", "", env)).toEqual({ kind: "pass" })
    expect(
      resolveHostAction("kofdyc-portal.owusu.workers.dev", "/dashboard", "", env),
    ).toEqual({ kind: "pass" })
    expect(resolveHostAction(null, "/dashboard", "", env)).toEqual({ kind: "pass" })
  })

  it("strips ports and ignores case when matching hosts", () => {
    expect(resolveHostAction("KOFDYC.ORG:443", "/news", "", env)).toEqual({ kind: "pass" })
    expect(resolveHostAction("admin.kofdyc.org:8787", "/", "", env)).toEqual({
      kind: "redirect",
      status: 302,
      location: "/dashboard",
    })
  })

  it("301-redirects dashboard paths on the public host to the admin host", () => {
    expect(resolveHostAction("kofdyc.org", "/dashboard", "", env)).toEqual({
      kind: "redirect",
      status: 301,
      location: "https://admin.kofdyc.org/dashboard",
    })
    expect(resolveHostAction("kofdyc.org", "/dashboard/login", "", env)).toEqual({
      kind: "redirect",
      status: 301,
      location: "https://admin.kofdyc.org/dashboard/login",
    })
  })

  it("preserves the query string on cross-host redirects", () => {
    expect(resolveHostAction("admin.kofdyc.org", "/news", "?x=1&y=2", env)).toEqual({
      kind: "redirect",
      status: 301,
      location: "https://kofdyc.org/news?x=1&y=2",
    })
    expect(
      resolveHostAction("kofdyc.org", "/dashboard/events", "?page=2", env),
    ).toEqual({
      kind: "redirect",
      status: 301,
      location: "https://admin.kofdyc.org/dashboard/events?page=2",
    })
  })

  it("passes public routes on the public host", () => {
    expect(resolveHostAction("kofdyc.org", "/", "", env)).toEqual({ kind: "pass" })
    expect(resolveHostAction("kofdyc.org", "/news", "", env)).toEqual({ kind: "pass" })
    expect(resolveHostAction("kofdyc.org", "/dashboard-tools", "", env)).toEqual({
      kind: "pass",
    })
  })

  it("redirects admin host root to /dashboard", () => {
    expect(resolveHostAction("admin.kofdyc.org", "/", "", env)).toEqual({
      kind: "redirect",
      status: 302,
      location: "/dashboard",
    })
  })

  it("passes dashboard paths on the admin host", () => {
    expect(resolveHostAction("admin.kofdyc.org", "/dashboard", "", env)).toEqual({
      kind: "pass",
    })
    expect(resolveHostAction("admin.kofdyc.org", "/dashboard/login", "", env)).toEqual({
      kind: "pass",
    })
  })

  it("301-redirects public routes on the admin host to the public host", () => {
    expect(resolveHostAction("admin.kofdyc.org", "/news", "", env)).toEqual({
      kind: "redirect",
      status: 301,
      location: "https://kofdyc.org/news",
    })
  })

  it("passes /api and /_serverFn paths on both hosts", () => {
    for (const host of ["kofdyc.org", "admin.kofdyc.org"]) {
      expect(resolveHostAction(host, "/api/auth/session", "", env)).toEqual({ kind: "pass" })
      expect(resolveHostAction(host, "/api/paystack-webhook", "", env)).toEqual({
        kind: "pass",
      })
      expect(resolveHostAction(host, "/api/upload", "", env)).toEqual({ kind: "pass" })
      expect(resolveHostAction(host, "/_serverFn/abc123", "", env)).toEqual({ kind: "pass" })
    }
  })

  it("passes file-like paths", () => {
    expect(resolveHostAction("admin.kofdyc.org", "/sw.js", "", env)).toEqual({ kind: "pass" })
    expect(resolveHostAction("kofdyc.org", "/manifest.json", "", env)).toEqual({
      kind: "pass",
    })
  })
})
