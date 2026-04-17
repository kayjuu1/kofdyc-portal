/**
 * Pure liturgical calendar logic for the Roman Catholic rite.
 * No external calendar library. All derived from the Easter date.
 */

export type LiturgicalSeason =
  | "advent"
  | "christmas"
  | "ordinary-time-1"
  | "lent"
  | "triduum"
  | "easter"
  | "ordinary-time-2"

export type LiturgicalColor =
  | "purple"
  | "rose"
  | "white"
  | "gold"
  | "green"
  | "red"
  | "black"

export type LiturgicalInfo = {
  season: LiturgicalSeason
  weekLabel: string
  color: LiturgicalColor
  accentColor: string
  isSpecialDay: boolean
  specialDayName?: string
}

/* ─── Date utilities ─── */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date)
  r.setDate(r.getDate() + days)
  return r
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / 86400000)
}

/* ─── Easter (Meeus / Jones / Butcher / Anonymous Gregorian algorithm) ─── */

export function getEasterDate(year: number): Date {
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

/* ─── Derived dates ─── */

/**
 * First Sunday of Advent for the given liturgical year (where Dec 25 falls).
 * Canonical rule: the Sunday in the 7-day window [Nov 27, Dec 3] inclusive —
 * i.e. 22 to 28 days before Dec 25 (always a Sunday).
 */
function getFirstSundayOfAdvent(year: number): Date {
  const dec25 = new Date(year, 11, 25)
  const w = dec25.getDay() // 0 = Sunday ... 6 = Saturday
  const daysBack = w === 0 ? 28 : 21 + w
  return addDays(dec25, -daysBack)
}

/**
 * Baptism of the Lord: the Sunday after Epiphany (Jan 6 fixed).
 * If Jan 6 is itself a Sunday, Baptism of the Lord is the following Sunday (Jan 13).
 */
function getBaptismOfTheLord(year: number): Date {
  const epiphany = new Date(year, 0, 6)
  const w = epiphany.getDay() // 0..6
  if (w === 0) return addDays(epiphany, 7) // Jan 13
  // Sunday after Jan 6
  return addDays(epiphany, 7 - w)
}

/* ─── Ordinal words ─── */

const ORDINAL_WORDS = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
  "Thirteenth",
  "Fourteenth",
  "Fifteenth",
  "Sixteenth",
  "Seventeenth",
  "Eighteenth",
  "Nineteenth",
  "Twentieth",
  "Twenty-First",
  "Twenty-Second",
  "Twenty-Third",
  "Twenty-Fourth",
  "Twenty-Fifth",
  "Twenty-Sixth",
  "Twenty-Seventh",
  "Twenty-Eighth",
  "Twenty-Ninth",
  "Thirtieth",
  "Thirty-First",
  "Thirty-Second",
  "Thirty-Third",
  "Thirty-Fourth",
]

function ordinal(n: number): string {
  return ORDINAL_WORDS[n] ?? `${n}th`
}

/* ─── Colour accent lookup (exposed via LiturgicalInfo.accentColor) ─── */

const ACCENT: Record<LiturgicalColor, string> = {
  purple: "#9B59B6",
  rose: "#F4A0B5",
  white: "#C9A84C",
  gold: "#FFD700",
  green: "#52B788",
  red: "#E63946",
  black: "#555555",
}

/* ─── Main entry point ─── */

export function getLiturgicalInfo(inputDate: Date): LiturgicalInfo {
  const date = startOfDay(inputDate)
  const year = date.getFullYear()

  // Easter-derived dates for the current calendar year
  const easter = startOfDay(getEasterDate(year))
  const ashWednesday = addDays(easter, -46)
  const palmSunday = addDays(easter, -7)
  const holyThursday = addDays(easter, -3)
  const goodFriday = addDays(easter, -2)
  const holySaturday = addDays(easter, -1)
  const ascension = addDays(easter, 39)
  const pentecost = addDays(easter, 49)

  // Christmas season straddles calendar years; we may need the previous or next
  // year's Advent/Baptism boundaries.
  const adventStartThisYear = getFirstSundayOfAdvent(year)
  const adventStartPrevYear = getFirstSundayOfAdvent(year - 1)
  const christmasThisYear = new Date(year, 11, 25)
  const christmasPrevYear = new Date(year - 1, 11, 25)
  const baptismThisYear = getBaptismOfTheLord(year)
  const epiphanyThisYear = new Date(year, 0, 6)
  const jan1ThisYear = new Date(year, 0, 1)

  // ───── CHRISTMAS SEASON (may belong to previous liturgical year) ─────
  // From Dec 25 (prev year) through Baptism of the Lord (this year), inclusive
  // of Baptism of the Lord (which closes the Christmas season).
  if (date >= christmasPrevYear && date <= baptismThisYear) {
    return buildChristmasInfo(date, {
      jan1: jan1ThisYear,
      epiphany: epiphanyThisYear,
      baptism: baptismThisYear,
      christmas: christmasPrevYear,
    })
  }
  if (date >= christmasThisYear) {
    // Late December: belongs to the NEXT liturgical year's Christmas season
    return buildChristmasInfo(date, {
      jan1: new Date(year + 1, 0, 1),
      epiphany: new Date(year + 1, 0, 6),
      baptism: getBaptismOfTheLord(year + 1),
      christmas: christmasThisYear,
    })
  }

  // ───── ADVENT ─────
  if (date >= adventStartThisYear && date < christmasThisYear) {
    return buildAdventInfo(date, adventStartThisYear)
  }
  // Very early January dates handled above (Christmas), but pre-Advent late
  // November of the previous year's cycle handled via adventStartPrevYear if needed:
  if (
    date >= adventStartPrevYear &&
    date < christmasPrevYear &&
    date.getFullYear() === year - 1
  ) {
    // Won't normally hit this since inputs use this-year easter dates, guard anyway.
    return buildAdventInfo(date, adventStartPrevYear)
  }

  // ───── TRIDUUM ─────
  if (sameDay(date, holyThursday)) {
    return {
      season: "triduum",
      color: "white",
      accentColor: ACCENT.white,
      isSpecialDay: true,
      specialDayName: "Holy Thursday",
      weekLabel: "Holy Thursday",
    }
  }
  if (sameDay(date, goodFriday)) {
    return {
      season: "triduum",
      color: "red",
      accentColor: ACCENT.red,
      isSpecialDay: true,
      specialDayName: "Good Friday",
      weekLabel: "Good Friday",
    }
  }
  if (sameDay(date, holySaturday)) {
    return {
      season: "triduum",
      color: "black",
      accentColor: ACCENT.black,
      isSpecialDay: true,
      specialDayName: "Holy Saturday",
      weekLabel: "Holy Saturday",
    }
  }

  // ───── LENT ─────
  if (date >= ashWednesday && date < holyThursday) {
    return buildLentInfo(date, ashWednesday, palmSunday)
  }

  // ───── EASTER SEASON ─────
  if (date >= easter && date <= pentecost) {
    return buildEasterInfo(date, easter, ascension, pentecost)
  }

  // ───── ORDINARY TIME ─────
  if (date > baptismThisYear && date < ashWednesday) {
    return buildOrdinaryTimeInfo(date, addDays(baptismThisYear, 1), "ordinary-time-1")
  }
  if (date > pentecost && date < adventStartThisYear) {
    return buildOrdinaryTimeInfo(date, addDays(pentecost, 1), "ordinary-time-2")
  }

  // Fallback (should be unreachable for valid calendar dates)
  return {
    season: "ordinary-time-2",
    color: "green",
    accentColor: ACCENT.green,
    isSpecialDay: false,
    weekLabel: "Ordinary Time",
  }
}

/* ─── Builders per season ─── */

function buildAdventInfo(date: Date, adventStart: Date): LiturgicalInfo {
  const diffDays = daysBetween(adventStart, date)
  const weekNum = Math.floor(diffDays / 7) + 1 // 1..4
  const isSunday = date.getDay() === 0
  const weekLabel = isSunday
    ? `${ordinal(weekNum)} Sunday of Advent`
    : `${ordinal(weekNum)} Week of Advent`

  if (isSunday && weekNum === 3) {
    return {
      season: "advent",
      color: "rose",
      accentColor: ACCENT.rose,
      isSpecialDay: true,
      specialDayName: "Gaudete Sunday",
      weekLabel,
    }
  }
  return {
    season: "advent",
    color: "purple",
    accentColor: ACCENT.purple,
    isSpecialDay: false,
    weekLabel,
  }
}

function buildChristmasInfo(
  date: Date,
  d: { jan1: Date; epiphany: Date; baptism: Date; christmas: Date }
): LiturgicalInfo {
  // Determine week label
  let weekLabel = "Christmas Season"
  let isSpecialDay = false
  let specialDayName: string | undefined

  if (sameDay(date, d.christmas)) {
    weekLabel = "Christmas Day"
  } else if (sameDay(date, d.jan1)) {
    weekLabel = "Solemnity of Mary, Mother of God"
  } else if (sameDay(date, d.epiphany)) {
    weekLabel = "Epiphany of the Lord"
  } else if (sameDay(date, d.baptism)) {
    weekLabel = "Baptism of the Lord"
  } else if (
    date.getDay() === 0 &&
    date > d.christmas &&
    date < d.jan1
  ) {
    // Sunday within the octave of Christmas
    weekLabel = "Feast of the Holy Family"
  }

  return {
    season: "christmas",
    color: "white",
    accentColor: "#C9A84C",
    isSpecialDay,
    specialDayName,
    weekLabel,
  }
}

function buildLentInfo(
  date: Date,
  ashWednesday: Date,
  palmSunday: Date
): LiturgicalInfo {
  // Ash Wednesday
  if (sameDay(date, ashWednesday)) {
    return {
      season: "lent",
      color: "purple",
      accentColor: ACCENT.purple,
      isSpecialDay: false,
      weekLabel: "Ash Wednesday",
    }
  }
  // Palm Sunday
  if (sameDay(date, palmSunday)) {
    return {
      season: "lent",
      color: "red",
      accentColor: ACCENT.red,
      isSpecialDay: true,
      specialDayName: "Palm Sunday",
      weekLabel: "Palm Sunday",
    }
  }

  const isSunday = date.getDay() === 0
  if (isSunday) {
    // First Sunday of Lent = Ash Wednesday + 4 days
    const firstSunday = addDays(ashWednesday, 4)
    const sundayNum = Math.round(daysBetween(firstSunday, date) / 7) + 1 // 1..5

    if (sundayNum === 4) {
      return {
        season: "lent",
        color: "rose",
        accentColor: ACCENT.rose,
        isSpecialDay: true,
        specialDayName: "Laetare Sunday",
        weekLabel: "Fourth Sunday of Lent",
      }
    }
    return {
      season: "lent",
      color: "purple",
      accentColor: ACCENT.purple,
      isSpecialDay: false,
      weekLabel: `${ordinal(sundayNum)} Sunday of Lent`,
    }
  }

  return {
    season: "lent",
    color: "purple",
    accentColor: ACCENT.purple,
    isSpecialDay: false,
    weekLabel: "Weekday of Lent",
  }
}

function buildEasterInfo(
  date: Date,
  easter: Date,
  ascension: Date,
  pentecost: Date
): LiturgicalInfo {
  if (sameDay(date, easter)) {
    return {
      season: "easter",
      color: "white",
      accentColor: "#C9A84C",
      isSpecialDay: false,
      weekLabel: "Easter Sunday",
    }
  }
  if (sameDay(date, pentecost)) {
    return {
      season: "easter",
      color: "red",
      accentColor: ACCENT.red,
      isSpecialDay: true,
      specialDayName: "Pentecost Sunday",
      weekLabel: "Pentecost Sunday",
    }
  }
  if (sameDay(date, ascension)) {
    return {
      season: "easter",
      color: "white",
      accentColor: "#C9A84C",
      isSpecialDay: false,
      weekLabel: "Ascension of the Lord",
    }
  }

  const isSunday = date.getDay() === 0
  if (isSunday) {
    const sundayNum = Math.round(daysBetween(easter, date) / 7) + 1 // 1..7
    if (sundayNum === 2) {
      return {
        season: "easter",
        color: "white",
        accentColor: "#C9A84C",
        isSpecialDay: false,
        weekLabel: "Divine Mercy Sunday",
      }
    }
    return {
      season: "easter",
      color: "white",
      accentColor: "#C9A84C",
      isSpecialDay: false,
      weekLabel: `${ordinal(sundayNum)} Sunday of Easter`,
    }
  }

  // Weekday of Easter season
  return {
    season: "easter",
    color: "white",
    accentColor: "#C9A84C",
    isSpecialDay: false,
    weekLabel: "Easter Season",
  }
}

function buildOrdinaryTimeInfo(
  date: Date,
  weekOneStart: Date,
  season: "ordinary-time-1" | "ordinary-time-2"
): LiturgicalInfo {
  const diffDays = daysBetween(weekOneStart, date)
  const weekNum = Math.max(1, Math.floor(diffDays / 7) + 1)
  const isSunday = date.getDay() === 0
  const weekLabel = isSunday
    ? `${ordinal(weekNum)} Sunday of Ordinary Time`
    : `${ordinal(weekNum)} Week of Ordinary Time`

  return {
    season,
    color: "green",
    accentColor: ACCENT.green,
    isSpecialDay: false,
    weekLabel,
  }
}

/* ─── Helpers exposed for SVG dispatcher ─── */

/**
 * Return the current Advent week number (1–4) for the given date,
 * or `null` if the date is not in Advent.
 */
export function getAdventWeekNumber(date: Date): number | null {
  const info = getLiturgicalInfo(date)
  if (info.season !== "advent") return null
  const adventStart = getFirstSundayOfAdvent(
    date.getMonth() < 11 ? date.getFullYear() - 1 : date.getFullYear()
  )
  const adventStartThisYear = getFirstSundayOfAdvent(date.getFullYear())
  const anchor =
    startOfDay(date) >= startOfDay(adventStartThisYear)
      ? adventStartThisYear
      : adventStart
  const diffDays = daysBetween(anchor, date)
  return Math.max(1, Math.min(4, Math.floor(diffDays / 7) + 1))
}
