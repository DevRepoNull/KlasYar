export type ColorTheme = "emerald" | "midnight" | "sunset" | "monochrome"

export interface ColorThemeOption {
  id: ColorTheme
  label: string
  englishLabel: string
  description: string
  primaryColor: string
  accentColor: string
  previewSwatches: [string, string, string, string]
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "emerald",
    label: "زمرد",
    englishLabel: "Emerald",
    description: "سبز تیره و درخشان با حس آرامش، طراوت و تعادل (پیش‌فرض)",
    primaryColor: "#0d9488",
    accentColor: "#14b8a6",
    previewSwatches: ["#0f766e", "#0d9488", "#5eead4", "#f0fdfa"],
  },
  {
    id: "midnight",
    label: "نیمه‌شب",
    englishLabel: "Midnight",
    description: "آبی نفتی با عمق مدرن و جزئیات نیلی جذاب",
    primaryColor: "#2563eb",
    accentColor: "#3b82f6",
    previewSwatches: ["#1e3a8a", "#2563eb", "#93c5fd", "#eff6ff"],
  },
  {
    id: "sunset",
    label: "غروب",
    englishLabel: "Sunset",
    description: "نارنجی و مرجانی گرم، پرانرژی و چشم‌نواز",
    primaryColor: "#ea580c",
    accentColor: "#f97316",
    previewSwatches: ["#9a3412", "#ea580c", "#fdba74", "#fff7ed"],
  },
  {
    id: "monochrome",
    label: "تک‌رنگ",
    englishLabel: "Monochrome",
    description: "خاکستری‌های مدرن و مینیمال با بالاترین تضاد و وقار",
    primaryColor: "#18181b",
    accentColor: "#71717a",
    previewSwatches: ["#18181b", "#3f3f46", "#a1a1aa", "#f4f4f5"],
  },
]

export const COLOR_THEME_COOKIE = "klasyar-color-theme"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/**
 * اعمال پالت رنگی انتخاب‌شده روی عنصر ریشه (HTML)
 * و ذخیره در کوکی جهت همگام‌سازی سریع بدون پرش نور (FOUC).
 */
export function applyColorTheme(theme: ColorTheme): void {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.setAttribute("data-color-theme", theme)

  try {
    document.cookie = `${COLOR_THEME_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
    localStorage.setItem("klasyar-color-theme", theme)
  } catch {}
}

/**
 * دریافت پالت رنگی ذخیره‌شده پیشین
 */
export function getSavedColorTheme(): ColorTheme {
  if (typeof document === "undefined") return "emerald"

  try {
    const match = document.cookie.match(
      /(?:^|;\s*)klasyar-color-theme=(emerald|midnight|sunset|monochrome)/,
    )
    if (match && match[1]) {
      return match[1] as ColorTheme
    }

    const local = localStorage.getItem("klasyar-color-theme") as ColorTheme | null
    if (local && ["emerald", "midnight", "sunset", "monochrome"].includes(local)) {
      return local
    }
  } catch {}

  return "emerald"
}
