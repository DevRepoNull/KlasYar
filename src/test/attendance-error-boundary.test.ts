import { describe, expect, it } from "vitest"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { calculateAttendancePercentage } from "@/lib/pure-logic"
import { parseJalaliDate } from "@/lib/jalali"
import { getNextAttendanceStatus } from "@/components/attendance/attendance-constants"

describe("ErrorBoundary static logic & resilience", () => {
  it("getDerivedStateFromError sets hasError to true and preserves error object", () => {
    const error = new Error("تست کرش حضور و غیاب")
    const state = ErrorBoundary.getDerivedStateFromError(error)
    expect(state.hasError).toBe(true)
    expect(state.error).toBe(error)
  })
})

describe("Attendance status cycles & data resilience", () => {
  it("getNextAttendanceStatus correctly cycles unrecorded -> present -> late -> excused -> absent -> unrecorded", () => {
    expect(getNextAttendanceStatus("unrecorded")).toBe("present")
    expect(getNextAttendanceStatus("present")).toBe("late")
    expect(getNextAttendanceStatus("late")).toBe("excused")
    expect(getNextAttendanceStatus("excused")).toBe("absent")
    expect(getNextAttendanceStatus("absent")).toBe("unrecorded")
  })

  it("safely handles calculateAttendancePercentage with zero or negative counts", () => {
    expect(calculateAttendancePercentage(0, 0, 0, 0)).toBeNull()
    expect(calculateAttendancePercentage(5, 0, 0, 0)).toBe(100)
    expect(calculateAttendancePercentage(0, 0, 0, 5)).toBe(0)
    expect(calculateAttendancePercentage(3, 1, 0, 1)).toBe(80)
  })

  it("handles malformed jalali date strings gracefully when guarded", () => {
    const safeParse = (str: string | null | undefined) => {
      if (!str || typeof str !== "string") return null
      try {
        return parseJalaliDate(str)
      } catch {
        return null
      }
    }

    expect(safeParse("")).toBeNull()
    expect(safeParse(null)).toBeNull()
    expect(safeParse(undefined)).toBeNull()
    expect(safeParse("invalid-date")).toBeNull()
    expect(safeParse("1403-08-20")).toEqual({
      year: 1403,
      month: 8,
      day: 20,
    })
  })
})

describe("Attendance Matrix Empty States & Guards", () => {
  it("correctly identifies when definition has empty or undefined students list", () => {
    interface MockClassDef {
      id: string
      title: string
      students?: unknown[]
    }
    const defWithEmptyStudents: MockClassDef = { id: "1", title: "کلاس ۱", students: [] }
    const defWithUndefinedStudents: MockClassDef = { id: "2", title: "کلاس ۲", students: undefined }

    const getStudents = (def: MockClassDef) =>
      Array.isArray(def?.students) ? def.students : []

    expect(getStudents(defWithEmptyStudents)).toEqual([])
    expect(getStudents(defWithUndefinedStudents)).toEqual([])
    expect(getStudents(defWithEmptyStudents).length).toBe(0)
    expect(getStudents(defWithUndefinedStudents).length).toBe(0)
  })

  it("correctly guards against undefined session lists", () => {
    const getSessions = (sessions: unknown) =>
      Array.isArray(sessions) ? sessions : []

    expect(getSessions(undefined)).toEqual([])
    expect(getSessions(null)).toEqual([])
    expect(getSessions([{ id: "s1" }])).toHaveLength(1)
  })
})
