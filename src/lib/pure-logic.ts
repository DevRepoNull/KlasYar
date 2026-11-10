/**
 * KlasYar - Pure Business Logic Functions
 * توابع منطق محاسباتی و خالص سیستم کلاس‌یار
 */

/**
 * محاسبه مدت زمان جلسه به دقیقه بر اساس ساعت شروع و پایان ("HH:mm")
 * @example calculateSessionDurationMinutes("16:00", "17:30") => 90
 */
export function calculateSessionDurationMinutes(
  start: string,
  end: string,
): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)

  if (
    Number.isNaN(sh) ||
    Number.isNaN(sm) ||
    Number.isNaN(eh) ||
    Number.isNaN(em)
  ) {
    return 0
  }

  const startTotal = sh * 60 + sm
  const endTotal = eh * 60 + em
  return Math.max(0, endTotal - startTotal)
}

/**
 * اعتبارسنجی سقف جلسات یک کلاس
 * بررسی می‌کند آیا می‌توان یک جلسه جدید برای این کلاس اضافه کرد یا خیر.
 * @param currentCount تعداد جلسات ثبت شده تاکنون
 * @param totalSessions کل جلسات مجاز کلاس
 */
export function canAddSessionForDefinition(
  currentCount: number,
  totalSessions: number,
): boolean {
  if (totalSessions <= 0) return false
  return currentCount < totalSessions
}

/**
 * بررسی اینکه آیا سقف جلسات کلاس تکمیل شده است
 */
export function isSessionLimitReached(
  currentCount: number,
  totalSessions: number,
): boolean {
  return !canAddSessionForDefinition(currentCount, totalSessions)
}

/**
 * بازه زمانی شروع و پایان یک جلسه
 */
export interface TimeInterval {
  start: string
  end: string
}

/**
 * بررسی تداخل و هم‌پوشانی دو بازه زمانی در یک روز [start, end)
 * توجه: جلسات پشت‌سرهم (Back-to-Back مانند ۱۰:۰۰ تا ۱۱:۳۰ و ۱۱:۳۰ تا ۱۳:۰۰) تداخل ندارند.
 */
export function checkTimeOverlap(a: TimeInterval, b: TimeInterval): boolean {
  if (a.start >= a.end || b.start >= b.end) return false
  // بازه‌ها همپوشانی دارند اگر و تنها اگر: a.start < b.end && b.start < a.end
  return a.start < b.end && b.start < a.end
}

/**
 * محاسبه درصد حضور (شاگرد یا میانگین کل کلاس)
 * وضعیت حاضر و تأخیر به عنوان حضور مثبت و غایب و مرخصی در مخرج قرار می‌گیرند.
 * @returns عدد درصد بین ۰ تا ۱۰۰، یا null در صورتی که هیچ رکوردی ثبت نشده باشد.
 */
export function calculateAttendancePercentage(
  present: number,
  late: number,
  excused: number,
  absent: number,
): number | null {
  const p = Math.max(0, present)
  const l = Math.max(0, late)
  const e = Math.max(0, excused)
  const a = Math.max(0, absent)

  const recordedTotal = p + l + e + a
  if (recordedTotal === 0) return null

  const attended = p + l
  return Math.round((attended / recordedTotal) * 100)
}
