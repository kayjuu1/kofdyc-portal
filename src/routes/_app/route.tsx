import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router"
import { getSession } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import {
  LayoutDashboard,
  Calendar,
  Newspaper,
  FileText,
  Users,
  Settings,
  LogOut,
  Church,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({ to: "/sign-in" })
    }
    return { session }
  },
  component: AppLayout,
})

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/dashboard/events", icon: Calendar },
  { label: "News", href: "/dashboard/news", icon: Newspaper },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Members", href: "/dashboard/members", icon: Users },
  { label: "Chaplain Chat", href: "/dashboard/chaplain", icon: MessageSquare },
]

function AppLayout() {
  const { session } = Route.useRouteContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: "/" })
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-card border-r border-border">
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Church className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">DYC Koforidua</p>
              <p className="text-xs text-muted-foreground">Portal</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Separator />

          <div className="p-3 space-y-1">
            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border animate-slide-in-right flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Church className="w-4 h-4 text-primary-foreground" />
                </div>
                <p className="font-bold text-sm text-foreground">DYC Koforidua</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <Separator />

            <div className="p-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 lg:pl-0">
        <header className="sticky top-0 z-40 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

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
      </div>
    </div>
  )
}
