/** پالت رنگ کلاس‌ها؛ رنگ پیش‌فرض هر کلاس تازه به‌صورت تصادفی از همین فهرست انتخاب می‌شود. */
export interface ClassPaletteColor {
  value: string
  label: string
}

export const CLASS_COLORS: readonly ClassPaletteColor[] = [
  { value: "#6366f1", label: "نیلی" },
  { value: "#0ea5e9", label: "آبی" },
  { value: "#14b8a6", label: "فیروزه‌ای" },
  { value: "#22c55e", label: "سبز" },
  { value: "#eab308", label: "زرد" },
  { value: "#f97316", label: "نارنجی" },
  { value: "#ef4444", label: "قرمز" },
  { value: "#ec4899", label: "صورتی" },
  { value: "#a855f7", label: "بنفش" },
  { value: "#64748b", label: "خاکستری" },
]

export function randomClassColor(): string {
  const index = Math.floor(Math.random() * CLASS_COLORS.length)
  return CLASS_COLORS[index]?.value ?? "#6366f1"
}

/** رنگ هگز را با شفافیت می‌آمیزد؛ رنگ‌های غیرهگز بدون پس‌زمینه می‌مانند. */
export function tintColor(color: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "transparent"
  const hex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
  return `${color}${hex}`
}

/** مقدار معتبر برای `<input type="color">` (فقط هگز شش‌رقمی). */
export function toColorInputValue(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#6366f1"
}
