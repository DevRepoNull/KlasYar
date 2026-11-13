import XLSX from "xlsx-js-style"
import { formatJalaliFullDate, todayJalali, toPersianDigits } from "@/lib/jalali"
import type { MonthReportData } from "./types"

// پالت رنگی هماهنگ با طراحی کلاس‌یار
const THEME = {
  headerBg: "0F766E", // سبز تیره کلاس‌یار (Teal 700)
  headerText: "FFFFFF",
  subHeaderBg: "F0FDFA", // Teal 50
  subHeaderText: "0F766E",
  rowEvenBg: "F8FAFC", // Slate 50
  rowOddBg: "FFFFFF",
  borderLight: "E2E8F0", // Slate 200
  borderDark: "0D9488",
  textPrimary: "0F172A",
  textMuted: "64748B",
  // وضعیت‌ها
  statusHeldBg: "DCFCE7",
  statusHeldText: "166534",
  statusCanceledBg: "FEE2E2",
  statusCanceledText: "991B1B",
  statusScheduledBg: "E0F2FE",
  statusScheduledText: "075985",
}

interface CellStyleOptions {
  bold?: boolean
  fontColor?: string
  fontSize?: number
  bgColor?: string
  align?: "left" | "center" | "right"
  wrapText?: boolean
  strike?: boolean
  borderColor?: string
  borderStyle?: "thin" | "medium"
}

function buildStyle({
  bold = false,
  fontColor = THEME.textPrimary,
  fontSize = 10,
  bgColor,
  align = "center",
  wrapText = false,
  strike = false,
  borderColor = THEME.borderLight,
  borderStyle = "thin",
}: CellStyleOptions = {}) {
  const borderDef = {
    style: borderStyle,
    color: { rgb: borderColor },
  }

  return {
    font: {
      name: "Tahoma",
      sz: fontSize,
      bold,
      strike,
      color: { rgb: fontColor },
    },
    fill: bgColor
      ? {
          patternType: "solid",
          fgColor: { rgb: bgColor },
        }
      : undefined,
    alignment: {
      vertical: "center",
      horizontal: align,
      wrapText,
    },
    border: {
      top: borderDef,
      bottom: borderDef,
      left: borderDef,
      right: borderDef,
    },
  }
}

/**
 * ایجاد ستون‌ها با عرض محاسبه‌شده متناسب با حداکثر طول محتوا
 */
function calculateColumnWidths(data: (string | number)[][], minWidths: number[]): { wch: number }[] {
  const colCount = minWidths.length
  const widths = [...minWidths]

  for (const row of data) {
    for (let c = 0; c < colCount; c++) {
      const val = row[c]
      if (val !== undefined && val !== null) {
        const str = String(val)
        // حروف فارسی در اکسل عرض بصری بیشتری می‌گیرند
        const visualLength = Math.ceil(str.length * 1.3) + 3
        if (visualLength > widths[c]) {
          widths[c] = visualLength
        }
      }
    }
  }

  return widths.map((w) => ({ wch: Math.min(Math.max(w, 8), 50) }))
}

export function buildExcelWorkbook(report: MonthReportData) {
  const wb = XLSX.utils.book_new()
  const todayStr = formatJalaliFullDate(todayJalali())

  // ==========================================
  // شیت ۱: لیست کامل جلسات
  // ==========================================
  const headers = [
    "ردیف",
    "عنوان کلاس",
    "تاریخ",
    "روز هفته",
    "ساعت شروع",
    "ساعت پایان",
    "مدت (دقیقه)",
    "مدت (ساعت)",
    "وضعیت جلسه",
    "شاگردان حاضر",
    "کل شاگردان",
    "درصد حضور",
    "یادداشت",
  ]

  // ردیف ۱: عنوان کلان گزارش
  // ردیف ۲: زیرعنوان متاداده
  // ردیف ۳: فاصله خالی
  // ردیف ۴: هدر جدول
  const rawRows: (string | number)[][] = [
    [`کلاس‌یار — گزارش ماهانه جلسات (${report.monthTitle})`],
    [
      `تاریخ صدور: ${todayStr}  |  تعداد کل جلسات: ${toPersianDigits(
        report.summary.totalSessions,
      )}  |  مجموع ساعات: ${toPersianDigits(report.summary.totalHours)} ساعت`,
    ],
    [], // ردیف خالی
    headers,
  ]

  // ردیف‌های داده جلسات
  report.sessions.forEach((item, idx) => {
    const presentCount = item.attendance.presentCount + item.attendance.lateCount
    const rateStr =
      item.attendance.rate !== null ? `${item.attendance.rate}٪` : "—"

    rawRows.push([
      idx + 1,
      item.classTitle,
      item.dateStr,
      item.weekday,
      item.start,
      item.end,
      item.durationMinutes,
      item.durationHours,
      item.statusLabel,
      presentCount,
      item.attendance.totalStudents,
      rateStr,
      item.note || "—",
    ])
  })

  if (report.sessions.length === 0) {
    rawRows.push([
      "در این ماه هیچ جلسه‌ای ثبت نشده است.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ])
  }

  const wsSessions = XLSX.utils.aoa_to_sheet(rawRows)

  // اعمال استایل‌ها به خانه‌های شیت ۱
  const bannerStyle = buildStyle({
    bold: true,
    fontSize: 13,
    fontColor: THEME.headerText,
    bgColor: THEME.headerBg,
    align: "center",
    borderColor: THEME.borderDark,
    borderStyle: "medium",
  })

  const subBannerStyle = buildStyle({
    bold: false,
    fontSize: 9.5,
    fontColor: THEME.subHeaderText,
    bgColor: THEME.subHeaderBg,
    align: "center",
    borderColor: THEME.borderDark,
  })

  const tableHeaderStyle = buildStyle({
    bold: true,
    fontSize: 10.5,
    fontColor: THEME.headerText,
    bgColor: THEME.headerBg,
    align: "center",
    borderColor: THEME.borderDark,
    borderStyle: "medium",
  })

  // ادغام ردیف عنوان و زیرعنوان در تمام ستون‌ها (A تا M)
  wsSessions["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ]

  // تنظیم ارتفاع ردیف‌ها
  wsSessions["!rows"] = [
    { hpt: 32 }, // عنوان
    { hpt: 22 }, // زیرعنوان
    { hpt: 10 }, // فاصله
    { hpt: 26 }, // هدر جدول
  ]

  // استایل‌دهی ردیف ۱ و ۲
  for (let c = 0; c < headers.length; c++) {
    const colLetter = XLSX.utils.encode_col(c)
    const cellA = wsSessions[`${colLetter}1`]
    if (cellA) cellA.s = bannerStyle

    const cellB = wsSessions[`${colLetter}2`]
    if (cellB) cellB.s = subBannerStyle
  }

  // استایل‌دهی هدر جدول (ردیف ۴ -> ایندکس ۳)
  for (let c = 0; c < headers.length; c++) {
    const colLetter = XLSX.utils.encode_col(c)
    const cell = wsSessions[`${colLetter}4`]
    if (cell) cell.s = tableHeaderStyle
  }

  // استایل‌دهی ردیف‌های داده (از ردیف ۵ به بعد)
  report.sessions.forEach((item, idx) => {
    const rowIdx = idx + 5 // در اکسل ایندکس ۱-مبنا است
    const isEven = idx % 2 === 0
    const rowBg = isEven ? THEME.rowEvenBg : THEME.rowOddBg

    for (let c = 0; c < headers.length; c++) {
      const colLetter = XLSX.utils.encode_col(c)
      const cellRef = `${colLetter}${rowIdx}`
      const cell = wsSessions[cellRef]
      if (!cell) continue

      // ستون وضعیت (ستون ۹ -> ایندکس ۸)
      if (c === 8) {
        let statusBg = THEME.statusScheduledBg
        let statusColor = THEME.statusScheduledText
        let strike = false

        if (item.status === "held") {
          statusBg = THEME.statusHeldBg
          statusColor = THEME.statusHeldText
        } else if (item.status === "canceled") {
          statusBg = THEME.statusCanceledBg
          statusColor = THEME.statusCanceledText
          strike = true
        }

        cell.s = buildStyle({
          bold: true,
          fontSize: 9.5,
          bgColor: statusBg,
          fontColor: statusColor,
          align: "center",
          strike,
        })
      } else {
        // چینش راست‌چین برای عنوان کلاس و یادداشت
        const isRightAlign = c === 1 || c === 12
        cell.s = buildStyle({
          fontSize: 9.5,
          bgColor: rowBg,
          align: isRightAlign ? "right" : "center",
          bold: c === 1, // عنوان کلاس برجسته
        })
      }
    }
  })

  // عرض ستون‌ها
  const defaultMinColWidths = [
    6,  // ردیف
    22, // عنوان کلاس
    13, // تاریخ
    10, // روز هفته
    10, // شروع
    10, // پایان
    12, // مدت دقیقه
    11, // مدت ساعت
    14, // وضعیت
    12, // حاضرین
    12, // کل شاگردان
    12, // درصد حضور
    28, // یادداشت
  ]
  wsSessions["!cols"] = calculateColumnWidths(rawRows.slice(3), defaultMinColWidths)

  // راست‌چین کردن کاربرگ (RTL)
  wsSessions["!views"] = [{ RTL: true }]

  // ==========================================
  // شیت ۲: خلاصه و شاخص‌های کلیدی
  // ==========================================
  const summaryRows: (string | number)[][] = [
    [`خلاصه شاخص‌های عملکردی ماه (${report.monthTitle})`, ""],
    [`تاریخ صدور گزارش: ${todayStr}`, ""],
    [], // خالی
    ["شاخص کلان", "مقدار"],
    ["ماه گزارش", report.monthTitle],
    ["مجموع کل ساعات جلسات", `${toPersianDigits(report.summary.totalHours)} ساعت (${toPersianDigits(report.summary.totalMinutes)} دقیقه)`],
    ["تعداد کل جلسات ماه", `${toPersianDigits(report.summary.totalSessions)} جلسه`],
    ["جلسات برگزارشده", `${toPersianDigits(report.summary.heldSessions)} جلسه`],
    ["جلسات برنامه‌ریزی‌شده", `${toPersianDigits(report.summary.scheduledSessions)} جلسه`],
    ["جلسات لغوشده", `${toPersianDigits(report.summary.canceledSessions)} جلسه`],
    [
      "میانگین کل حضور و غیاب",
      report.summary.overallAttendanceRate !== null
        ? `${toPersianDigits(report.summary.overallAttendanceRate)}٪`
        : "—",
    ],
    ["تعداد کلاس‌های فعال در این ماه", `${toPersianDigits(report.classSummaries.length)} کلاس`],
    [], // خالی
    ["--- تفکیک به ازای کلاس‌ها ---", ""],
    ["عنوان کلاس", "شاگردان", "جلسات کل", "برگزارشده", "مجموع ساعت", "میانگین حضور"],
  ]

  report.classSummaries.forEach((c) => {
    summaryRows.push([
      c.classTitle,
      c.totalStudents,
      c.sessionsCount,
      c.heldCount,
      `${c.totalHours} ساعت`,
      c.attendanceRate !== null ? `${c.attendanceRate}٪` : "—",
    ])
  })

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)

  // تنظیمات شیت خلاصه
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 13, c: 0 }, e: { r: 13, c: 5 } },
  ]

  wsSummary["!cols"] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ]

  wsSummary["!views"] = [{ RTL: true }]

  // استایل‌دهی ردیف‌های شیت خلاصه
  for (let c = 0; c < 6; c++) {
    const colLetter = XLSX.utils.encode_col(c)
    const c0 = wsSummary[`${colLetter}1`]
    if (c0) c0.s = bannerStyle
    const c1 = wsSummary[`${colLetter}2`]
    if (c1) c1.s = subBannerStyle
  }

  // هدر جدول شاخص‌ها
  if (wsSummary["A4"]) wsSummary["A4"].s = tableHeaderStyle
  if (wsSummary["B4"]) wsSummary["B4"].s = tableHeaderStyle

  // مقادیر شاخص‌ها (ردیف ۵ تا ۱۲)
  for (let r = 5; r <= 12; r++) {
    const isEven = r % 2 === 0
    const rowBg = isEven ? THEME.rowEvenBg : THEME.rowOddBg
    if (wsSummary[`A${r}`]) {
      wsSummary[`A${r}`].s = buildStyle({
        bold: true,
        fontSize: 9.5,
        bgColor: rowBg,
        align: "right",
      })
    }
    if (wsSummary[`B${r}`]) {
      wsSummary[`B${r}`].s = buildStyle({
        fontSize: 9.5,
        bgColor: rowBg,
        align: "center",
      })
    }
  }

  // هدر جدول تفکیک کلاس‌ها (ردیف ۱۵)
  for (let c = 0; c < 6; c++) {
    const colLetter = XLSX.utils.encode_col(c)
    const cell = wsSummary[`${colLetter}15`]
    if (cell) cell.s = tableHeaderStyle
  }

  // داده‌های تفکیک کلاس‌ها
  report.classSummaries.forEach((_, idx) => {
    const r = idx + 16
    const isEven = idx % 2 === 0
    const rowBg = isEven ? THEME.rowEvenBg : THEME.rowOddBg

    for (let c = 0; c < 6; c++) {
      const colLetter = XLSX.utils.encode_col(c)
      const cell = wsSummary[`${colLetter}${r}`]
      if (cell) {
        cell.s = buildStyle({
          fontSize: 9.5,
          bgColor: rowBg,
          align: c === 0 ? "right" : "center",
          bold: c === 0,
        })
      }
    }
  })

  // افزودن کاربرگ‌ها به ورک‌بوک
  XLSX.utils.book_append_sheet(wb, wsSessions, "جلسات")
  XLSX.utils.book_append_sheet(wb, wsSummary, "شاخص‌ها و کلاس‌ها")

  // تنظیمات کلی نمایش ورک‌بوک
  wb.Workbook = {
    Views: [{ RTL: true }],
  }

  return wb
}

export function exportToExcel(report: MonthReportData): void {
  const wb = buildExcelWorkbook(report)
  // نام‌گذاری فایل با فرمت درخواستی پرامپت: Klasyar-Report-YYYY-MM.xlsx
  const filename = `Klasyar-Report-${report.monthKey}.xlsx`
  XLSX.writeFile(wb, filename)
}
