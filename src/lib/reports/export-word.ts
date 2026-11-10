import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import { toPersianDigits } from "@/lib/jalali"
import type { MonthReportData } from "./types"

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportToWord(report: MonthReportData): Promise<void> {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
  }

  // سربرگ جدول جلسات
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("#", 6),
      createHeaderCell("عنوان کلاس", 24),
      createHeaderCell("تاریخ", 13),
      createHeaderCell("روز", 10),
      createHeaderCell("ساعت", 14),
      createHeaderCell("مدت", 11),
      createHeaderCell("وضعیت", 12),
      createHeaderCell("حضور", 10),
    ],
  })

  // ردیف‌های جلسات
  const rows = report.sessions.map((item, index) => {
    const rateStr =
      item.attendance.rate !== null
        ? `${toPersianDigits(item.attendance.rate)}٪`
        : "—"

    return new TableRow({
      cantSplit: true,
      children: [
        createDataCell(toPersianDigits(index + 1), 6),
        createDataCell(item.classTitle, 24, true),
        createDataCell(item.dateStr, 13),
        createDataCell(item.weekday, 10),
        createDataCell(`${item.start} - ${item.end}`, 14),
        createDataCell(`${toPersianDigits(item.durationMinutes)} د`, 11),
        createDataCell(item.statusLabel, 12),
        createDataCell(rateStr, 10),
      ],
    })
  })

  const sessionsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [headerRow, ...rows],
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          // عنوان سند
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({
                text: "کلاس‌یار — گزارش ماهانه جلسات",
                bold: true,
                size: 32,
                color: "0f766e",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // زیرعنوان ماه
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `ماه: ${report.monthTitle}  |  تعداد کل جلسات: ${toPersianDigits(
                  report.summary.totalSessions,
                )}  |  مجموع ساعات: ${toPersianDigits(
                  report.summary.totalHours,
                )} ساعت`,
                size: 20,
                color: "64748b",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // شاخص‌های کلیدی
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `جلسات برگزارشده: ${toPersianDigits(
                  report.summary.heldSessions,
                )} جلسه  |  میانگین کل حضور و غیاب: ${
                  report.summary.overallAttendanceRate !== null
                    ? `${toPersianDigits(report.summary.overallAttendanceRate)}٪`
                    : "—"
                }`,
                bold: true,
                size: 20,
                color: "0f172a",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // جدول جلسات یا پیام خالی
          report.sessions.length > 0
            ? sessionsTable
            : new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({
                    text: `در ماه ${report.monthTitle} هیچ جلسه‌ای ثبت نشده است.`,
                    size: 22,
                    font: "Vazirmatn",
                    rightToLeft: true,
                  }),
                ],
              }),

          // پاورقی سند
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 360 },
            children: [
              new TextRun({
                text: "تولید شده توسط نرم‌افزار مدیریت کلاس و جلسات «کلاس‌یار»",
                size: 16,
                color: "94a3b8",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `گزارش-کلاس‌یار-${report.monthKey}.docx`)
}

function createHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "f1f5f9" },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18,
            color: "334155",
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}

function createDataCell(
  text: string,
  widthPercent: number,
  alignRight = false,
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            size: 18,
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}
