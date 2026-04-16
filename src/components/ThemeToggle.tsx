import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeToggle({ variant = "ghost", size = "icon" }: { variant?: "ghost" | "outline"; size?: "icon" | "sm" }) {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    // Sync with what the inline script may have set
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  function toggle() {
    const next = theme === "light" ? "dark" : "light"
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
    setTheme(next)
  }

  return (
    <Button variant={variant} size={size} onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  )
}
