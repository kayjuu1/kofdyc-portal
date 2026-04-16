import { createFileRoute, Link, Outlet, redirect, useRouter, useRouterState } from "@tanstack/react-router"
import {
  Calendar,
  ChevronRight,
  Church,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
  Users,
} from "lucide-react"

import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { hasPermission, type UserRole } from "@/lib/permissions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ThemeToggle"

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({ to: "/dashboard/login" })
    }
    return { session }
  },
  component: AppLayout,
})

function formatRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Events", href: "/dashboard/events", icon: Calendar },
      { label: "News", href: "/dashboard/news", icon: Newspaper },
      { label: "Documents", href: "/dashboard/documents", icon: FileText },
      { label: "Programmes", href: "/dashboard/programmes", icon: ClipboardList },
      { label: "Submission Prompts", href: "/dashboard/submission-prompts", icon: ClipboardList, permission: "viewDashboard" as const },
    ],
  },
]

const adminItems = [
  { label: "Admin Users", href: "/dashboard/admin-users", icon: Users, permission: "manageAdminUsers" as const },
  { label: "Chaplain Inbox", href: "/dashboard/chaplain", icon: MessageSquare, permission: "manageChaplainInbox" as const },
]

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "Dashboard"
  if (pathname.startsWith("/dashboard/events")) return "Events"
  if (pathname.startsWith("/dashboard/news")) return "News"
  if (pathname.startsWith("/dashboard/documents")) return "Documents"
  if (pathname.startsWith("/dashboard/programmes")) return "Programmes"
  if (pathname.startsWith("/dashboard/admin-users")) return "Admin Users"
  if (pathname.startsWith("/dashboard/chaplain")) return "Chaplain Inbox"
  if (pathname.startsWith("/dashboard/settings")) return "Settings"
  return "Dashboard"
}

function AppLayout() {
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const role = ((session.user as { role?: string }).role ?? "coordinator") as UserRole
  const pageTitle = getPageTitle(pathname)

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: "/" })
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((namePart: string) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : session.user.email?.charAt(0).toUpperCase() ?? "U"

  const visibleAdminItems = adminItems.filter((item) => hasPermission(role, item.permission))

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="data-[active=true]:bg-transparent"
              >
                <Link to="/dashboard">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Church className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">KOFDYC</span>
                    <span className="text-xs text-muted-foreground">Youth Portal</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {navSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href))

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                          <Link to={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {visibleAdminItems.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdminItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                          <Link to={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-medium">{session.user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {formatRoleLabel(role)}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasPermission(role, "manageSettings") ? (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings">
                        <Settings className="mr-2 size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            {pageTitle !== "Dashboard" ? (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{pageTitle}</span>
              </>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">View site</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
