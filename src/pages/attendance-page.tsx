import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Award,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
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
import { SessionAttendanceDialog } from "@/components/attendance/session-attendance-dialog"
import { SessionFormDialog } from "@/components/sessions/session-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { SESSION_STATUS_LABELS } from "@/db/schema"
import {
  formatClock,
  formatJalaliMonthTitle,
  formatJalaliShortDate,
  jalaliDateToString,
  parseJalaliDate,
  shiftJalaliMonth,
  todayJalali,
  toPersianDigits,
  weekdayName,
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

function getRateBadgeClass(rate: number | null): string {
  if (rate === null) return "border-border/60 bg-muted/40 text-muted-foreground"
  if (rate >= 85)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (rate >= 70)
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
  if (rate >= 50)
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
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
  const sessions = monthlyData?.sessions ?? []
  const attendanceRecords = monthlyData?.attendance ?? []

  const monthTitle = formatJalaliMonthTitle(month.year, month.month)

  // نقشه دسترسی سریع به وضعیت حضور بر اساس `sessionId_studentId`
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    for (const record of attendanceRecords) {
      map.set(`${record.sessionId}_${record.studentId}`, record.status)
    }
    return map
  }, [attendanceRecords])

  // فیلتر کردن دانش‌آموزان با جستجو
  const students = useMemo(() => {
    const list = definition?.students ?? []
    if (!searchQuery.trim()) return list
    const q = searchQuery.trim().toLowerCase()
    return list.filter((s) => s.name.toLowerCase().includes(q))
  }, [definition, searchQuery])

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

    const allStudents = definition?.students ?? []
    for (const student of allStudents) {
      let present = 0
      let late = 0
      let excused = 0
      let absent = 0
      let unrecorded = 0

      for (const session of sessions) {
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
  }, [definition, sessions, attendanceMap])

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
      studentsCount: definition?.students.length ?? 0,
      perfectStudents,
      atRiskStudents,
    }
  }, [studentStats, sessions, definition])

  // جابه‌جایی ماه
  const goToMonth = (delta: number) => {
    setMonth((curr) => shiftJalaliMonth(curr.year, curr.month, delta))
  }

  const goToToday = () => {
    setMonth({ year: today.year, month: today.month })
  }

  // تغییر وضعیت یک خانه ماتریس با کلیک (چرخش وضعیت + ذخیره خودکار در IndexedDB)
  const handleCellClick = async (sessionId: string, studentId: string) => {
    const cellKey = `${sessionId}_${studentId}`
    setUpdatingCell(cellKey)
    setError(null)

    const currentStatus: ExtendedAttendanceStatus =
      attendanceMap.get(cellKey) ?? "unrecorded"
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            حضور و غیاب
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            ماتریس ماهانه شاگرد × جلسه؛ با کلیک روی هر خانه وضعیت به صورت خودکار تغییر کرده و ذخیره می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* انتخاب کلاس */}
          <Select
            value={effectiveClassId}
            onValueChange={setSelectedClassId}
          >
            <SelectTrigger className="w-48 sm:w-56" aria-label="انتخاب کلاس">
              <SelectValue placeholder="انتخاب کلاس" />
            </SelectTrigger>
            <SelectContent>
              {(definitions ?? []).map((def) => (
                <SelectItem key={def.id} value={def.id}>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                    <span>{def.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({toPersianDigits(def.students.length)} شاگرد)
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* تغییر ماه شمسی */}
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
              className="mt-2 gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              تعریف کلاس جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* کارت‌های خلاصه آمار بالای صفحه */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <SummaryCard
              icon={CalendarClock}
              label="جلسات این ماه"
              value={`${toPersianDigits(overallStats.sessionsCount)} جلسه`}
              hint={definition?.title ?? "کلاس"}
              colorClass="bg-primary/10 text-primary"
            />
            <SummaryCard
              icon={Award}
              label="حضور ممتاز (≥۹۵٪)"
              value={`${toPersianDigits(overallStats.perfectStudents)} شاگرد`}
              hint="بدون غیبت غیرموجه"
              colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              icon={Users}
              label="تعداد دانش‌آموزان"
              value={`${toPersianDigits(overallStats.studentsCount)} نفر`}
              hint={`${toPersianDigits(overallStats.atRiskStudents)} نفر نیاز به پیگیری`}
              colorClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            />
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

          {/* ماتریس شاگرد × جلسه */}
          <Card className="overflow-hidden border-border/80">
            {definition && definition.students.length === 0 ? (
              <CardContent className="py-14 text-center">
                <p className="text-sm font-semibold">این کلاس هیچ شاگردی ندارد</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  برای شروع حضور و غیاب ابتدا در ویرایش کلاس، نام شاگردان را وارد کنید.
                </p>
              </CardContent>
            ) : sessions.length === 0 ? (
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold">
                  در {monthTitle} جلسه‌ای برای «{definition?.title}» ثبت نشده است
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  می‌توانید برای این ماه جلسه جدیدی ثبت کنید تا ماتریس حضور نمایش داده شود.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateSessionOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  ثبت جلسه در این ماه
                </Button>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-end text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground">
                      <th className="sticky start-0 z-10 w-12 bg-muted/90 p-3 text-center font-bold backdrop-blur-sm">
                        #
                      </th>
                      <th className="sticky start-12 z-10 min-w-[10rem] bg-muted/90 p-3 text-start font-bold backdrop-blur-sm">
                        نام شاگرد
                      </th>
                      <th className="min-w-[6.5rem] p-3 text-center font-bold">
                        درصد حضور
                      </th>
                      <th className="min-w-[6rem] p-3 text-center font-bold">
                        خلاصه ماه
                      </th>

                      {/* ستون‌های جلسات */}
                      {sessions.map((session) => {
                        const parsedDate = parseJalaliDate(session.date)
                        const shortDate = formatJalaliShortDate(parsedDate)
                        const wName = weekdayName(parsedDate)

                        // شمارش حاضرین این جلسه
                        let presentInSession = 0
                        for (const student of definition?.students ?? []) {
                          const st = attendanceMap.get(`${session.id}_${student.id}`)
                          if (st === "present" || st === "late") presentInSession++
                        }

                        return (
                          <th
                            key={session.id}
                            className="min-w-[6.5rem] border-s p-2 text-center font-normal transition-colors hover:bg-muted/60"
                          >
                            <button
                              type="button"
                              onClick={() => setActiveSession(session)}
                              className="group flex w-full flex-col items-center gap-1 text-center"
                              title="کلیک برای باز کردن برگه حضور این جلسه"
                            >
                              <span className="text-[11px] font-bold text-foreground">
                                {shortDate}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {wName} · {formatClock(session.start)}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.2 text-[9px] font-medium border",
                                  session.status === "held"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                    : session.status === "canceled"
                                    ? "border-destructive/30 bg-destructive/10 text-destructive line-through"
                                    : "border-primary/30 bg-primary/10 text-primary",
                                )}
                              >
                                {SESSION_STATUS_LABELS[session.status]}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100">
                                {toPersianDigits(presentInSession)}/{toPersianDigits(definition?.students.length ?? 0)} حاضر
                              </span>
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {students.map((student, index) => {
                      const stats = studentStats.get(student.id)
                      const rate = stats?.rate ?? null

                      return (
                        <tr
                          key={student.id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <td className="sticky start-0 z-10 bg-card p-3 text-center font-medium text-muted-foreground tabular-nums">
                            {toPersianDigits(index + 1)}
                          </td>
                          <td className="sticky start-12 z-10 bg-card p-3 font-semibold text-start">
                            {student.name}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={cn(
                                "inline-block rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums",
                                getRateBadgeClass(rate),
                              )}
                            >
                              {rate !== null ? `${toPersianDigits(rate)}٪` : "—"}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[11px] text-muted-foreground tabular-nums">
                            {toPersianDigits(stats?.present ?? 0)} از{" "}
                            {toPersianDigits(stats?.recordedTotal ?? 0)}
                          </td>

                          {/* خانه‌های ماتریس */}
                          {sessions.map((session) => {
                            const cellKey = `${session.id}_${student.id}`
                            const statusKey: ExtendedAttendanceStatus =
                              attendanceMap.get(cellKey) ?? "unrecorded"
                            const config = ATTENDANCE_CONFIGS[statusKey]
                            const Icon = config.icon
                            const isBusy = updatingCell === cellKey

                            return (
                              <td
                                key={session.id}
                                className="border-s p-1.5 text-center"
                              >
                                <motion.button
                                  type="button"
                                  disabled={isBusy}
                                  whileTap={{ scale: 0.88 }}
                                  whileHover={{ scale: 1.08 }}
                                  onClick={() =>
                                    handleCellClick(session.id, student.id)
                                  }
                                  className={cn(
                                    "inline-flex h-8 w-full max-w-[5.5rem] items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-colors",
                                    config.cellClasses,
                                  )}
                                  title={`${student.name} · ${config.label} (کلیک برای تغییر)`}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span>{config.shortLabel}</span>
                                </motion.button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>

                  {/* پاورقی جدول: جمع حاضرین هر جلسه */}
                  <tfoot>
                    <tr className="border-t bg-muted/40 font-bold text-muted-foreground">
                      <td colSpan={2} className="sticky start-0 z-10 bg-muted/90 p-3 text-start backdrop-blur-sm">
                        جمع حاضرین جلسه
                      </td>
                      <td colSpan={2} className="p-3 text-center">
                        —
                      </td>
                      {sessions.map((session) => {
                        let presentInSession = 0
                        for (const student of definition?.students ?? []) {
                          const st = attendanceMap.get(`${session.id}_${student.id}`)
                          if (st === "present" || st === "late") presentInSession++
                        }
                        const totalStudents = definition?.students.length ?? 0
                        return (
                          <td key={session.id} className="border-s p-2 text-center text-xs tabular-nums text-foreground">
                            {toPersianDigits(presentInSession)} از {toPersianDigits(totalStudents)}
                          </td>
                        )
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* دیالوگ حضور کامل برای یک جلسه */}
      <SessionAttendanceDialog
        session={activeSession}
        definition={definition}
        onClose={() => setActiveSession(null)}
      />

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
