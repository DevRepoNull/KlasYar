/**
 * نام ماه جاری شمسی و سال، مثلاً «آبان ۱۴۰۵».
 * تقویم پیش‌فرض `fa-IR` در Intl تقویم هجری شمسی است؛ ترتیب اجزا را خودمان
 * می‌چینیم چون Intl سال را پیش از ماه برمی‌گرداند.
 */
export function formatJalaliMonth(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR", {
      month: "long",
      year: "numeric",
    }).formatToParts(date)
    const month = parts.find((part) => part.type === "month")?.value
    const year = parts.find((part) => part.type === "year")?.value

    if (month && year) return `${month} ${year}`

    return new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(date)
  } catch {
    return new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(date)
  }
}
