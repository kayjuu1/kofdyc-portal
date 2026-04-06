import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Church, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LiturgicalBanner } from "@/components/LiturgicalBanner"

const navLinks = [
  { label: "News", href: "/news" },
  { label: "Events", href: "/#events" },
  { label: "Documents", href: "/pastoral-letters" },
  { label: "About", href: "/#about" },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Church className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-foreground leading-tight text-sm">DYC Koforidua</p>
                <p className="text-xs text-muted-foreground leading-tight">Diocesan Youth Council</p>
              </div>
            </Link>
            <span className="hidden md:block text-border">|</span>
            <span className="hidden md:block text-sm text-muted-foreground">
              Catholic Diocese of Koforidua
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard/login">Admin Login</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between py-2 text-xs text-muted-foreground border-t border-border/50">
          <span>{today}</span>
          <div className="flex items-center gap-4">
            <LiturgicalBanner />
            <span>Eastern Region, Ghana</span>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Separator className="my-2" />
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard/login" onClick={() => setMobileOpen(false)}>Admin Login</Link>
          </Button>
        </div>
      )}
    </header>
  )
}
