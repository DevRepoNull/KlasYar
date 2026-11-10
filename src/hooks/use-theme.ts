import { useEffect, useState } from "react"

import { useSettingsHydrated } from "@/hooks/use-settings"
import { applyTheme, resolveTheme, type ResolvedTheme } from "@/lib/theme"
import { useSettingsStore, type ThemeMode } from "@/store/settingsStore"

interface UseThemeResult {
  theme: ThemeMode
  resolved: ResolvedTheme
  hydrated: boolean
}

/**
 * تم انتخاب‌شده را روی <html> اعمال می‌کند و در حالت «سیستم» به تغییر
 * prefers-color-scheme گوش می‌دهد. تا پیش از hydration کاری نمی‌کند تا تمی که
 * اسکریپت index.html پیش از رندر اعمال کرده است پاک نشود.
 */
export function useTheme(): UseThemeResult {
  const theme = useSettingsStore((state) => state.theme)
  const hydrated = useSettingsHydrated()
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(theme),
  )

  useEffect(() => {
    if (!hydrated) return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setResolved(applyTheme(theme))

    sync()

    if (theme !== "system") return

    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [theme, hydrated])

  return { theme, resolved, hydrated }
}
