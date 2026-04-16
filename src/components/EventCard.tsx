import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"

interface EventCardProps {
  title: string
  eventType: string
  startAt: string
  endAt: string | null
  venue: string | null
  registrationType: string
  feeAmount: number | null
  feeCurrency: string
}

export function EventCard({
  title,
  eventType,
  startAt,
  venue,
  registrationType,
  feeAmount,
  feeCurrency,
}: EventCardProps) {
  const startDate = new Date(startAt)
  const month = startDate.toLocaleDateString("en-US", { month: "short" })
  const day = startDate.getDate()
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <Card className="group border-border/50 transition-all hover:border-primary/20 hover:shadow-md">
      <CardContent className="flex gap-4 p-4">
        {/* Date block */}
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
          <span className="text-[10px] font-semibold uppercase tracking-wider">{month}</span>
          <span className="text-xl font-bold leading-none">{day}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] capitalize">{eventType}</Badge>
            {registrationType === "paid" && feeAmount ? (
              <Badge variant="outline" className="text-[10px]">
                {feeCurrency} {feeAmount.toFixed(2)}
              </Badge>
            ) : null}
          </div>
          <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {title}
          </h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 shrink-0 text-muted-foreground/60" />
              {timeStr}
            </div>
            {venue ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">{venue}</span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
