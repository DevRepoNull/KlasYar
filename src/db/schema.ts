import Dexie, { type Table } from "dexie"

import { DatabaseError, normalizeDatabaseError } from "./errors"

/** نام دیتابیس IndexedDB؛ در تست‌ها می‌توان نمونه‌ای با نام دیگر ساخت. */
export const DB_NAME = "klasyar"

/** نسخه فعلی اسکیمای دیتابیس. برای هر تغییر ساختار جداول یک نسخه اضافه کنید. */
export const DB_VERSION = 2

/* -------------------------------------------------------------------------- */
/*                                   انواع                                    */
/* -------------------------------------------------------------------------- */

/** روزهای هفته به ترتیب تقویم ایران: ۰ = شنبه ... ۶ = جمعه */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: "شنبه",
  1: "یکشنبه",
  2: "دوشنبه",
  3: "سه‌شنبه",
  4: "چهارشنبه",
  5: "پنجشنبه",
  6: "جمعه",
}

export type SessionStatus = "scheduled" | "held" | "canceled"

export const SESSION_STATUSES: readonly SessionStatus[] = [
  "scheduled",
  "held",
  "canceled",
]

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "برنامه‌ریزی‌شده",
  held: "برگزارشده",
  canceled: "لغوشده",
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
]

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غایب",
  late: "با تأخیر",
  excused: "موجه",
}

export interface ClassStudent {
  id: string
  name: string
}

export interface ClassDefinition {
  id: string
  title: string
  daysOfWeek: DayOfWeek[]
  totalSessions: number
  /** ساعت شروع پیش‌فرض به شکل HH:MM */
  defaultStart: string
  /** ساعت پایان پیش‌فرض به شکل HH:MM */
  defaultEnd: string
  color: string
  students: ClassStudent[]
  /** ISO 8601 */
  createdAt: string
  /** ISO 8601 */
  updatedAt: string
}

export interface Session {
  id: string
  definitionId: string
  /** تاریخ شمسی به شکل YYYY-MM-DD */
  date: string
  /** HH:MM */
  start: string
  /** HH:MM */
  end: string
  status: SessionStatus
  note: string
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  sessionId: string
  studentId: string
  status: AttendanceStatus
}

export interface Setting {
  key: string
  value: unknown
}

export interface User {
  id: number
  username: string
  passwordHash: string
  createdAt: string
}

/* -------------------------------------------------------------------------- */
/*                                  دیتابیس                                   */
/* -------------------------------------------------------------------------- */

export class KlasYarDatabase extends Dexie {
  classDefinitions!: Table<ClassDefinition, string>
  sessions!: Table<Session, string>
  attendance!: Table<Attendance, string>
  settings!: Table<Setting, string>
  users!: Table<User, number>

  constructor(name: string = DB_NAME) {
    super(name)

    this.version(1).stores({
      classDefinitions: "id, title, createdAt, updatedAt",
      sessions: "id, definitionId, date, [definitionId+date], status",
      attendance: "id, sessionId, studentId, status, &[sessionId+studentId]",
      settings: "key",
    })

    this.version(2).stores({
      users: "id, username",
    })
  }
}

export const db = new KlasYarDatabase()

/* -------------------------------------------------------------------------- */
/*                              ابزارهای عمومی                                */
/* -------------------------------------------------------------------------- */

/** شنبه = ۰ تا جمعه = ۶؛ هم‌راستا با `DayOfWeek` */
export function dayOfWeekFromDate(date: Date): DayOfWeek {
  return ((date.getDay() + 1) % 7) as DayOfWeek
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  const random = Math.random().toString(36).slice(2, 10)
  return `id_${Date.now().toString(36)}_${random}`
}

/** ساعت را به شکل HH:MM نرمال می‌کند و در صورت نامعتبر بودن خطا می‌دهد. */
export function normalizeTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) {
    throw new DatabaseError("validation", "ساعت باید به شکل HH:MM باشد (مثلاً 16:30).")
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    throw new DatabaseError("validation", "ساعت وارد‌شده معتبر نیست.")
  }
  return `${pad2(hours)}:${pad2(minutes)}`
}

export function isValidTime(value: string): boolean {
  try {
    normalizeTime(value)
    return true
  } catch {
    return false
  }
}

/** تاریخ شمسی را به شکل YYYY-MM-DD نرمال می‌کند. */
export function normalizeJalaliDate(value: string): string {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim())
  if (!match) {
    throw new DatabaseError(
      "validation",
      "تاریخ باید به شکل شمسی YYYY-MM-DD باشد (مثلاً 1405-08-17).",
    )
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new DatabaseError("validation", "تاریخ شمسی وارد‌شده معتبر نیست.")
  }
  return `${match[1]}-${pad2(month)}-${pad2(day)}`
}

export function isValidJalaliDate(value: string): boolean {
  try {
    normalizeJalaliDate(value)
    return true
  } catch {
    return false
  }
}

/** ماه را به شکل YYYY-MM نرمال می‌کند. */
export function normalizeMonth(value: string): string {
  const match = /^(\d{4})-(\d{1,2})$/.exec(value.trim())
  if (!match) {
    throw new DatabaseError("validation", "ماه باید به شکل YYYY-MM باشد (مثلاً 1405-08).")
  }
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    throw new DatabaseError("validation", "ماه وارد‌شده معتبر نیست.")
  }
  return `${match[1]}-${pad2(month)}`
}

/** ماه شمسی مربوط به یک تاریخ YYYY-MM-DD */
export function monthOfDate(jalaliDate: string): string {
  return normalizeJalaliDate(jalaliDate).slice(0, 7)
}

/**
 * تبدیل تاریخ میلادی به رشته تاریخ شمسی (YYYY-MM-DD) با تقویم فارسی `Intl`.
 * اگر تقویم فارسی در محیط موجود نباشد، تاریخ میلادی برگردانده می‌شود.
 */
export function toJalaliDateString(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const pick = (type: string) =>
      parts.find((part) => part.type === type)?.value.replace(/\D/g, "") ?? ""
    const year = pick("year")
    const month = pick("month")
    const day = pick("day")
    if (!year || !month || !day) return date.toISOString().slice(0, 10)
    return `${year.padStart(4, "0")}-${pad2(Number(month))}-${pad2(Number(day))}`
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export function currentJalaliMonth(date: Date = new Date()): string {
  return toJalaliDateString(date).slice(0, 7)
}

export function isSessionStatus(value: unknown): value is SessionStatus {
  return typeof value === "string" && (SESSION_STATUSES as readonly string[]).includes(value)
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === "string" && (ATTENDANCE_STATUSES as readonly string[]).includes(value)
  )
}

/* -------------------------------------------------------------------------- */
/*                             دسترسی به دیتابیس                              */
/* -------------------------------------------------------------------------- */

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined" && indexedDB !== null
}

/** باز کردن صریح دیتابیس؛ برای نمایش خطای دسترسی در شروع برنامه. */
export async function openDatabase(): Promise<void> {
  if (!isIndexedDbAvailable()) {
    throw new DatabaseError("storage-unavailable")
  }
  try {
    await db.open()
  } catch (error) {
    throw normalizeDatabaseError(error)
  }
}
