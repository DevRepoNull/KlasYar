export type AppFont = "vazirmatn" | "system"

export const FONT_OPTIONS: { id: AppFont; name: string; description: string; isRecommended?: boolean }[] = [
  {
    id: "vazirmatn",
    name: "وزیرمتن (Vazirmatn)",
    description: "فونت بهینه‌شده و چشم‌نواز برای متون فارسی با خوانایی استثنایی در تمامی ابعاد نمایشگر.",
    isRecommended: true,
  },
  {
    id: "system",
    name: "فونت سیستم‌عامل (System Font)",
    description: "استفاده از فونت پیش‌فرض رابط کاربری سیستم‌عامل دستگاه شما.",
  },
]

/**
 * فونت انتخاب‌شده را به طور بی‌درنگ روی عنصر ریشه سند اعمال می‌کند.
 */
export function applyFontFamily(font: AppFont): void {
  if (typeof document === "undefined") return

  const root = document.documentElement
  if (font === "system") {
    root.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    root.classList.add("font-system")
    root.classList.remove("font-vazir")
  } else {
    root.style.fontFamily = "var(--font-vazirmatn, 'Vazirmatn', system-ui, sans-serif)"
    root.classList.add("font-vazir")
    root.classList.remove("font-system")
  }
}
