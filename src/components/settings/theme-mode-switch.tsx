import { motion } from "framer-motion"
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSettingsStore, type ThemeMode } from "@/store/settingsStore"

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "روشن", icon: Sun },
  { value: "dark", label: "تاریک", icon: Moon },
  { value: "system", label: "سیستم", icon: Monitor },
]

/** سوییچ سه‌حالته تم با نشانگر متحرک و آیکون‌های انیمیشنی. */
export function ThemeModeSwitch() {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)

  return (
    <div
      role="radiogroup"
      aria-label="حالت نمایش"
      className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="theme-mode-indicator"
                className="absolute inset-0 rounded-lg border bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <motion.span
              className="relative z-10 flex items-center gap-1.5"
              animate={{ opacity: active ? 1 : 0.75, scale: active ? 1 : 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <motion.span
                animate={{ rotate: active ? 0 : -14 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="grid place-items-center"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </motion.span>
              {label}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
