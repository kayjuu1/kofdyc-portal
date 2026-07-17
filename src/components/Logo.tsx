import { cn } from "@/lib/utils"

// White chip so the multicolor emblem stays legible on dark surfaces
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-white p-0.5 ring-1 ring-border/50",
        className
      )}
    >
      <img src="/logo-mark.png" alt="KOFDYC logo" className="h-full w-full object-contain" />
    </span>
  )
}
