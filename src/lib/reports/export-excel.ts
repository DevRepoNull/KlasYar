import * as XLSX from "xlsx"
import type { MonthReportData } from "./types"

export function exportToExcel(report: MonthReportData): void {
  const wb = XLSX.utils.book_new()

  // شیت ۱: لیست کامل جلسات ماه
  const sessionsRows = report.sessions.map((item, index) => ({
    "ردیف": index + 1,
    "عنوان کلاس": item.classTitle,
    "تاریخ": item.dateStr,
    "روز هفته": item.weekday,
    "ساعت شروع": item.start,
    "ساعت پایان": item.end,
    "مدت (دقیقه)": item.durationMinutes,
    "مدت (ساعت)": item.durationHours,
    "وضعیت جلسه": item.statusLabel,
    "شاگردان حاضر": item.attendance.presentCount + item.attendance.lateCount,
    "کل شاگردان": item.attendance.totalStudents,
    "درصد حضور": item.attendance.rate !== null ? `${item.attendance.rate}٪` : "—",
    "یادداشت": item.note || "—",
  }))

  const wsSessions =
    sessionsRows.length > 0
      ? XLSX.utils.json_to_sheet(sessionsRows)
      : XLSX.utils.json_to_sheet([
          { "پیام": "در این ماه هیچ جلسه‌ای ثبت نشده است." },
        ])

  wsSessions["!views"] = [{ RTL: true }]
  wsSessions["!cols"] = [
    { wch: 6 },  // ردیف
    { wch: 20 }, // عنوان کلاس
    { wch: 12 }, // تاریخ
    { wch: 10 }, // روز هفته
    { wch: 10 }, // شروع
    { wch: 10 }, // پایان
    { wch: 12 }, // مدت دقیقه
    { wch: 12 }, // مدت ساعت
    { wch: 14 }, // وضعیت
    { wch: 14 }, // حاضرین
    { wch: 12 }, // کل شاگردان
    { wch: 12 }, // درصد حضور
    { wch: 28 }, // یادداشت
  ]

  // شیت ۲: خلاصه شاخص‌ها و تفکیک به ازای هر کلاس
  const summaryKpiRows = [
    { "شاخص کلان": "ماه گزارش", "مقدار": report.monthTitle },
    { "شاخص کلان": "مجموع کل ساعات جلسات", "مقدار": `${report.summary.totalHours} ساعت` },
    { "شاخص کلان": "تعداد کل جلسات ماه", "مقدار": report.summary.totalSessions },
    { "شاخص کلان": "جلسات برگزارشده", "مقدار": report.summary.heldSessions },
    { "شاخص کلان": "جلسات برنامه‌ریزی‌شده", "مقدار": report.summary.scheduledSessions },
    { "شاخص کلان": "جلسات لغوشده", "مقدار": report.summary.canceledSessions },
    {
      "شاخص کلان": "میانگین کل حضور و غیاب",
      "مقدار":
        report.summary.overallAttendanceRate !== null
          ? `${report.summary.overallAttendanceRate}٪`
          : "—",
    },
    { "شاخص کلان": "", "مقدار": "" }, // ردیف خالی جداکننده
  ]

  const classSummaryRows = report.classSummaries.map((c) => ({
    "شاخص کلان": `کلاس: ${c.classTitle}`,
    "مقدار": `${c.totalHours} ساعت (${c.heldCount} برگزارشده از ${c.sessionsCount} جلسه) · حضور: ${
      c.attendanceRate !== null ? `${c.attendanceRate}٪` : "—"
    }`,
  }))

  const wsSummary = XLSX.utils.json_to_sheet([
    ...summaryKpiRows,
    { "شاخص کلان": "--- تفکیک به ازای کلاس‌ها ---", "مقدار": "--- جزئیات ---" },
    ...classSummaryRows,
  ])

  wsSummary["!views"] = [{ RTL: true }]
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 35 }]

  XLSX.utils.book_append_sheet(wb, wsSessions, "جلسات")
  XLSX.utils.book_append_sheet(wb, wsSummary, "خلاصه ماهانه")

  XLSX.writeFile(wb, `گزارش-کلاس‌یار-${report.monthKey}.xlsx`)
}
