import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  FileType2,
  Filter,
  FilterX,
  GraduationCap,
  Loader2,
  Percent,
  RotateCcw,
  Search,
  Upload,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  JalaliDateRangePicker,
  type DateRangeValue,
} from "@/components/ui/jalali-date-picker"
import { useClassDefinitions, useSessionsByMonth, useAttendanceByMonth } from "@/db/hooks"
import {
  buildMonthReportData,
  calculateFilteredClassSummaries,
  calculateFilteredReportSummary,
  exportDatabaseBackup,
  exportToExcel,
  exportToPdf,
  exportToWord,
  filterReportSessions,
  importDatabaseBackup,
} from "@/lib/reports"
import type { ClassReportSummary, MonthReportData } from "@/lib/reports"
import {
  formatClock,
  formatDuration,
  formatJalaliMonthTitle,
  JALALI_MONTH_NAMES,
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
  colorClass = "text-primary bg-primary/10 border-primary/20",
}: SummaryCardProps) {
  return (
    <motion.div whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}>
      <Card className="border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-border hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-sm",
              colorClass,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-black tabular-nums tracking-tight mt-0.5">{value}</p>
            <p className="truncate text-[11px] text-muted-foreground mt-0.5">{hint}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ReportsPage() {
  const today = useMemo(() => todayJalali(), [])
  const [month, setMonth] = useState(() => ({
    year: today.year,
    month: today.month,
  }))

  // وضعیت‌های انتخاب مستقیم ماه و سال تقویم گزارشات
  const monthButtonRef = useRef<HTMLButtonElement>(null)
  const monthPickerRef = useRef<HTMLDivElement>(null)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerCoords, setPickerCoords] = useState<{ top: number; left: number } | null>(null)
  const [pickerYear, setPickerYear] = useState<number>(today.year)

  // وضعیت‌های فیلتر پیشرفته
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: "", to: "" })
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

  // کامپایل داده‌های خام گزارش برای کل ماه
  const reportData = useMemo(() => {
    return buildMonthReportData(
      month.year,
      month.month,
      classDefs ?? [],
      sessions ?? [],
      attendanceRecords ?? [],
    )
  }, [month, classDefs, sessions, attendanceRecords])

  // فیلتر کردن جلسات بر اساس کلاس، بازه تاریخ، و جستجوی متنی
  const filteredSessions = useMemo(() => {
    return filterReportSessions(reportData.sessions, {
      selectedClassId,
      dateRange,
      searchQuery,
    })
  }, [reportData.sessions, selectedClassId, dateRange, searchQuery])

  // محاسبه مجدد جمع‌بندی‌های خلاصه بر اساس داده‌های فیلتر شده
  const filteredSummary = useMemo(() => {
    return calculateFilteredReportSummary(filteredSessions)
  }, [filteredSessions])

  // جمع‌بندی به تفکیک کلاس بر اساس جلسات فیلترشده
  const filteredClassSummaries = useMemo<ClassReportSummary[]>(() => {
    return calculateFilteredClassSummaries(filteredSessions, classDefs ?? [])
  }, [filteredSessions, classDefs])

  // داده‌های نهایی برای گزارش و خروجی‌ها (منطبق با فیلترهای فعال)
  const effectiveReportData = useMemo<MonthReportData>(() => {
    return {
      ...reportData,
      sessions: filteredSessions,
      classSummaries: filteredClassSummaries,
      summary: filteredSummary,
    }
  }, [reportData, filteredSessions, filteredClassSummaries, filteredSummary])

  // بررسی وضعیت فیلترهای فعال
  const hasActiveFilters =
    selectedClassId !== "all" ||
    Boolean(dateRange.from) ||
    Boolean(dateRange.to) ||
    Boolean(searchQuery.trim())

  const activeFiltersCount =
    (selectedClassId !== "all" ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0)

  const selectedClassTitle = useMemo(() => {
    if (selectedClassId === "all") return "همه کلاس‌ها"
    return (
      (classDefs ?? []).find((c) => c.id === selectedClassId)?.title ??
      "کلاس انتخابی"
    )
  }, [selectedClassId, classDefs])

  // ریست کردن تمام فیلترها
  const handleClearAllFilters = () => {
    setSelectedClassId("all")
    setDateRange({ from: "", to: "" })
    setSearchQuery("")
    toast.success("تمام فیلترها بازنشانی شدند.")
  }

  const updatePickerCoords = () => {
    if (!monthButtonRef.current) return
    const rect = monthButtonRef.current.getBoundingClientRect()
    const width = 290
    const height = 290
    let top = rect.bottom + 6
    if (top + height > window.innerHeight && rect.top > height) {
      top = rect.top - height - 6
    }
    let left = rect.left + rect.width / 2 - width / 2
    if (left < 10) left = 10
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10
    }
    setPickerCoords({ top, left })
  }

  const toggleMonthPicker = () => {
    if (!isMonthPickerOpen) {
      setPickerYear(month.year)
      updatePickerCoords()
    }
    setIsMonthPickerOpen((prev) => !prev)
  }

  // بستن پاپ‌اور انتخاب ماه با کلیک خارج از آن
  useEffect(() => {
    if (!isMonthPickerOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        monthButtonRef.current?.contains(target) ||
        monthPickerRef.current?.contains(target)
      ) {
        return
      }
      setIsMonthPickerOpen(false)
    }
    const handleScrollOrResize = () => updatePickerCoords()

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("resize", handleScrollOrResize)
    window.addEventListener("scroll", handleScrollOrResize, true)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", handleScrollOrResize)
      window.removeEventListener("scroll", handleScrollOrResize, true)
    }
  }, [isMonthPickerOpen])

  const selectMonth = (monthIndex: number) => {
    setMonth({ year: pickerYear, month: monthIndex })
    setDateRange({ from: "", to: "" })
    setIsMonthPickerOpen(false)
  }

  const goToMonth = (delta: number) => {
    setMonth((curr) => shiftJalaliMonth(curr.year, curr.month, delta))
    // ریست بازه تاریخ با تغییر ماه جهت جلوگیری از ناهماهنگی
    setDateRange({ from: "", to: "" })
  }

  const goToToday = () => {
    setMonth({ year: today.year, month: today.month })
    setDateRange({ from: "", to: "" })
    setIsMonthPickerOpen(false)
  }

  // ۱. خروجی Excel با اعمال فیلترها
  const handleExportExcel = async () => {
    if (effectiveReportData.sessions.length === 0) {
      toast("جلسه‌ای با فیلترهای انتخابی برای دریافت خروجی یافت نشد.", { icon: "ℹ️" })
      return
    }
    setExportingExcel(true)
    try {
      exportToExcel(effectiveReportData)
      toast.success("فایل اکسل با موفقیت دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در ایجاد فایل اکسل.")
    } finally {
      setExportingExcel(false)
    }
  }

  // ۲. خروجی PDF با اعمال فیلترها
  const handleExportPdf = async () => {
    if (effectiveReportData.sessions.length === 0) {
      toast("جلسه‌ای با فیلترهای انتخابی برای دریافت خروجی یافت نشد.", { icon: "ℹ️" })
      return
    }
    setExportingPdf(true)
    try {
      await exportToPdf(effectiveReportData)
      toast.success("فایل PDF با موفقیت دانلود شد.")
    } catch (e) {
      console.error(e)
      toast.error("خطا در ایجاد فایل PDF.")
    } finally {
      setExportingPdf(false)
    }
  }

  // ۳. خروجی Word با اعمال فیلترها
  const handleExportWord = async () => {
    if (effectiveReportData.sessions.length === 0) {
      toast("جلسه‌ای با فیلترهای انتخابی برای دریافت خروجی یافت نشد.", { icon: "ℹ️" })
      return
    }
    setExportingWord(true)
    try {
      await exportToWord(effectiveReportData)
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
            گزارش ماهانه جلسات و حضور غیاب را مشاهده کنید، فیلترهای دلخواه اعمال کنید و با فرمت‌های Excel، PDF، Word یا نسخه پشتیبان دیتابیس دریافت نمایید.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="active:scale-95 transition-transform"
          >
            امروز
          </Button>
          <div
            className="flex items-center gap-0.5 rounded-xl border bg-card/80 p-0.5 sm:p-1 shadow-sm backdrop-blur-md"
            role="group"
            aria-label="جابه‌جایی ماه"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 active:scale-95"
              aria-label="ماه قبل"
              onClick={() => goToMonth(-1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <button
              ref={monthButtonRef}
              type="button"
              onClick={toggleMonthPicker}
              aria-haspopup="dialog"
              aria-expanded={isMonthPickerOpen}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold transition-all hover:bg-accent hover:text-foreground active:scale-95"
              title="انتخاب مستقیم ماه و سال"
            >
              <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>{monthTitle}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  isMonthPickerOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 active:scale-95"
              aria-label="ماه بعد"
              onClick={() => goToMonth(1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
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
              <p className="text-sm font-bold">
                خروجی‌های ماه {monthTitle}
                {hasActiveFilters && (
                  <span className="ms-2 text-xs font-normal text-primary">
                    ({toPersianDigits(filteredSessions.length)} جلسه فیلترشده)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {hasActiveFilters
                  ? "فایل‌های خروجی دقیقا بر اساس فیلترهای فعال بالا تولید خواهند شد"
                  : "انتخاب قالب موردنظر برای گزارش این ماه"}
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
                className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 active:scale-95"
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
                className="gap-2 border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300 active:scale-95"
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
                className="gap-2 border-sky-500/30 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300 active:scale-95"
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
                className="gap-2 active:scale-95"
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
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground active:scale-95"
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

      {/* بنر وضعیت فیلترها روی شاخص‌ها در صورت فعال بودن */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0" />
            <span>
              شاخص‌های جمع‌بندی بالا بر اساس <strong>{toPersianDigits(activeFiltersCount)} فیلتر فعال</strong> (
              {selectedClassId !== "all" && `کلاس: ${selectedClassTitle} `}
              {(dateRange.from || dateRange.to) && `بازه تاریخ: ${dateRange.from ? toPersianDigits(dateRange.from) : "ابتدا"} تا ${dateRange.to ? toPersianDigits(dateRange.to) : "انتها"} `}
              {searchQuery.trim() && `جستجو: «${searchQuery.trim()}»`}
              ) محاسبه شده‌اند.
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="h-7 text-xs text-primary hover:bg-primary/10 active:scale-95"
          >
            <RotateCcw className="h-3 w-3 me-1" />
            ریست فیلترها
          </Button>
        </div>
      )}

      {/* کارت‌های خلاصه شاخص‌ها با اسکرول افقی در موبایل و گرید ۴ ستونه در دسکتاپ */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
        <div className="min-w-[15rem] flex-1 snap-center sm:min-w-0">
          <SummaryCard
            icon={Clock3}
            label="جمع کل ساعت جلسات"
            value={formatDuration(filteredSummary.totalMinutes)}
            hint={hasActiveFilters ? "محاسبه بر اساس فیلتر" : monthTitle}
            colorClass="bg-primary/10 text-primary"
          />
        </div>
        <div className="min-w-[15rem] flex-1 snap-center sm:min-w-0">
          <SummaryCard
            icon={BarChart3}
            label="تعداد کل جلسات"
            value={`${toPersianDigits(filteredSummary.totalSessions)} جلسه`}
            hint={`${toPersianDigits(filteredSummary.heldSessions)} برگزارشده · ${toPersianDigits(filteredSummary.canceledSessions)} لغوشده`}
            colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="min-w-[15rem] flex-1 snap-center sm:min-w-0">
          <SummaryCard
            icon={Percent}
            label="میانگین حضور و غیاب"
            value={
              filteredSummary.overallAttendanceRate !== null
                ? `${toPersianDigits(filteredSummary.overallAttendanceRate)}٪`
                : "—"
            }
            hint={hasActiveFilters ? "درصد حاضرین فیلترشده" : "درصد کل حاضرین ماه"}
            colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>
        <div className="min-w-[15rem] flex-1 snap-center sm:min-w-0">
          <SummaryCard
            icon={GraduationCap}
            label="کلاس‌های فعال"
            value={`${toPersianDigits(filteredClassSummaries.length)} کلاس`}
            hint={hasActiveFilters ? "کلاس‌های مشمول فیلتر" : "دارای جلسه در این ماه"}
            colorClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
        </div>
      </div>

      {/* جمع‌بندی به تفکیک کلاس */}
      {filteredClassSummaries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              جمع‌بندی به تفکیک کلاس‌ها
              {hasActiveFilters && (
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  ({toPersianDigits(filteredClassSummaries.length)} کلاس نمایش‌داده‌شده)
                </span>
              )}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClassSummaries.map((c) => (
              <Card key={c.classId} className="border-border/70 p-4 transition-all duration-200 hover:shadow-sm">
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

      {/* بخش جدول جلسات ماه و فیلترهای پیشرفته */}
      <div className="space-y-4">
        {/* نوار فیلترهای پیشرفته بالای جدول گزارشات */}
        <Card className="border-border/80 bg-card/70 p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">فیلترهای پیشرفته جدول گزارشات</h2>
                  <p className="text-[11px] text-muted-foreground">
                    فیلتر بر اساس کلاس، بازه تاریخی شمسی و جستجوی متنی
                  </p>
                </div>
                {hasActiveFilters && (
                  <span className="ms-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {toPersianDigits(activeFiltersCount)} فیلتر فعال
                  </span>
                )}
              </div>

              {/* دکمه پاک کردن فیلترها */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive active:scale-95"
                  title="پاک کردن تمام فیلترها و نمایش همه جلسات ماه"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>پاک کردن فیلترها</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end">
              {/* فیلتر کلاس با Dropdown (Select) */}
              <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-4">
                <label className="flex h-4 items-center text-[11px] font-medium text-muted-foreground">
                  فیلتر بر اساس کلاس
                </label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-9 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="همه کلاس‌ها" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="font-medium">همه کلاس‌ها</span>
                    </SelectItem>
                    {(classDefs ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span>{c.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* فیلتر تاریخ با JalaliDatePicker (حالت انتخاب بازه - Range) */}
              <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-4">
                <label className="flex h-4 items-center text-[11px] font-medium text-muted-foreground">
                  فیلتر بازه تاریخ
                </label>
                <JalaliDateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  onClear={() => setDateRange({ from: "", to: "" })}
                  defaultYear={month.year}
                  defaultMonth={month.month}
                  placeholder="همه روزهای این ماه (یا انتخاب بازه)..."
                  className="w-full"
                />
              </div>

              {/* فیلتر جستجوی متنی */}
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                <label className="flex h-4 items-center text-[11px] font-medium text-muted-foreground">
                  جستجو در جلسات
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute start-3 top-2.5 h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در عنوان، روز یا یادداشت…"
                    className="h-9 ps-9 pe-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute end-2 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label="پاک کردن متن جستجو"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* چیپ‌های فیلترهای فعال و وضعیت تعداد جلسات */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-1.5">
                {hasActiveFilters ? (
                  <>
                    <span className="text-[11px] font-medium">فیلترهای فعال:</span>

                    {selectedClassId !== "all" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        <span>کلاس: {selectedClassTitle}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClassId("all")}
                          className="text-muted-foreground hover:text-foreground active:scale-95"
                          title="حذف فیلتر کلاس"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {(dateRange.from || dateRange.to) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        <span>
                          بازه: {dateRange.from ? toPersianDigits(dateRange.from) : "ابتدا"} تا{" "}
                          {dateRange.to ? toPersianDigits(dateRange.to) : "انتها"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDateRange({ from: "", to: "" })}
                          className="text-muted-foreground hover:text-foreground active:scale-95"
                          title="حذف فیلتر تاریخ"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {searchQuery.trim() && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        <span>جستجو: «{searchQuery.trim()}»</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-muted-foreground hover:text-foreground active:scale-95"
                          title="حذف متن جستجو"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    نمایش کامل تمام جلسات ماه {monthTitle}
                  </span>
                )}
              </div>

              <div className="text-[11px] font-medium text-foreground">
                {hasActiveFilters ? (
                  <span>
                    نمایش <strong className="font-bold text-primary">{toPersianDigits(filteredSessions.length)}</strong> جلسه از{" "}
                    {toPersianDigits(reportData.sessions.length)} جلسه
                  </span>
                ) : (
                  <span>
                    مجموع جلسات ماه: <strong className="font-bold">{toPersianDigits(reportData.sessions.length)}</strong> جلسه
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* جدول جلسات ماه */}
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
          ) : filteredSessions.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <FilterX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-semibold">
                هیچ جلسه‌ای با فیلترهای انتخابی یافت نشد
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                می‌توانید بازه تاریخ یا کلاس انتخابی را تغییر دهید یا تمام فیلترها را ریست کنید.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="mt-2 text-xs active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5 me-1.5" />
                پاک کردن فیلترها
              </Button>
            </CardContent>
          ) : (
            <>
              {/* حالت دسکتاپ و تبلت: جدول استاندارد با اسکرول افقی در صورت نیاز */}
              <div className="hidden md:block overflow-x-auto">
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
                                "inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold border whitespace-nowrap shadow-xs",
                                item.status === "held"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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

              {/* حالت موبایل: تبدیل ردیف‌های جدول به کارت‌های لیستی مدرن و لمسی */}
              <div className="block md:hidden divide-y divide-border/60">
                {filteredSessions.map((item, index) => {
                  const rateStr =
                    item.attendance.rate !== null
                      ? `${toPersianDigits(item.attendance.rate)}٪`
                      : "—"

                  return (
                    <div
                      key={item.session.id}
                      className="p-3.5 space-y-2.5 transition-colors hover:bg-muted/15"
                    >
                      {/* ردیف اول: نام کلاس، رنگ، شماره و برچسب وضعیت */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground tabular-nums">
                            {toPersianDigits(index + 1)}
                          </span>
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.classColor }}
                          />
                          <span className="font-bold text-xs truncate">
                            {item.classTitle}
                          </span>
                        </div>

                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-[11px] font-bold border shrink-0 whitespace-nowrap shadow-xs",
                            item.status === "held"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : item.status === "canceled"
                              ? "border-destructive/30 bg-destructive/10 text-destructive line-through"
                              : "border-primary/30 bg-primary/10 text-primary",
                          )}
                        >
                          {item.statusLabel}
                        </span>
                      </div>

                      {/* ردیف دوم: تاریخ، روز هفته، ساعت و مدت */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          <span className="tabular-nums font-medium text-foreground">
                            {item.dateStr}
                          </span>
                          <span>({item.weekday})</span>
                        </span>

                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatClock(item.start)} تا {formatClock(item.end)}</span>
                          <span className="text-muted-foreground/80">({toPersianDigits(item.durationMinutes)} دقیقه)</span>
                        </span>
                      </div>

                      {/* ردیف سوم: خلاصه حضور و غیاب */}
                      <div className="flex items-center justify-between rounded-xl bg-card/70 border border-border/60 px-3 py-2 text-[11px]">
                        <span className="text-muted-foreground font-medium">حضور و غیاب:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {toPersianDigits(
                              item.attendance.presentCount + item.attendance.lateCount,
                            )}{" "}
                            حاضر
                          </span>
                          <span className="text-muted-foreground">
                            از {toPersianDigits(item.attendance.totalStudents)} شاگرد
                          </span>
                          <span className="rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-bold text-primary tabular-nums">
                            {rateStr}
                          </span>
                        </div>
                      </div>

                      {/* ردیف چهارم: یادداشت جلسه (در صورت وجود) */}
                      {item.note ? (
                        <p className="text-[11px] leading-5 text-muted-foreground bg-muted/20 rounded-xl p-2.5 border border-border/40">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </>
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

      {/* پنجره انتخاب مستقیم ماه و سال شمسی گزارشات */}
      {typeof document !== "undefined" &&
        isMonthPickerOpen &&
        pickerCoords &&
        createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[120] bg-black/15 backdrop-blur-[1px]"
              aria-hidden="true"
              onClick={() => setIsMonthPickerOpen(false)}
            />
            <motion.div
              ref={monthPickerRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${pickerCoords.top}px`,
                left: `${pickerCoords.left}px`,
                width: "290px",
                zIndex: 130,
              }}
              dir="rtl"
              className="rounded-2xl border border-border/80 bg-popover p-3 text-popover-foreground shadow-2xl backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="انتخاب ماه و سال گزارش"
            >
              {/* انتخابگر سال */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setPickerYear((y) => y - 1)}
                  aria-label="سال قبل"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-sm font-black text-foreground">
                  سال {toPersianDigits(pickerYear)}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setPickerYear((y) => y + 1)}
                  aria-label="سال بعد"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* شبکه ۱۲ ماه شمسی */}
              <div className="grid grid-cols-3 gap-1.5">
                {JALALI_MONTH_NAMES.map((name, idx) => {
                  const monthNum = idx + 1
                  const isSelected =
                    month.year === pickerYear && month.month === monthNum
                  const isCurrentMonth =
                    today.year === pickerYear && today.month === monthNum

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => selectMonth(monthNum)}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-all active:scale-95",
                        isSelected
                          ? "bg-primary text-primary-foreground font-black shadow-sm"
                          : isCurrentMonth
                          ? "border border-primary/40 bg-primary/10 text-primary font-bold"
                          : "hover:bg-accent text-foreground/85",
                      )}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>

              {/* دکمه برو به امروز */}
              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    goToToday()
                    setIsMonthPickerOpen(false)
                  }}
                  className="h-7 text-xs text-primary font-bold px-2 active:scale-95"
                >
                  ماه جاری ({toPersianDigits(today.year)} {JALALI_MONTH_NAMES[today.month - 1]})
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMonthPickerOpen(false)}
                  className="h-7 text-xs text-muted-foreground px-2"
                >
                  بستن
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
