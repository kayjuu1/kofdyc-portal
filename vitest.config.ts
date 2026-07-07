import path from "node:path"
import { defineConfig } from "vitest/config"

// Standalone config: without it vitest inherits vite.config.ts, whose
// Cloudflare Workers plugin crashes the test runner at startup.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
