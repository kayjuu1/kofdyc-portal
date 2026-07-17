import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ variant = "ghost", size = "icon" }: { variant?: "ghost" | "outline"; size?: "icon" | "sm" }) {
  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  // Both icons are always rendered and CSS picks the visible one, so the
  // markup is identical on server and client regardless of the theme the
  // inline script applied — no hydration mismatch.
  return (
    <Button variant={variant} size={size} onClick={toggle} aria-label="Toggle theme">
      <Moon className="size-4 dark:hidden" />
      <Sun className="size-4 hidden dark:block" />
    </Button>
  )
}
