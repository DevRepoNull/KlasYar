import { describe, expect, it } from "vitest"
import type { ClassDefinition, Session } from "@/db/schema"
import {
  buildMonthReportData,
  calculateFilteredClassSummaries,
  calculateFilteredReportSummary,
  filterReportSessions,
} from "@/lib/reports/data-builder"
import type { ReportSessionItem } from "@/lib/reports/types"

describe("Reports Filtering and Dynamic Summaries", () => {
  const mockClassDefs: ClassDefinition[] = [
    {
      id: "class-1",
      title: "ریاضی نهم",
      color: "#0d9488",
      daysOfWeek: [0, 2],
      totalSessions: 16,
      defaultStart: "08:00",
      defaultEnd: "09:30",
      students: [
        { id: "s1", name: "علی رضایی" },
        { id: "s2", name: "محمد حسینی" },
      ],
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "class-2",
      title: "فیزیک دهم",
      color: "#6366f1",
      daysOfWeek: [1, 3],
      totalSessions: 12,
      defaultStart: "10:00",
      defaultEnd: "11:00",
      students: [{ id: "s3", name: "سارا احمدی" }],
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
  ]

  const mockSessions: Session[] = [
    {
      id: "sess-1",
      definitionId: "class-1",
      date: "1403-08-05",
      start: "08:00",
      end: "09:30", // 90 min
      status: "held",
      note: "فصل اول جبر",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "sess-2",
      definitionId: "class-1",
      date: "1403-08-12",
      start: "08:00",
      end: "09:30", // 90 min
      status: "held",
      note: "حل تمرین معادله",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "sess-3",
      definitionId: "class-1",
      date: "1403-08-19",
      start: "08:00",
      end: "09:30", // 90 min
      status: "canceled",
      note: "تعطیل رسمی",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "sess-4",
      definitionId: "class-2",
      date: "1403-08-10",
      start: "10:00",
      end: "11:00", // 60 min
      status: "held",
      note: "مکانیک حرکت",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "sess-5",
      definitionId: "class-2",
      date: "1403-08-25",
      start: "10:00",
      end: "11:00", // 60 min
      status: "scheduled",
      note: "آزمایشگاه",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
  ]

  const monthReport = buildMonthReportData(
    1403,
    8,
    mockClassDefs,
    mockSessions,
    [
      { id: "a1", sessionId: "sess-1", studentId: "s1", status: "present" },
      { id: "a2", sessionId: "sess-1", studentId: "s2", status: "late" },
      { id: "a3", sessionId: "sess-4", studentId: "s3", status: "absent" },
    ],
  )

  it("builds raw month report data with all 5 sessions", () => {
    expect(monthReport.sessions.length).toBe(5)
    expect(monthReport.summary.totalSessions).toBe(5)
    expect(monthReport.summary.heldSessions).toBe(3)
    expect(monthReport.summary.canceledSessions).toBe(1)
    expect(monthReport.summary.scheduledSessions).toBe(1)
    // Non-canceled sessions: 90 + 90 + 60 + 60 = 300 minutes (5 hours)
    expect(monthReport.summary.totalMinutes).toBe(300)
    expect(monthReport.summary.totalHours).toBe(5)
  })

  it("filters sessions by class ID", () => {
    const filteredClass1 = filterReportSessions(monthReport.sessions, {
      selectedClassId: "class-1",
    })
    expect(filteredClass1.length).toBe(3)
    expect(filteredClass1.every((s) => s.session.definitionId === "class-1")).toBe(true)

    const filteredClass2 = filterReportSessions(monthReport.sessions, {
      selectedClassId: "class-2",
    })
    expect(filteredClass2.length).toBe(2)
    expect(filteredClass2.every((s) => s.session.definitionId === "class-2")).toBe(true)

    const filteredAll = filterReportSessions(monthReport.sessions, {
      selectedClassId: "all",
    })
    expect(filteredAll.length).toBe(5)
  })

  it("filters sessions by Jalali date range (from / to)", () => {
    // Only from 1403-08-10 to 1403-08-20
    const inRange = filterReportSessions(monthReport.sessions, {
      dateRange: { from: "1403-08-10", to: "1403-08-20" },
    })
    expect(inRange.length).toBe(3) // sess-4 (10th), sess-2 (12th), sess-3 (19th)
    expect(inRange.map((s) => s.session.id)).toEqual(["sess-4", "sess-2", "sess-3"])

    // Only 'from' specified (from 1403-08-15 onwards)
    const fromOnly = filterReportSessions(monthReport.sessions, {
      dateRange: { from: "1403-08-15" },
    })
    expect(fromOnly.length).toBe(2) // sess-3 (19th), sess-5 (25th)

    // Only 'to' specified (up to 1403-08-10)
    const toOnly = filterReportSessions(monthReport.sessions, {
      dateRange: { to: "1403-08-10" },
    })
    expect(toOnly.length).toBe(2) // sess-1 (5th), sess-4 (10th)

    // Inverted date range (from > to) should normalize automatically
    const inverted = filterReportSessions(monthReport.sessions, {
      dateRange: { from: "1403-08-20", to: "1403-08-10" },
    })
    expect(inverted.length).toBe(3)
  })

  it("filters sessions by text search query", () => {
    const searchJabr = filterReportSessions(monthReport.sessions, {
      searchQuery: "جبر",
    })
    expect(searchJabr.length).toBe(1)
    expect(searchJabr[0].session.id).toBe("sess-1")

    const searchClassTitle = filterReportSessions(monthReport.sessions, {
      searchQuery: "فیزیک",
    })
    expect(searchClassTitle.length).toBe(2)
  })

  it("recalculates summary cards dynamically based on filtered sessions", () => {
    // Filter only class-2
    const filtered = filterReportSessions(monthReport.sessions, {
      selectedClassId: "class-2",
    })
    const summary = calculateFilteredReportSummary(filtered)

    expect(summary.totalSessions).toBe(2)
    expect(summary.heldSessions).toBe(1)
    expect(summary.scheduledSessions).toBe(1)
    expect(summary.canceledSessions).toBe(0)
    // 60 + 60 = 120 minutes (2 hours)
    expect(summary.totalMinutes).toBe(120)
    expect(summary.totalHours).toBe(2)
    // 1 held session with 1 student absent -> attendance rate 0%
    expect(summary.overallAttendanceRate).toBe(0)
  })

  it("recalculates class breakdown summaries to only show filtered classes", () => {
    const filteredClass1 = filterReportSessions(monthReport.sessions, {
      selectedClassId: "class-1",
    })
    const classSummaries = calculateFilteredClassSummaries(
      filteredClass1,
      mockClassDefs,
    )

    // Only class-1 should be in the list, class-2 excluded
    expect(classSummaries.length).toBe(1)
    expect(classSummaries[0].classId).toBe("class-1")
    expect(classSummaries[0].sessionsCount).toBe(3)
    expect(classSummaries[0].heldCount).toBe(2)
    // Active sessions: 90 + 90 = 180 min (canceled session sess-3 excluded)
    expect(classSummaries[0].totalMinutes).toBe(180)
    expect(classSummaries[0].totalHours).toBe(3)
  })

  it("handles empty filtered sessions gracefully with zero counts and null attendance", () => {
    const emptySessions: ReportSessionItem[] = []
    const summary = calculateFilteredReportSummary(emptySessions)
    const classSummaries = calculateFilteredClassSummaries(
      emptySessions,
      mockClassDefs,
    )

    expect(summary.totalSessions).toBe(0)
    expect(summary.totalMinutes).toBe(0)
    expect(summary.totalHours).toBe(0)
    expect(summary.overallAttendanceRate).toBeNull()
    expect(classSummaries).toEqual([])
  })
})
