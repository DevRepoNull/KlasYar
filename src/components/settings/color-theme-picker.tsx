import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { COLOR_THEMES } from "@/lib/color-theme"
import { useSettingsStore } from "@/store/settingsStore"
import { cn } from "@/lib/utils"

export function ColorThemePicker() {
  const colorTheme = useSettingsStore((state) => state.colorTheme)
  const setColorTheme = useSettingsStore((state) => state.setColorTheme)

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {COLOR_THEMES.map((theme) => {
        const isSelected = colorTheme === theme.id

        return (
          <motion.button
            key={theme.id}
            type="button"
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setColorTheme(theme.id)}
            className={cn(
              "group relative flex flex-col justify-between rounded-2xl border p-4 text-start transition-all duration-200 outline-none",
              isSelected
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/40 dark:bg-primary/10"
                : "border-border/70 bg-card/60 backdrop-blur-md hover:border-border hover:bg-card/90 hover:shadow-sm",
            )}
            aria-pressed={isSelected}
            aria-label={`انتخاب تم رنگی ${theme.label}`}
          >
            {/* سربرگ پالت با نشان انتخاب و رنگ اصلی */}
            <div className="flex items-center justify-between w-full mb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-5 w-5 rounded-full shrink-0 shadow-sm ring-2 ring-background transition-transform group-hover:scale-110"
                  style={{ backgroundColor: theme.primaryColor }}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-foreground">
                    {theme.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 font-medium">
                    ({theme.englishLabel})
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-muted-foreground/30 text-transparent",
                )}
              >
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            </div>

            {/* سواتچ رنگ‌های پالت */}
            <div className="flex items-center gap-1.5 my-2">
              {theme.previewSwatches.map((color, idx) => (
                <span
                  key={idx}
                  className="h-3.5 flex-1 rounded-md shadow-xs border border-black/5 dark:border-white/10"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* توضیح مختصر حال‌وهوای پالت */}
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {theme.description}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}
