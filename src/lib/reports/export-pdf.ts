import html2pdf from "html2pdf.js"
import { formatJalaliFullDate, todayJalali, toPersianDigits } from "@/lib/jalali"
import type { MonthReportData } from "./types"

export async function exportToPdf(report: MonthReportData): Promise<void> {
  const container = document.createElement("div")
  container.id = "pdf-report-container"
  container.setAttribute("dir", "rtl")

  const todayStr = formatJalaliFullDate(todayJalali())

  // قالب HTML گزارش ماهانه با فونت وزیرمتن و طراحی شیک و تمیز
  container.innerHTML = `
    <style>
      @font-face {
        font-family: 'Vazirmatn';
        src: url('/fonts/Vazirmatn-Variable.woff2') format('woff2');
        font-weight: 100 900;
        font-style: normal;
      }
      #pdf-report-container {
        font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        direction: rtl;
        text-align: right;
        background: #ffffff;
        color: #1e293b;
        padding: 24px;
        box-sizing: border-box;
      }
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #0d9488;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .pdf-title {
        font-size: 20px;
        font-weight: 900;
        color: #0f766e;
        margin: 0 0 4px 0;
      }
      .pdf-subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 0;
      }
      .pdf-meta {
        font-size: 11px;
        color: #64748b;
        text-align: left;
      }
      .kpi-grid {
        display: flex;
        gap: 12px;
        margin-bottom: 18px;
      }
      .kpi-card {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 14px;
        background: #f8fafc;
      }
      .kpi-label {
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
      }
      .kpi-value {
        font-size: 16px;
        font-weight: 900;
        color: #0f172a;
      }
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
        margin-bottom: 16px;
      }
      .pdf-table th {
        background: #f1f5f9;
        color: #334155;
        font-weight: 700;
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
        text-align: center;
      }
      .pdf-table td {
        border: 1px solid #e2e8f0;
        padding: 6px 8px;
        text-align: center;
      }
      .pdf-table tr:nth-child(even) td {
        background: #fafafa;
      }
      .pdf-table td.text-start {
        text-align: right;
      }
      .status-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9.5px;
        font-weight: 600;
      }
      .status-held { background: #dcfce7; color: #166534; }
      .status-scheduled { background: #e0f2fe; color: #075985; }
      .status-canceled { background: #fee2e2; color: #991b1b; text-decoration: line-through; }
      .empty-box {
        text-align: center;
        padding: 30px;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        color: #64748b;
        font-size: 12px;
      }
      .pdf-footer {
        margin-top: 14px;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: #94a3b8;
      }
    </style>

    <div class="pdf-header">
      <div>
        <h1 class="pdf-title">کلاس‌یار · گزارش ماهانه جلسات</h1>
        <p class="pdf-subtitle">ماه: ${report.monthTitle}</p>
      </div>
      <div class="pdf-meta">
        <p style="margin:0 0 2px 0;"><strong>تاریخ صدور:</strong> ${todayStr}</p>
        <p style="margin:0;"><strong>تعداد جلسات:</strong> ${toPersianDigits(report.summary.totalSessions)} جلسه</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">مجموع ساعات جلسات</div>
        <div class="kpi-value">${toPersianDigits(report.summary.totalHours)} ساعت</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">جلسات برگزارشده</div>
        <div class="kpi-value">${toPersianDigits(report.summary.heldSessions)} از ${toPersianDigits(report.summary.totalSessions)} جلسه</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">میانگین کل حضور و غیاب</div>
        <div class="kpi-value">${report.summary.overallAttendanceRate !== null ? `${toPersianDigits(report.summary.overallAttendanceRate)}٪` : "—"}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">کلاس‌های فعال</div>
        <div class="kpi-value">${toPersianDigits(report.classSummaries.length)} کلاس</div>
      </div>
    </div>

    ${
      report.sessions.length === 0
        ? `<div class="empty-box">در ماه ${report.monthTitle} هیچ جلسه‌ای ثبت نشده است.</div>`
        : `
          <table class="pdf-table">
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 130px;" class="text-start">عنوان کلاس</th>
                <th style="width: 75px;">تاریخ</th>
                <th style="width: 60px;">روز</th>
                <th style="width: 80px;">ساعت</th>
                <th style="width: 60px;">مدت</th>
                <th style="width: 75px;">وضعیت</th>
                <th style="width: 70px;">حضور</th>
                <th class="text-start">یادداشت</th>
              </tr>
            </thead>
            <tbody>
              ${report.sessions
                .map((item, index) => {
                  const statusClass =
                    item.status === "held"
                      ? "status-held"
                      : item.status === "canceled"
                      ? "status-canceled"
                      : "status-scheduled"
                  const rateStr =
                    item.attendance.rate !== null
                      ? `${toPersianDigits(item.attendance.rate)}٪`
                      : "—"

                  return `
                    <tr>
                      <td>${toPersianDigits(index + 1)}</td>
                      <td class="text-start" style="font-weight: 700;">${item.classTitle}</td>
                      <td>${item.dateStr}</td>
                      <td>${item.weekday}</td>
                      <td dir="ltr">${toPersianDigits(item.start)} - ${toPersianDigits(item.end)}</td>
                      <td>${toPersianDigits(item.durationMinutes)} دقیقه</td>
                      <td><span class="status-badge ${statusClass}">${item.statusLabel}</span></td>
                      <td>${rateStr}</td>
                      <td class="text-start" style="color: #64748b;">${item.note || "—"}</td>
                    </tr>
                  `
                })
                .join("")}
            </tbody>
          </table>
        `
    }

    <div class="pdf-footer">
      <span>تولید شده توسط نرم‌افزار کلاس‌یار</span>
      <span>صفحه ۱ از ۱</span>
    </div>
  `

  document.body.appendChild(container)

  const opt = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename: `گزارش-کلاس‌یار-${report.monthKey}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
  }

  try {
    await html2pdf().set(opt).from(container).save()
  } finally {
    container.remove()
  }
}
