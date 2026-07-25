import { useEffect, useRef, useState } from "react"
import { ArrowRight, Heart } from "lucide-react"
import type { FeaturedEventItem } from "@/functions/featured-events"
import { cn } from "@/lib/utils"

const CAROUSEL_INTERVAL_MS = 8000

type Countdown =
  | { state: "counting"; days: number; hours: number; minutes: number; seconds: number }
  | { state: "happening" }
  | { state: "started" }

function computeCountdown(item: FeaturedEventItem, nowMs: number): Countdown {
  const target = Date.parse(item.targetDate)
  const diff = target - nowMs
  if (diff <= 0) {
    if (item.eventEndAt && nowMs < Date.parse(item.eventEndAt)) {
      return { state: "happening" }
    }
    return { state: "started" }
  }
  return {
    state: "counting",
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  }
}

/** Renders the support line, bolding segments wrapped in ** markers. */
function SupportLine({ text }: { text: string }) {
  const segments = text.split("**")
  return (
    <p className="mt-8 flex items-start justify-center gap-2 text-sm text-muted-foreground">
      <Heart className="mt-0.5 size-4 shrink-0 fill-red-500 text-red-500" />
      <span>
        {segments.map((segment, index) =>
          index % 2 === 1 ? (
            <strong key={index} className="font-bold text-foreground">
              {segment}
            </strong>
          ) : (
            <span key={index}>{segment}</span>
          ),
        )}
      </span>
    </p>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-2 sm:px-3">
      <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function CountdownPill({
  item,
  countdown,
}: {
  item: FeaturedEventItem
  countdown: Countdown
}) {
  const cta = item.ctaUrl ? (
    <a
      href={item.ctaUrl}
      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900"
    >
      {item.ctaLabel}
      <ArrowRight className="size-4" />
    </a>
  ) : null

  return (
    <div className="relative z-10 -mt-10 flex justify-center px-4 sm:-mt-12">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background px-4 py-3 shadow-xl sm:gap-5 sm:px-6 sm:py-4">
        {countdown.state === "counting" ? (
          <div className="flex divide-x divide-border">
            <CountdownUnit value={countdown.days} label="Days" />
            <CountdownUnit value={countdown.hours} label="Hrs" />
            <CountdownUnit value={countdown.minutes} label="Min" />
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </div>
        ) : (
          <span className="px-2 text-lg font-bold text-foreground sm:text-xl">
            {countdown.state === "happening" ? "Happening now" : "This event has started"}
          </span>
        )}
        {cta}
      </div>
    </div>
  )
}

function FeaturedEventSlide({
  item,
  nowMs,
}: {
  item: FeaturedEventItem
  nowMs: number
}) {
  const countdown = computeCountdown(item, nowMs)
  return (
    <div>
      <p
        className="text-center text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: "#2D6A4F" }}
      >
        Featured event
      </p>
      <h2 className="mt-2 text-center font-serif text-2xl font-bold text-foreground md:text-4xl">
        {item.displayTitle}
      </h2>
      <div className="mt-6 overflow-hidden rounded-2xl shadow-lg">
        <img
          src={item.artworkUrl}
          alt={item.displayTitle}
          className="aspect-video w-full object-cover"
        />
      </div>
      <CountdownPill item={item} countdown={countdown} />
      {item.supportLine ? <SupportLine text={item.supportLine} /> : null}
    </div>
  )
}

export function FeaturedEventHero({
  items,
  serverNow,
}: {
  items: FeaturedEventItem[]
  serverNow: string
}) {
  // Initial render uses server time so SSR and hydration output match;
  // after mount the captured offset absorbs client clock skew.
  const [nowMs, setNowMs] = useState(() => Date.parse(serverNow))
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const offsetRef = useRef<number | null>(null)

  useEffect(() => {
    offsetRef.current = Date.now() - Date.parse(serverNow)
    const tick = () => setNowMs(Date.now() - (offsetRef.current ?? 0))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [serverNow])

  const count = items.length

  useEffect(() => {
    if (count <= 1 || isPaused) return
    const interval = setInterval(
      () => setActiveIndex((index) => (index + 1) % count),
      CAROUSEL_INTERVAL_MS,
    )
    return () => clearInterval(interval)
  }, [count, isPaused])

  if (count === 0) return null

  return (
    <section
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {count === 1 ? (
        <FeaturedEventSlide item={items[0]} nowMs={nowMs} />
      ) : (
        <>
          <div className="relative">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "transition-opacity duration-500",
                  index === activeIndex
                    ? "relative opacity-100"
                    : "pointer-events-none absolute inset-0 opacity-0",
                )}
                aria-hidden={index !== activeIndex}
                {...(index !== activeIndex ? { inert: "" } : {})}
              >
                <FeaturedEventSlide item={item} nowMs={nowMs} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.displayTitle}`}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  index === activeIndex
                    ? "bg-foreground"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
