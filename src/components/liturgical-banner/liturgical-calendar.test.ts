import { describe, it, expect } from "vitest"
import {
  getEasterDate,
  getLiturgicalInfo,
  type LiturgicalSeason,
  type LiturgicalColor,
} from "./liturgical-calendar"

describe("getEasterDate", () => {
  it.each([
    [2024, 2, 31], // March 31
    [2025, 3, 20], // April 20
    [2026, 3, 5], // April 5
    [2038, 3, 25], // April 25
  ])("year %i → month %i day %i", (year, month, day) => {
    const easter = getEasterDate(year)
    expect(easter.getFullYear()).toBe(year)
    expect(easter.getMonth()).toBe(month) // 0-indexed
    expect(easter.getDate()).toBe(day)
  })
})

describe("getLiturgicalInfo", () => {
  function check(
    dateStr: string,
    season: LiturgicalSeason,
    color: LiturgicalColor,
    specialDay?: string
  ) {
    const [y, m, d] = dateStr.split("-").map(Number)
    const info = getLiturgicalInfo(new Date(y, m - 1, d))
    expect(info.season).toBe(season)
    expect(info.color).toBe(color)
    if (specialDay) {
      expect(info.isSpecialDay).toBe(true)
      expect(info.specialDayName).toBe(specialDay)
    } else {
      // No special day expected — either isSpecialDay is false,
      // or for some named days (like Christmas, Epiphany) the weekLabel carries the name
    }
  }

  it("2024-12-01 → advent, purple", () => {
    check("2024-12-01", "advent", "purple")
  })

  it("2024-12-15 → advent, rose, Gaudete Sunday", () => {
    check("2024-12-15", "advent", "rose", "Gaudete Sunday")
  })

  it("2024-12-25 → christmas, white", () => {
    const info = getLiturgicalInfo(new Date(2024, 11, 25))
    expect(info.season).toBe("christmas")
    expect(info.color).toBe("white")
    expect(info.weekLabel).toBe("Christmas Day")
  })

  it("2025-01-06 → christmas, white, Epiphany", () => {
    const info = getLiturgicalInfo(new Date(2025, 0, 6))
    expect(info.season).toBe("christmas")
    expect(info.color).toBe("white")
    expect(info.weekLabel).toBe("Epiphany of the Lord")
  })

  it("2025-01-12 → christmas, white, Baptism of the Lord", () => {
    // Epiphany Jan 6 2025 is Monday → Baptism = Sunday Jan 12
    const info = getLiturgicalInfo(new Date(2025, 0, 12))
    expect(info.season).toBe("christmas")
    expect(info.color).toBe("white")
    expect(info.weekLabel).toBe("Baptism of the Lord")
  })

  it("2025-01-14 → ordinary-time-1, green", () => {
    check("2025-01-14", "ordinary-time-1", "green")
  })

  it("2025-03-05 → lent, purple, Ash Wednesday", () => {
    const info = getLiturgicalInfo(new Date(2025, 2, 5))
    expect(info.season).toBe("lent")
    expect(info.color).toBe("purple")
    expect(info.weekLabel).toBe("Ash Wednesday")
  })

  it("2025-03-30 → lent, rose, Laetare Sunday", () => {
    check("2025-03-30", "lent", "rose", "Laetare Sunday")
  })

  it("2025-04-13 → lent, red, Palm Sunday", () => {
    check("2025-04-13", "lent", "red", "Palm Sunday")
  })

  it("2025-04-17 → triduum, white, Holy Thursday", () => {
    check("2025-04-17", "triduum", "white", "Holy Thursday")
  })

  it("2025-04-18 → triduum, red, Good Friday", () => {
    check("2025-04-18", "triduum", "red", "Good Friday")
  })

  it("2025-04-19 → triduum, black, Holy Saturday", () => {
    check("2025-04-19", "triduum", "black", "Holy Saturday")
  })

  it("2025-04-20 → easter, white, Easter Sunday", () => {
    const info = getLiturgicalInfo(new Date(2025, 3, 20))
    expect(info.season).toBe("easter")
    expect(info.color).toBe("white")
    expect(info.weekLabel).toBe("Easter Sunday")
  })

  it("2025-04-27 → easter, white, Divine Mercy Sunday", () => {
    const info = getLiturgicalInfo(new Date(2025, 3, 27))
    expect(info.season).toBe("easter")
    expect(info.color).toBe("white")
    expect(info.weekLabel).toBe("Divine Mercy Sunday")
  })

  it("2025-06-08 → easter, red, Pentecost Sunday", () => {
    check("2025-06-08", "easter", "red", "Pentecost Sunday")
  })

  it("2025-06-09 → ordinary-time-2, green", () => {
    check("2025-06-09", "ordinary-time-2", "green")
  })

  it("2025-11-30 → advent, purple", () => {
    const info = getLiturgicalInfo(new Date(2025, 10, 30))
    expect(info.season).toBe("advent")
    expect(info.color).toBe("purple")
    expect(info.weekLabel).toContain("Advent")
  })
})
