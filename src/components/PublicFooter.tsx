import { Link } from "@tanstack/react-router"
import { Church } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Church className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">DYC Koforidua</p>
                <p className="text-xs text-muted-foreground">Diocesan Youth Council</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Catholic Diocese of Koforidua, Eastern Region, Ghana
            </p>
            <p className="text-xs text-muted-foreground italic font-serif">
              "Go therefore and make disciples of all nations" — Matthew 28:19
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { label: "News", href: "/news" },
                { label: "Pastoral Letters", href: "/pastoral-letters" },
                { label: "Submit News", href: "/news/submit" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>St. Joseph's Cathedral</li>
              <li>Koforidua, Ghana</li>
              <li>+233 XXX XXX XXX</li>
              <li>dyc@dyckoforidua.org</li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Diocesan Youth Council, Koforidua. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/sign-in" className="hover:text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
