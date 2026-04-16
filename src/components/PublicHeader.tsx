import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Church, Menu, X, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LiturgicalBanner } from "@/components/LiturgicalBanner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Programmes", href: "/programmes" },
  { label: "Documents", href: "/documents" },
  { label: "About", href: "/" },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const isLinkActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <>
      {/* Spacer to offset the fixed navbar */}
      <div className="h-20" />

      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* Desktop floating pill navbar */}
        <div
          className={cn(
            "relative z-[60] mx-auto mt-3 hidden w-full max-w-7xl items-center justify-between self-start rounded-full border px-4 py-2 transition-all duration-300 lg:flex",
            scrolled
              ? "border-border/40 bg-background/80 shadow-sm backdrop-blur-md"
              : "border-transparent bg-transparent"
          )}
          style={{ minWidth: 900 }}
        >
          <Link to="/" className="relative z-20 flex items-center gap-2.5 px-2 py-1">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Church className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">KOFDYC</p>
              <p className="text-[11px] leading-tight text-muted-foreground">Diocesan Youth Council</p>
            </div>
          </Link>

          <nav className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium lg:flex">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "relative px-4 py-2 transition-colors",
                    active
                      ? "font-semibold text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-full bg-primary/10" />
                  ) : null}
                  <span className="relative z-20">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="relative z-20 flex items-center gap-2">
            <LiturgicalBanner />
            <ThemeToggle />
            <Link
              to="/dashboard/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
            >
              <LogIn className="size-3.5" />
              Admin
            </Link>
          </div>
        </div>

        {/* Mobile bar */}
        <div className="relative z-50 w-full border-b border-border/40 bg-background/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex w-full flex-row items-center justify-between">
            <Link to="/" className="relative z-20 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Church className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-foreground">KOFDYC</p>
                <p className="text-[11px] leading-tight text-muted-foreground">Diocesan Youth Council</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="mt-3 w-full border-t border-border/40 pt-3">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{today}</span>
                <LiturgicalBanner />
              </div>
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const active = isLinkActive(link.href)
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
              <Separator className="my-3" />
              <Link
                to="/dashboard/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <LogIn className="size-3.5" />
                Admin Login
              </Link>
            </div>
          ) : null}
        </div>
      </header>
    </>
  )
}
