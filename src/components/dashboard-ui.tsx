import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DashboardPageHeaderProps = {
  title: string
  description: string
  action?: {
    label: string
    href: string
    icon?: LucideIcon
  }
  children?: ReactNode
}

export function DashboardPageHeader({
  title,
  description,
  action,
  children,
}: DashboardPageHeaderProps) {
  const ActionIcon = action?.icon

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action ? (
          <Button asChild size="sm">
            <Link to={action.href}>
              {ActionIcon ? <ActionIcon className="mr-1.5 size-4" /> : null}
              {action.label}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

type DashboardStatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: "emerald" | "gold" | "sky" | "rose" | "plum"
  detail?: string
}

const toneConfig: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  { icon: string; accent: string }
> = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    accent: "text-emerald-600",
  },
  gold: {
    icon: "bg-amber-50 text-amber-600",
    accent: "text-amber-600",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600",
    accent: "text-sky-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    accent: "text-rose-600",
  },
  plum: {
    icon: "bg-violet-50 text-violet-600",
    accent: "text-violet-600",
  },
}

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  tone = "emerald",
  detail,
}: DashboardStatCardProps) {
  const config = toneConfig[tone]

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn("flex size-9 items-center justify-center rounded-lg", config.icon)}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className={cn("text-3xl font-bold tracking-tight", config.accent)}>{value}</p>
          {detail ? (
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

type DashboardSectionCardProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  children: ReactNode
  className?: string
}

export function DashboardSectionCard({
  title,
  description,
  actionLabel,
  actionHref,
  children,
  className,
}: DashboardSectionCardProps) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader>
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm">{description}</CardDescription>
          ) : null}
        </div>
        {actionLabel && actionHref ? (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link to={actionHref}>
                {actionLabel}
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

type DashboardFilterPillsProps<T extends string> = {
  items: readonly T[]
  value?: T
  onSelect: (value: T) => void
  formatLabel?: (value: T) => string
}

export function DashboardFilterPills<T extends string>({
  items,
  value,
  onSelect,
  formatLabel,
}: DashboardFilterPillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = value === item

        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {formatLabel ? formatLabel(item) : item}
          </button>
        )
      })}
    </div>
  )
}

type DashboardEmptyStateProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function DashboardEmptyState({
  title,
  description,
  icon: Icon,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
