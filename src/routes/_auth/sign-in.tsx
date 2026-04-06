import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/sign-in")({
  beforeLoad: async () => {
    throw redirect({ to: "/dashboard/login" })
  },
})
