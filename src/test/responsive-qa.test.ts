import { describe, expect, it } from "vitest"
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-items"
import { buildMonthReportData, filterReportSessions } from "@/lib/reports/data-builder"
import type { ClassDefinition, Session, Attendance } from "@/db/schema"
import { getNextAttendanceStatus } from "@/components/attendance/attendance-constants"

describe("Prompt 27: Responsive Mobile-First & QA", () => {
  describe("Navigation & Active Path Checking", () => {
    it("provides the primary nav items with required metadata", () => {
      expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(5)
      const hrefs = NAV_ITEMS.map((item) => item.href)
      expect(hrefs).toContain("/")
      expect(hrefs).toContain("/classes")
      expect(hrefs).toContain("/sessions")
      expect(hrefs).toContain("/attendance")
      expect(hrefs).toContain("/reports")
    })

    it("correctly identifies active paths for mobile & desktop navigation", () => {
      expect(isActivePath("/", "/")).toBe(true)
      expect(isActivePath("/classes", "/")).toBe(false)
      expect(isActivePath("/classes", "/classes")).toBe(true)
      expect(isActivePath("/classes/123", "/classes")).toBe(true)
      expect(isActivePath("/sessions", "/sessions")).toBe(true)
      expect(isActivePath("/attendance", "/attendance")).toBe(true)
      expect(isActivePath("/reports", "/reports")).toBe(true)
      expect(isActivePath("/help", "/help")).toBe(true)
      expect(isActivePath("/onboarding", "/help")).toBe(true)
    })
  })

  describe("Reports Mobile Card List Data Preparation", () => {
    const mockClass: ClassDefinition = {
      id: "cls-1",
      title: "ریاضی نهم",
      color: "#0d9488",
      daysOfWeek: [0, 2],
      totalSessions: 12,
      defaultStart: "09:00",
      defaultEnd: "10:30",
      students: [{ id: "stu-1", name: "علی رضایی" }],
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z",
    }

    const mockSession: Session = {
      id: "ses-1",
      definitionId: "cls-1",
      date: "1405-02-15",
      start: "09:00",
      end: "10:30",
      status: "held",
      note: "جلسه جبرانی مشتق",
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z",
    }

    const mockAttendance: Attendance = {
      id: "att-1",
      sessionId: "ses-1",
      studentId: "stu-1",
      status: "present",
    }

    it("formats report session rows suitable for both table and mobile card list rendering", () => {
      const data = buildMonthReportData(1405, 2, [mockClass], [mockSession], [mockAttendance])
      const filtered = filterReportSessions(data.sessions, {
        selectedClassId: "all",
        dateRange: { from: "", to: "" },
        searchQuery: "",
      })

      expect(filtered).toHaveLength(1)
      const item = filtered[0]
      expect(item.classTitle).toBe("ریاضی نهم")
      expect(item.classColor).toBe("#0d9488")
      expect(item.durationMinutes).toBe(90)
      expect(item.attendance.presentCount).toBe(1)
      expect(item.attendance.rate).toBe(100)
      expect(item.note).toBe("جلسه جبرانی مشتق")
    })
  })

  describe("Attendance Cycling & Mobile Status Interaction", () => {
    it("cycles through extended attendance statuses correctly on tap", () => {
      expect(getNextAttendanceStatus("unrecorded")).toBe("present")
      expect(getNextAttendanceStatus("present")).toBe("late")
      expect(getNextAttendanceStatus("late")).toBe("excused")
      expect(getNextAttendanceStatus("excused")).toBe("absent")
      expect(getNextAttendanceStatus("absent")).toBe("unrecorded")
    })
  })
})
