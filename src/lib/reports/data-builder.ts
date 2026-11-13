import type { Attendance, ClassDefinition, Session } from "@/db/schema"
import { SESSION_STATUS_LABELS } from "@/db/schema"
import {
  formatJalaliMonthTitle,
  formatJalaliShortDate,
  pad2,
  parseJalaliDate,
  weekdayName,
} from "@/lib/jalali"
import {
  calculateAttendancePercentage,
  calculateSessionDurationMinutes,
} from "@/lib/pure-logic"
import type {
  ClassReportSummary,
  MonthReportData,
  ReportSessionItem,
} from "./types"

export function buildMonthReportData(
  year: number,
  month: number,
  classDefs: ClassDefinition[],
  monthSessions: Session[],
  attendanceRecords: Attendance[],
): MonthReportData {
  const monthKey = `${year}-${pad2(month)}`
  const monthTitle = formatJalaliMonthTitle(year, month)

  const classMap = new Map<string, ClassDefinition>(
    classDefs.map((def) => [def.id, def]),
  )

  // ساخت نقشه حضور: `sessionId_studentId -> status`
  const attendanceMap = new Map<string, string>()
  for (const record of attendanceRecords) {
    attendanceMap.set(`${record.sessionId}_${record.studentId}`, record.status)
  }

  // مرتب‌سازی جلسات بر اساس تاریخ و ساعت
  const sortedSessions = [...monthSessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
  )

  const sessionItems: ReportSessionItem[] = []

  for (const session of sortedSessions) {
    const classDef = classMap.get(session.definitionId)
    const classTitle = classDef?.title ?? "کلاس"
    const classColor = classDef?.color ?? "#0d9488"
    const students = classDef?.students ?? []

    const durationMinutes = calculateSessionDurationMinutes(
      session.start,
      session.end,
    )
    const durationHours = Math.round((durationMinutes / 60) * 10) / 10

    // محاسبه حضور و غیاب این جلسه
    let presentCount = 0
    let lateCount = 0
    let excusedCount = 0
    let absentCount = 0
    let unrecordedCount = 0

    for (const student of students) {
      const status = attendanceMap.get(`${session.id}_${student.id}`)
      if (status === "present") presentCount++
      else if (status === "late") lateCount++
      else if (status === "excused") excusedCount++
      else if (status === "absent") absentCount++
      else unrecordedCount++
    }

    const rate = calculateAttendancePercentage(
      presentCount,
      lateCount,
      excusedCount,
      absentCount,
    )

    const jDate = parseJalaliDate(session.date)

    sessionItems.push({
      session,
      classTitle,
      classColor,
      jalaliDate: jDate,
      dateStr: session.date,
      shortDate: formatJalaliShortDate(jDate),
      weekday: weekdayName(jDate),
      start: session.start,
      end: session.end,
      durationMinutes,
      durationHours,
      status: session.status,
      statusLabel: SESSION_STATUS_LABELS[session.status],
      attendance: {
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        unrecordedCount,
        totalStudents: students.length,
        rate,
      },
      note: session.note,
    })
  }

  const classSummaries = calculateFilteredClassSummaries(sessionItems, classDefs)
  const summary = calculateFilteredReportSummary(sessionItems)

  return {
    year,
    month,
    monthTitle,
    monthKey,
    sessions: sessionItems,
    classSummaries,
    summary,
  }
}

/**
 * فیلتر کردن پیشرفته لیست جلسات گزارش بر اساس کلاس، بازه تاریخ، و متن جستجو
 */
export function filterReportSessions(
  sessions: ReportSessionItem[],
  filters: {
    selectedClassId?: string
    dateRange?: { from?: string; to?: string }
    searchQuery?: string
  },
): ReportSessionItem[] {
  const selectedClassId = filters.selectedClassId ?? "all"
  const q = filters.searchQuery?.trim().toLowerCase() ?? ""
  const rawFrom = filters.dateRange?.from?.trim() ?? ""
  const rawTo = filters.dateRange?.to?.trim() ?? ""

  // عادی‌سازی بازه تاریخ در صورت جابجایی احتمالی ابتدا و انتها
  const normalizedFrom = rawFrom && rawTo && rawFrom > rawTo ? rawTo : rawFrom
  const normalizedTo = rawFrom && rawTo && rawFrom > rawTo ? rawFrom : rawTo

  return sessions.filter((item) => {
    // ۱. فیلتر کلاس
    if (selectedClassId !== "all" && item.session.definitionId !== selectedClassId) {
      return false
    }

    // ۲. فیلتر بازه تاریخ شمسی (از تاریخ)
    if (normalizedFrom && item.dateStr < normalizedFrom) {
      return false
    }

    // ۳. فیلتر بازه تاریخ شمسی (تا تاریخ)
    if (normalizedTo && item.dateStr > normalizedTo) {
      return false
    }

    // ۴. فیلتر جستجوی متنی
    if (q) {
      const match =
        item.classTitle.toLowerCase().includes(q) ||
        item.dateStr.includes(q) ||
        item.weekday.includes(q) ||
        item.note.toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })
}

/**
 * محاسبه شاخص‌های کلی گزارش بر اساس جلسات (فیلترشده یا کامل)
 */
export function calculateFilteredReportSummary(
  sessions: ReportSessionItem[],
): MonthReportData["summary"] {
  let totalMinutes = 0
  let heldSessions = 0
  let scheduledSessions = 0
  let canceledSessions = 0
  let allPresent = 0
  let allEvaluated = 0

  for (const item of sessions) {
    if (item.status === "held") heldSessions++
    else if (item.status === "scheduled") scheduledSessions++
    else if (item.status === "canceled") canceledSessions++

    // جلسات لغوشده در جمع ساعت و آمار حضور محاسبه نمی‌شوند
    if (item.status !== "canceled") {
      totalMinutes += item.durationMinutes
      const recorded =
        item.attendance.presentCount +
        item.attendance.lateCount +
        item.attendance.excusedCount +
        item.attendance.absentCount
      allPresent += item.attendance.presentCount + item.attendance.lateCount
      allEvaluated += recorded
    }
  }

  const overallAttendanceRate =
    allEvaluated > 0 ? Math.round((allPresent / allEvaluated) * 100) : null

  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    totalSessions: sessions.length,
    heldSessions,
    scheduledSessions,
    canceledSessions,
    overallAttendanceRate,
  }
}

/**
 * محاسبه جمع‌بندی به تفکیک کلاس‌ها بر اساس جلسات (فیلترشده یا کامل)
 */
export function calculateFilteredClassSummaries(
  sessions: ReportSessionItem[],
  classDefs: ClassDefinition[],
): ClassReportSummary[] {
  const summaries: ClassReportSummary[] = []
  const classIds = new Set(sessions.map((s) => s.session.definitionId))

  for (const def of classDefs) {
    if (!classIds.has(def.id)) continue

    const classSessions = sessions.filter(
      (item) => item.session.definitionId === def.id,
    )
    if (classSessions.length === 0) continue

    const activeSessions = classSessions.filter((item) => item.status !== "canceled")
    const classMinutes = activeSessions.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    )
    const classHeld = classSessions.filter((item) => item.status === "held").length

    let cPresent = 0
    let cEvaluated = 0
    for (const item of activeSessions) {
      cPresent += item.attendance.presentCount + item.attendance.lateCount
      cEvaluated +=
        item.attendance.presentCount +
        item.attendance.lateCount +
        item.attendance.excusedCount +
        item.attendance.absentCount
    }
    const cRate = cEvaluated > 0 ? Math.round((cPresent / cEvaluated) * 100) : null

    summaries.push({
      classId: def.id,
      classTitle: def.title,
      classColor: def.color,
      totalStudents: def.students.length,
      sessionsCount: classSessions.length,
      heldCount: classHeld,
      totalMinutes: classMinutes,
      totalHours: Math.round((classMinutes / 60) * 10) / 10,
      attendanceRate: cRate,
    })
  }

  return summaries
}
