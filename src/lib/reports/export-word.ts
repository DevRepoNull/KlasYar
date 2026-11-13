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
import {
  formatDuration,
  formatJalaliFullDate,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"
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

const TABLE_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
}

const CELL_MARGINS = {
  top: 130,
  bottom: 130,
  left: 140,
  right: 140,
}

export function buildWordDocument(report: MonthReportData): Document {
  const todayStr = formatJalaliFullDate(todayJalali())

  // ۱. سربرگ جدول جلسات با رنگ سبز تیره و متن سفید
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("#", 5),
      createHeaderCell("عنوان کلاس", 25, true),
      createHeaderCell("تاریخ", 13),
      createHeaderCell("روز", 10),
      createHeaderCell("ساعت", 14),
      createHeaderCell("مدت", 10),
      createHeaderCell("وضعیت", 11),
      createHeaderCell("حضور", 12),
    ],
  })

  // ۲. ردیف‌های داده جدول با استایل راه‌راه (Zebra Striping)
  const rows = report.sessions.map((item, index) => {
    const isEven = index % 2 === 0
    const rowBg = isEven ? "F8FAFC" : "FFFFFF"

    const rateStr =
      item.attendance.rate !== null
        ? `${toPersianDigits(item.attendance.rate)}٪`
        : "—"
    const presentCount =
      item.attendance.presentCount + item.attendance.lateCount
    const attendanceText = `${toPersianDigits(presentCount)}/${toPersianDigits(
      item.attendance.totalStudents,
    )} (${rateStr})`

    return new TableRow({
      cantSplit: true,
      children: [
        createDataCell(toPersianDigits(index + 1), 5, false, rowBg),
        createDataCell(item.classTitle, 25, true, rowBg, true),
        createDataCell(toPersianDigits(item.dateStr), 13, false, rowBg),
        createDataCell(item.weekday, 10, false, rowBg),
        createDataCell(`${item.start} - ${item.end}`, 14, false, rowBg),
        createDataCell(formatDuration(item.durationMinutes), 10, false, rowBg),
        createStatusCell(item.status, item.statusLabel, 11),
        createDataCell(attendanceText, 12, false, rowBg),
      ],
    })
  })

  const sessionsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER,
    rows: [headerRow, ...rows],
  })

  // جدول کارت‌های شاخص کلیدی بالای سند
  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDER,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          createKpiCell("مجموع کل ساعت جلسات", `${toPersianDigits(report.summary.totalHours)} ساعت`, "0F766E"),
          createKpiCell("جلسات برگزارشده", `${toPersianDigits(report.summary.heldSessions)} از ${toPersianDigits(report.summary.totalSessions)} جلسه`),
          createKpiCell("میانگین حضور و غیاب", report.summary.overallAttendanceRate !== null ? `${toPersianDigits(report.summary.overallAttendanceRate)}٪` : "—", "0D9488"),
          createKpiCell("کلاس‌های فعال", `${toPersianDigits(report.classSummaries.length)} کلاس`),
        ],
      }),
    ],
  })

  // ساخت سند نهایی با ساختار استاندارد و جهت راست به چپ
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }, // نیم اینچ حاشیه
          },
        },
        children: [
          // عنوان اصلی سند
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "کلاس‌یار — گزارش ماهانه جلسات",
                bold: true,
                size: 32,
                color: "0F766E",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // متاداده گزارش و تاریخ صدور
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `گزارش دوره: ${report.monthTitle}   |   تاریخ صدور: ${todayStr}   |   تعداد جلسات: ${toPersianDigits(
                  report.summary.totalSessions,
                )} جلسه`,
                size: 18,
                color: "64748B",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // جدول شاخص‌های کلان
          kpiTable,

          new Paragraph({
            spacing: { after: 200 },
          }),

          // عنوان بخش جلسات
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `جدول تفصیلی جلسات (${report.monthTitle})`,
                bold: true,
                size: 22,
                color: "1E293B",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),

          // جدول جلسات یا پیام خالی در صورت نبود جلسه
          report.sessions.length > 0
            ? sessionsTable
            : new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { before: 240, after: 240 },
                children: [
                  new TextRun({
                    text: `در ماه ${report.monthTitle} هیچ جلسه‌ای ثبت نشده است.`,
                    size: 20,
                    color: "64748B",
                    font: "Vazirmatn",
                    rightToLeft: true,
                  }),
                ],
              }),

          // پاورقی سند
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "تولید شده توسط نرم‌افزار هوشمند مدیریت آموزش و جلسات «کلاس‌یار»",
                size: 16,
                color: "94A3B8",
                font: "Vazirmatn",
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  })

  return doc
}

export async function exportToWord(report: MonthReportData): Promise<void> {
  const doc = buildWordDocument(report)
  // نام‌گذاری فایل با فرمت درخواستی پرامپت: Klasyar-Report-YYYY-MM.docx
  const filename = `Klasyar-Report-${report.monthKey}.docx`

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

/**
 * ایجاد خانه سربرگ جدول با رنگ سبز تیره و متن سفید
 */
function createHeaderCell(
  text: string,
  widthPercent: number,
  alignRight = false,
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "0F766E" }, // سبز تیره کلاس‌یار
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 19,
            color: "FFFFFF",
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}

/**
 * ایجاد خانه داده با فونت استاندارد و رنگ پس‌زمینه
 */
function createDataCell(
  text: string,
  widthPercent: number,
  alignRight = false,
  fillColor = "FFFFFF",
  bold = false,
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: fillColor },
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text,
            size: 17,
            bold,
            color: "1E293B",
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}

/**
 * ایجاد خانه وضعیت جلسه با رنگ‌بندی و بج وضعیت
 */
function createStatusCell(
  status: string,
  statusLabel: string,
  widthPercent: number,
): TableCell {
  let fill = "E0F2FE"
  let color = "075985"
  let strike = false

  if (status === "held") {
    fill = "DCFCE7"
    color = "166534"
  } else if (status === "canceled") {
    fill = "FEE2E2"
    color = "991B1B"
    strike = true
  }

  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill },
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text: statusLabel,
            bold: true,
            strike,
            size: 16,
            color,
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}

/**
 * ایجاد سلول کارت شاخص‌های کلیدی بالای سند
 */
function createKpiCell(
  label: string,
  value: string,
  valueColor = "0F172A",
): TableCell {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
    margins: { top: 140, bottom: 140, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text: label,
            size: 15,
            color: "64748B",
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: value,
            bold: true,
            size: 20,
            color: valueColor,
            font: "Vazirmatn",
            rightToLeft: true,
          }),
        ],
      }),
    ],
  })
}
