import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  Calendar,
  Newspaper,
  FileText,
  Users,
  MapPin,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Church,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <FeaturedSection />
        <NewsGrid />
      </main>
      <Footer />
    </div>
  )
}

function Header() {
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
            {[
              { label: "News", href: "#news" },
              { label: "Events", href: "#events" },
              { label: "Documents", href: "/documents" },
              { label: "About", href: "#about" },
            ].map((link) => (
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
              <Link to="/sign-in">Sign In</Link>
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
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-primary text-primary" />
              Season of Lent
            </span>
            <span>Eastern Region, Ghana</span>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-1 animate-fade-in">
          {[
            { label: "News", href: "#news" },
            { label: "Events", href: "#events" },
            { label: "Documents", href: "/documents" },
            { label: "About", href: "#about" },
          ].map((link) => (
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
            <Link to="/sign-in" onClick={() => setMobileOpen(false)}>Sign In</Link>
          </Button>
        </div>
      )}
    </header>
  )
}

function FeaturedSection() {
  return (
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
              Featured
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 font-serif">
              Diocesan Youth Congress 2026: A Gathering of Faith and Fellowship
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Preparations are underway for the biggest youth gathering of the year. All parishes across the five deaneries are encouraged to participate in this celebration of our Catholic youth identity.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>March 15, 2026</span>
              <span className="text-border">|</span>
              <span>By DYC Communications</span>
            </div>
            <Button asChild className="mt-6" variant="outline">
              <a href="/news/1">
                Read Full Story <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="bg-muted/50 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Calendar, label: "Events Calendar", href: "/calendar" },
                  { icon: Newspaper, label: "Latest News", href: "#news" },
                  { icon: FileText, label: "Documents", href: "/documents" },
                  { icon: Users, label: "Parish Profiles", href: "/parishes" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.href}
                    className="flex items-center gap-3 p-2 -mx-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.label}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Monthly Youth Mass", date: "Apr 5", location: "All Parishes" },
                  { title: "Youth Retreat", date: "May 20", location: "St. Augustine's" },
                  { title: "DYC Day", date: "Jun 15", location: "St. Joseph's Cathedral" },
                ].map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-primary/10 text-primary shrink-0">
                      <span className="text-xs font-medium">{event.date.split(" ")[0]}</span>
                      <span className="text-lg font-bold leading-none">{event.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function NewsGrid() {
  const news = [
    {
      title: "Lenten Retreat Series Begins This Weekend",
      excerpt: "Join us for a series of spiritual retreats throughout the Lenten season at various parishes across the diocese.",
      date: "March 5, 2026",
      category: "Spirituality",
      readTime: "3 min read",
    },
    {
      title: "DYC Executive Council Meeting Highlights",
      excerpt: "Key decisions from the February meeting including programme approvals and upcoming event planning.",
      date: "February 28, 2026",
      category: "Announcements",
      readTime: "5 min read",
    },
    {
      title: "New Portal Launch Announcement",
      excerpt: "We are excited to announce the launch of our new digital platform for the Diocese of Koforidua.",
      date: "February 20, 2026",
      category: "Technology",
      readTime: "2 min read",
    },
    {
      title: "Youth Leadership Training Workshop",
      excerpt: "Applications now open for the annual leadership development programme for parish youth coordinators.",
      date: "February 15, 2026",
      category: "Events",
      readTime: "4 min read",
    },
    {
      title: "Pastoral Programme Submissions Due",
      excerpt: "Reminder to all parish coordinators: pastoral programme submissions for 2026 are due by March 31.",
      date: "February 10, 2026",
      category: "Announcements",
      readTime: "2 min read",
    },
  ]

  return (
    <section id="news" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-serif">Latest News</h2>
            <p className="text-sm text-muted-foreground mt-1">Stay informed with updates from across the diocese</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/news">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article, index) => (
            <article
              key={index}
              className="group cursor-pointer"
            >
              <Card className="h-full hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.date}</span>
                    <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Read more <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-12" id="events">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground font-serif">Upcoming Events</h2>
              <p className="text-sm text-muted-foreground mt-1">Mark your calendar for these gatherings</p>
            </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/calendar">
              Full Calendar <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Monthly Youth Mass",
                date: "April 5, 2026",
                time: "10:00 AM",
                location: "All Parishes",
                type: "Mass",
              },
              {
                title: "Youth Retreat: Finding Peace in Christ",
                date: "May 20, 2026",
                time: "8:00 AM",
                location: "St. Augustine's Parish Hall",
                type: "Retreat",
              },
              {
                title: "Diocesan Youth Day 2026",
                date: "June 15, 2026",
                time: "9:00 AM",
                location: "St. Joseph's Cathedral",
                type: "Rally",
              },
              {
                title: "DYC Executive Meeting",
                date: "June 28, 2026",
                time: "10:00 AM",
                location: "Diocesan Center",
                type: "Meeting",
              },
            ].map((event, i) => (
              <Card key={i} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <Badge className="w-fit text-xs">{event.type}</Badge>
                  <CardTitle className="text-base font-semibold mt-2">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center text-primary">🕐</span>
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-12" id="about">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground font-serif mb-4">About DYC</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Diocesan Youth Council (DYC) of Koforidua is committed to fostering spiritual growth,
                leadership development, and community service among Catholic youth across our diocese.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Through our various programmes and events, we aim to strengthen the faith of our young people
                and prepare them to be active witnesses of Christ's love in their communities.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Faith Formation", "Youth Empowerment", "Community Service"].map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">DYC Executive Council</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { name: "Kojo Mensah", role: "Chairman" },
                  { name: "Abena Serwaa", role: "Vice Chairperson" },
                  { name: "Yaw Boateng", role: "General Secretary" },
                  { name: "Akua Afriyie", role: "Organizing Secretary" },
                  { name: "Kwame Osei", role: "Treasurer" },
                  { name: "Efua Mansa", role: "PRO" },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
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
              {["Events", "News", "Documents", "Calendar", "Parishes"].map((link) => (
                <li key={link}>
                  <a
                    href={`/${link.toLowerCase()}`}
                    className="hover:text-primary transition-colors"
                  >
                    {link}
                  </a>
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
          <p>&copy; 2026 Diocesan Youth Council, Koforidua. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/sign-in" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <span>|</span>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
