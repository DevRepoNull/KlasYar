import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Award,
  CalendarCheck2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Minus,
  Percent,
  Plus,
  Search,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import {
  ATTENDANCE_CONFIGS,
  getNextAttendanceStatus,
  type ExtendedAttendanceStatus,
} from "@/components/attendance/attendance-constants"
import { AttendanceMatrix } from "@/components/attendance/attendance-matrix"
import { SessionAttendanceDialog } from "@/components/attendance/session-attendance-dialog"
import { SessionFormDialog } from "@/components/sessions/session-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClassDefinitions, useClassMonthlyAttendance } from "@/db/hooks"
import {
  deleteAttendanceBySessionAndStudent,
  upsertAttendance,
} from "@/db/attendance"
import { getDatabaseErrorMessage } from "@/db/errors"
import type { AttendanceStatus, Session } from "@/db/schema"
import {
  formatJalaliMonthTitle,
  jalaliDateToString,
  shiftJalaliMonth,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"
import { calculateAttendancePercentage } from "@/lib/pure-logic"
import { cn } from "@/lib/utils"

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

export default function AttendancePage() {
  const definitions = useClassDefinitions()
  const today = useMemo(() => todayJalali(), [])
  const todayStr = useMemo(() => jalaliDateToString(today), [today])

  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [month, setMonth] = useState(() => ({
    year: today.year,
    month: today.month,
  }))
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingCell, setUpdatingCell] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // دیالوگ حضور کامل یک جلسه
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  // دیالوگ ایجاد جلسه جدید در این کلاس
  const [createSessionOpen, setCreateSessionOpen] = useState(false)

  // تنظیم کلاس پیش‌فرض در صورت تعریف کلاس‌ها
  const effectiveClassId = useMemo(() => {
    if (selectedClassId) return selectedClassId
    return definitions?.[0]?.id ?? ""
  }, [selectedClassId, definitions])

  // داده‌های زنده ماهانه کلاس (جلسات و رکوردهای حضور)
  const monthlyData = useClassMonthlyAttendance(
    effectiveClassId,
    month.year,
    month.month,
  )

  const definition = monthlyData?.definition
  const sessions = useMemo(
    () => (Array.isArray(monthlyData?.sessions) ? monthlyData.sessions : []),
    [monthlyData?.sessions],
  )
  const attendanceRecords = useMemo(
    () => (Array.isArray(monthlyData?.attendance) ? monthlyData.attendance : []),
    [monthlyData?.attendance],
  )

  const monthTitle = formatJalaliMonthTitle(month.year, month.month)

  // فهرست تضمین‌شده دانش‌آموزان کلاس
  const allStudents = useMemo(() => {
    return Array.isArray(definition?.students) ? definition.students : []
  }, [definition?.students])

  // نقشه دسترسی سریع به وضعیت حضور بر اساس `sessionId_studentId`
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    for (const record of attendanceRecords) {
      if (record && record.sessionId && record.studentId) {
        map.set(`${record.sessionId}_${record.studentId}`, record.status)
      }
    }
    return map
  }, [attendanceRecords])

  // فیلتر کردن دانش‌آموزان با جستجو
  const students = useMemo(() => {
    if (!searchQuery.trim()) return allStudents
    const q = searchQuery.trim().toLowerCase()
    return allStudents.filter((s) => (s?.name ?? "").toLowerCase().includes(q))
  }, [allStudents, searchQuery])

  // آمار حضور به تفکیک هر دانش‌آموز در این ماه
  // نکته مهم لبه: جلساتی که هنوز رکوردی برای دانش‌آموز ثبت نشده «ثبت‌نشده» هستند و نباید غیبت به حساب آیند.
  const studentStats = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        present: number
        late: number
        excused: number
        absent: number
        unrecorded: number
        recordedTotal: number
        rate: number | null
      }
    >()

    for (const student of allStudents) {
      if (!student || !student.id) continue
      let present = 0
      let late = 0
      let excused = 0
      let absent = 0
      let unrecorded = 0

      for (const session of sessions) {
        if (!session || !session.id) continue
        const status = attendanceMap.get(`${session.id}_${student.id}`)
        if (status === "present") present++
        else if (status === "late") late++
        else if (status === "excused") excused++
        else if (status === "absent") absent++
        else unrecorded++
      }

      const recordedTotal = present + late + excused + absent
      const rate = calculateAttendancePercentage(present, late, excused, absent)

      statsMap.set(student.id, {
        present,
        late,
        excused,
        absent,
        unrecorded,
        recordedTotal,
        rate,
      })
    }

    return statsMap
  }, [allStudents, sessions, attendanceMap])

  // آمار کل ماه کلاس برای کارت‌های بالا
  const overallStats = useMemo(() => {
    let totalPresent = 0
    let totalEvaluated = 0
    let perfectStudents = 0
    let atRiskStudents = 0

    studentStats.forEach((stat) => {
      totalPresent += stat.present + stat.late
      totalEvaluated += stat.recordedTotal
      if (stat.rate !== null && stat.rate >= 95) perfectStudents++
      if (stat.rate !== null && stat.rate < 60) atRiskStudents++
    })

    const overallRate =
      totalEvaluated > 0
        ? Math.round((totalPresent / totalEvaluated) * 100)
        : null

    return {
      overallRate,
      sessionsCount: sessions.length,
      studentsCount: allStudents.length,
      perfectStudents,
      atRiskStudents,
    }
  }, [studentStats, sessions.length, allStudents.length])

  // جابه‌جایی ماه
  const goToMonth = (delta: number) => {
    setMonth((curr) => shiftJalaliMonth(curr.year, curr.month, delta))
  }

  const goToToday = () => {
    setMonth({ year: today.year, month: today.month })
  }

  // تغییر وضعیت یک خانه ماتریس با کلیک (چرخش وضعیت + ذخیره خودکار در IndexedDB)
  const handleCellClick = async (sessionId: string, studentId: string) => {
    if (!sessionId || !studentId) return
    const cellKey = `${sessionId}_${studentId}`
    setUpdatingCell(cellKey)
    setError(null)

    const rawStatus = attendanceMap.get(cellKey)
    const currentStatus: ExtendedAttendanceStatus =
      rawStatus && rawStatus in ATTENDANCE_CONFIGS
        ? (rawStatus as ExtendedAttendanceStatus)
        : "unrecorded"
    const nextStatus = getNextAttendanceStatus(currentStatus)

    try {
      if (nextStatus === "unrecorded") {
        await deleteAttendanceBySessionAndStudent(sessionId, studentId)
      } else {
        await upsertAttendance(sessionId, studentId, nextStatus)
      }
    } catch (err) {
      setError(getDatabaseErrorMessage(err))
    } finally {
      setUpdatingCell(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* سربرگ و فیلترهای اصلی */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            حضور و غیاب
          </h1>
          <p className="max-w-xl text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
            ماتریس ماهانه شاگرد × جلسه؛ با کلیک روی هر خانه وضعیت به صورت خودکار تغییر کرده و ذخیره می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* انتخاب کلاس */}
          <Select
            value={effectiveClassId}
            onValueChange={setSelectedClassId}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[16.5rem] h-9 text-xs" aria-label="انتخاب کلاس">
              <SelectValue placeholder="انتخاب کلاس" />
            </SelectTrigger>
            <SelectContent>
              {(definitions ?? []).map((def) => (
                <SelectItem key={def.id} value={def.id}>
                  <span className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                    <span className="truncate max-w-[12rem]">{def.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                      ({toPersianDigits(def.students?.length ?? 0)}&nbsp;شاگرد)
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* تغییر ماه شمسی */}
          <Button type="button" variant="outline" size="sm" onClick={goToToday} className="h-9 text-xs active:scale-95 px-2.5">
            امروز
          </Button>
          <div
            className="flex items-center gap-0.5 rounded-xl border bg-card p-0.5 sm:p-1 shadow-sm"
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
            <span
              aria-live="polite"
              className="min-w-[6.5rem] sm:min-w-[7.5rem] px-1 text-center text-xs sm:text-sm font-bold"
            >
              {monthTitle}
            </span>
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

      {/* خطای احتمالی */}
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs leading-5 text-destructive"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      {/* اگر هیچ کلاسی وجود ندارد */}
      {definitions !== undefined && definitions.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background text-muted-foreground ring-1 ring-border">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-base font-bold">هنوز هیچ کلاسی تعریف نشده است</p>
            <p className="max-w-sm text-xs leading-6 text-muted-foreground">
              برای ثبت و مشاهده حضور و غیاب، ابتدا باید از بخش «کلاس‌ها» حداقل یک کلاس همراه با فهرست دانش‌آموزان بسازید.
            </p>
            <Button
              type="button"
              onClick={() => {
                window.location.href = "/classes"
              }}
              className="mt-2 gap-2 glow-effect"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              تعریف کلاس جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* کارت‌های خلاصه آمار بالای صفحه: اسکرول افقی در موبایل و گرید ۴ ستونه در دسکتاپ */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            <div className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0">
              <SummaryCard
                icon={Percent}
                label="میانگین حضور کلاس"
                value={
                  overallStats.overallRate === null
                    ? "—"
                    : `${toPersianDigits(overallStats.overallRate)}٪`
                }
                hint={monthTitle}
                colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0">
              <SummaryCard
                icon={CalendarClock}
                label="جلسات این ماه"
                value={`${toPersianDigits(overallStats.sessionsCount)} جلسه`}
                hint={definition?.title ?? "کلاس"}
                colorClass="bg-primary/10 text-primary"
              />
            </div>
            <div className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0">
              <SummaryCard
                icon={Award}
                label="حضور ممتاز (≥۹۵٪)"
                value={`${toPersianDigits(overallStats.perfectStudents)} شاگرد`}
                hint="بدون غیبت غیرموجه"
                colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0">
              <SummaryCard
                icon={Users}
                label="تعداد دانش‌آموزان"
                value={`${toPersianDigits(overallStats.studentsCount)} نفر`}
                hint={`${toPersianDigits(overallStats.atRiskStudents)} نفر نیاز به پیگیری`}
                colorClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
              />
            </div>
          </div>

          {/* راهنمای آیکون‌ها و جستجو */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground me-1 font-medium">راهنما:</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="h-3 w-3" /> حاضر
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                <Clock3 className="h-3 w-3" /> تأخیر
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-700 dark:text-sky-300">
                <CalendarCheck2 className="h-3 w-3" /> مرخصی
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300">
                <X className="h-3 w-3" /> غایب
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/80 bg-muted/40 px-2 py-0.5 text-muted-foreground">
                <Minus className="h-3 w-3" /> ثبت‌نشده
              </span>
            </div>

            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی شاگرد…"
                className="ps-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* ماتریس شاگرد × جلسه با ErrorBoundary */}
          <ErrorBoundary sectionName="ماتریس حضور و غیاب">
            <AttendanceMatrix
              definition={definition}
              sessions={sessions}
              students={students}
              attendanceMap={attendanceMap}
              studentStats={studentStats}
              updatingCell={updatingCell}
              onCellClick={handleCellClick}
              onOpenSessionAttendance={(session) => setActiveSession(session)}
              onOpenCreateSession={() => setCreateSessionOpen(true)}
              monthTitle={monthTitle}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          </ErrorBoundary>
        </>
      )}

      {/* دیالوگ حضور کامل برای یک جلسه */}
      {activeSession ? (
        <SessionAttendanceDialog
          session={activeSession}
          definition={definition}
          onClose={() => setActiveSession(null)}
        />
      ) : null}

      {/* دیالوگ ساخت جلسه جدید */}
      <SessionFormDialog
        open={createSessionOpen}
        session={null}
        initialDefinitionId={effectiveClassId}
        initialDate={todayStr}
        definitions={definitions ?? []}
        onClose={() => setCreateSessionOpen(false)}
      />
    </div>
  )
}
