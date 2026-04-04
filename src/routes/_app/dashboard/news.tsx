import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/dashboard/news")({
  component: NewsLayout,
})

function NewsLayout() {
  return <Outlet />
}
