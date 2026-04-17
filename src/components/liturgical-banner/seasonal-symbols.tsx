import type { LiturgicalColor, LiturgicalSeason } from "./liturgical-calendar"
import { getAdventWeekNumber } from "./liturgical-calendar"

/* ─── Individual SVG components ─── */

type SymbolProps = { size?: number; accent?: string }

function AdventWreath({ size = 140, candlesLit = 1 }: SymbolProps & { candlesLit?: number }) {
  const cx = size / 2
  const cy = size / 2
  const wreathR = size * 0.38
  const candleW = size * 0.08
  const candleH = size * 0.2
  // 4 candle positions at N, E, S, W
  const positions = [
    { angle: -Math.PI / 2, isRose: false }, // top (week 1)
    { angle: 0, isRose: false }, // right (week 2)
    { angle: Math.PI / 2, isRose: true }, // bottom (week 3 = Gaudete)
    { angle: Math.PI, isRose: false }, // left (week 4)
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Evergreen ring */}
      <circle
        cx={cx}
        cy={cy}
        r={wreathR}
        fill="none"
        stroke="#2d5a3d"
        strokeWidth={size * 0.1}
      />
      <circle
        cx={cx}
        cy={cy}
        r={wreathR}
        fill="none"
        stroke="#4a8c5c"
        strokeWidth={size * 0.06}
        strokeDasharray={`${size * 0.05} ${size * 0.03}`}
      />
      {positions.map((p, i) => {
        const x = cx + Math.cos(p.angle) * wreathR - candleW / 2
        const y = cy + Math.sin(p.angle) * wreathR - candleH / 2
        const lit = i < candlesLit
        const bodyColor = p.isRose ? "#E8A5B8" : "#6B4B8A"
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={candleW}
              height={candleH}
              rx={size * 0.01}
              fill={bodyColor}
              stroke="#2a1a3d"
              strokeWidth={0.5}
            />
            {/* Wick */}
            <line
              x1={x + candleW / 2}
              y1={y}
              x2={x + candleW / 2}
              y2={y - size * 0.02}
              stroke="#2a1a3d"
              strokeWidth={1}
            />
            {/* Flame */}
            {lit ? (
              <ellipse
                cx={x + candleW / 2}
                cy={y - size * 0.04}
                rx={size * 0.022}
                ry={size * 0.04}
                fill="#FFB347"
                stroke="#FF8C1A"
                strokeWidth={0.5}
              />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

function NativityStar({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const cy = size / 2
  const longR = size * 0.46
  const shortR = size * 0.18
  const points: string[] = []
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2
    const r = i % 2 === 0 ? longR : shortR
    points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`)
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id="starGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF4C2" />
          <stop offset="100%" stopColor="#C9A84C" />
        </radialGradient>
      </defs>
      <polygon
        points={points.join(" ")}
        fill="url(#starGlow)"
        stroke="#8a6d2c"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={size * 0.08} fill="#FFF4C2" />
    </svg>
  )
}

function ChiRho({ size = 140, accent = "#52B788" }: SymbolProps) {
  const cx = size / 2
  const stroke = size * 0.08
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* X (chi) — diagonals behind */}
      <line
        x1={size * 0.18}
        y1={size * 0.18}
        x2={size * 0.82}
        y2={size * 0.82}
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <line
        x1={size * 0.82}
        y1={size * 0.18}
        x2={size * 0.18}
        y2={size * 0.82}
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* P (rho) — vertical + loop */}
      <line
        x1={cx}
        y1={size * 0.14}
        x2={cx}
        y2={size * 0.9}
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx} ${size * 0.16}
            Q ${size * 0.8} ${size * 0.22} ${size * 0.78} ${size * 0.38}
            Q ${size * 0.78} ${size * 0.54} ${cx} ${size * 0.52}`}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  )
}

function CrossWithAshes({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const crossColor = "#E8D5F2"
  const armY = size * 0.35
  const armH = size * 0.1
  const stemW = size * 0.1
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Ashes smudge */}
      <ellipse
        cx={cx}
        cy={size * 0.88}
        rx={size * 0.22}
        ry={size * 0.045}
        fill="#6B6B6B"
        opacity={0.7}
      />
      <ellipse
        cx={cx - size * 0.05}
        cy={size * 0.9}
        rx={size * 0.08}
        ry={size * 0.02}
        fill="#3A3A3A"
        opacity={0.5}
      />
      {/* Vertical stem */}
      <rect
        x={cx - stemW / 2}
        y={size * 0.12}
        width={stemW}
        height={size * 0.72}
        fill={crossColor}
        stroke="#4a3559"
        strokeWidth={1}
      />
      {/* Horizontal arm */}
      <rect
        x={size * 0.22}
        y={armY}
        width={size * 0.56}
        height={armH}
        fill={crossColor}
        stroke="#4a3559"
        strokeWidth={1}
      />
    </svg>
  )
}

function ChaliceAndHost({ size = 140 }: SymbolProps) {
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Host (circle above) */}
      <circle
        cx={cx}
        cy={size * 0.22}
        r={size * 0.12}
        fill="#F5F0E8"
        stroke="#C9A84C"
        strokeWidth={2}
      />
      <line
        x1={cx - size * 0.07}
        y1={size * 0.22}
        x2={cx + size * 0.07}
        y2={size * 0.22}
        stroke="#C9A84C"
        strokeWidth={1.5}
      />
      <line
        x1={cx}
        y1={size * 0.15}
        x2={cx}
        y2={size * 0.29}
        stroke="#C9A84C"
        strokeWidth={1.5}
      />
      {/* Chalice */}
      {/* Cup */}
      <path
        d={`M ${cx - size * 0.2} ${size * 0.42}
            Q ${cx - size * 0.2} ${size * 0.58} ${cx} ${size * 0.6}
            Q ${cx + size * 0.2} ${size * 0.58} ${cx + size * 0.2} ${size * 0.42} Z`}
        fill="#D4AF37"
        stroke="#8a6d2c"
        strokeWidth={1.5}
      />
      {/* Stem */}
      <rect
        x={cx - size * 0.04}
        y={size * 0.6}
        width={size * 0.08}
        height={size * 0.18}
        fill="#D4AF37"
        stroke="#8a6d2c"
        strokeWidth={1}
      />
      {/* Node */}
      <ellipse cx={cx} cy={size * 0.7} rx={size * 0.07} ry={size * 0.03} fill="#C9A84C" />
      {/* Base */}
      <ellipse
        cx={cx}
        cy={size * 0.82}
        rx={size * 0.18}
        ry={size * 0.04}
        fill="#D4AF37"
        stroke="#8a6d2c"
        strokeWidth={1.5}
      />
    </svg>
  )
}

function CrownOfThorns({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.34
  const thorns: string[] = []
  const count = 24
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count
    const ix = cx + Math.cos(angle) * r
    const iy = cy + Math.sin(angle) * r
    const ox = cx + Math.cos(angle) * (r + size * 0.1)
    const oy = cy + Math.sin(angle) * (r + size * 0.1)
    const lx = cx + Math.cos(angle + 0.1) * (r + size * 0.03)
    const ly = cy + Math.sin(angle + 0.1) * (r + size * 0.03)
    thorns.push(`M ${ix} ${iy} L ${ox} ${oy} L ${lx} ${ly} Z`)
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Main ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#4a1a0a"
        strokeWidth={size * 0.065}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#7a2a12"
        strokeWidth={size * 0.04}
        strokeDasharray={`${size * 0.04} ${size * 0.02}`}
      />
      {/* Thorns */}
      <path d={thorns.join(" ")} fill="#4a1a0a" stroke="#2a0a04" strokeWidth={0.5} />
    </svg>
  )
}

function PaschalCandle({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const candleW = size * 0.22
  const x = cx - candleW / 2
  const topY = size * 0.14
  const bottomY = size * 0.86
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Candle body (unlit / dark during Holy Saturday) */}
      <rect
        x={x}
        y={topY}
        width={candleW}
        height={bottomY - topY}
        fill="#3a3340"
        stroke="#1a1520"
        strokeWidth={1.5}
      />
      {/* Cross inscribed */}
      <line
        x1={cx}
        y1={size * 0.24}
        x2={cx}
        y2={size * 0.68}
        stroke="#C9A84C"
        strokeWidth={size * 0.018}
        strokeLinecap="round"
      />
      <line
        x1={cx - size * 0.08}
        y1={size * 0.44}
        x2={cx + size * 0.08}
        y2={size * 0.44}
        stroke="#C9A84C"
        strokeWidth={size * 0.018}
        strokeLinecap="round"
      />
      {/* Alpha (above) */}
      <text
        x={cx}
        y={size * 0.32}
        textAnchor="middle"
        fontSize={size * 0.075}
        fontFamily="serif"
        fontWeight="bold"
        fill="#C9A84C"
      >
        Α
      </text>
      {/* Omega (below) */}
      <text
        x={cx}
        y={size * 0.62}
        textAnchor="middle"
        fontSize={size * 0.075}
        fontFamily="serif"
        fontWeight="bold"
        fill="#C9A84C"
      >
        Ω
      </text>
      {/* Wick (unlit) */}
      <line
        x1={cx}
        y1={topY}
        x2={cx}
        y2={topY - size * 0.03}
        stroke="#1a1520"
        strokeWidth={1.5}
      />
    </svg>
  )
}

function RisenSun({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const horizonY = size * 0.72
  const sunR = size * 0.22
  // rays behind
  const rays: string[] = []
  const rayCount = 12
  for (let i = 0; i < rayCount; i++) {
    const angle = Math.PI + (i * Math.PI) / (rayCount - 1) // half circle above horizon
    const innerR = sunR + size * 0.02
    const outerR = size * 0.46
    const ix = cx + Math.cos(angle) * innerR
    const iy = horizonY + Math.sin(angle) * innerR
    const ox = cx + Math.cos(angle) * outerR
    const oy = horizonY + Math.sin(angle) * outerR
    rays.push(`M ${ix} ${iy} L ${ox} ${oy}`)
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE29A" />
          <stop offset="100%" stopColor="#FFC043" />
        </radialGradient>
      </defs>
      {/* Rays */}
      <path
        d={rays.join(" ")}
        stroke="#FFD166"
        strokeWidth={size * 0.022}
        strokeLinecap="round"
        fill="none"
      />
      {/* Rolled-away stone behind */}
      <ellipse
        cx={cx + size * 0.22}
        cy={horizonY + size * 0.04}
        rx={size * 0.16}
        ry={size * 0.08}
        fill="#8B7355"
        stroke="#5a4a34"
        strokeWidth={1.5}
      />
      {/* Empty tomb opening */}
      <path
        d={`M ${cx - size * 0.22} ${horizonY + size * 0.1}
            Q ${cx - size * 0.22} ${horizonY - size * 0.02} ${cx - size * 0.06} ${horizonY - size * 0.06}
            Q ${cx + size * 0.1} ${horizonY - size * 0.02} ${cx + size * 0.1} ${horizonY + size * 0.1} Z`}
        fill="#2a2a2a"
        stroke="#5a4a34"
        strokeWidth={1.5}
      />
      {/* Sun rising */}
      <circle cx={cx} cy={horizonY} r={sunR} fill="url(#sunGlow)" />
      {/* Horizon line */}
      <line
        x1={size * 0.06}
        y1={horizonY + size * 0.1}
        x2={size * 0.94}
        y2={horizonY + size * 0.1}
        stroke="#8B7355"
        strokeWidth={1.5}
      />
    </svg>
  )
}

function DoveWithFlame({ size = 140 }: SymbolProps) {
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Flame above */}
      <path
        d={`M ${cx} ${size * 0.06}
            Q ${cx - size * 0.05} ${size * 0.14} ${cx} ${size * 0.22}
            Q ${cx + size * 0.05} ${size * 0.14} ${cx} ${size * 0.06} Z`}
        fill="#FF6B35"
        stroke="#C04020"
        strokeWidth={1}
      />
      <path
        d={`M ${cx} ${size * 0.1}
            Q ${cx - size * 0.025} ${size * 0.15} ${cx} ${size * 0.2}
            Q ${cx + size * 0.025} ${size * 0.15} ${cx} ${size * 0.1} Z`}
        fill="#FFD166"
      />
      {/* Dove body */}
      <path
        d={`M ${cx - size * 0.3} ${size * 0.56}
            Q ${cx - size * 0.35} ${size * 0.42} ${cx - size * 0.1} ${size * 0.38}
            Q ${cx + size * 0.1} ${size * 0.36} ${cx + size * 0.25} ${size * 0.5}
            Q ${cx + size * 0.32} ${size * 0.62} ${cx + size * 0.1} ${size * 0.66}
            Q ${cx - size * 0.15} ${size * 0.7} ${cx - size * 0.3} ${size * 0.56} Z`}
        fill="#FFFFFF"
        stroke="#BFC8D6"
        strokeWidth={1.5}
      />
      {/* Wing */}
      <path
        d={`M ${cx - size * 0.1} ${size * 0.4}
            Q ${cx + size * 0.05} ${size * 0.28} ${cx + size * 0.18} ${size * 0.46}
            Q ${cx + size * 0.05} ${size * 0.52} ${cx - size * 0.1} ${size * 0.48} Z`}
        fill="#E0E6EE"
        stroke="#BFC8D6"
        strokeWidth={1}
      />
      {/* Head */}
      <circle cx={cx - size * 0.28} cy={size * 0.5} r={size * 0.055} fill="#FFFFFF" stroke="#BFC8D6" strokeWidth={1.5} />
      {/* Eye */}
      <circle cx={cx - size * 0.3} cy={size * 0.49} r={size * 0.008} fill="#1a1a1a" />
      {/* Beak */}
      <path
        d={`M ${cx - size * 0.33} ${size * 0.5}
            L ${cx - size * 0.38} ${size * 0.51}
            L ${cx - size * 0.33} ${size * 0.52} Z`}
        fill="#FFC043"
        stroke="#8a6d2c"
        strokeWidth={0.5}
      />
      {/* Tail feathers */}
      <path
        d={`M ${cx + size * 0.2} ${size * 0.48}
            L ${cx + size * 0.34} ${size * 0.44}
            L ${cx + size * 0.34} ${size * 0.52}
            L ${cx + size * 0.32} ${size * 0.58}
            L ${cx + size * 0.26} ${size * 0.56} Z`}
        fill="#E0E6EE"
        stroke="#BFC8D6"
        strokeWidth={1}
      />
      {/* Motion lines below suggesting descent */}
      <line
        x1={cx - size * 0.15}
        y1={size * 0.78}
        x2={cx + size * 0.15}
        y2={size * 0.78}
        stroke="#BFC8D6"
        strokeWidth={1}
        opacity={0.6}
      />
      <line
        x1={cx - size * 0.05}
        y1={size * 0.86}
        x2={cx + size * 0.05}
        y2={size * 0.86}
        stroke="#BFC8D6"
        strokeWidth={1}
        opacity={0.4}
      />
    </svg>
  )
}

function Rose({ size = 140 }: SymbolProps) {
  const cx = size / 2
  const cy = size / 2
  const petalR = size * 0.22
  // 5 petals around center
  const petals: string[] = []
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const px = cx + Math.cos(angle) * (size * 0.14)
    const py = cy + Math.sin(angle) * (size * 0.14)
    petals.push(`<ellipse cx="${px}" cy="${py}" rx="${petalR * 0.7}" ry="${petalR}" transform="rotate(${(angle * 180) / Math.PI + 90} ${px} ${py})"/>`)
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Leaves */}
      <ellipse
        cx={cx - size * 0.26}
        cy={cy + size * 0.1}
        rx={size * 0.12}
        ry={size * 0.05}
        fill="#4a8c5c"
        transform={`rotate(-30 ${cx - size * 0.26} ${cy + size * 0.1})`}
      />
      <ellipse
        cx={cx + size * 0.26}
        cy={cy + size * 0.1}
        rx={size * 0.12}
        ry={size * 0.05}
        fill="#4a8c5c"
        transform={`rotate(30 ${cx + size * 0.26} ${cy + size * 0.1})`}
      />
      {/* Outer petals */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
        const px = cx + Math.cos(angle) * (size * 0.14)
        const py = cy + Math.sin(angle) * (size * 0.14)
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={petalR * 0.7}
            ry={petalR}
            fill="#E8A5B8"
            stroke="#B97088"
            strokeWidth={1}
            transform={`rotate(${(angle * 180) / Math.PI + 90} ${px} ${py})`}
          />
        )
      })}
      {/* Inner bud */}
      <circle cx={cx} cy={cy} r={size * 0.1} fill="#D76B8A" stroke="#B05070" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={size * 0.05} fill="#B05070" />
    </svg>
  )
}

/* ─── Dispatcher ─── */

export function SeasonSymbol({
  season,
  isSpecialDay,
  specialDayName,
  color,
  size = 140,
  date,
}: {
  season: LiturgicalSeason
  isSpecialDay: boolean
  specialDayName?: string
  color: LiturgicalColor
  size?: number
  date?: Date
}) {
  // Priority dispatch based on special day first
  if (specialDayName === "Good Friday") return <CrownOfThorns size={size} />
  if (specialDayName === "Holy Saturday") return <PaschalCandle size={size} />
  if (specialDayName === "Holy Thursday") return <ChaliceAndHost size={size} />
  if (specialDayName === "Pentecost Sunday") return <DoveWithFlame size={size} />
  if (specialDayName === "Gaudete Sunday" || specialDayName === "Laetare Sunday") {
    return <Rose size={size} />
  }
  if (specialDayName === "Palm Sunday") return <CrossWithAshes size={size} />

  // Unused vars guard
  void isSpecialDay
  void color

  if (season === "advent") {
    const week = date ? getAdventWeekNumber(date) ?? 1 : 1
    return <AdventWreath size={size} candlesLit={week} />
  }
  if (season === "christmas") return <NativityStar size={size} />
  if (season === "ordinary-time-1" || season === "ordinary-time-2") {
    return <ChiRho size={size} accent="#52B788" />
  }
  if (season === "lent") return <CrossWithAshes size={size} />
  if (season === "triduum") return <PaschalCandle size={size} />
  if (season === "easter") return <RisenSun size={size} />

  // Fallback
  return <ChiRho size={size} />
}
