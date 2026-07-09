import { createFileRoute, redirect } from "@tanstack/react-router"

// Superseded by the admin-managed /leadership page
export const Route = createFileRoute("/executive")({
  beforeLoad: () => {
    // 302, not 301: /leadership starts empty until dyc_executive content is
    // migrated — a cached permanent redirect would outlive any rollback
    throw redirect({ to: "/leadership", statusCode: 302 })
  },
})
