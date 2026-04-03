export type LiturgicalSeason =
  | "Advent"
  | "Christmas"
  | "Ordinary Time"
  | "Lent"
  | "Easter"

export interface LiturgicalInfo {
  season: LiturgicalSeason
  color: string
  label: string
}

/** Anonymous Gregorian Easter algorithm (Computus) */
function getEasterDate(year: number): Date {
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
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Get the Sunday on or before a given date */
function sundayOnOrBefore(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function getCurrentLiturgicalSeason(date: Date = new Date()): LiturgicalInfo {
  const year = date.getFullYear()
  const easter = getEasterDate(year)

  // Key dates
  const ashWednesday = addDays(easter, -46)
  const pentecost = addDays(easter, 49)

  // Advent: 4 Sundays before Christmas
  const christmas = new Date(year, 11, 25)
  const adventStart = sundayOnOrBefore(addDays(christmas, -22))

  // Previous year's Christmas season (ends on Baptism of the Lord, ~Jan 10-13)
  const epiphany = new Date(year, 0, 6)
  const baptismOfLord = epiphany.getDay() === 0
    ? addDays(epiphany, 7)
    : sundayOnOrBefore(addDays(epiphany, 7))

  // Christmas season from previous year (Jan 1 to Baptism of the Lord)
  if (date < baptismOfLord) {
    return { season: "Christmas", color: "white", label: "Christmas Season" }
  }

  // Ordinary Time I (after Baptism until Ash Wednesday)
  if (date >= baptismOfLord && date < ashWednesday) {
    return { season: "Ordinary Time", color: "green", label: "Ordinary Time" }
  }

  // Lent (Ash Wednesday to Easter Vigil)
  if (date >= ashWednesday && date < easter) {
    return { season: "Lent", color: "purple", label: "Season of Lent" }
  }

  // Easter Season (Easter to Pentecost)
  if (date >= easter && date <= pentecost) {
    return { season: "Easter", color: "white", label: "Easter Season" }
  }

  // Advent
  if (date >= adventStart) {
    return { season: "Advent", color: "purple", label: "Season of Advent" }
  }

  // Christmas (Dec 25 onward)
  if (date >= christmas) {
    return { season: "Christmas", color: "white", label: "Christmas Season" }
  }

  // Ordinary Time II (after Pentecost to Advent)
  return { season: "Ordinary Time", color: "green", label: "Ordinary Time" }
}
