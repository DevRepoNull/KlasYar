import { runDb } from "./errors"
import {
  dayOfWeekFromDate,
  db,
  nowIso,
  toJalaliDateString,
  type Attendance,
  type AttendanceStatus,
  type ClassDefinition,
  type Session,
} from "./schema"
import { SETTING_KEYS } from "./settings"

/** با افزایش این عدد، seed بعدی داده نمونه را به‌روزرسانی می‌کند. */
export const SEED_VERSION = 1

const SEED_MARKER_KEY = SETTING_KEYS.seedDemoData

export interface SeedResult {
  seeded: boolean
  classDefinitions: number
  sessions: number
  attendance: number
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function buildDemoData(): {
  definitions: ClassDefinition[]
  sessions: Session[]
  attendance: Attendance[]
} {
  const now = nowIso()
  const today = new Date()

  const mathId = "seed-class-math"
  const englishId = "seed-class-english"

  const definitions: ClassDefinition[] = [
    {
      id: mathId,
      title: "ریاضی پایه دهم",
      daysOfWeek: [0, 2],
      totalSessions: 12,
      defaultStart: "16:00",
      defaultEnd: "17:30",
      color: "#6366f1",
      students: [
        { id: `${mathId}-student-1`, name: "سارا محمدی" },
        { id: `${mathId}-student-2`, name: "علی رضایی" },
        { id: `${mathId}-student-3`, name: "نگار کریمی" },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: englishId,
      title: "زبان انگلیسی پایه یازدهم",
      daysOfWeek: [1, 3],
      totalSessions: 8,
      defaultStart: "18:00",
      defaultEnd: "19:15",
      color: "#0ea5e9",
      students: [
        { id: `${englishId}-student-1`, name: "مهدی احمدی" },
        { id: `${englishId}-student-2`, name: "زهرا موسوی" },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  const sessions: Session[] = []
  const attendance: Attendance[] = []

  for (const definition of definitions) {
    let created = 0
    for (let offset = -7; offset <= 21 && created < 5; offset += 1) {
      const day = addDays(today, offset)
      if (!definition.daysOfWeek.includes(dayOfWeekFromDate(day))) continue

      const date = toJalaliDateString(day)
      const id = `${definition.id}-session-${date}`
      const isPast = offset < 0

      sessions.push({
        id,
        definitionId: definition.id,
        date,
        start: definition.defaultStart,
        end: definition.defaultEnd,
        status: isPast ? "held" : "scheduled",
        note: isPast ? "جلسه برگزار شد." : "",
        createdAt: now,
        updatedAt: now,
      })

      if (isPast) {
        definition.students.forEach((student, index) => {
          const statuses: AttendanceStatus[] = ["late", "absent", "present"]
          attendance.push({
            id: `${id}-${student.id}`,
            sessionId: id,
            studentId: student.id,
            status: statuses[index % statuses.length],
          })
        })
      }

      created += 1
    }
  }

  return { definitions, sessions, attendance }
}

/**
 * درج داده نمونه.
 *
 * idempotent است: شناسه‌ها ثابت‌اند و درج با `bulkPut` انجام می‌شود، پس اجرای
 * دوباره داده تکراری نمی‌سازد. با `force: true` داده نمونه از نو نوشته می‌شود.
 */
export async function seedDemoData(
  options: { force?: boolean } = {},
): Promise<SeedResult> {
  const { force = false } = options

  return runDb(() =>
    db.transaction(
      "rw",
      db.classDefinitions,
      db.sessions,
      db.attendance,
      db.settings,
      async () => {
        if (!force) {
          const marker = await db.settings.get(SEED_MARKER_KEY)
          const seededVersion =
            typeof marker?.value === "object" && marker.value !== null
              ? ((marker.value as { version?: number }).version ?? 0)
              : 0
          if (seededVersion >= SEED_VERSION) {
            return {
              seeded: false,
              classDefinitions: 0,
              sessions: 0,
              attendance: 0,
            }
          }
        }

        const { definitions, sessions, attendance } = buildDemoData()

        await db.classDefinitions.bulkPut(definitions)
        await db.sessions.bulkPut(sessions)
        await db.attendance.bulkPut(attendance)
        await db.settings.put({
          key: SEED_MARKER_KEY,
          value: { version: SEED_VERSION, seededAt: nowIso() },
        })

        return {
          seeded: true,
          classDefinitions: definitions.length,
          sessions: sessions.length,
          attendance: attendance.length,
        }
      },
    ),
  )
}
