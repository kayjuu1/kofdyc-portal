import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Church, Menu, MessageCircleHeart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { LiturgicalBanner } from "@/components/LiturgicalBanner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

const topLinks = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
]

const navGroups = [
  {
    label: "About",
    items: [
      { label: "Leadership", href: "/leadership", description: "Diocesan executives and patrons" },
      { label: "Hierarchy", href: "/hierarchy", description: "Deaneries, parishes, and societies" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Programmes", href: "/programmes", description: "Formation and youth programmes" },
      { label: "Documents", href: "/documents", description: "Pastoral documents and guidelines" },
      { label: "Calendar", href: "/calendar", description: "Liturgical and events calendar" },
    ],
  },
]

const chaplainLink = { label: "Talk to the Chaplain", href: "/chaplain-contact" }

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

  const isGroupActive = (items: { href: string }[]) =>
    items.some((item) => isLinkActive(item.href))

  return (
    <>
      {/* Spacer to offset the fixed navbar */}
      <div className="h-20" />

      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* Desktop floating pill navbar */}
        <div
          className={cn(
            "relative z-[60] mx-auto mt-3 hidden w-full max-w-6xl items-center justify-between self-start rounded-full border px-4 py-2 transition-all duration-300 lg:flex",
            scrolled
              ? "border-border/40 bg-background/80 shadow-sm backdrop-blur-md"
              : "border-transparent bg-transparent"
          )}
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

          <NavigationMenu className="text-sm font-medium">
            <NavigationMenuList>
              {topLinks.map((link) => {
                const active = isLinkActive(link.href)
                return (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        "whitespace-nowrap rounded-full bg-transparent px-3 py-2 font-medium hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <Link to={link.href}>{link.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}

              {navGroups.map((group) => {
                const active = isGroupActive(group.items)
                return (
                  <NavigationMenuItem key={group.label}>
                    <NavigationMenuTrigger
                      className={cn(
                        "h-auto whitespace-nowrap rounded-full bg-transparent px-3 py-2 font-medium hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary data-open:bg-primary/10 data-open:text-primary data-open:hover:bg-primary/10 data-open:focus:bg-primary/10 data-popup-open:bg-primary/10 data-popup-open:hover:bg-primary/10",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-56 gap-1 p-1">
                        {group.items.map((item) => (
                          <li key={item.label}>
                            <NavigationMenuLink
                              asChild
                              className={cn(
                                "flex-col items-start gap-0.5 px-3 py-2",
                                isLinkActive(item.href) && "bg-primary/10"
                              )}
                            >
                              <Link to={item.href}>
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isLinkActive(item.href) && "text-primary"
                                  )}
                                >
                                  {item.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="relative z-20 flex items-center gap-2">
            <LiturgicalBanner />
            <Button asChild size="sm" className="rounded-full">
              <Link to={chaplainLink.href}>
                <MessageCircleHeart className="size-4" />
                {chaplainLink.label}
              </Link>
            </Button>
            <ThemeToggle />
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
                {topLinks.map((link) => (
                  <MobileNavLink
                    key={link.label}
                    href={link.href}
                    label={link.label}
                    active={isLinkActive(link.href)}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
                {navGroups.map((group) => (
                  <div key={group.label} className="pt-2">
                    <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <MobileNavLink
                        key={item.label}
                        href={item.href}
                        label={item.label}
                        active={isLinkActive(item.href)}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                ))}
                <div className="pt-3">
                  <Button asChild className="w-full rounded-full">
                    <Link to={chaplainLink.href} onClick={() => setMobileOpen(false)}>
                      <MessageCircleHeart className="size-4" />
                      {chaplainLink.label}
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          ) : null}
        </div>
      </header>
    </>
  )
}

function MobileNavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string
  label: string
  active: boolean
  onNavigate: () => void
}) {
  return (
    <Link
      to={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
      )}
    >
      {label}
    </Link>
  )
}
