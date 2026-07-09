import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

// No baseURL: same-origin auth calls work on both the public and admin hosts
export const authClient = createAuthClient({
  plugins: [
    adminClient(),
  ],
})
