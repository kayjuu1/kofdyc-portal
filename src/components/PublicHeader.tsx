import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Church, Menu, X, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LiturgicalBanner } from "@/components/LiturgicalBanner"
import { ThemeToggle } from "@/components/ThemeToggle"

const navLinks = [
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Programmes", href: "/programmes" },
  { label: "Documents", href: "/documents" },
  { label: "About", href: "/" },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      {/* Top info bar */}
      <div className="hidden border-b border-border/30 bg-muted/30 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
          <span>{today}</span>
          <div className="flex items-center gap-4">
            <LiturgicalBanner />
            <Separator orientation="vertical" className="h-3" />
            <span>Catholic Diocese of Koforidua</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">DYC Koforidua</p>
              <p className="text-[11px] leading-tight text-muted-foreground">Diocesan Youth Council</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link to="/dashboard/login">
                <LogIn className="mr-1.5 size-3.5" />
                Admin
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="border-t border-border/40 bg-background px-4 py-3 md:hidden">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Separator className="my-3" />
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/dashboard/login" onClick={() => setMobileOpen(false)}>
              <LogIn className="mr-1.5 size-3.5" />
              Admin Login
            </Link>
          </Button>
        </div>
      ) : null}
    </header>
  )
}
