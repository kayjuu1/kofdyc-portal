import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { canonicalizeRole, hasPermission, type UserRole } from "@/lib/permissions"
import {
  LayoutDashboard,
  Calendar,
  Newspaper,
  FileText,
  Users,
  Settings,
  LogOut,
  Church,
  ChevronRight,
  MessageSquare,
  ClipboardList,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await getSession()
    const role = canonicalizeRole((session?.user as { role?: string } | undefined)?.role)
    if (!session?.user || !role || (session.user as { isActive?: boolean }).isActive === false) {
      throw redirect({ to: "/dashboard/login" })
    }
    ;(session.user as { role?: string }).role = role
    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const role = ((session.user as { role?: string }).role ?? "coordinator") as UserRole
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { label: "Events", href: "/dashboard/events", icon: Calendar, show: true },
    { label: "News", href: "/dashboard/news", icon: Newspaper, show: true },
    { label: "Documents", href: "/dashboard/documents", icon: FileText, show: true },
    { label: "Programmes", href: "/dashboard/programmes", icon: ClipboardList, show: true },
    { label: "Admin Users", href: "/dashboard/admin-users", icon: Users, show: hasPermission(role, "manageAdminUsers") },
    { label: "Chaplain Inbox", href: "/dashboard/chaplain", icon: MessageSquare, show: hasPermission(role, "manageChaplainInbox") },
  ]

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: "/" })
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Church className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold">DYC Koforidua</span>
                    <span className="truncate text-xs text-muted-foreground">Portal</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.filter((item) => item.show).map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <SidebarMenu>
            {hasPermission(role, "manageSettings") && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link to="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign Out" onClick={handleSignOut}>
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="p-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4">
          <SidebarTrigger className="-ml-1" />
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Dashboard</span>
          </nav>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
