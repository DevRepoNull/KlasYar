import {
  jalaaliMonthLength,
  isValidJalaaliDate,
  jalaaliToDateObject,
  toGregorian,
  toJalaali,
} from "jalaali-js"

/**
 * ابزارهای تقویم شمسی.
 *
 * تاریخ‌ها در دیتابیس به شکل شمسی `YYYY-MM-DD` ذخیره می‌شوند، اما FullCalendar
 * (و `Date` مرورگر) میلادی کار می‌کند. همه‌ی تبدیل‌ها اینجا متمرکز است تا
 * تاریخ‌های روز و مرز ماه یک منبع واحد داشته باشند.
 */

export interface JalaliDate {
  year: number
  month: number
  day: number
}

/** ترتیب ماه‌ها: فروردین = ۱ */
export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const

/** شنبه = ۰ … جمعه = ۶؛ هم‌راستا با `DayOfWeek` در لایه دیتابیس. */
export const JALALI_WEEKDAY_NAMES = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

/** تعطیلات رسمی ثابت (بدون تعطیلات قمری که هر سال جابه‌جا می‌شوند). */
const OFFICIAL_HOLIDAYS: Record<string, string> = {
  "1-1": "نوروز",
  "1-2": "نوروز",
  "1-3": "نوروز",
  "1-4": "نوروز",
  "1-12": "روز جمهوری اسلامی",
  "1-13": "سیزده‌بدر",
  "3-14": "رحلت امام خمینی",
  "3-15": "قیام ۱۵ خرداد",
  "11-22": "پیروزی انقلاب اسلامی",
  "12-29": "ملی شدن صنعت نفت",
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/** ارقام لاتین را برای نمایش به ارقام فارسی تبدیل می‌کند. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)])
}

export function jalaliDateToString(date: JalaliDate): string {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`
}

/** پارس تاریخ شمسی `YYYY-MM-DD`؛ برای تاریخ نامعتبر خطا می‌دهد. */
export function parseJalaliDate(value: string): JalaliDate {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim())
  if (!match) {
    throw new Error(`تاریخ شمسی نامعتبر است: ${value}`)
  }
  const date: JalaliDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
  if (!isValidJalaaliDate(date.year, date.month, date.day)) {
    throw new Error(`تاریخ شمسی نامعتبر است: ${value}`)
  }
  return date
}

export function isSameJalaliDate(a: JalaliDate, b: JalaliDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

/** عدد قابل مقایسه برای مرتب‌سازی/برابری تاریخ شمسی. */
export function jalaliDateKey(date: JalaliDate): number {
  return date.year * 10000 + date.month * 100 + date.day
}

/** تاریخ محلی امروز به شمسی. */
export function todayJalali(): JalaliDate {
  return jalaliFromDate(new Date())
}

export function jalaliFromDate(date: Date): JalaliDate {
  const { jy, jm, jd } = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
  return { year: jy, month: jm, day: jd }
}


/** `Date` محلی در ابتدای روز داده‌شده (برای FullCalendar و محاسبه هفته). */
export function jalaliToDate(date: JalaliDate): Date {
  return jalaaliToDateObject(date.year, date.month, date.day)
}

/** تاریخ شمسی به رشته میلادی `YYYY-MM-DD` برای ورودی‌های FullCalendar. */
export function jalaliToGregorianIso(date: JalaliDate): string {
  const { gy, gm, gd } = toGregorian(date.year, date.month, date.day)
  return `${gy}-${pad2(gm)}-${pad2(gd)}`
}

export function daysInJalaliMonth(year: number, month: number): number {
  return jalaaliMonthLength(year, month)
}

export function addJalaliDays(date: JalaliDate, days: number): JalaliDate {
  const next = jalaliToDate(date)
  next.setDate(next.getDate() + days)
  return jalaliFromDate(next)
}

/** جابه‌جایی ماه؛ سال هم در صورت نیاز تغییر می‌کند. */
export function shiftJalaliMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta
  const nextYear = Math.floor(total / 12)
  const nextMonth = total - nextYear * 12 + 1
  return { year: nextYear, month: nextMonth }
}

export interface JalaliRange {
  first: JalaliDate
  last: JalaliDate
  /** اولین روز (شمسی) و آخرین روز (شمسی) */
  firstIso: string
  lastIso: string
  /** بازه میلادی برای FullCalendar؛ انتهای بازه انحصاری است. */
  startIso: string
  endExclusiveIso: string
}

/** مرزهای ماه شمسی به‌همراه نسخه میلادی آن. */
export function jalaliMonthBounds(year: number, month: number): JalaliRange {
  const first: JalaliDate = { year, month, day: 1 }
  const last: JalaliDate = {
    year,
    month,
    day: daysInJalaliMonth(year, month),
  }
  return {
    first,
    last,
    firstIso: jalaliDateToString(first),
    lastIso: jalaliDateToString(last),
    startIso: jalaliToGregorianIso(first),
    endExclusiveIso: jalaliToGregorianIso(addJalaliDays(last, 1)),
  }
}

/** بازه‌ی کامل هفته‌های تقویم که ماه را می‌پوشاند (شامل روزهای بین‌ماه). */
export function jalaliMonthWeekBounds(
  year: number,
  month: number,
): JalaliRange {
  const monthBounds = jalaliMonthBounds(year, month)
  const startIndex = weekdayIndex(monthBounds.first)
  const first = addJalaliDays(monthBounds.first, -startIndex)
  const endIndex = weekdayIndex(monthBounds.last)
  const last = addJalaliDays(monthBounds.last, 6 - endIndex)

  return {
    first,
    last,
    firstIso: jalaliDateToString(first),
    lastIso: jalaliDateToString(last),
    startIso: jalaliToGregorianIso(first),
    endExclusiveIso: jalaliToGregorianIso(addJalaliDays(last, 1)),
  }
}

/** هفته‌ی شمسی (شنبه تا جمعه) که تاریخ داده‌شده در آن قرار دارد. */
export function jalaliWeekBounds(date: JalaliDate): JalaliRange {
  const index = weekdayIndex(date)
  const first = addJalaliDays(date, -index)
  const last = addJalaliDays(date, 6 - index)
  return {
    first,
    last,
    firstIso: jalaliDateToString(first),
    lastIso: jalaliDateToString(last),
    startIso: jalaliToGregorianIso(first),
    endExclusiveIso: jalaliToGregorianIso(addJalaliDays(last, 1)),
  }
}

/** شنبه = ۰ … جمعه = ۶ */
export function weekdayIndex(date: JalaliDate): number {
  return (jalaliToDate(date).getDay() + 1) % 7
}

export function weekdayName(date: JalaliDate): string {
  return JALALI_WEEKDAY_NAMES[weekdayIndex(date)]
}

export function isFriday(date: JalaliDate): boolean {
  return weekdayIndex(date) === 6
}

/** عنوان تعطیل رسمی ثابت (در صورت وجود). */
export function getOfficialHoliday(date: JalaliDate): string | null {
  return OFFICIAL_HOLIDAYS[`${date.month}-${date.day}`] ?? null
}

/** هر روز تعطیل یا جمعه (تعطیلی هفتگی) */
export function isNonWorkingDay(date: JalaliDate): boolean {
  return isFriday(date) || getOfficialHoliday(date) !== null
}

export function formatJalaliMonthTitle(year: number, month: number): string {
  return `${JALALI_MONTH_NAMES[month - 1]} ${toPersianDigits(year)}`
}

/** مثلاً «دوشنبه، ۱۸ آبان ۱۴۰۵» */
export function formatJalaliFullDate(date: JalaliDate): string {
  return `${weekdayName(date)}، ${toPersianDigits(date.day)} ${
    JALALI_MONTH_NAMES[date.month - 1]
  } ${toPersianDigits(date.year)}`
}

export function formatJalaliShortDate(date: JalaliDate): string {
  return `${toPersianDigits(date.day)} ${JALALI_MONTH_NAMES[date.month - 1]}`
}

/** «۱۶:۳۰» با ارقام فارسی */
export function formatClock(time: string): string {
  return toPersianDigits(time)
}

/** مدت به دقیقه را به متن خوانا تبدیل می‌کند؛ مثلاً «۱۲٫۵ ساعت». */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "۰ ساعت"
  const hours = minutes / 60
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 1,
  }).format(hours)
  return `${formatted} ساعت`
}
