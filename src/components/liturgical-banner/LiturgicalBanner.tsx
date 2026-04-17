import { useMemo } from "react"
import {
  getLiturgicalInfo,
  type LiturgicalColor,
} from "./liturgical-calendar"
import { SeasonSymbol } from "./seasonal-symbols"

/* ─── Colour palette per liturgical colour ─── */

const SEASON_PALETTE: Record<
  LiturgicalColor,
  { bg: string; accentColor: string; text: string }
> = {
  purple: { bg: "#4B0082", accentColor: "#9B59B6", text: "#FFFFFF" },
  rose: { bg: "#C2547A", accentColor: "#F4A0B5", text: "#FFFFFF" },
  white: { bg: "#F5F0E8", accentColor: "#C9A84C", text: "#1A1A1A" },
  gold: { bg: "#B8860B", accentColor: "#FFD700", text: "#FFFFFF" },
  green: { bg: "#2D6A4F", accentColor: "#52B788", text: "#FFFFFF" },
  red: { bg: "#8B0000", accentColor: "#E63946", text: "#FFFFFF" },
  black: { bg: "#1A1A1A", accentColor: "#555555", text: "#EEEEEE" },
}

/* ─── Darken utility ─── */

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - percent / 100)))
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - percent / 100)))
  const b = Math.max(0, Math.round((num & 0xff) * (1 - percent / 100)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

/* ─── Season display name ─── */

const SEASON_NAME: Record<string, string> = {
  advent: "Advent",
  christmas: "Christmas Season",
  "ordinary-time-1": "Ordinary Time",
  lent: "Lent",
  triduum: "Sacred Triduum",
  easter: "Easter Season",
  "ordinary-time-2": "Ordinary Time",
}

/* ─── Main component ─── */

export default function LiturgicalBanner() {
  const now = useMemo(() => new Date(), [])
  const info = useMemo(() => getLiturgicalInfo(now), [now])

  const palette = SEASON_PALETTE[info.color]
  const bgGradient = `linear-gradient(135deg, ${palette.bg}, ${darken(palette.bg, 20)})`
  const weekLabelColor =
    info.color === "white" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)"

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: bgGradient }}
    >
      {/* Desktop layout */}
      <div className="mx-auto hidden min-h-[180px] max-w-7xl items-center gap-8 px-6 py-6 sm:flex">
        {/* SVG symbol */}
        <div className="shrink-0" style={{ opacity: 0.9 }}>
          <SeasonSymbol
            season={info.season}
            isSpecialDay={info.isSpecialDay}
            specialDayName={info.specialDayName}
            color={info.color}
            size={140}
            date={now}
          />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center">
          {info.isSpecialDay && info.specialDayName && (
            <span
              className="mb-2 inline-block w-fit rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: palette.accentColor }}
            >
              {info.specialDayName}
            </span>
          )}

          <h2
            className="font-serif text-4xl font-bold"
            style={{ color: palette.text }}
          >
            {SEASON_NAME[info.season]}
          </h2>

          <p
            className="mt-1 text-lg font-light"
            style={{ color: weekLabelColor }}
          >
            {info.weekLabel}
          </p>

          <div
            className="mt-3"
            style={{
              height: 2,
              width: 80,
              backgroundColor: palette.accentColor,
            }}
          />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-6 text-center sm:hidden">
        <div className="mb-4" style={{ opacity: 0.9 }}>
          <SeasonSymbol
            season={info.season}
            isSpecialDay={info.isSpecialDay}
            specialDayName={info.specialDayName}
            color={info.color}
            size={100}
            date={now}
          />
        </div>

        {info.isSpecialDay && info.specialDayName && (
          <span
            className="mb-2 inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ backgroundColor: palette.accentColor }}
          >
            {info.specialDayName}
          </span>
        )}

        <h2
          className="font-serif text-2xl font-bold"
          style={{ color: palette.text }}
        >
          {SEASON_NAME[info.season]}
        </h2>

        <p
          className="mt-1 text-base font-light"
          style={{ color: weekLabelColor }}
        >
          {info.weekLabel}
        </p>

        <div
          className="mt-3"
          style={{
            height: 2,
            width: 80,
            backgroundColor: palette.accentColor,
          }}
        />
      </div>
    </section>
  )
}
