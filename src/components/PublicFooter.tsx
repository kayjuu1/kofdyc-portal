import { Link } from "@tanstack/react-router"
import { Church, Mail, MapPin, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const quickLinks = [
  { label: "News", href: "/news" },
  { label: "Documents", href: "/documents" },
  { label: "Submit News", href: "/news/submit" },
  { label: "Contact Chaplain", href: "/chaplain-contact" },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Church className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">DYC Koforidua</p>
                <p className="text-xs text-muted-foreground">Diocesan Youth Council</p>
              </div>
            </div>
            <p className="mb-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Fostering spiritual growth, leadership development, and community service among
              Catholic youth across the Diocese of Koforidua.
            </p>
            <p className="text-xs italic text-muted-foreground/70 font-serif">
              "Go therefore and make disciples of all nations" — Matthew 28:19
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>St. Joseph's Cathedral, Koforidua, Ghana</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span>+233 XXX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0" />
                <span>dyc@dyckoforidua.org</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} Diocesan Youth Council, Koforidua. All rights reserved.</p>
          <Link to="/dashboard/login" className="transition-colors hover:text-primary">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
