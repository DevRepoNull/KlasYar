import { describe, expect, it } from "vitest"
import {
  jalaliToDate,
  parseJalaliDate,
  toPersianDigits,
} from "@/lib/jalali"

describe("Session & Class Date Enhancements QA", () => {
  it("converts Jalali date strings to correct Gregorian references for class session generation", () => {
    const pastJalali = "1404-07-01"
    const parsed = parseJalaliDate(pastJalali)
    expect(parsed.year).toBe(1404)
    expect(parsed.month).toBe(7)
    expect(parsed.day).toBe(1)

    const gregDate = jalaliToDate(parsed)
    expect(gregDate).toBeInstanceOf(Date)
    expect(Number.isNaN(gregDate.getTime())).toBe(false)
  })

  it("formats 24-hour time values and Persian numerals correctly", () => {
    const time = "16:30"
    const [h, m] = time.split(":")
    expect(toPersianDigits(h)).toBe("۱۶")
    expect(toPersianDigits(m)).toBe("۳۰")
  })

  it("filters sessions accurately within a Jalali date range", () => {
    const mockSessions = [
      { id: "1", date: "1405-08-01", start: "14:00" },
      { id: "2", date: "1405-08-10", start: "16:00" },
      { id: "3", date: "1405-08-25", start: "10:00" },
      { id: "4", date: "1405-09-05", start: "15:00" },
    ]

    const range = { from: "1405-08-05", to: "1405-08-30" }
    const filtered = mockSessions.filter(
      (s) => s.date >= range.from && s.date <= range.to,
    )

    expect(filtered).toHaveLength(2)
    expect(filtered.map((s) => s.id)).toEqual(["2", "3"])
  })
})
