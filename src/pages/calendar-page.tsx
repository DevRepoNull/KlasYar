import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import faLocale from "@fullcalendar/core/locales/fa"
import type { EventContentArg, EventInput } from "@fullcalendar/core"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  ListChecks,
  Plus,
  Sparkles,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { SessionChip } from "@/components/calendar/session-chip"
import { SessionDayPanel } from "@/components/calendar/session-day-panel"
import {
  DeleteSessionDialog,
  SessionAttendanceDialog,
} from "@/components/calendar/session-dialogs"
import { SessionFormDialog } from "@/components/sessions/session-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker"
import { useToast } from "@/hooks/use-toast"
import { useClassDefinitions, useSessionsByDateRange } from "@/db/hooks"
import { getDatabaseErrorMessage } from "@/db/errors"
import type { ClassDefinition, Session } from "@/db/schema"
import { seedDemoData } from "@/db/seed"
import {
  formatClock,
  formatDuration,
  formatJalaliMonthTitle,
  getOfficialHoliday,
  isFriday,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  jalaliDateToString,
  jalaliFromDate,
  jalaliMonthWeekBounds,
  jalaliToGregorianIso,
  jalaliWeekBounds,
  pad2,
  parseJalaliDate,
  shiftJalaliMonth,
  todayJalali,
  toPersianDigits,
  type JalaliDate,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"

import "@/components/calendar/calendar.css"

/** مدت جلسه به دقیقه (ساعت پایان منهای شروع). */
function sessionMinutes(session: Session): number {
  const [startHour, startMinute] = session.start.split(":").map(Number)
  const [endHour, endMinute] = session.end.split(":").map(Number)
  return Math.max(
    0,
    endHour * 60 + endMinute - (startHour * 60 + startMinute),
  )
}

/**
 * تاریخ شمسی یک marker تقویم.
 * FullCalendar هر روز را با نیمه‌شب محلی می‌سازد؛ خواندن اجزای محلی `Date`
 * از یک روز جابه‌جایی جلوگیری می‌کند.
 */
function jalaliFromMarker(marker: number | Date): JalaliDate {
  return jalaliFromDate(new Date(marker))
}

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
  colorClass = "bg-primary/15 text-primary border-primary/25",
}: SummaryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
      className="h-full"
    >
      <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 dark:bg-card/45 dark:border-white/10 dark:hover:border-white/20">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-sm transition-transform duration-200 group-hover:scale-105",
              colorClass,
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-black tracking-tight tabular-nums mt-0.5">{value}</p>
            <p className="truncate text-[11px] text-muted-foreground mt-0.5">{hint}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function CalendarPage() {
  const { toast } = useToast()
  const today = useMemo(() => todayJalali(), [])
  const [month, setMonth] = useState(() => ({
    year: today.year,
    month: today.month,
  }))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [createSessionDate, setCreateSessionDate] = useState<string | null>(null)
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(null)
  const [editTarget, setEditTarget] = useState<Session | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)

  const todayStr = useMemo(() => jalaliDateToString(today), [today])
  const monthKey = `${month.year}-${pad2(month.month)}`
  const monthTitle = formatJalaliMonthTitle(month.year, month.month)

  // روزهای ابتدا/انتهای ماه + روزهای بین‌ماه که در جدول دیده می‌شوند.
  const viewBounds = useMemo(
    () => jalaliMonthWeekBounds(month.year, month.month),
    [month],
  )
  const currentWeek = useMemo(() => jalaliWeekBounds(today), [today])

  const sessionsInView = useSessionsByDateRange(
    viewBounds.firstIso,
    viewBounds.lastIso,
  )
  const weekSessions = useSessionsByDateRange(
    currentWeek.firstIso,
    currentWeek.lastIso,
  )
  const definitions = useClassDefinitions()

  const definitionById = useMemo(
    () =>
      new Map<string, ClassDefinition>(
        (definitions ?? []).map((definition) => [
          definition.id,
          definition,
        ]),
      ),
    [definitions],
  )

  const handleOpenAttendance = useCallback(
    (session: Session) => {
      const def = definitionById.get(session.definitionId)
      if (!def) {
        toast({
          title: "کلاس یافت نشد",
          description: "تعریف این کلاس در سیستم یافت نشد یا ممکن است حذف شده باشد.",
          variant: "destructive",
        })
        return
      }
      setAttendanceSession(session)
    },
    [definitionById, toast],
  )

  // جلسات امروز
  const todaySessions = useMemo(() => {
    return (sessionsInView ?? [])
      .filter((s) => s.date === todayStr)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [sessionsInView, todayStr])

  // جلسه بعدی پیش‌رو
  const nextUpcomingSession = useMemo(() => {
    if (todaySessions.length > 0) return todaySessions[0]
    return (sessionsInView ?? [])
      .filter((s) => s.date > todayStr && s.status !== "canceled")
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))[0]
  }, [sessionsInView, todaySessions, todayStr])

  // داده نمونه فقط یک‌بار (idempotent) درج می‌شود تا نمای تقویم خالی نباشد.
  useEffect(() => {
    let active = true
    seedDemoData().catch((error) => {
      if (active) setSeedError(getDatabaseErrorMessage(error))
    })
    return () => {
      active = false
    }
  }, [])

  const monthSessions = useMemo(
    () =>
      (sessionsInView ?? []).filter((session) =>
        session.date.startsWith(`${monthKey}-`),
      ),
    [sessionsInView, monthKey],
  )

  const countedMonthSessions = useMemo(
    () => monthSessions.filter((session) => session.status !== "canceled"),
    [monthSessions],
  )
  const heldMonthCount = useMemo(
    () => monthSessions.filter((session) => session.status === "held").length,
    [monthSessions],
  )
  const monthMinutes = useMemo(
    () =>
      countedMonthSessions.reduce(
        (total, session) => total + sessionMinutes(session),
        0,
      ),
    [countedMonthSessions],
  )
  const weekMinutes = useMemo(
    () =>
      (weekSessions ?? [])
        .filter((session) => session.status !== "canceled")
        .reduce((total, session) => total + sessionMinutes(session), 0),
    [weekSessions],
  )

  const events = useMemo<EventInput[]>(() => {
    return [...(sessionsInView ?? [])]
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
      )
      .flatMap((session) => {
        const definition = definitionById.get(session.definitionId)
        if (!definition) return []
        return [
          {
            id: session.id,
            title: definition.title,
            start: jalaliToGregorianIso(parseJalaliDate(session.date)),
            allDay: true,
            extendedProps: { session, definition },
          } satisfies EventInput,
        ]
      })
  }, [sessionsInView, definitionById])

  const selectedSessions = useMemo(() => {
    if (!selectedDate || !sessionsInView) return undefined
    return sessionsInView
      .filter((session) => session.date === selectedDate)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [selectedDate, sessionsInView])

  const visibleRange = useMemo(
    () => ({
      start: viewBounds.startIso,
      end: viewBounds.endExclusiveIso,
    }),
    [viewBounds],
  )

  const calendarViews = useMemo(
    () => ({
      jalaliMonth: {
        type: "dayGrid",
        visibleRange: () => visibleRange,
      },
    }),
    [visibleRange],
  )

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const session = arg.event.extendedProps.session as Session | undefined
    const definition = arg.event.extendedProps.definition as
      | ClassDefinition
      | undefined
    if (!session || !definition) return true
    return <SessionChip session={session} definition={definition} />
  }, [])

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(month.year)
  const monthButtonRef = useRef<HTMLButtonElement>(null)
  const monthPickerRef = useRef<HTMLDivElement>(null)
  const [pickerCoords, setPickerCoords] = useState<{ top: number; left: number } | null>(null)
  const calendarRef = useRef<FullCalendar>(null)
  const calendarContainerRef = useRef<HTMLDivElement>(null)

  // به‌روزرسانی اندازه تقویم در لود اولیه، تغییر ماه و رصد تغییر ابعاد کانتینر
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        calendarRef.current?.getApi()?.updateSize()
      } catch {}
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        calendarRef.current?.getApi()?.updateSize()
      } catch {}
    }, 60)
    return () => clearTimeout(timer)
  }, [monthKey])

  useEffect(() => {
    if (!calendarContainerRef.current) return
    const observer = new ResizeObserver(() => {
      try {
        calendarRef.current?.getApi()?.updateSize()
      } catch {}
    })
    observer.observe(calendarContainerRef.current)
    return () => observer.disconnect()
  }, [])

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

  // بستن پاپ‌اور ماه با کلیک خارج از آن
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
    setSelectedDate(null)
    setIsMonthPickerOpen(false)
  }

  const goToMonth = (delta: number) => {
    setMonth((current) => shiftJalaliMonth(current.year, current.month, delta))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setMonth({ year: today.year, month: today.month })
    setSelectedDate(null)
  }

  const openDayFromMarker = (marker: number | Date) => {
    setSelectedDate(jalaliDateToString(jalaliFromMarker(marker)))
  }

  const deleteDefinition = deleteTarget
    ? definitionById.get(deleteTarget.definitionId)
    : undefined

  return (
    <div className="space-y-6">
      {/* سربرگ داشبورد و ناوبری زمانی ماه */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            داشبورد و تقویم آموزشی
          </h1>
          <p className="max-w-xl text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
            مدیریت هوشمند و یکپارچه جلسات ماه، حضور و غیاب، و دسترسی به برنامه روزانه کلاس‌ها
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateSessionDate(selectedDate ?? todayStr)}
            className="gap-1.5 active:scale-95 glow-effect font-bold h-9 text-xs"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>جلسه جدید</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="active:scale-95 h-9 text-xs px-2.5"
          >
            امروز
          </Button>
          {/* پرش مستقیم به تاریخ */}
          <div className="hidden sm:block">
            <JalaliDatePicker
              value={selectedDate ?? todayStr}
              onChange={(pickedDate) => {
                if (pickedDate) {
                  const parsed = parseJalaliDate(pickedDate)
                  setMonth({ year: parsed.year, month: parsed.month })
                  setSelectedDate(pickedDate)
                }
              }}
              placeholder="پرش به تاریخ…"
              className="w-36 text-xs"
            />
          </div>

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

      {seedError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-5 text-destructive"
        >
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>بارگذاری داده نمونه انجام نشد: {seedError}</span>
        </div>
      ) : null}

      {/* شبکه بنتو گرید (Bento Grid) مدرن و داینامیک: ۲ ستون در تبلت، ۱۲ ستون در دسکتاپ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* ۱. کارت اصلی بنتو: تقویم تعاملی ماه شمسی (تمام عرض در موبایل، ۲ ستون در تبلت، ۸ ستون در دسکتاپ) */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
          className="order-2 md:order-1 md:col-span-2 lg:col-span-8"
        >
          <Card className="overflow-hidden border-border/70 bg-card/75 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-3 sm:p-5">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      تقویم جلسات ماه {monthTitle}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      هفته از شنبه · برای مشاهده و ثبت حضور روی هر روز کلیک کنید
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>برگزارشده</span>
                  </span>
                  <span className="flex items-center gap-1 ms-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>برنامه‌ریزی‌شده</span>
                  </span>
                </div>
              </div>

              <div ref={calendarContainerRef} className="klasyar-calendar">
                <FullCalendar
                  ref={calendarRef}
                  key={monthKey}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="jalaliMonth"
                  views={calendarViews}
                  initialDate={viewBounds.startIso}
                  locale="fa"
                  locales={[faLocale]}
                  direction="rtl"
                  firstDay={6}
                  headerToolbar={false}
                  footerToolbar={false}
                  height="auto"
                  fixedWeekCount={false}
                  showNonCurrentDates
                  dayMaxEvents={false}
                  eventDisplay="block"
                  events={events}
                  eventContent={renderEventContent}
                  dayHeaderContent={(arg) => {
                    const dayIndex = (arg.date.getDay() + 1) % 7
                    return JALALI_WEEKDAY_NAMES[dayIndex]
                  }}
                  dayCellContent={(info) =>
                    toPersianDigits(jalaliFromMarker(info.date).day)
                  }
                  dayCellClassNames={(info) => {
                    const date = jalaliFromMarker(info.date)
                    const dateIso = jalaliDateToString(date)
                    const classes: string[] = []

                    if (date.year !== month.year || date.month !== month.month) {
                      classes.push("kl-other-month")
                    }
                    if (isFriday(date)) classes.push("kl-weekend")
                    if (getOfficialHoliday(date)) classes.push("kl-holiday")
                    if (selectedDate === dateIso) classes.push("kl-selected")
                    return classes
                  }}
                  eventClassNames={() => ["kl-session-event"]}
                  dateClick={(info) => openDayFromMarker(info.date)}
                  eventClick={(info) => {
                    const session = info.event.extendedProps.session as
                      | Session
                      | undefined
                    info.jsEvent.preventDefault()
                    if (session) setSelectedDate(session.date)
                  }}
                />
              </div>

              <AnimatePresence initial={false} mode="wait">
                {selectedDate ? (
                  <SessionDayPanel
                    key={selectedDate}
                    date={selectedDate}
                    sessions={selectedSessions}
                    definitions={definitionById}
                    onClose={() => setSelectedDate(null)}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onAddSession={() => setCreateSessionDate(selectedDate)}
                    onAttendance={handleOpenAttendance}
                  />
                ) : null}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ۲. ستون کناری بنتو: برنامه امروز و جلسات پیش‌رو + کارت کلاس‌ها (در تبلت ۲ ستون کنار هم، در دسکتاپ ۴ ستون عمودی) */}
        <div className="order-1 md:order-2 md:col-span-2 lg:col-span-4 flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-col gap-4">
          {/* کارت جلسات امروز */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className="flex-1"
          >
            <Card className="h-full border-border/70 bg-card/75 backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <Sparkles className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">برنامه امروز</h3>
                      <p className="text-[11px] text-muted-foreground">{todayStr}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {toPersianDigits(todaySessions.length)} جلسه
                  </span>
                </div>

                {/* لیست جلسات امروز */}
                <div className="mt-3.5 space-y-2">
                  {todaySessions.length > 0 ? (
                    todaySessions.map((session) => {
                      const def = definitionById.get(session.definitionId)
                      return (
                        <div
                          key={session.id}
                          className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5 transition-all hover:bg-background/90 hover:border-primary/30"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: def?.color ?? "#0d9488" }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">
                                {def?.title ?? "کلاس"}
                              </p>
                              <p className="text-[11px] text-muted-foreground tabular-nums">
                                {formatClock(session.start)} تا {formatClock(session.end)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAttendance(session)}
                              className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 active:scale-95"
                              title="ثبت حضور و غیاب"
                            >
                              حضور
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedDate(session.date)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground active:scale-95"
                              title="مشاهده جزئیات روز"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  ) : nextUpcomingSession ? (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 text-center">
                      <p className="text-xs font-medium text-foreground">
                        امروز جلسه‌ای ثبت نشده است
                      </p>
                      <div className="mt-2.5 rounded-xl bg-card/70 p-2.5 text-start border border-border/60">
                        <span className="text-[10px] text-muted-foreground block mb-0.5">
                          جلسه بعدی شما:
                        </span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-primary">
                            {definitionById.get(nextUpcomingSession.definitionId)?.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {nextUpcomingSession.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 py-6 text-center">
                      <CalendarDays className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-60" />
                      <p className="text-xs text-muted-foreground">
                        هیچ جلسه فعالی در برنامه ثبت نشده است
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* دکمه اکشن سریع برای امروز */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  onClick={() => setCreateSessionDate(todayStr)}
                  className="w-full h-9 text-xs font-bold gap-2 active:scale-95 glow-effect"
                >
                  <Plus className="h-4 w-4" />
                  <span>ثبت جلسه برای امروز ({todayStr})</span>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* کارت کلاس‌های فعال */}
          <motion.div whileHover={{ y: -3, transition: { duration: 0.18 } }}>
            <Card className="border-border/70 bg-card/75 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold">کلاس‌های فعال</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums font-medium">
                  {toPersianDigits(definitions?.length ?? 0)} کلاس
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(definitions ?? []).length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">کلاسی تعریف نشده است.</p>
                ) : (
                  (definitions ?? []).slice(0, 6).map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-[11px]"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium truncate max-w-[100px]">{c.title}</span>
                    </span>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ۳. ردیف کارت‌های شاخص عملکردی بنتو: اسکرول افقی (Carousel) در موبایل، ۲ ستون در تبلت، ۳ ستون در دسکتاپ */}
        <div className="order-3 md:col-span-2 lg:col-span-12">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
            <div className="min-w-[15.5rem] flex-1 snap-center md:min-w-0">
              <SummaryCard
                icon={Clock3}
                label="مجموع ساعت آموزش ماه"
                value={
                  sessionsInView === undefined ? "…" : formatDuration(monthMinutes)
                }
                hint={monthTitle}
                colorClass="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25"
              />
            </div>

            <div className="min-w-[15.5rem] flex-1 snap-center md:min-w-0">
              <SummaryCard
                icon={Timer}
                label="ساعت آموزش هفته جاری"
                value={
                  weekSessions === undefined ? "…" : formatDuration(weekMinutes)
                }
                hint="شنبه تا جمعه هفته حاضر"
                colorClass="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25"
              />
            </div>

            <div className="min-w-[15.5rem] flex-1 snap-center md:min-w-0 md:col-span-2 lg:col-span-1">
              <SummaryCard
                icon={ListChecks}
                label="جلسات ثبت‌شده ماه"
                value={
                  sessionsInView === undefined
                    ? "…"
                    : `${toPersianDigits(countedMonthSessions.length)} جلسه`
                }
                hint={`${toPersianDigits(heldMonthCount)} برگزارشده · ${toPersianDigits(monthSessions.length - countedMonthSessions.length)} لغوشده`}
                colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        رنگ تگ‌ها از رنگ هر کلاس می‌آید؛ جلسه‌های هم‌زمان کنار هم نمایش داده می‌شوند.
      </p>

      <SessionFormDialog
        open={createSessionDate !== null}
        session={null}
        initialDate={createSessionDate}
        definitions={definitions ?? []}
        onClose={() => setCreateSessionDate(null)}
      />
      <SessionFormDialog
        open={editTarget !== null}
        session={editTarget}
        definitions={definitions ?? []}
        onClose={() => setEditTarget(null)}
      />
      {attendanceSession ? (
        <SessionAttendanceDialog
          session={attendanceSession}
          definition={definitionById.get(attendanceSession.definitionId)}
          onClose={() => setAttendanceSession(null)}
        />
      ) : null}
      <DeleteSessionDialog
        session={deleteTarget}
        definition={deleteDefinition}
        onClose={() => setDeleteTarget(null)}
      />

      {/* پنجره انتخاب مستقیم ماه و سال شمسی */}
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
              aria-label="انتخاب ماه و سال تقویم"
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
