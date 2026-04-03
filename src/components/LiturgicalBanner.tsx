import { getCurrentLiturgicalSeason } from "@/lib/liturgical"
import { Star } from "lucide-react"

const colorMap: Record<string, string> = {
  purple: "text-purple-600",
  white: "text-amber-500",
  green: "text-green-600",
  red: "text-red-600",
}

export function LiturgicalBanner() {
  const info = getCurrentLiturgicalSeason()
  const colorClass = colorMap[info.color] ?? "text-primary"

  return (
    <span className="flex items-center gap-1">
      <Star className={`w-3 h-3 fill-current ${colorClass}`} />
      {info.label}
    </span>
  )
}
