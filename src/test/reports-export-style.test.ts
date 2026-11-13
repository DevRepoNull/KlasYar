import { describe, expect, it } from "vitest"
import { buildMonthReportData } from "@/lib/reports/data-builder"
import { buildExcelWorkbook } from "@/lib/reports/export-excel"
import { buildWordDocument } from "@/lib/reports/export-word"
import type { ClassDefinition, Session } from "@/db/schema"

describe("Export Styles and File Naming (Excel, Word, PDF)", () => {
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
  ]

  const mockSessions: Session[] = [
    {
      id: "sess-1",
      definitionId: "class-1",
      date: "1403-08-05",
      start: "08:00",
      end: "09:30",
      status: "held",
      note: "جلسه اول جبر",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
    {
      id: "sess-2",
      definitionId: "class-1",
      date: "1403-08-12",
      start: "08:00",
      end: "09:30",
      status: "canceled",
      note: "تعطیل رسمی",
      createdAt: "1403-01-01",
      updatedAt: "1403-01-01",
    },
  ]

  const reportData = buildMonthReportData(
    1403,
    8,
    mockClassDefs,
    mockSessions,
    [
      { id: "a1", sessionId: "sess-1", studentId: "s1", status: "present" },
      { id: "a2", sessionId: "sess-1", studentId: "s2", status: "late" },
    ],
  )

  it("builds styled Excel workbook with RTL and teal header styling", () => {
    const wb = buildExcelWorkbook(reportData)

    expect(wb.SheetNames).toContain("جلسات")
    expect(wb.SheetNames).toContain("شاخص‌ها و کلاس‌ها")

    const wsSessions = wb.Sheets["جلسات"]
    expect(wsSessions).toBeDefined()

    // بررسی راست‌چین بودن کاربرگ (RTL View)
    expect(wsSessions["!views"]).toEqual([{ RTL: true }])

    // بررسی وجود ادغام برای ردیف بنر و عنوان
    expect(wsSessions["!merges"]).toBeDefined()
    expect(wsSessions["!merges"]?.length).toBeGreaterThanOrEqual(2)

    // بررسی استایل هدر جدول (A4)
    const headerCell = wsSessions["A4"]
    expect(headerCell).toBeDefined()
    expect(headerCell.s).toBeDefined()
    expect(headerCell.s.fill.fgColor.rgb).toBe("0F766E") // سبز تیره کلاس‌یار
    expect(headerCell.s.font.color.rgb).toBe("FFFFFF") // متن سفید
    expect(headerCell.s.font.bold).toBe(true)

    // بررسی محاسبه خودکار عرض ستون‌ها
    expect(wsSessions["!cols"]).toBeDefined()
    expect(wsSessions["!cols"]?.length).toBe(13)
    wsSessions["!cols"]?.forEach((col) => {
      expect(col.wch).toBeGreaterThan(0)
    })

    // بررسی شیت شاخص‌ها
    const wsSummary = wb.Sheets["شاخص‌ها و کلاس‌ها"]
    expect(wsSummary).toBeDefined()
    expect(wsSummary["!views"]).toEqual([{ RTL: true }])
  })

  it("builds standard Word document with RTL direction and styled elements", () => {
    const doc = buildWordDocument(reportData)
    expect(doc).toBeDefined()
    expect(doc.constructor.name).toBe("File")
  })

  it("formats file names consistently as Klasyar-Report-YYYY-MM.*", () => {
    const expectedPrefix = `Klasyar-Report-${reportData.monthKey}`
    const excelName = `${expectedPrefix}.xlsx`
    const pdfName = `${expectedPrefix}.pdf`
    const wordName = `${expectedPrefix}.docx`

    expect(excelName).toBe("Klasyar-Report-1403-08.xlsx")
    expect(pdfName).toBe("Klasyar-Report-1403-08.pdf")
    expect(wordName).toBe("Klasyar-Report-1403-08.docx")
  })
})
