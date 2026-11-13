import html2pdf from "html2pdf.js"
import {
  formatClock,
  formatDuration,
  formatJalaliFullDate,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"
import type { MonthReportData } from "./types"

export async function exportToPdf(report: MonthReportData): Promise<void> {
  const container = document.createElement("div")
  container.id = "pdf-report-container"
  container.setAttribute("dir", "rtl")

  const todayStr = formatJalaliFullDate(todayJalali())

  // قالب استاندارد، تمیز و راست‌چین با فونت فارسی و سازگار با html2pdf.js
  container.innerHTML = `
    <style>
      @font-face {
        font-family: 'Vazirmatn';
        src: url('/fonts/Vazirmatn-Variable.woff2') format('woff2');
        font-weight: 100 900;
        font-style: normal;
      }
      #pdf-report-container {
        font-family: 'Vazirmatn', Tahoma, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        direction: rtl;
        text-align: right;
        background: #ffffff;
        color: #0f172a;
        padding: 24px;
        box-sizing: border-box;
        width: 100%;
        line-height: 1.6;
        letter-spacing: normal !important;
        word-spacing: normal !important;
      }
      #pdf-report-container * {
        letter-spacing: normal !important;
        word-spacing: normal !important;
        text-rendering: geometricPrecision;
      }
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #0d9488;
        padding-bottom: 14px;
        margin-bottom: 16px;
      }
      .brand-box {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .brand-logo {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #0f766e;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(15, 118, 110, 0.25);
      }
      .brand-title {
        font-size: 22px;
        font-weight: 900;
        color: #0f766e;
        margin: 0;
        letter-spacing: normal !important;
        word-spacing: normal !important;
        font-feature-settings: "liga" 1, "calt" 1;
      }
      .brand-subtitle {
        font-size: 11px;
        color: #64748b;
        margin: 2px 0 0 0;
      }
      .pdf-meta-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 11px;
        color: #475569;
        text-align: left;
        line-height: 1.6;
      }
      .kpi-grid {
        display: flex;
        gap: 12px;
        margin-bottom: 18px;
      }
      .kpi-card {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 12px;
        background: #f8fafc;
      }
      .kpi-label {
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
        font-weight: 500;
      }
      .kpi-value {
        font-size: 16px;
        font-weight: 900;
        color: #0f172a;
      }
      .kpi-hint {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        margin-bottom: 16px;
      }
      .pdf-table th {
        background: #0f766e;
        color: #ffffff;
        font-weight: 700;
        border: 1px solid #0d9488;
        padding: 8px 6px;
        text-align: center;
      }
      .pdf-table td {
        border: 1px solid #e2e8f0;
        padding: 7px 6px;
        text-align: center;
        vertical-align: middle;
      }
      /* راه‌راه بودن سطرهای جدول (Zebra Striping) */
      .pdf-table tr:nth-child(even) td {
        background: #f8fafc;
      }
      .pdf-table tr:nth-child(odd) td {
        background: #ffffff;
      }
      .pdf-table td.text-start {
        text-align: right;
      }
      .class-title-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
      }
      .class-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }
      .status-badge {
        display: inline-block;
        vertical-align: middle;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 9px;
        font-weight: 700;
        line-height: 1.4 !important;
        white-space: nowrap;
        border: 1px solid transparent;
        box-sizing: border-box;
      }
      .status-held {
        background: #dcfce7;
        color: #166534;
        border-color: #bbf7d0;
      }
      .status-scheduled {
        background: #e0f2fe;
        color: #075985;
        border-color: #bae6fd;
      }
      .status-canceled {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
        text-decoration: line-through;
      }
      .empty-box {
        text-align: center;
        padding: 36px 20px;
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        color: #64748b;
        font-size: 13px;
        background: #f8fafc;
      }
      .pdf-footer {
        margin-top: 14px;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9.5px;
        color: #94a3b8;
      }
    </style>

    <!-- سربرگ گزارش با لوگوی کلاس‌یار و متاداده -->
    <div class="pdf-header">
      <div class="brand-box">
        <div class="brand-logo">
          <!-- آیکون وکتوری کلاه فارغ‌التحصیلی کلاس‌یار -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div>
          <h1 class="brand-title">کلاس‌یار</h1>
          <p class="brand-subtitle">سامانه هوشمند مدیریت کلاس، جلسات آموزشی و حضور و غیاب</p>
        </div>
      </div>

      <div class="pdf-meta-box">
        <div><strong>گزارش ماه:</strong> ${report.monthTitle}</div>
        <div><strong>تاریخ صدور:</strong> ${todayStr}</div>
        <div><strong>تعداد جلسات گزارش:</strong> ${toPersianDigits(report.summary.totalSessions)} جلسه</div>
      </div>
    </div>

    <!-- کارت‌های خلاصه شاخص‌های کلیدی -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">مجموع کل ساعت جلسات</div>
        <div class="kpi-value">${toPersianDigits(report.summary.totalHours)} ساعت</div>
        <div class="kpi-hint">${toPersianDigits(report.summary.totalMinutes)} دقیقه آموزش</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">جلسات برگزارشده</div>
        <div class="kpi-value">${toPersianDigits(report.summary.heldSessions)} از ${toPersianDigits(report.summary.totalSessions)} جلسه</div>
        <div class="kpi-hint">${toPersianDigits(report.summary.canceledSessions)} جلسه لغوشده</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">میانگین کل حضور و غیاب</div>
        <div class="kpi-value" style="color: #0d9488;">
          ${report.summary.overallAttendanceRate !== null ? `${toPersianDigits(report.summary.overallAttendanceRate)}٪` : "—"}
        </div>
        <div class="kpi-hint">درصد حضور کل شاگردان</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">کلاس‌های فعال</div>
        <div class="kpi-value">${toPersianDigits(report.classSummaries.length)} کلاس</div>
        <div class="kpi-hint">دارای جلسه در این دوره</div>
      </div>
    </div>

    <!-- جدول جلسات ماه -->
    ${
      report.sessions.length === 0
        ? `<div class="empty-box">در دوره انتخابی (${report.monthTitle}) هیچ جلسه‌ای ثبت نشده است.</div>`
        : `
          <table class="pdf-table">
            <thead>
              <tr>
                <th style="width: 28px;">#</th>
                <th style="width: 135px;" class="text-start">عنوان کلاس</th>
                <th style="width: 75px;">تاریخ</th>
                <th style="width: 50px;">روز</th>
                <th style="width: 85px;">ساعت</th>
                <th style="width: 55px;">مدت</th>
                <th style="width: 95px;">وضعیت</th>
                <th style="width: 70px;">حضور و غیاب</th>
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
                  const presentCount =
                    item.attendance.presentCount + item.attendance.lateCount

                  return `
                    <tr>
                      <td style="font-weight: 500; color: #64748b;">${toPersianDigits(index + 1)}</td>
                      <td class="text-start">
                        <div class="class-title-cell">
                          <span class="class-dot" style="background-color: ${item.classColor};"></span>
                          <span>${item.classTitle}</span>
                        </div>
                      </td>
                      <td style="font-family: monospace, Tahoma; font-size: 9.5px;">${toPersianDigits(item.dateStr)}</td>
                      <td>${item.weekday}</td>
                      <td dir="ltr" style="font-family: monospace, Tahoma; font-size: 9px;">${formatClock(item.start)} - ${formatClock(item.end)}</td>
                      <td>${formatDuration(item.durationMinutes)}</td>
                      <td><span class="status-badge ${statusClass}">${item.statusLabel}</span></td>
                      <td>
                        <strong>${toPersianDigits(presentCount)}</strong>/${toPersianDigits(item.attendance.totalStudents)}
                        <span style="color: #64748b; font-size: 8.5px;">(${rateStr})</span>
                      </td>
                      <td class="text-start" style="color: #64748b;">${item.note || "—"}</td>
                    </tr>
                  `
                })
                .join("")}
            </tbody>
          </table>
        `
    }

    <!-- پاورقی استاندارد -->
    <div class="pdf-footer">
      <span>تولید شده توسط نرم‌افزار مدیریت آموزش «کلاس‌یار»</span>
      <span>KlasYar Offline Classroom Assistant</span>
    </div>
  `

  document.body.appendChild(container)

  // اطمینان از بارگذاری کامل فونت‌های سند قبل از ایجاد تصویر
  if ("fonts" in document) {
    try {
      await document.fonts.ready
    } catch {}
  }

  // نام‌گذاری فایل با فرمت درخواستی پرامپت: Klasyar-Report-YYYY-MM.pdf
  const filename = `Klasyar-Report-${report.monthKey}.pdf`

  const opt = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
  }

  try {
    await html2pdf().set(opt).from(container).save()
  } finally {
    container.remove()
  }
}
