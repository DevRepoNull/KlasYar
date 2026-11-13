import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCheck,
  ClipboardCheck,
  RotateCcw,
  TriangleAlert,
  Users,
} from "lucide-react"

import {
  ATTENDANCE_CONFIGS,
  type ExtendedAttendanceStatus,
} from "@/components/attendance/attendance-constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAttendanceBySession } from "@/db/hooks"
import {
  clearSessionAttendance,
  deleteAttendanceBySessionAndStudent,
  saveSessionAttendance,
  upsertAttendance,
} from "@/db/attendance"
import { getDatabaseErrorMessage } from "@/db/errors"
import type { AttendanceStatus, ClassDefinition, Session } from "@/db/schema"
import { useToast } from "@/hooks/use-toast"
import {
  formatClock,
  formatJalaliFullDate,
  parseJalaliDate,
  toPersianDigits,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"

interface SessionAttendanceDialogProps {
  session: Session | null
  definition: ClassDefinition | undefined
  onClose: () => void
}

const STATUS_BUTTONS: AttendanceStatus[] = [
  "present",
  "late",
  "excused",
  "absent",
]

export function SessionAttendanceDialog({
  session,
  definition,
  onClose,
}: SessionAttendanceDialogProps) {
  const { toast } = useToast()
  const attendanceRecords = useAttendanceBySession(session?.id)
  const [updatingStudent, setUpdatingStudent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedStudent, setLastSavedStudent] = useState<string | null>(null)

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    for (const record of attendanceRecords ?? []) {
      map.set(record.studentId, record.status)
    }
    return map
  }, [attendanceRecords])

  useEffect(() => {
    if (lastSavedStudent) {
      const timer = setTimeout(() => setLastSavedStudent(null), 1800)
      return () => clearTimeout(timer)
    }
  }, [lastSavedStudent])

  const students = useMemo(
    () => (definition && Array.isArray(definition.students) ? definition.students : []),
    [definition],
  )
  const totalStudents = students.length

  const sessionDateTitle = useMemo(() => {
    if (!session?.date) return ""
    try {
      return formatJalaliFullDate(parseJalaliDate(session.date))
    } catch {
      return session.date
    }
  }, [session?.date])

  // محاسبات آمار حضور جلسه
  const stats = useMemo(() => {
    let present = 0
    let late = 0
    let excused = 0
    let absent = 0
    let unrecorded = 0

    for (const student of students) {
      if (!student || !student.id) continue
      const status = attendanceMap.get(student.id)
      if (status === "present") present++
      else if (status === "late") late++
      else if (status === "excused") excused++
      else if (status === "absent") absent++
      else unrecorded++
    }

    const recordedTotal = present + late + excused + absent
    const presentRate =
      recordedTotal > 0
        ? Math.round(((present + late) / recordedTotal) * 100)
        : null

    return {
      present,
      late,
      excused,
      absent,
      unrecorded,
      recordedTotal,
      presentRate,
    }
  }, [students, attendanceMap])

  // اطمینان از خروج ایمن پس از اجرای بدون شرط تمام هوک‌های ری‌اکت
  if (!session || !definition) return null

  // ذخیره خودکار هنگام کلیک روی هر وضعیت (اگر همان وضعیت قبلی باشد، به ثبت‌نشده برمی‌گردد)
  const handleToggleStatus = async (
    studentId: string,
    clickedStatus: AttendanceStatus,
  ) => {
    setUpdatingStudent(studentId)
    setError(null)
    const currentStatus = attendanceMap.get(studentId)

    try {
      if (currentStatus === clickedStatus) {
        // بازگرداندن به حالت «ثبت‌نشده»
        await deleteAttendanceBySessionAndStudent(session.id, studentId)
        setLastSavedStudent(studentId)
      } else {
        // ثبت وضعیت جدید با ذخیره خودکار
        await upsertAttendance(session.id, studentId, clickedStatus)
        setLastSavedStudent(studentId)
      }
    } catch (err) {
      setError(getDatabaseErrorMessage(err))
    } finally {
      setUpdatingStudent(null)
    }
  }

  // ثبت حضور یک‌جا برای همه دانش‌آموزان
  const handleMarkAllPresent = async () => {
    if (students.length === 0) return
    setError(null)
    try {
      await saveSessionAttendance(
        session.id,
        students.map((student) => ({
          studentId: student.id,
          status: "present",
        })),
      )
      toast({
        title: "حضور همه ثبت شد",
        description: `تمام دانش‌آموزان این جلسه به عنوان «حاضر» ثبت شدند.`,
      })
    } catch (err) {
      setError(getDatabaseErrorMessage(err))
    }
  }

  // پاک کردن همه رکوردهای حضور این جلسه
  const handleClearAll = async () => {
    if (students.length === 0) return
    setError(null)
    try {
      await clearSessionAttendance(session.id)
      toast({
        title: "وضعیت حضور بازنشانی شد",
        description: `تمام رکوردهای این جلسه به حالت «ثبت‌نشده» برگشتند.`,
      })
    } catch (err) {
      setError(getDatabaseErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: definition.color }}
            />
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              حضور و غیاب · {definition.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {sessionDateTitle} · ساعت{" "}
            {formatClock(session.start ?? "")} تا {formatClock(session.end ?? "")}
          </DialogDescription>
        </DialogHeader>

        <ErrorBoundary sectionName="فهرست حضور جلسه">
          <div className="space-y-4">
          {/* کارت وضعیت کلی و نشانگر بصری حاضرین */}
          <div className="space-y-3 rounded-2xl border bg-card/60 p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                حاضرین: {toPersianDigits(stats.present)} از {toPersianDigits(totalStudents)} شاگرد
              </span>
              {stats.presentRate !== null ? (
                <Badge
                  variant={stats.presentRate >= 75 ? "secondary" : "destructive"}
                  className="text-xs tabular-nums"
                >
                  {toPersianDigits(stats.presentRate)}٪ حضور
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  هنوز حضوری ثبت نشده
                </span>
              )}
            </div>

            {/* نوار پیشرفت بصری */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${
                    totalStudents > 0
                      ? Math.min(100, Math.round((stats.present / totalStudents) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* نشانگرهای تفکیکی رنگی */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {toPersianDigits(stats.present)} حاضر
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {toPersianDigits(stats.late)} تأخیر
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-700 dark:text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                {toPersianDigits(stats.excused)} مرخصی
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {toPersianDigits(stats.absent)} غایب
              </span>
              {stats.unrecorded > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/80 bg-muted/40 px-2 py-0.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {toPersianDigits(stats.unrecorded)} ثبت‌نشده
                </span>
              ) : null}
            </div>
          </div>

          {/* نوار عملیات سریع */}
          {students.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                روی هر وضعیت کلیک کنید تا خودکار ذخیره شود
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleMarkAllPresent}
                >
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  حاضر کردن همه
                </Button>
                {stats.recordedTotal > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleClearAll}
                    title="پاک کردن تمام وضعیت‌های این جلسه"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    پاک کردن
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* لیست دانش‌آموزان با micro-interaction */}
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-xs text-muted-foreground">
              این کلاس هنوز دانش‌آموزی ندارد؛ برای ثبت حضور ابتدا از بخش «کلاس‌ها» دانش‌آموزان را اضافه کنید.
            </div>
          ) : (
            <ul className="divide-y divide-border/60 rounded-2xl border bg-card/40">
              {students.map((student, index) => {
                const currentStatus = attendanceMap.get(student.id) as
                  | ExtendedAttendanceStatus
                  | undefined
                const isBusy = updatingStudent === student.id
                const isSaved = lastSavedStudent === student.id

                return (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2.5 p-3 transition-colors hover:bg-muted/25"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground tabular-nums">
                        {toPersianDigits(index + 1)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{student.name}</p>
                        <AnimatePresence>
                          {isSaved ? (
                            <motion.span
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-[10px] text-emerald-600 dark:text-emerald-400"
                            >
                              ✓ ذخیره شد
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* دکمه‌های وضعیت با انیمیشن micro-interaction */}
                    <div className="flex items-center gap-1" role="group" aria-label={`وضعیت حضور ${student.name}`}>
                      {STATUS_BUTTONS.map((statusKey) => {
                        const config = ATTENDANCE_CONFIGS[statusKey]
                        const isSelected = currentStatus === statusKey
                        const Icon = config.icon

                        return (
                          <motion.button
                            key={statusKey}
                            type="button"
                            disabled={isBusy}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            animate={
                              isSelected
                                ? { scale: [0.93, 1.08, 1], transition: { duration: 0.22 } }
                                : { scale: 1 }
                            }
                            onClick={() => handleToggleStatus(student.id, statusKey)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                              isSelected
                                ? config.activeButtonClasses
                                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                            title={config.label}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">{config.shortLabel}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </div>
      </ErrorBoundary>

        <DialogFooter>
          <Button type="button" onClick={onClose} className="w-full sm:w-auto">
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
