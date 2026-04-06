import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { events } from "@/db/schema"
import { and, eq, gte, lte } from "drizzle-orm"

export const getCalendarEvents = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      year: number
      month: number
      scope?: "diocese" | "deanery" | "parish"
    }) => input
  )
  .handler(async ({ data }) => {
    const startOfMonth = new Date(data.year, data.month - 1, 1).toISOString()
    const endOfMonth = new Date(data.year, data.month, 0, 23, 59, 59).toISOString()

    const conditions = [
      eq(events.status, "published"),
      gte(events.startAt, startOfMonth),
      lte(events.startAt, endOfMonth),
    ]

    if (data.scope) {
      conditions.push(eq(events.scope, data.scope))
    }

    const calendarEvents = await db
      .select({
        id: events.id,
        title: events.title,
        startAt: events.startAt,
        endAt: events.endAt,
        eventType: events.eventType,
        scope: events.scope,
        venue: events.venue,
      })
      .from(events)
      .where(and(...conditions))

    return calendarEvents
  })

/** Get liturgical feast days for a given year */
export function getFeastDays(year: number) {
  // Easter calculation (Computus)
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(year, month - 1, day)

  const addDays = (d: Date, n: number) => {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
  }

  const fmt = (d: Date) => d.toISOString().split("T")[0]

  return [
    { date: `${year}-01-01`, name: "Solemnity of Mary", color: "white" },
    { date: `${year}-01-06`, name: "Epiphany of the Lord", color: "white" },
    { date: `${year}-02-02`, name: "Presentation of the Lord", color: "white" },
    { date: fmt(addDays(easter, -46)), name: "Ash Wednesday", color: "purple" },
    { date: fmt(addDays(easter, -7)), name: "Palm Sunday", color: "red" },
    { date: fmt(addDays(easter, -3)), name: "Holy Thursday", color: "white" },
    { date: fmt(addDays(easter, -2)), name: "Good Friday", color: "red" },
    { date: fmt(easter), name: "Easter Sunday", color: "white" },
    { date: fmt(addDays(easter, 39)), name: "Ascension of the Lord", color: "white" },
    { date: fmt(addDays(easter, 49)), name: "Pentecost Sunday", color: "red" },
    { date: fmt(addDays(easter, 56)), name: "Trinity Sunday", color: "white" },
    { date: fmt(addDays(easter, 60)), name: "Corpus Christi", color: "white" },
    { date: `${year}-08-15`, name: "Assumption of Mary", color: "white" },
    { date: `${year}-11-01`, name: "All Saints' Day", color: "white" },
    { date: `${year}-11-02`, name: "All Souls' Day", color: "purple" },
    { date: `${year}-12-08`, name: "Immaculate Conception", color: "white" },
    { date: `${year}-12-25`, name: "Christmas Day", color: "white" },
  ]
}
