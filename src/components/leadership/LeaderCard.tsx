import type { ReactNode } from "react"

export const GOLD = "#C9A84C"

/**
 * Renders a heading with the segment after a `|` divider in gold,
 * e.g. "The Diocesan|Executive Council".
 */
export function GoldTitle({ title, className }: { title: string; className?: string }) {
  const [first, ...rest] = title.split("|")
  const gold = rest.join("|")
  return (
    <h1 className={className}>
      {first}
      {gold ? (
        <>
          {" "}
          <span style={{ color: GOLD }}>{gold}</span>
        </>
      ) : null}
    </h1>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="h-px w-8 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {children}
      </span>
      <span className="h-px w-8 bg-border" />
    </div>
  )
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Profile card shared by the Leadership page and Hierarchy leader grids:
 * portrait photo with a dark role pill overlapping its bottom edge.
 */
export function LeaderCard({
  name,
  roleTitle,
  photoUrl,
  footer,
}: {
  name: string
  roleTitle: string
  photoUrl: string | null
  footer?: ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="aspect-[4/5] w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-muted">
            <span className="text-4xl font-bold text-muted-foreground">
              {initialsOf(name)}
            </span>
          </div>
        )}
        <span className="absolute -bottom-3 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-neutral-800 px-3 py-1 text-xs whitespace-nowrap text-white shadow-md">
          {roleTitle}
        </span>
      </div>
      <div className="mt-5 text-center">
        <p className="font-bold text-foreground">{name}</p>
        {footer}
      </div>
    </div>
  )
}
