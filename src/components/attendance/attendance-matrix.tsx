import { motion } from "framer-motion"
import {
  CalendarDays,
  Plus,
  SearchX,
  UserPlus,
} from "lucide-react"

import {
  ATTENDANCE_CONFIGS,
  type ExtendedAttendanceStatus,
} from "@/components/attendance/attendance-constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type {
  AttendanceStatus,
  ClassDefinition,
  ClassStudent,
  Session,
} from "@/db/schema"
import { SESSION_STATUS_LABELS } from "@/db/schema"
import {
  formatClock,
  formatJalaliShortDate,
  parseJalaliDate,
  toPersianDigits,
  weekdayName,
  type JalaliDate,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"

export interface StudentStatsItem {
  present: number
  late: number
  excused: number
  absent: number
  unrecorded: number
  recordedTotal: number
  rate: number | null
}

export interface AttendanceMatrixProps {
  definition: ClassDefinition | undefined
  sessions: Session[]
  students: ClassStudent[]
  attendanceMap: Map<string, AttendanceStatus>
  studentStats: Map<string, StudentStatsItem>
  updatingCell: string | null
  onCellClick: (sessionId: string, studentId: string) => void
  onOpenSessionAttendance: (session: Session) => void
  onOpenCreateSession: () => void
  monthTitle: string
  searchQuery: string
  onClearSearch: () => void
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

function safeParseJalali(dateStr: string | null | undefined): JalaliDate | null {
  if (!dateStr || typeof dateStr !== "string") return null
  try {
    return parseJalaliDate(dateStr)
  } catch {
    return null
  }
}

/**
 * کامپوننت ماتریس ماهانه حضور و غیاب شاگرد × جلسه
 * کاملاً ایمن در برابر مقادیر undefined یا null و دارای وضعیت‌های خالی (Empty States)
 */
export function AttendanceMatrix({
  definition,
  sessions = [],
  students = [],
  attendanceMap,
  studentStats,
  updatingCell,
  onCellClick,
  onOpenSessionAttendance,
  onOpenCreateSession,
  monthTitle,
  searchQuery,
  onClearSearch,
}: AttendanceMatrixProps) {
  const allClassStudents = definition?.students ?? []
  const totalStudentsCount = allClassStudents.length

  // ۱. حالت خالی: کلاس انتخاب نشده یا یافت نشد
  if (!definition) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold">کلاسی انتخاب نشده است</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            لطفاً از منوی بالای صفحه یک کلاس را انتخاب کنید.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ۲. حالت خالی: کلاس هیچ شاگردی ندارد
  if (totalStudentsCount === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-base font-bold">این کلاس هیچ شاگردی ندارد</p>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground">
            برای شروع ثبت حضور و غیاب، ابتدا باید از بخش «کلاس‌ها»، وارد ویرایش این کلاس شده و اسامی شاگردان را اضافه کنید.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              window.location.href = "/classes"
            }}
            className="mt-2 gap-1.5"
          >
            مدیریت شاگردان در کلاس‌ها
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ۳. حالت خالی: هیچ جلسه‌ای در این ماه ثبت نشده است
  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold">
            در {monthTitle} جلسه‌ای برای «{definition.title}» ثبت نشده است
          </p>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground">
            می‌توانید برای این ماه جلسه جدیدی ثبت کنید تا جدول حضور و غیاب شکل بگیرد.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onOpenCreateSession}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            ثبت جلسه در این ماه
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ۴. حالت خالی: فیلتر جستجو نتیجه‌ای نداشت
  if (students.length === 0 && searchQuery.trim()) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold">شاگردی با این نام پیدا نشد</p>
          <p className="text-xs text-muted-foreground">
            نتیجه‌ای برای جستجوی «{searchQuery}» در بین شاگردان این کلاس وجود ندارد.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="mt-1"
          >
            پاک کردن جستجو
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/80">
      {/* حالت دسکتاپ و تبلت: ماتریس افقی کامل */}
      <div className="hidden md:block overflow-x-auto">
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

              {/* سرستون‌های جلسات ماه */}
              {sessions.map((session) => {
                if (!session || !session.id) return null
                const parsedDate = safeParseJalali(session.date)
                const shortDate = parsedDate ? formatJalaliShortDate(parsedDate) : session.date
                const wName = parsedDate ? weekdayName(parsedDate) : ""

                // محاسبه حاضرین این جلسه
                let presentInSession = 0
                for (const student of allClassStudents) {
                  if (!student || !student.id) continue
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
                      onClick={() => onOpenSessionAttendance(session)}
                      className="group flex w-full flex-col items-center gap-1 text-center cursor-pointer transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
                      title="کلیک برای باز کردن برگه حضور این جلسه"
                    >
                      <span className="text-[11px] font-bold text-foreground">
                        {shortDate}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {wName} · {formatClock(session.start ?? "")}
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
                        {SESSION_STATUS_LABELS[session.status] ?? session.status}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100">
                        {toPersianDigits(presentInSession)}/{toPersianDigits(totalStudentsCount)} حاضر
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {students.map((student, index) => {
              if (!student || !student.id) return null
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
                    {student.name ?? "بدون نام"}
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

                  {/* خانه‌های ماتریس وضعیت حضور */}
                  {sessions.map((session) => {
                    if (!session || !session.id) return null
                    const cellKey = `${session.id}_${student.id}`
                    const rawStatus = attendanceMap.get(cellKey)
                    const statusKey: ExtendedAttendanceStatus =
                      rawStatus && rawStatus in ATTENDANCE_CONFIGS
                        ? (rawStatus as ExtendedAttendanceStatus)
                        : "unrecorded"

                    const config =
                      ATTENDANCE_CONFIGS[statusKey] ??
                      ATTENDANCE_CONFIGS.unrecorded
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
                          whileHover={{ scale: 1.06 }}
                          onClick={() => onCellClick(session.id, student.id)}
                          className={cn(
                            "inline-flex h-8 w-full max-w-[5.5rem] items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
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

          {/* جمع حاضرین در پاورقی جدول */}
          <tfoot>
            <tr className="border-t bg-muted/40 font-bold text-muted-foreground">
              <td
                colSpan={2}
                className="sticky start-0 z-10 bg-muted/90 p-3 text-start backdrop-blur-sm"
              >
                جمع حاضرین جلسه
              </td>
              <td colSpan={2} className="p-3 text-center">
                —
              </td>
              {sessions.map((session) => {
                if (!session || !session.id) return null
                let presentInSession = 0
                for (const student of allClassStudents) {
                  if (!student || !student.id) continue
                  const st = attendanceMap.get(`${session.id}_${student.id}`)
                  if (st === "present" || st === "late") presentInSession++
                }

                return (
                  <td
                    key={session.id}
                    className="border-s p-2 text-center text-xs tabular-nums text-foreground"
                  >
                    {toPersianDigits(presentInSession)} از{" "}
                    {toPersianDigits(totalStudentsCount)}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* حالت موبایل: تبدیل ماتریس به کارتهای لیستی شاگردان با امکان لمس سریع حضور و غیاب */}
      <div className="block md:hidden divide-y divide-border/60">
        {students.map((student, index) => {
          if (!student || !student.id) return null
          const stats = studentStats.get(student.id)
          const rate = stats?.rate ?? null

          return (
            <div key={student.id} className="p-3.5 space-y-3 transition-colors hover:bg-muted/15">
              {/* سربرگ کارت شاگرد */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums">
                    {toPersianDigits(index + 1)}
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {student.name ?? "بدون نام"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {toPersianDigits(stats?.present ?? 0)} از {toPersianDigits(stats?.recordedTotal ?? 0)}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums",
                      getRateBadgeClass(rate),
                    )}
                  >
                    {rate !== null ? `${toPersianDigits(rate)}٪` : "—"}
                  </span>
                </div>
              </div>

              {/* ردیف دکمه‌های وضعیت حضور شاگرد در جلسات ماه */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground">وضعیت در جلسات ماه (برای تغییر کلیک کنید):</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {sessions.map((session) => {
                    if (!session || !session.id) return null
                    const parsedDate = safeParseJalali(session.date)
                    const shortDate = parsedDate ? formatJalaliShortDate(parsedDate) : session.date
                    const cellKey = `${session.id}_${student.id}`
                    const rawStatus = attendanceMap.get(cellKey)
                    const statusKey: ExtendedAttendanceStatus =
                      rawStatus && rawStatus in ATTENDANCE_CONFIGS
                        ? (rawStatus as ExtendedAttendanceStatus)
                        : "unrecorded"

                    const config =
                      ATTENDANCE_CONFIGS[statusKey] ??
                      ATTENDANCE_CONFIGS.unrecorded
                    const Icon = config.icon
                    const isBusy = updatingCell === cellKey

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/70 p-2 min-w-[5.25rem] shrink-0"
                      >
                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                          {shortDate}
                        </span>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {formatClock(session.start ?? "")}
                        </span>
                        <motion.button
                          type="button"
                          disabled={isBusy}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onCellClick(session.id, student.id)}
                          className={cn(
                            "inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50",
                            config.cellClasses,
                          )}
                          title={`${student.name} · ${config.label}`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span>{config.shortLabel}</span>
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
