import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"

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
  const dateStr = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge className="w-fit text-xs capitalize">{eventType}</Badge>
          {registrationType === "paid" && feeAmount && (
            <Badge variant="outline" className="text-xs">
              {feeCurrency} {feeAmount.toFixed(2)}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-semibold mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          {dateStr}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          {timeStr}
        </div>
        {venue && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{venue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
