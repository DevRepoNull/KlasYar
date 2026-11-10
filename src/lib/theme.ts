import type { ThemeMode } from "@/store/settingsStore"

export type ResolvedTheme = "light" | "dark"

/**
 * آینه‌ی همگام تم در cookie. منبع اصلی IndexedDB است، اما اسکریپت inline در
 * index.html باید پیش از رندر و به‌صورت همگام تم را بداند؛ cookie این کار را
 * می‌کند و به همین دلیل پرش تم (FOUC) رخ نمی‌دهد.
 */
export const THEME_HINT_COOKIE = "klasyar-theme"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

/** کلاس `dark` و `color-scheme` را اعمال می‌کند و آینه‌ی cookie را به‌روز می‌کند. */
export function applyTheme(theme: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(theme)
  const root = document.documentElement

  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  document.cookie = `${THEME_HINT_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`

  return resolved
}
