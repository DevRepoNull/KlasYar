import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  FileType2,
  GraduationCap,
  Loader2,
  Percent,
  Search,
  Upload,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useClassDefinitions, useSessionsByMonth, useAttendanceByMonth } from "@/db/hooks"
import {
  buildMonthReportData,
  exportDatabaseBackup,
  exportToExcel,
  exportToPdf,
  exportToWord,
  importDatabaseBackup,
} from "@/lib/reports"
import {
  formatClock,
  formatDuration,
  formatJalaliMonthTitle,
  pad2,
  shiftJalaliMonth,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  colorClass?: string
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  colorClass = "text-primary bg-primary/10",
}: SummaryCardProps) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            colorClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-black tabular-nums">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const today = useMemo(() => todayJalali(), [])
  const [month, setMonth] = useState(() => ({
    year: today.year,
    month: today.month,
  }))
  const [searchQuery, setSearchQuery] = useState("")

  // وضعیت‌های بارگذاری هنگام تولید خروجی‌ها
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingWord, setExportingWord] = useState(false)
  const [exportingBackup, setExportingBackup] = useState(false)
  const [importingBackup, setImportingBackup] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const monthKey = `${month.year}-${pad2(month.month)}`
  const monthTitle = formatJalaliMonthTitle(month.year, month.month)

  // داده‌های زنده برای ماه انتخابی
  const classDefs = useClassDefinitions()
  const sessions = useSessionsByMonth(monthKey)
  const attendanceRecords = useAttendanceByMonth(monthKey)

  // کامپایل داده‌های گزارش
  const reportData = useMemo(() => {
    return buildMonthReportData(
      month.year,
      month.month,
      classDefs ?? [],
      sessions ?? [],
      attendanceRecords ?? [],
    )
  }, [month, classDefs, sessions, attendanceRecords])

  // فیلتر جلسات بر اساس جستجو
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return reportData.sessions
    const q = searchQuery.trim().toLowerCase()
    return reportData.sessions.filter(
      (s) =>
        s.classTitle.toLowerCase().includes(q) ||
        s.dateStr.includes(q) ||
        s.note.toLowerCase().includes(q),
    )
  }, [reportData.sessions, searchQuery])

  const goToMonth = (delta: number) => {
    setMonth((curr) => shiftJalaliMonth(curr.year, curr.month, delta))
  }

  const goToToday = () => {
    setMonth({ year: today.year, month: today.month })
  }

  // ۱. خروجی Excel
  const handleExportExcel = async () => {
    if (reportData.sessions.length === 0) {
      toast("جلسه‌ای در این ماه برای دریافت خروجی ثبت نشده است.", { icon: "ℹ️" })
    }
    setExportingExcel(true)
    try {
      exportToExcel(reportData)
      toast.success("فایل اکسل با موفقیت دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در ایجاد فایل اکسل.")
    } finally {
      setExportingExcel(false)
    }
  }

  // ۲. خروجی PDF
  const handleExportPdf = async () => {
    if (reportData.sessions.length === 0) {
      toast("جلسه‌ای در این ماه برای دریافت خروجی ثبت نشده است.", { icon: "ℹ️" })
    }
    setExportingPdf(true)
    try {
      await exportToPdf(reportData)
      toast.success("فایل PDF با موفقیت دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در ایجاد فایل PDF.")
    } finally {
      setExportingPdf(false)
    }
  }

  // ۳. خروجی Word
  const handleExportWord = async () => {
    if (reportData.sessions.length === 0) {
      toast("جلسه‌ای در این ماه برای دریافت خروجی ثبت نشده است.", { icon: "ℹ️" })
    }
    setExportingWord(true)
    try {
      await exportToWord(reportData)
      toast.success("فایل Word با موفقیت دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در ایجاد فایل Word.")
    } finally {
      setExportingWord(false)
    }
  }

  // ۴. پشتیبان‌گیری دیتابیس JSON
  const handleExportBackup = async () => {
    setExportingBackup(true)
    try {
      await exportDatabaseBackup()
      toast.success("فایل پشتیبان کامل دیتابیس دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در تهیه فایل پشتیبان.")
    } finally {
      setExportingBackup(false)
    }
  }

  // ۵. بازگردانی پشتیبان دیتابیس
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedBackupFile(file)
      setImportConfirmOpen(true)
    }
    e.target.value = ""
  }

  const handleConfirmImport = async () => {
    if (!selectedBackupFile) return
    setImportConfirmOpen(false)
    setImportingBackup(true)
    try {
      await importDatabaseBackup(selectedBackupFile)
      toast.success("پشتیبان دیتابیس با موفقیت بازگردانی شد.")
    } catch (e) {
      console.error(e)
      toast.error("فایل پشتیبان نامعتبر است.")
    } finally {
      setImportingBackup(false)
      setSelectedBackupFile(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* سربرگ و ناوبری ماه */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            گزارش‌ها و خروجی‌ها
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            گزارش ماهانه جلسات و حضور غیاب را مشاهده کنید و با فرمت‌های Excel، PDF، Word یا نسخه پشتیبان دیتابیس دریافت نمایید.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goToToday}>
            امروز
          </Button>
          <div
            className="flex items-center gap-0.5 rounded-xl border bg-card p-1 shadow-sm"
            role="group"
            aria-label="جابه‌جایی ماه"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="ماه قبل"
              onClick={() => goToMonth(-1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <span
              aria-live="polite"
              className="min-w-[7.5rem] px-1 text-center text-sm font-bold"
            >
              {monthTitle}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="ماه بعد"
              onClick={() => goToMonth(1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* پنل دکمه‌های خروجی با آیکون و انیمیشن hover */}
      <Card className="border-border/80 bg-card/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ArrowDownToLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold">خروجی‌های ماه {monthTitle}</p>
              <p className="text-[11px] text-muted-foreground">
                انتخاب قالب موردنظر برای گزارش این ماه
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* دکمه Excel */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportingExcel}
                onClick={handleExportExcel}
                className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
              >
                {exportingExcel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                )}
                <span>خروجی Excel</span>
              </Button>
            </motion.div>

            {/* دکمه PDF */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportingPdf}
                onClick={handleExportPdf}
                className="gap-2 border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-rose-600" />
                )}
                <span>خروجی PDF</span>
              </Button>
            </motion.div>

            {/* دکمه Word */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportingWord}
                onClick={handleExportWord}
                className="gap-2 border-sky-500/30 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
              >
                {exportingWord ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileType2 className="h-4 w-4 text-sky-600" />
                )}
                <span>خروجی Word</span>
              </Button>
            </motion.div>

            {/* دکمه پشتیبان کامل دیتابیس JSON */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={exportingBackup}
                onClick={handleExportBackup}
                className="gap-2"
                title="دانلود نسخه کامل پشتیبان از همه کلاس‌ها، جلسات و حضور و غیاب"
              >
                {exportingBackup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 text-primary" />
                )}
                <span>پشتیبان JSON</span>
              </Button>
            </motion.div>

            {/* دکمه بازگردانی دیتابیس */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={importingBackup}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="بارگذاری فایل پشتیبان قبلی"
            >
              {importingBackup ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>بازگردانی</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </Card>

      {/* کارت‌های خلاصه شاخص‌ها */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="جمع کل ساعت جلسات"
          value={formatDuration(reportData.summary.totalMinutes)}
          hint={monthTitle}
          colorClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          icon={BarChart3}
          label="تعداد کل جلسات ماه"
          value={`${toPersianDigits(reportData.summary.totalSessions)} جلسه`}
          hint={`${toPersianDigits(reportData.summary.heldSessions)} برگزارشده · ${toPersianDigits(reportData.summary.canceledSessions)} لغوشده`}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          icon={Percent}
          label="میانگین حضور و غیاب"
          value={
            reportData.summary.overallAttendanceRate !== null
              ? `${toPersianDigits(reportData.summary.overallAttendanceRate)}٪`
              : "—"
          }
          hint="درصد کل حاضرین ماه"
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          icon={GraduationCap}
          label="کلاس‌های فعال در این ماه"
          value={`${toPersianDigits(reportData.classSummaries.length)} کلاس`}
          hint="دارای جلسه در این ماه"
          colorClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </div>

      {/* جمع‌بندی به تفکیک کلاس */}
      {reportData.classSummaries.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-bold">جمع‌بندی به تفکیک کلاس‌ها</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reportData.classSummaries.map((c) => (
              <Card key={c.classId} className="border-border/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.classColor }}
                    />
                    <h3 className="font-bold text-sm">{c.classTitle}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {toPersianDigits(c.totalStudents)} شاگرد
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                  <div>
                    <p className="text-[11px] text-muted-foreground">جلسات</p>
                    <p className="font-bold tabular-nums">
                      {toPersianDigits(c.heldCount)} از {toPersianDigits(c.sessionsCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">مجموع ساعت</p>
                    <p className="font-bold tabular-nums">
                      {formatDuration(c.totalMinutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">میانگین حضور</p>
                    <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {c.attendanceRate !== null
                        ? `${toPersianDigits(c.attendanceRate)}٪`
                        : "—"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* جدول جلسات ماه */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">جدول جلسات ماه ({monthTitle})</h2>
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در جلسات ماه…"
              className="ps-9 h-9 text-xs"
            />
          </div>
        </div>

        <Card className="overflow-hidden border-border/80">
          {reportData.sessions.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-semibold">
                در {monthTitle} هیچ جلسه‌ای ثبت نشده است
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                می‌توانید از بخش تقویم یا جلسات برای این ماه جلسه ایجاد کنید.
              </p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-end text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="w-12 p-3 text-center font-bold">#</th>
                    <th className="min-w-[10rem] p-3 text-start font-bold">کلاس</th>
                    <th className="min-w-[7rem] p-3 text-center font-bold">تاریخ</th>
                    <th className="min-w-[6rem] p-3 text-center font-bold">روز</th>
                    <th className="min-w-[7.5rem] p-3 text-center font-bold">ساعت</th>
                    <th className="min-w-[5.5rem] p-3 text-center font-bold">مدت</th>
                    <th className="min-w-[6.5rem] p-3 text-center font-bold">وضعیت</th>
                    <th className="min-w-[8rem] p-3 text-center font-bold">حضور و غیاب</th>
                    <th className="min-w-[12rem] p-3 text-start font-bold">یادداشت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSessions.map((item, index) => {
                    const rateStr =
                      item.attendance.rate !== null
                        ? `${toPersianDigits(item.attendance.rate)}٪`
                        : "—"

                    return (
                      <tr
                        key={item.session.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="p-3 text-center font-medium text-muted-foreground tabular-nums">
                          {toPersianDigits(index + 1)}
                        </td>
                        <td className="p-3 font-semibold text-start">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.classColor }}
                            />
                            <span>{item.classTitle}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {item.dateStr}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {item.weekday}
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {formatClock(item.start)} تا {formatClock(item.end)}
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          {toPersianDigits(item.durationMinutes)} د
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium border",
                              item.status === "held"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                : item.status === "canceled"
                                ? "border-destructive/30 bg-destructive/10 text-destructive line-through"
                                : "border-primary/30 bg-primary/10 text-primary",
                            )}
                          >
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-center tabular-nums">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {toPersianDigits(
                              item.attendance.presentCount + item.attendance.lateCount,
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            /{toPersianDigits(item.attendance.totalStudents)} ({rateStr})
                          </span>
                        </td>
                        <td className="p-3 text-start text-muted-foreground">
                          {item.note || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* دیالوگ تأیید بازگردانی فایل پشتیبان دیتابیس */}
      <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأیید بازگردانی دیتابیس
            </DialogTitle>
            <DialogDescription>
              با بازگردانی فایل پشتیبان «{selectedBackupFile?.name}»، اطلاعات فعلی تمام کلاس‌ها، جلسات و حضور و غیاب با محتوای این فایل جایگزین خواهند شد.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive">
            هشدار: این عملیات برگشت‌پذیر نیست. اگر اطلاعات جاری ذخیره نشده است، ابتدا یک خروجی پشتیبان جدید بگیرید.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportConfirmOpen(false)
                setSelectedBackupFile(null)
              }}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmImport}
            >
              بله، بازگردانی شود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
