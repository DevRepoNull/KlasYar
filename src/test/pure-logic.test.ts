import { describe, expect, it } from "vitest"
import {
  calculateAttendancePercentage,
  calculateSessionDurationMinutes,
  canAddSessionForDefinition,
  checkTimeOverlap,
  isSessionLimitReached,
  type TimeInterval,
} from "../lib/pure-logic"

describe("Pure Logic: Session Duration (محاسبه مدت جلسه)", () => {
  it("calculates normal session duration in minutes accurately", () => {
    expect(calculateSessionDurationMinutes("16:00", "17:30")).toBe(90)
    expect(calculateSessionDurationMinutes("10:00", "11:00")).toBe(60)
    expect(calculateSessionDurationMinutes("08:15", "09:45")).toBe(90)
    expect(calculateSessionDurationMinutes("08:00", "12:30")).toBe(270)
    expect(calculateSessionDurationMinutes("14:10", "14:55")).toBe(45)
  })

  it("returns 0 when start and end times are identical", () => {
    expect(calculateSessionDurationMinutes("10:00", "10:00")).toBe(0)
    expect(calculateSessionDurationMinutes("18:30", "18:30")).toBe(0)
  })

  it("returns 0 when end time is before start time", () => {
    expect(calculateSessionDurationMinutes("17:00", "16:00")).toBe(0)
    expect(calculateSessionDurationMinutes("20:00", "08:00")).toBe(0)
  })

  it("handles empty or invalid time inputs gracefully", () => {
    expect(calculateSessionDurationMinutes("", "10:00")).toBe(0)
    expect(calculateSessionDurationMinutes("10:00", "")).toBe(0)
    expect(calculateSessionDurationMinutes("invalid", "10:00")).toBe(0)
    expect(calculateSessionDurationMinutes("10:00", "bad")).toBe(0)
  })
})

describe("Pure Logic: Session Ceiling Validation (اعتبارسنجی سقف جلسات)", () => {
  it("allows adding sessions when current count is strictly less than total", () => {
    expect(canAddSessionForDefinition(0, 12)).toBe(true)
    expect(canAddSessionForDefinition(5, 12)).toBe(true)
    expect(canAddSessionForDefinition(11, 12)).toBe(true)

    expect(isSessionLimitReached(0, 12)).toBe(false)
    expect(isSessionLimitReached(11, 12)).toBe(false)
  })

  it("rejects adding sessions when current count equals total allowed", () => {
    expect(canAddSessionForDefinition(12, 12)).toBe(false)
    expect(isSessionLimitReached(12, 12)).toBe(true)
  })

  it("rejects adding sessions when count exceeds total (overflow edge case)", () => {
    expect(canAddSessionForDefinition(13, 12)).toBe(false)
    expect(canAddSessionForDefinition(20, 12)).toBe(false)
    expect(isSessionLimitReached(13, 12)).toBe(true)
  })

  it("handles single-session classes (total = 1)", () => {
    expect(canAddSessionForDefinition(0, 1)).toBe(true)
    expect(canAddSessionForDefinition(1, 1)).toBe(false)
    expect(isSessionLimitReached(1, 1)).toBe(true)
  })

  it("safely rejects non-positive totalSessions definitions", () => {
    expect(canAddSessionForDefinition(0, 0)).toBe(false)
    expect(canAddSessionForDefinition(0, -1)).toBe(false)
    expect(isSessionLimitReached(0, 0)).toBe(true)
  })
})

describe("Pure Logic: Time Interval Overlap (هم‌پوشانی زمانی)", () => {
  it("detects no overlap for disjoint non-overlapping intervals", () => {
    const a: TimeInterval = { start: "10:00", end: "11:00" }
    const b: TimeInterval = { start: "12:00", end: "13:00" }

    expect(checkTimeOverlap(a, b)).toBe(false)
    expect(checkTimeOverlap(b, a)).toBe(false)
  })

  it("allows back-to-back adjacent sessions without overlap (جلسات پشت‌سرهم)", () => {
    const a: TimeInterval = { start: "10:00", end: "11:30" }
    const b: TimeInterval = { start: "11:30", end: "13:00" }

    // Session A ends exactly when Session B begins
    expect(checkTimeOverlap(a, b)).toBe(false)
    expect(checkTimeOverlap(b, a)).toBe(false)
  })

  it("detects partial overlap when one session starts before another ends", () => {
    const a: TimeInterval = { start: "10:00", end: "11:30" }
    const b: TimeInterval = { start: "11:00", end: "12:30" }

    expect(checkTimeOverlap(a, b)).toBe(true)
    expect(checkTimeOverlap(b, a)).toBe(true)
  })

  it("detects overlap when one session is fully inside another", () => {
    const outer: TimeInterval = { start: "09:00", end: "13:00" }
    const inner: TimeInterval = { start: "10:00", end: "11:00" }

    expect(checkTimeOverlap(outer, inner)).toBe(true)
    expect(checkTimeOverlap(inner, outer)).toBe(true)
  })

  it("detects overlap when two sessions have identical start and end times", () => {
    const a: TimeInterval = { start: "14:00", end: "15:30" }
    const b: TimeInterval = { start: "14:00", end: "15:30" }

    expect(checkTimeOverlap(a, b)).toBe(true)
  })

  it("rejects invalid time ranges where start >= end as non-overlapping", () => {
    const valid: TimeInterval = { start: "10:00", end: "12:00" }
    const inverted: TimeInterval = { start: "12:00", end: "10:00" }
    const zeroDuration: TimeInterval = { start: "10:00", end: "10:00" }

    expect(checkTimeOverlap(valid, inverted)).toBe(false)
    expect(checkTimeOverlap(valid, zeroDuration)).toBe(false)
  })
})

describe("Pure Logic: Attendance Percentage (درصد حضور)", () => {
  it("returns 100% when all students are present or late", () => {
    expect(calculateAttendancePercentage(5, 0, 0, 0)).toBe(100)
    expect(calculateAttendancePercentage(3, 2, 0, 0)).toBe(100)
    expect(calculateAttendancePercentage(0, 4, 0, 0)).toBe(100)
  })

  it("calculates accurate percentage with absences and leaves", () => {
    // 3 present out of 4 total evaluated -> 75%
    expect(calculateAttendancePercentage(3, 0, 0, 1)).toBe(75)

    // 2 present, 1 late (3 attended) out of 5 total (1 excused, 1 absent) -> 60%
    expect(calculateAttendancePercentage(2, 1, 1, 1)).toBe(60)

    // 0 attended out of 4 total -> 0%
    expect(calculateAttendancePercentage(0, 0, 2, 2)).toBe(0)
  })

  it("rounds decimal percentages to the nearest integer", () => {
    // 2 out of 3 -> 66.666...% => 67%
    expect(calculateAttendancePercentage(2, 0, 0, 1)).toBe(67)

    // 1 out of 3 -> 33.333...% => 33%
    expect(calculateAttendancePercentage(1, 0, 0, 2)).toBe(33)
  })

  it("returns null when no attendance records are evaluated (0 total)", () => {
    expect(calculateAttendancePercentage(0, 0, 0, 0)).toBeNull()
  })

  it("handles negative inputs safely without NaN", () => {
    expect(calculateAttendancePercentage(-1, -2, -3, -4)).toBeNull()
    expect(calculateAttendancePercentage(2, -1, 0, 0)).toBe(100)
  })
})
