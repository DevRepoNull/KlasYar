import type { JalaliDate } from "@/lib/jalali"
import type { Session, SessionStatus } from "@/db/schema"

export interface ReportSessionItem {
  session: Session
  classTitle: string
  classColor: string
  jalaliDate: JalaliDate
  dateStr: string
  shortDate: string
  weekday: string
  start: string
  end: string
  durationMinutes: number
  durationHours: number
  status: SessionStatus
  statusLabel: string
  attendance: {
    presentCount: number
    lateCount: number
    excusedCount: number
    absentCount: number
    unrecordedCount: number
    totalStudents: number
    rate: number | null
  }
  note: string
}

export interface ClassReportSummary {
  classId: string
  classTitle: string
  classColor: string
  totalStudents: number
  sessionsCount: number
  heldCount: number
  totalMinutes: number
  totalHours: number
  attendanceRate: number | null
}

export interface MonthReportData {
  year: number
  month: number
  monthTitle: string
  monthKey: string
  sessions: ReportSessionItem[]
  classSummaries: ClassReportSummary[]
  summary: {
    totalMinutes: number
    totalHours: number
    totalSessions: number
    heldSessions: number
    scheduledSessions: number
    canceledSessions: number
    overallAttendanceRate: number | null
  }
}
