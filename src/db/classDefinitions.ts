import { DatabaseError, runDb } from "./errors"
import {
  DAYS_OF_WEEK,
  DAY_OF_WEEK_LABELS,
  db,
  newId,
  normalizeTime,
  nowIso,
  type ClassDefinition,
  type ClassStudent,
  type DayOfWeek,
} from "./schema"

const TITLE_MAX_LENGTH = 120
const COLOR_MAX_LENGTH = 40
const DEFAULT_COLOR = "#6366f1"
const DEFAULT_START = "16:00"
const DEFAULT_END = "17:30"
const MAX_TOTAL_SESSIONS = 200

export interface StudentInput {
  /** برای دانش‌آموزان موجود؛ اگر نباشد شناسه تازه ساخته می‌شود. */
  id?: string
  name: string
}

export interface ClassDefinitionInput {
  title: string
  daysOfWeek?: DayOfWeek[]
  totalSessions?: number
  defaultStart?: string
  defaultEnd?: string
  color?: string
  students?: StudentInput[]
}

export interface ClassDefinitionUpdate {
  title?: string
  daysOfWeek?: DayOfWeek[]
  totalSessions?: number
  defaultStart?: string
  defaultEnd?: string
  color?: string
  students?: StudentInput[]
}

export interface ClassDefinitionDeleteImpact {
  sessions: number
  attendance: number
}

export interface DeleteClassDefinitionResult {
  deletedSessions: number
  deletedAttendance: number
}

/* -------------------------------------------------------------------------- */
/*                                  کمکی‌ها                                   */
/* -------------------------------------------------------------------------- */

function normalizeTitle(value: string): string {
  const title = value.trim()
  if (!title) {
    throw new DatabaseError("validation", "نام کلاس نمی‌تواند خالی باشد.")
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new DatabaseError(
      "validation",
      `نام کلاس نباید بیشتر از ${TITLE_MAX_LENGTH} نویسه باشد.`,
    )
  }
  return title
}

function normalizeDaysOfWeek(value: readonly DayOfWeek[]): DayOfWeek[] {
  const unique = new Set<DayOfWeek>()
  for (const day of value) {
    if (!(DAYS_OF_WEEK as readonly number[]).includes(day)) {
      throw new DatabaseError(
        "validation",
        `روز هفته «${DAY_OF_WEEK_LABELS[day] ?? String(day)}» معتبر نیست.`,
      )
    }
    unique.add(day)
  }
  if (unique.size === 0) {
    throw new DatabaseError(
      "validation",
      "حداقل یک روز هفته باید انتخاب شود.",
    )
  }
  return [...unique].sort((a, b) => a - b)
}

function normalizeTotalSessions(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_TOTAL_SESSIONS
  ) {
    throw new DatabaseError(
      "validation",
      `تعداد جلسات باید عددی صحیح بین ۱ تا ${MAX_TOTAL_SESSIONS} باشد.`,
    )
  }
  return value
}

function normalizeColor(value: string | undefined): string {
  const color = (value ?? DEFAULT_COLOR).trim()
  if (!color) return DEFAULT_COLOR
  if (color.length > COLOR_MAX_LENGTH) {
    throw new DatabaseError("validation", "رنگ انتخابی معتبر نیست.")
  }
  return color
}

function normalizeStudents(
  list: readonly StudentInput[],
  previous: readonly ClassStudent[] = [],
): ClassStudent[] {
  const byName = new Map(previous.map((student) => [student.name.trim(), student.id]))
  const seen = new Set<string>()
  const result: ClassStudent[] = []

  for (const item of list) {
    const name = item.name.trim()
    if (!name) continue // ردیف‌های خالی فرم نادیده گرفته می‌شوند

    const key = name.toLocaleLowerCase("fa")
    if (seen.has(key)) {
      throw new DatabaseError(
        "duplicate",
        `دانش‌آموز «${name}» دو بار در این کلاس ثبت شده است.`,
      )
    }
    seen.add(key)

    const existing = item.id
      ? previous.find((student) => student.id === item.id)
      : undefined
    const id = existing?.id ?? byName.get(name) ?? item.id ?? newId()
    result.push({ id, name })
  }

  return result
}

function assertTimeRange(start: string, end: string): void {
  if (start >= end) {
    throw new DatabaseError(
      "validation",
      "ساعت پایان باید بعد از ساعت شروع باشد.",
    )
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CRUD                                     */
/* -------------------------------------------------------------------------- */

export async function createClassDefinition(
  input: ClassDefinitionInput,
): Promise<ClassDefinition> {
  return runDb(async () => {
    const now = nowIso()
    const defaultStart = normalizeTime(input.defaultStart ?? DEFAULT_START)
    const defaultEnd = normalizeTime(input.defaultEnd ?? DEFAULT_END)
    assertTimeRange(defaultStart, defaultEnd)

    const definition: ClassDefinition = {
      id: newId(),
      title: normalizeTitle(input.title),
      daysOfWeek: normalizeDaysOfWeek(input.daysOfWeek ?? []),
      totalSessions: normalizeTotalSessions(input.totalSessions ?? 1),
      defaultStart,
      defaultEnd,
      color: normalizeColor(input.color),
      students: normalizeStudents(input.students ?? []),
      createdAt: now,
      updatedAt: now,
    }

    await db.classDefinitions.add(definition)
    return definition
  })
}

export async function getClassDefinitionById(
  id: string,
): Promise<ClassDefinition | undefined> {
  return runDb(() => db.classDefinitions.get(id))
}

export async function getAllClassDefinitions(): Promise<ClassDefinition[]> {
  return runDb(() => db.classDefinitions.orderBy("createdAt").toArray())
}

export async function updateClassDefinition(
  id: string,
  patch: ClassDefinitionUpdate,
): Promise<ClassDefinition> {
  return runDb(() =>
    db.transaction("rw", db.classDefinitions, async () => {
      const current = await db.classDefinitions.get(id)
      if (!current) {
        throw new DatabaseError("not-found", "کلاس موردنظر یافت نشد.")
      }

      const next: ClassDefinition = {
        ...current,
        title:
          patch.title !== undefined ? normalizeTitle(patch.title) : current.title,
        daysOfWeek:
          patch.daysOfWeek !== undefined
            ? normalizeDaysOfWeek(patch.daysOfWeek)
            : current.daysOfWeek,
        totalSessions:
          patch.totalSessions !== undefined
            ? normalizeTotalSessions(patch.totalSessions)
            : current.totalSessions,
        defaultStart:
          patch.defaultStart !== undefined
            ? normalizeTime(patch.defaultStart)
            : current.defaultStart,
        defaultEnd:
          patch.defaultEnd !== undefined
            ? normalizeTime(patch.defaultEnd)
            : current.defaultEnd,
        color:
          patch.color !== undefined ? normalizeColor(patch.color) : current.color,
        students:
          patch.students !== undefined
            ? normalizeStudents(patch.students, current.students)
            : current.students,
        updatedAt: nowIso(),
      }

      assertTimeRange(next.defaultStart, next.defaultEnd)
      await db.classDefinitions.put(next)
      return next
    }),
  )
}

/** تعداد جلسه‌ها و رکوردهای حضوری که با حذف این کلاس از بین می‌روند. */
export async function getClassDefinitionDeleteImpact(
  id: string,
): Promise<ClassDefinitionDeleteImpact> {
  return runDb(async () => {
    const sessionIds = (await db.sessions
      .where("definitionId")
      .equals(id)
      .primaryKeys()) as string[]
    const attendance = sessionIds.length
      ? await db.attendance.where("sessionId").anyOf(sessionIds).count()
      : 0
    return { sessions: sessionIds.length, attendance }
  })
}

/**
 * حذف کلاس.
 *
 * اگر کلاس جلسه داشته باشد، بدون `cascade: true` خطای `conflict` می‌دهد تا حذف
 * داده‌های وابسته فقط پس از تأیید کاربر انجام شود. با `cascade: true` جلسه‌ها و
 * رکوردهای حضور آن‌ها هم در همان تراکنش حذف می‌شوند.
 */
export async function deleteClassDefinition(
  id: string,
  options: { cascade?: boolean } = {},
): Promise<DeleteClassDefinitionResult> {
  const { cascade = false } = options

  return runDb(() =>
    db.transaction(
      "rw",
      db.classDefinitions,
      db.sessions,
      db.attendance,
      async () => {
        const current = await db.classDefinitions.get(id)
        if (!current) {
          throw new DatabaseError("not-found", "کلاس موردنظر یافت نشد.")
        }

        const sessionIds = (await db.sessions
          .where("definitionId")
          .equals(id)
          .primaryKeys()) as string[]

        if (sessionIds.length > 0 && !cascade) {
          throw new DatabaseError(
            "conflict",
            `این کلاس ${sessionIds.length} جلسه دارد. برای حذف آن‌ها هم باید حذف آبشاری تأیید شود.`,
          )
        }

        const deletedAttendance = sessionIds.length
          ? await db.attendance.where("sessionId").anyOf(sessionIds).delete()
          : 0
        const deletedSessions = await db.sessions
          .where("definitionId")
          .equals(id)
          .delete()

        await db.classDefinitions.delete(id)
        return { deletedSessions, deletedAttendance }
      },
    ),
  )
}

/* -------------------------------------------------------------------------- */
/*                               نام‌های مستعار                                */
/* -------------------------------------------------------------------------- */

export {
  createClassDefinition as create,
  getClassDefinitionById as getById,
  getAllClassDefinitions as getAll,
  updateClassDefinition as update,
  deleteClassDefinition as delete,
  deleteClassDefinition as deleteClass,
}
