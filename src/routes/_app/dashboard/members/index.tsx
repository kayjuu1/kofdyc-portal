import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/dashboard/members/")({
  beforeLoad: async () => {
    throw redirect({ to: "/dashboard/admin-users" })
  },
})
