import { useLiveQuery } from "dexie-react-hooks"

import {
  getAttendanceByDefinition,
  getAttendanceByMonth,
  getAttendanceBySession,
  getAttendanceByStudent,
} from "./attendance"
import {
  getAllClassDefinitions,
  getClassDefinitionById,
} from "./classDefinitions"
import { db, type Attendance, type ClassDefinition, type Session } from "./schema"
import {
  checkSessionLimit,
  getAllSessions,
  getSessionsByDate,
  getSessionsByDateRange,
  getSessionsByDefinition,
  getSessionsByMonth,
  type SessionLimitInfo,
} from "./sessions"
import { getAllSettings, getSetting } from "./settings"

/**
 * hookهای live query.
 *
 * همه‌ی hookها با `undefined` بارگذاری اولیه را نشان می‌دهند و بعد از اولین
 * پاسخ IndexedDB به‌صورت خودکار با هر تغییر جدول‌های مربوطه به‌روز می‌شوند.
 */

export function useClassDefinitions(): ClassDefinition[] | undefined {
  return useLiveQuery(() => getAllClassDefinitions(), [])
}

export function useClassDefinition(
  id: string | null | undefined,
): ClassDefinition | undefined {
  return useLiveQuery(
    () => (id ? getClassDefinitionById(id) : Promise.resolve(undefined)),
    [id],
  )
}

export function useSessionsByMonth(
  month: string | null | undefined,
): Session[] | undefined {
  return useLiveQuery(
    () => (month ? getSessionsByMonth(month) : Promise.resolve([])),
    [month],
  )
}

export function useAllSessions(): Session[] | undefined {
  return useLiveQuery(() => getAllSessions(), [])
}

export function useClassSessionCount(
  definitionId: string | null | undefined,
  ignoreId?: string,
): SessionLimitInfo | undefined {
  return useLiveQuery(
    () =>
      definitionId
        ? checkSessionLimit(definitionId, ignoreId)
        : Promise.resolve(undefined),
    [definitionId, ignoreId],
  )
}

export function useSessionsByDefinition(
  definitionId: string | null | undefined,
): Session[] | undefined {
  return useLiveQuery(
    () => (definitionId ? getSessionsByDefinition(definitionId) : Promise.resolve([])),
    [definitionId],
  )
}

export function useSessionsByDate(
  date: string | null | undefined,
): Session[] | undefined {
  return useLiveQuery(
    () => (date ? getSessionsByDate(date) : Promise.resolve([])),
    [date],
  )
}

/** جلسه‌های یک بازه شمسی (شامل دو سر بازه)؛ با تغییر بازه دوباره خوانده می‌شود. */
export function useSessionsByDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): Session[] | undefined {
  return useLiveQuery(
    () => (from && to ? getSessionsByDateRange(from, to) : Promise.resolve([])),
    [from, to],
  )
}

export function useSession(
  id: string | null | undefined,
): Session | undefined {
  return useLiveQuery(async () => (id ? await db.sessions.get(id) : undefined), [id])
}

export function useAttendanceBySession(
  sessionId: string | null | undefined,
): Attendance[] | undefined {
  return useLiveQuery(
    () => (sessionId ? getAttendanceBySession(sessionId) : Promise.resolve([])),
    [sessionId],
  )
}

export function useAttendanceByDefinition(
  definitionId: string | null | undefined,
): Attendance[] | undefined {
  return useLiveQuery(
    () => (definitionId ? getAttendanceByDefinition(definitionId) : Promise.resolve([])),
    [definitionId],
  )
}

export function useAttendanceByMonth(
  month: string | null | undefined,
): Attendance[] | undefined {
  return useLiveQuery(
    () => (month ? getAttendanceByMonth(month) : Promise.resolve([])),
    [month],
  )
}

export function useAttendanceByStudent(
  studentId: string | null | undefined,
): Attendance[] | undefined {
  return useLiveQuery(
    () => (studentId ? getAttendanceByStudent(studentId) : Promise.resolve([])),
    [studentId],
  )
}

export interface ClassMonthlyAttendanceResult {
  definition: ClassDefinition
  sessions: Session[]
  attendance: Attendance[]
}

/** دریافت هم‌زمان اطلاعات کلاس، جلسات یک ماه شمسی و رکوردهای حضور آن جلسات برای ماتریس حضور و غیاب. */
export function useClassMonthlyAttendance(
  definitionId: string | null | undefined,
  year: number,
  month: number,
): ClassMonthlyAttendanceResult | null | undefined {
  const monthKey = `${year}-${String(month).padStart(2, "0")}`
  return useLiveQuery(async () => {
    if (!definitionId) return null
    const definition = await db.classDefinitions.get(definitionId)
    if (!definition) return null

    const sessions = await db.sessions
      .where("definitionId")
      .equals(definitionId)
      .toArray()

    const monthSessions = sessions
      .filter((session) => session.date.startsWith(`${monthKey}-`))
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
      )

    const sessionIds = monthSessions.map((session) => session.id)
    const records =
      sessionIds.length > 0
        ? await db.attendance.where("sessionId").anyOf(sessionIds).toArray()
        : []

    return {
      definition,
      sessions: monthSessions,
      attendance: records,
    }
  }, [definitionId, monthKey])
}

export function useSettings(): Record<string, unknown> | undefined {
  return useLiveQuery(() => getAllSettings(), [])
}

/** مقدار یک تنظیم؛ تا زمانی که خوانده نشده `fallback` برگردانده می‌شود. */
export function useSetting<T>(key: string, fallback: T): T {
  const value = useLiveQuery(() => getSetting<T>(key), [key])
  return value === undefined ? fallback : value
}
