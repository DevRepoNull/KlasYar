import { DatabaseError, runDb } from "./errors"
import {
  ATTENDANCE_STATUSES,
  db,
  isAttendanceStatus,
  newId,
  normalizeMonth,
  type Attendance,
  type AttendanceStatus,
} from "./schema"

export interface AttendanceInput {
  sessionId: string
  studentId: string
  /** پیش‌فرض: present */
  status?: AttendanceStatus
}

export interface AttendanceEntry {
  studentId: string
  status: AttendanceStatus
}

/* -------------------------------------------------------------------------- */
/*                                  کمکی‌ها                                   */
/* -------------------------------------------------------------------------- */

function normalizeStatus(value: AttendanceStatus): AttendanceStatus {
  if (!isAttendanceStatus(value)) {
    throw new DatabaseError("validation", "وضعیت حضور معتبر نیست.")
  }
  return value
}

/** جلسه باید وجود داشته باشد و دانش‌آموز در فهرست همان کلاس باشد. */
async function assertSessionStudent(
  sessionId: string,
  studentId: string,
): Promise<void> {
  const session = await db.sessions.get(sessionId)
  if (!session) {
    throw new DatabaseError("not-found", "جلسه موردنظر یافت نشد.")
  }
  const definition = await db.classDefinitions.get(session.definitionId)
  if (!definition) {
    throw new DatabaseError("not-found", "کلاس این جلسه یافت نشد.")
  }
  const students = Array.isArray(definition.students) ? definition.students : []
  if (!students.some((student) => student && student.id === studentId)) {
    throw new DatabaseError(
      "validation",
      "این دانش‌آموز در فهرست دانش‌آموزان کلاس نیست.",
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CRUD                                     */
/* -------------------------------------------------------------------------- */

export async function createAttendance(
  input: AttendanceInput,
): Promise<Attendance> {
  return runDb(async () => {
    const status = normalizeStatus(input.status ?? "present")
    await assertSessionStudent(input.sessionId, input.studentId)

    const existing = await db.attendance
      .where("[sessionId+studentId]")
      .equals([input.sessionId, input.studentId])
      .first()
    if (existing) {
      throw new DatabaseError(
        "duplicate",
        "وضعیت حضور این دانش‌آموز برای این جلسه قبلاً ثبت شده است.",
      )
    }

    const record: Attendance = {
      id: newId(),
      sessionId: input.sessionId,
      studentId: input.studentId,
      status,
    }
    await db.attendance.add(record)
    return record
  })
}

export async function getAttendanceById(
  id: string,
): Promise<Attendance | undefined> {
  return runDb(() => db.attendance.get(id))
}

export async function getAllAttendance(): Promise<Attendance[]> {
  return runDb(() => db.attendance.toArray())
}

export async function getAttendanceBySession(
  sessionId: string,
): Promise<Attendance[]> {
  return runDb(() =>
    db.attendance.where("sessionId").equals(sessionId).toArray(),
  )
}

export async function getAttendanceByStudent(
  studentId: string,
): Promise<Attendance[]> {
  return runDb(() =>
    db.attendance.where("studentId").equals(studentId).toArray(),
  )
}

/** رکوردهای حضور جلسه‌های یک ماه شمسی (`YYYY-MM`). */
export async function getAttendanceByMonth(
  month: string,
): Promise<Attendance[]> {
  return runDb(async () => {
    const normalized = normalizeMonth(month)
    const sessionIds = (await db.sessions
      .where("date")
      .startsWith(`${normalized}-`)
      .primaryKeys()) as string[]
    if (!sessionIds.length) return []
    return db.attendance.where("sessionId").anyOf(sessionIds).toArray()
  })
}

export async function updateAttendance(
  id: string,
  status: AttendanceStatus,
): Promise<Attendance> {
  return runDb(() =>
    db.transaction("rw", db.attendance, async () => {
      const current = await db.attendance.get(id)
      if (!current) {
        throw new DatabaseError("not-found", "رکورد حضور یافت نشد.")
      }
      const next: Attendance = { ...current, status: normalizeStatus(status) }
      await db.attendance.put(next)
      return next
    }),
  )
}

export async function deleteAttendance(id: string): Promise<void> {
  return runDb(async () => {
    const deleted = await db.attendance.where("id").equals(id).delete()
    if (deleted === 0) {
      throw new DatabaseError("not-found", "رکورد حضور یافت نشد.")
    }
  })
}

/** حذف رکورد حضور یک دانش‌آموز در یک جلسه (بازگرداندن به حالت «ثبت‌نشده»). */
export async function deleteAttendanceBySessionAndStudent(
  sessionId: string,
  studentId: string,
): Promise<boolean> {
  return runDb(async () => {
    let count = await db.attendance
      .where("[sessionId+studentId]")
      .equals([sessionId, studentId])
      .delete()

    if (count === 0) {
      const items = await db.attendance
        .where("sessionId")
        .equals(sessionId)
        .filter((r) => r.studentId === studentId)
        .toArray()
      if (items.length > 0) {
        await db.attendance.bulkDelete(items.map((i) => i.id))
        count = items.length
      }
    }
    return count > 0
  })
}

/** پاک کردن همه رکوردهای حضور یک جلسه (همه شاگردان به «ثبت‌نشده» بازمی‌گردند). */
export async function clearSessionAttendance(
  sessionId: string,
): Promise<number> {
  return runDb(async () => {
    return db.attendance.where("sessionId").equals(sessionId).delete()
  })
}

/**
 * ثبت یا به‌روزرسانی وضعیت حضور؛ برای تغییر سریع وضعیت از رابط کاربری.
 * برخلاف `createAttendance` نسبت به ثبت تکراری خطا نمی‌دهد.
 */
export async function upsertAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus,
): Promise<Attendance> {
  return runDb(() =>
    db.transaction(
      "rw",
      db.attendance,
      db.sessions,
      db.classDefinitions,
      async () => {
        const normalized = normalizeStatus(status)
        await assertSessionStudent(sessionId, studentId)

        const existing = await db.attendance
          .where("[sessionId+studentId]")
          .equals([sessionId, studentId])
          .first()

        if (existing) {
          const next: Attendance = { ...existing, status: normalized }
          await db.attendance.put(next)
          return next
        }

        const record: Attendance = {
          id: newId(),
          sessionId,
          studentId,
          status: normalized,
        }
        await db.attendance.add(record)
        return record
      },
    ),
  )
}

/** ذخیره یک‌جای فهرست حضور یک جلسه (همه دانش‌آموزان در یک تراکنش). */
export async function saveSessionAttendance(
  sessionId: string,
  entries: AttendanceEntry[],
): Promise<Attendance[]> {
  return runDb(() =>
    db.transaction(
      "rw",
      db.attendance,
      db.sessions,
      db.classDefinitions,
      async () => {
        const session = await db.sessions.get(sessionId)
        if (!session) {
          throw new DatabaseError("not-found", "جلسه موردنظر یافت نشد.")
        }
        const definition = await db.classDefinitions.get(session.definitionId)
        if (!definition) {
          throw new DatabaseError("not-found", "کلاس این جلسه یافت نشد.")
        }

        const studentIds = new Set(definition.students.map((student) => student.id))
        for (const entry of entries) {
          if (!studentIds.has(entry.studentId)) {
            throw new DatabaseError(
              "validation",
              "این دانش‌آموز در فهرست دانش‌آموزان کلاس نیست.",
            )
          }
          normalizeStatus(entry.status)
        }

        const existing = await db.attendance
          .where("sessionId")
          .equals(sessionId)
          .toArray()
        const byStudent = new Map(
          existing.map((record) => [record.studentId, record]),
        )

        const records: Attendance[] = entries.map((entry) => {
          const previous = byStudent.get(entry.studentId)
          return {
            id: previous?.id ?? newId(),
            sessionId,
            studentId: entry.studentId,
            status: entry.status,
          }
        })

        if (records.length) {
          await db.attendance.bulkPut(records)
        }
        return records
      },
    ),
  )
}

/** رکوردهای حضور همه جلسه‌های یک کلاس. */
export async function getAttendanceByDefinition(
  definitionId: string,
): Promise<Attendance[]> {
  return runDb(async () => {
    const sessionIds = (await db.sessions
      .where("definitionId")
      .equals(definitionId)
      .primaryKeys()) as string[]
    if (!sessionIds.length) return []
    return db.attendance.where("sessionId").anyOf(sessionIds).toArray()
  })
}

/* -------------------------------------------------------------------------- */
/*                               نام‌های مستعار                                */
/* -------------------------------------------------------------------------- */

export {
  createAttendance as create,
  getAttendanceById as getById,
  getAllAttendance as getAll,
  updateAttendance as update,
  deleteAttendance as delete,
  getAttendanceByDefinition as getByDefinition,
  getAttendanceByMonth as getByMonth,
}

export { ATTENDANCE_STATUSES }
