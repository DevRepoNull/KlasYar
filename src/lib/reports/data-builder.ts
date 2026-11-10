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
  let totalMinutes = 0
  let heldSessions = 0
  let scheduledSessions = 0
  let canceledSessions = 0
  let allPresent = 0
  let allEvaluated = 0

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

    if (session.status === "held") heldSessions++
    else if (session.status === "scheduled") scheduledSessions++
    else if (session.status === "canceled") canceledSessions++

    // جلسات لغوشده در جمع ساعت محاسبه نمی‌شوند
    if (session.status !== "canceled") {
      totalMinutes += durationMinutes
    }

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

    const recordedTotal = presentCount + lateCount + excusedCount + absentCount
    const rate = calculateAttendancePercentage(
      presentCount,
      lateCount,
      excusedCount,
      absentCount,
    )

    if (session.status !== "canceled") {
      allPresent += presentCount + lateCount
      allEvaluated += recordedTotal
    }

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

  // جمع‌بندی به تفکیک کلاس
  const classSummaries: ClassReportSummary[] = []
  for (const def of classDefs) {
    const classSessions = sessionItems.filter(
      (item) => item.session.definitionId === def.id,
    )
    if (classSessions.length === 0) continue

    const activeSessions = classSessions.filter(
      (item) => item.status !== "canceled",
    )
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

    classSummaries.push({
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

  const overallAttendanceRate =
    allEvaluated > 0 ? Math.round((allPresent / allEvaluated) * 100) : null

  return {
    year,
    month,
    monthTitle,
    monthKey,
    sessions: sessionItems,
    classSummaries,
    summary: {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalSessions: sortedSessions.length,
      heldSessions,
      scheduledSessions,
      canceledSessions,
      overallAttendanceRate,
    },
  }
}
