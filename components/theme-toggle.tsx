"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { FaSun, FaMoon } from "react-icons/fa"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg text-muted-foreground"
        aria-label="Theme wechseln"
      >
        <FaSun className="w-4 h-4" />
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-teal-100 dark:hover:bg-teal-900 text-gray-600 dark:text-gray-300"
      aria-label={isDark ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
      title={isDark ? "Heller Modus" : "Dunkler Modus"}
    >
      {isDark ? (
        <FaSun className="w-4 h-4 text-amber-400" />
      ) : (
        <FaMoon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  )
}
