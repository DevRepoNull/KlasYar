import { useMemo, useState } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"

import {
  DeleteSessionDialog,
  SessionAttendanceDialog,
} from "@/components/calendar/session-dialogs"
import { SessionFormDialog } from "@/components/sessions/session-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { JalaliDateRangePicker } from "@/components/ui/jalali-date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAllSessions, useClassDefinitions } from "@/db/hooks"
import type { ClassDefinition, Session, SessionStatus } from "@/db/schema"
import { SESSION_STATUS_LABELS } from "@/db/schema"
import {
  formatClock,
  formatJalaliFullDate,
  parseJalaliDate,
  toPersianDigits,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"

const sessionListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const sessionCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
}

const STATUS_BADGE_CLASSES: Record<SessionStatus, string> = {
  scheduled: "border-primary/25 bg-primary/10 text-primary",
  held: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  canceled: "border-destructive/25 bg-destructive/10 text-destructive line-through",
}

export default function SessionsPage() {
  const { toast } = useToast()
  const sessions = useAllSessions()
  const definitions = useClassDefinitions()
  const prefersReducedMotion = useReducedMotion() ?? false

  const [classFilter, setClassFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  })

  // دیالوگ‌ها
  const [formOpen, setFormOpen] = useState(false)
  const [formSession, setFormSession] = useState<Session | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [attendanceTarget, setAttendanceTarget] = useState<Session | null>(null)

  const definitionById = useMemo(
    () =>
      new Map<string, ClassDefinition>(
        (definitions ?? []).map((def) => [def.id, def]),
      ),
    [definitions],
  )

  const handleOpenAttendance = (session: Session) => {
    const def = definitionById.get(session.definitionId)
    if (!def) {
      toast({
        title: "کلاس یافت نشد",
        description: "تعریف این کلاس در سیستم یافت نشد یا ممکن است حذف شده باشد.",
        variant: "destructive",
      })
      return
    }
    setAttendanceTarget(session)
  }

  const hasActiveFilters = Boolean(
    classFilter !== "all" ||
      statusFilter !== "all" ||
      searchQuery.trim() ||
      dateRange.from ||
      dateRange.to,
  )

  const handleClearFilters = () => {
    setClassFilter("all")
    setStatusFilter("all")
    setSearchQuery("")
    setDateRange({ from: "", to: "" })
  }

  // محاسبات آمار بالای صفحه
  const stats = useMemo(() => {
    const all = sessions ?? []
    const scheduled = all.filter((s) => s.status === "scheduled").length
    const held = all.filter((s) => s.status === "held").length
    const canceled = all.filter((s) => s.status === "canceled").length
    return { total: all.length, scheduled, held, canceled }
  }, [sessions])

  // فیلتر کردن لیست جلسات
  const filteredSessions = useMemo(() => {
    let result = [...(sessions ?? [])]

    if (classFilter !== "all") {
      result = result.filter((s) => s.definitionId === classFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }

    if (dateRange.from) {
      result = result.filter((s) => s.date >= dateRange.from)
    }

    if (dateRange.to) {
      result = result.filter((s) => s.date <= dateRange.to)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((s) => {
        const classDef = definitionById.get(s.definitionId)
        const titleMatch = classDef?.title.toLowerCase().includes(q)
        const noteMatch = s.note.toLowerCase().includes(q)
        const dateMatch = s.date.includes(q)
        return titleMatch || noteMatch || dateMatch
      })
    }

    // مرتب‌سازی معکوس بر اساس تاریخ (جدیدترین اول)
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start))
  }, [sessions, classFilter, statusFilter, dateRange, searchQuery, definitionById])

  const openCreate = () => {
    setFormSession(null)
    setFormOpen(true)
  }

  const openEdit = (session: Session) => {
    setFormSession(session)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setFormSession(null)
  }

  return (
    <div className="space-y-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            جلسات
          </h1>
          <p className="max-w-xl text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
            جلسه‌های برنامه‌ریزی‌شده، برگزارشده و لغوشده را بررسی کنید؛ با ثبت جلسه جدید سقف و همپوشانی زمانی کنترل می‌شود.
          </p>
        </div>

        <Button type="button" onClick={openCreate} className="gap-2 active:scale-95 glow-effect h-9 text-xs font-bold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          جلسه جدید
        </Button>
      </div>

      {/* کارت‌های خلاصه آمار با اسکرول افقی (Carousel) در موبایل و گرید ۴ ستونه در دسکتاپ */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
          className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0"
        >
          <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/20 shadow-sm">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">کل جلسات</p>
                <p className="text-xl font-black tabular-nums tracking-tight">
                  {sessions === undefined ? "…" : toPersianDigits(stats.total)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
          className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0"
        >
          <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-sm">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">برنامه‌ریزی‌شده</p>
                <p className="text-xl font-black tabular-nums tracking-tight">
                  {sessions === undefined ? "…" : toPersianDigits(stats.scheduled)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
          className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0"
        >
          <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">برگزارشده</p>
                <p className="text-xl font-black tabular-nums tracking-tight">
                  {sessions === undefined ? "…" : toPersianDigits(stats.held)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
          className="min-w-[14.5rem] flex-1 snap-center sm:min-w-0"
        >
          <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-border hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/25 shadow-sm">
                <XCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">لغوشده</p>
                <p className="text-xl font-black tabular-nums tracking-tight">
                  {sessions === undefined ? "…" : toPersianDigits(stats.canceled)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* بخش فیلترها و جستجو */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در جلسات، یادداشت یا تاریخ…"
              className="ps-10 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* فیلتر بازه تاریخ شمسی */}
            <JalaliDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              onClear={() => setDateRange({ from: "", to: "" })}
              placeholder="فیلتر بازه تاریخ (از / تا)…"
              className="w-full sm:w-auto"
            />

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-48 text-xs h-9" aria-label="فیلتر کلاس">
                <Filter className="h-3.5 w-3.5 text-muted-foreground me-1.5 shrink-0" />
                <SelectValue placeholder="همه کلاس‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کلاس‌ها</SelectItem>
                {(definitions ?? []).map((def) => (
                  <SelectItem key={def.id} value={def.id}>
                    <span className="flex items-center gap-2 truncate">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: def.color }}
                      />
                      <span className="truncate">{def.title}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 text-xs h-9" aria-label="فیلتر وضعیت">
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="scheduled">برنامه‌ریزی‌شده</SelectItem>
                <SelectItem value="held">برگزارشده</SelectItem>
                <SelectItem value="canceled">لغوشده</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 gap-1 text-xs text-muted-foreground hover:text-destructive active:scale-95"
                title="پاک کردن تمام فیلترها"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>ریست فیلترها</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* نمایش لیست جلسات */}
      {sessions === undefined ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border bg-muted/30"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background text-muted-foreground ring-1 ring-border">
              <CalendarClock className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold">جلسه‌ای یافت نشد</p>
            <p className="max-w-sm text-xs leading-6 text-muted-foreground">
              {sessions.length === 0
                ? "هنوز هیچ جلسه‌ای ثبت نشده است؛ اولین جلسه را برای یکی از کلاس‌ها بسازید."
                : "جلسه‌ای با این مشخصات یا فیلترها وجود ندارد؛ فیلترها را پاک کنید یا جلسه تازه ثبت کنید."}
            </p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              ثبت جلسه جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={prefersReducedMotion ? undefined : sessionListVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          animate="show"
          className="space-y-3"
        >
          {filteredSessions.map((session) => {
            const def = definitionById.get(session.definitionId)
            const color = def?.color ?? "#6366f1"
            const studentCount = def?.students.length ?? 0

            return (
              <motion.article
                key={session.id}
                variants={prefersReducedMotion ? undefined : sessionCardVariants}
                whileHover={prefersReducedMotion ? undefined : { y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/75 backdrop-blur-xl p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-primary/5 dark:bg-card/45 dark:border-white/10 dark:hover:border-white/20"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 start-0 w-1.5"
                  style={{ backgroundColor: color }}
                />

                <div className="min-w-0 flex-1 space-y-2 ps-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-bold">
                      {def?.title ?? "کلاس نامشخص"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-xs",
                        STATUS_BADGE_CLASSES[session.status],
                      )}
                    >
                      {SESSION_STATUS_LABELS[session.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span>
                        {(() => {
                          try {
                            return formatJalaliFullDate(parseJalaliDate(session.date))
                          } catch {
                            return session.date
                          }
                        })()}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="tabular-nums">
                        {formatClock(session.start)} تا {formatClock(session.end)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {toPersianDigits(studentCount)} شاگرد
                    </span>
                  </div>

                  {session.note ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {session.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex w-full sm:w-auto shrink-0 items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs active:scale-95 flex-1 sm:flex-initial h-8"
                    onClick={() => handleOpenAttendance(session)}
                  >
                    حضور و غیاب
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground active:scale-95"
                    aria-label="ویرایش جلسه"
                    onClick={() => openEdit(session)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive active:scale-95"
                    aria-label="حذف جلسه"
                    onClick={() => setDeleteTarget(session)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      )}

      {/* دیالوگ ثبت و ویرایش جلسه با اعتبارسنجی سقف و همپوشانی */}
      <SessionFormDialog
        open={formOpen}
        session={formSession}
        definitions={definitions ?? []}
        onClose={closeForm}
      />

      {/* دیالوگ حضور و غیاب جلسه */}
      {attendanceTarget ? (
        <SessionAttendanceDialog
          session={attendanceTarget}
          definition={definitionById.get(attendanceTarget.definitionId)}
          onClose={() => setAttendanceTarget(null)}
        />
      ) : null}

      {/* دیالوگ حذف جلسه */}
      <DeleteSessionDialog
        session={deleteTarget}
        definition={
          deleteTarget
            ? definitionById.get(deleteTarget.definitionId)
            : undefined
        }
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
