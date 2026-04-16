import { getCurrentLiturgicalSeason } from "@/lib/liturgical"
import { cn } from "@/lib/utils"

const colorMap: Record<string, string> = {
  purple: "bg-purple-600",
  white: "bg-amber-500",
  green: "bg-green-600",
  red: "bg-red-600",
}

export function LiturgicalBanner() {
  const info = getCurrentLiturgicalSeason()
  const dotClass = colorMap[info.color] ?? "bg-primary"

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn("inline-block size-2 rounded-full", dotClass)} />
      {info.label}
    </span>
  )
}
