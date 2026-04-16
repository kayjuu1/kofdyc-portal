import { useNavigate, useSearch } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

const scopes = [
  { value: "", label: "All" },
  { value: "diocese", label: "Diocese" },
  { value: "deanery", label: "Deanery" },
  { value: "parish", label: "Parish" },
] as const

export function ScopeFilter() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, string | undefined>
  const currentScope = search.scope ?? ""

  return (
    <div className="flex items-center gap-1">
      {scopes.map((s) => (
        <button
          key={s.value}
          onClick={() =>
            navigate({
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                scope: s.value || undefined,
                page: undefined,
              }),
            } as never)
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            currentScope === s.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
