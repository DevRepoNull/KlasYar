import { DatabaseError, runDb } from "./errors"
import { checkTimeOverlap, isSessionLimitReached } from "@/lib/pure-logic"
import { jalaliToDate, parseJalaliDate } from "@/lib/jalali"
import {
  dayOfWeekFromDate,
  db,
  newId,
  normalizeJalaliDate,
  normalizeMonth,
  normalizeTime,
  nowIso,
  toJalaliDateString,
  type Session,
  type SessionStatus,
} from "./schema"

const NOTE_MAX_LENGTH = 1000

export interface SessionInput {
  definitionId: string
  /** تاریخ شمسی YYYY-MM-DD */
  date: string
  /** HH:MM؛ پیش‌فرض از کلاس گرفته می‌شود. */
  start?: string
  /** HH:MM؛ پیش‌فرض از کلاس گرفته می‌شود. */
  end?: string
  status?: SessionStatus
  note?: string
}

export interface SessionUpdate {
  definitionId?: string
  date?: string
  start?: string
  end?: string
  status?: SessionStatus
  note?: string
}

export interface SessionLimitInfo {
  count: number
  total: number
  isFull: boolean
}

export interface SessionDateRange {
  /** تاریخ شمسی شروع (شامل) */
  from?: string
  /** تاریخ شمسی پایان (شامل) */
  to?: string
}

/* -------------------------------------------------------------------------- */
/*                                  کمکی‌ها                                   */
/* -------------------------------------------------------------------------- */

function normalizeNote(value: string): string {
  const note = value.trim()
  if (note.length > NOTE_MAX_LENGTH) {
    throw new DatabaseError(
      "validation",
      `یادداشت نباید بیشتر از ${NOTE_MAX_LENGTH} نویسه باشد.`,
    )
  }
  return note
}

function assertTimeRange(start: string, end: string): void {
  if (start >= end) {
    throw new DatabaseError(
      "validation",
      "ساعت پایان باید بعد از ساعت شروع باشد.",
    )
  }
}

/** بررسی تداخل زمانی با جلسه‌های دیگر همان روز. */
export async function findOverlappingSession(
  date: string,
  start: string,
  end: string,
  ignoreId?: string,
): Promise<Session | undefined> {
  const normalizedDate = normalizeJalaliDate(date)
  const normStart = normalizeTime(start)
  const normEnd = normalizeTime(end)

  const sameDaySessions = await db.sessions
    .where("date")
    .equals(normalizedDate)
    .toArray()

  return sameDaySessions.find((session) => {
    if (session.id === ignoreId) return false
    if (session.status === "canceled") return false
    return checkTimeOverlap(
      { start: normStart, end: normEnd },
      { start: session.start, end: session.end },
    )
  })
}

/** شمارش جلسات یک کلاس و اعتبارسنجی سقف جلسات. */
export async function checkSessionLimit(
  definitionId: string,
  ignoreId?: string,
): Promise<SessionLimitInfo> {
  const definition = await db.classDefinitions.get(definitionId)
  if (!definition) {
    throw new DatabaseError("not-found", "کلاس انتخاب‌شده یافت نشد.")
  }

  const sessions = await db.sessions
    .where("definitionId")
    .equals(definitionId)
    .toArray()

  const count = sessions.filter((session) => session.id !== ignoreId).length
  return {
    count,
    total: definition.totalSessions,
    isFull: isSessionLimitReached(count, definition.totalSessions),
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CRUD                                     */
/* -------------------------------------------------------------------------- */

export async function createSession(input: SessionInput): Promise<Session> {
  return runDb(async () => {
    const definition = await db.classDefinitions.get(input.definitionId)
    if (!definition) {
      throw new DatabaseError("not-found", "کلاس انتخاب‌شده یافت نشد.")
    }

    const date = normalizeJalaliDate(input.date)
    const start = normalizeTime(input.start ?? definition.defaultStart)
    const end = normalizeTime(input.end ?? definition.defaultEnd)
    assertTimeRange(start, end)

    const limitInfo = await checkSessionLimit(definition.id)
    if (limitInfo.isFull) {
      throw new DatabaseError(
        "conflict",
        `سقف جلسات این کلاس تکمیل شده است (${limitInfo.count} از ${limitInfo.total} جلسه ثبت شده).`,
      )
    }

    const overlapping = await findOverlappingSession(date, start, end)
    if (overlapping) {
      const conflictingClass = await db.classDefinitions.get(
        overlapping.definitionId,
      )
      const className = conflictingClass
        ? `کلاس «${conflictingClass.title}»`
        : "جلسه دیگری"
      throw new DatabaseError(
        "conflict",
        `این بازه زمانی با ${className} در ساعت ${overlapping.start} تا ${overlapping.end} تداخل دارد.`,
      )
    }

    const now = nowIso()
    const session: Session = {
      id: newId(),
      definitionId: definition.id,
      date,
      start,
      end,
      status: input.status ?? "scheduled",
      note: normalizeNote(input.note ?? ""),
      createdAt: now,
      updatedAt: now,
    }

    await db.sessions.add(session)
    return session
  })
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  return runDb(() => db.sessions.get(id))
}

export async function getAllSessions(): Promise<Session[]> {
  return runDb(() => db.sessions.orderBy("date").toArray())
}

/** جلسه‌های یک کلاس، مرتب بر اساس تاریخ. */
export async function getSessionsByDefinition(
  definitionId: string,
  range: SessionDateRange = {},
): Promise<Session[]> {
  return runDb(async () => {
    const from = range.from ? normalizeJalaliDate(range.from) : undefined
    const to = range.to ? normalizeJalaliDate(range.to) : undefined

    let sessions = await db.sessions
      .where("definitionId")
      .equals(definitionId)
      .toArray()

    if (from) sessions = sessions.filter((session) => session.date >= from)
    if (to) sessions = sessions.filter((session) => session.date <= to)

    return sessions.sort((a, b) => a.date.localeCompare(b.date))
  })
}

/** جلسه‌های یک ماه شمسی (`YYYY-MM`). */
export async function getSessionsByMonth(month: string): Promise<Session[]> {
  return runDb(async () => {
    const normalized = normalizeMonth(month)
    return db.sessions
      .where("date")
      .startsWith(`${normalized}-`)
      .sortBy("date")
  })
}

/** جلسه‌های بازه بسته شمسی؛ هر دو سر بازه شامل می‌شود. */
export async function getSessionsByDateRange(
  from: string,
  to: string,
): Promise<Session[]> {
  return runDb(async () => {
    const start = normalizeJalaliDate(from)
    const end = normalizeJalaliDate(to)
    if (start > end) {
      throw new DatabaseError("validation", "بازه تاریخ معتبر نیست.")
    }
    return db.sessions.where("date").between(start, end, true, true).sortBy("date")
  })
}

/** جلسه‌های یک روز شمسی (`YYYY-MM-DD`). */
export async function getSessionsByDate(date: string): Promise<Session[]> {
  return runDb(async () => {
    const normalized = normalizeJalaliDate(date)
    const sessions = await db.sessions.where("date").equals(normalized).toArray()
    return sessions.sort((a, b) => a.start.localeCompare(b.start))
  })
}

export async function updateSession(
  id: string,
  patch: SessionUpdate,
): Promise<Session> {
  return runDb(() =>
    db.transaction("rw", db.sessions, async () => {
      const current = await db.sessions.get(id)
      if (!current) {
        throw new DatabaseError("not-found", "جلسه موردنظر یافت نشد.")
      }

      const next: Session = {
        ...current,
        definitionId: patch.definitionId ?? current.definitionId,
        date:
          patch.date !== undefined
            ? normalizeJalaliDate(patch.date)
            : current.date,
        start:
          patch.start !== undefined ? normalizeTime(patch.start) : current.start,
        end: patch.end !== undefined ? normalizeTime(patch.end) : current.end,
        status: patch.status ?? current.status,
        note: patch.note !== undefined ? normalizeNote(patch.note) : current.note,
        updatedAt: nowIso(),
      }

      assertTimeRange(next.start, next.end)

      if (next.definitionId !== current.definitionId) {
        const limitInfo = await checkSessionLimit(next.definitionId, id)
        if (limitInfo.isFull) {
          throw new DatabaseError(
            "conflict",
            `سقف جلسات این کلاس تکمیل شده است (${limitInfo.count} از ${limitInfo.total} جلسه ثبت شده).`,
          )
        }
      }

      const overlapping = await findOverlappingSession(
        next.date,
        next.start,
        next.end,
        id,
      )
      if (overlapping) {
        const conflictingClass = await db.classDefinitions.get(
          overlapping.definitionId,
        )
        const className = conflictingClass
          ? `کلاس «${conflictingClass.title}»`
          : "جلسه دیگری"
        throw new DatabaseError(
          "conflict",
          `این بازه زمانی با ${className} در ساعت ${overlapping.start} تا ${overlapping.end} تداخل دارد.`,
        )
      }

      await db.sessions.put(next)
      return next
    }),
  )
}

/** حذف جلسه همراه با رکوردهای حضور همان جلسه. */
export async function deleteSession(id: string): Promise<void> {
  return runDb(() =>
    db.transaction("rw", db.sessions, db.attendance, async () => {
      const current = await db.sessions.get(id)
      if (!current) {
        throw new DatabaseError("not-found", "جلسه موردنظر یافت نشد.")
      }
      await db.attendance.where("sessionId").equals(id).delete()
      await db.sessions.delete(id)
    }),
  )
}

/**
 * تولید خودکار جلسه‌های یک کلاس بر اساس روزهای هفته و تعداد کل جلسات.
 * تاریخ شروع پیش‌فرض: امروز؛ اگر امروز گذشته یا از روزهای هفته نباشد، روزهای آینده انتخاب می‌شوند.
 */
export async function generateClassSessions(
  definitionId: string,
  options: { count?: number; startDate?: string | Date } = {},
): Promise<Session[]> {
  return runDb(() =>
    db.transaction("rw", db.classDefinitions, db.sessions, async () => {
      const definition = await db.classDefinitions.get(definitionId)
      if (!definition) {
        throw new DatabaseError("not-found", "کلاس موردنظر یافت نشد.")
      }

      if (definition.daysOfWeek.length === 0) {
        throw new DatabaseError(
          "validation",
          "این کلاس روز هفتگی تعریف‌شده ندارد.",
        )
      }

      const count = options.count ?? definition.totalSessions
      if (count <= 0) return []

      const existingSessions = await db.sessions
        .where("definitionId")
        .equals(definitionId)
        .toArray()
      const existingDates = new Set(existingSessions.map((s) => s.date))

      const now = nowIso()
      let startRef = new Date()
      if (options.startDate) {
        if (typeof options.startDate === "string") {
          try {
            startRef = jalaliToDate(parseJalaliDate(options.startDate))
          } catch {
            startRef = new Date(options.startDate)
          }
        } else if (options.startDate instanceof Date) {
          startRef = options.startDate
        }
      }
      const createdSessions: Session[] = []

      for (
        let offset = 0;
        offset < 365 &&
        existingSessions.length + createdSessions.length < count;
        offset += 1
      ) {
        const candidateDate = new Date(startRef)
        candidateDate.setDate(candidateDate.getDate() + offset)

        const dayOfWeek = dayOfWeekFromDate(candidateDate)
        if (!definition.daysOfWeek.includes(dayOfWeek)) continue

        const jalaliStr = toJalaliDateString(candidateDate)
        if (existingDates.has(jalaliStr)) continue

        const overlapping = await findOverlappingSession(
          jalaliStr,
          definition.defaultStart,
          definition.defaultEnd,
        )
        if (overlapping) continue

        existingDates.add(jalaliStr)
        const session: Session = {
          id: newId(),
          definitionId: definition.id,
          date: jalaliStr,
          start: definition.defaultStart,
          end: definition.defaultEnd,
          status: "scheduled",
          note: "",
          createdAt: now,
          updatedAt: now,
        }
        createdSessions.push(session)
      }

      if (createdSessions.length > 0) {
        await db.sessions.bulkAdd(createdSessions)
      }

      return createdSessions
    }),
  )
}

/* -------------------------------------------------------------------------- */
/*                               نام‌های مستعار                                */
/* -------------------------------------------------------------------------- */

export {
  createSession as create,
  getSessionById as getById,
  getAllSessions as getAll,
  updateSession as update,
  deleteSession as delete,
  getSessionsByDefinition as getByDefinition,
  getSessionsByMonth as getByMonth,
}
