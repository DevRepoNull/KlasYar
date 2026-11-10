import { useCallback, useEffect, useMemo, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import faLocale from "@fullcalendar/core/locales/fa"
import type { EventContentArg, EventInput } from "@fullcalendar/core"
import { AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  Plus,
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
import { useClassDefinitions, useSessionsByDateRange } from "@/db/hooks"
import { getDatabaseErrorMessage } from "@/db/errors"
import type { ClassDefinition, Session } from "@/db/schema"
import { seedDemoData } from "@/db/seed"
import {
  formatDuration,
  formatJalaliMonthTitle,
  getOfficialHoliday,
  isFriday,
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
}

function SummaryCard({ icon: Icon, label, value, hint }: SummaryCardProps) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
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

export default function CalendarPage() {
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

  // نمای ماه شمسی یک Custom View است: `dayGridMonth` بازه ثابت میلادی دارد و
  // `visibleRange` را نادیده می‌گیرد، اما نمای سفارشی با visibleRange دقیقاً
  // هفته‌های ماه شمسی را رندر می‌کند.
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            تقویم
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            جلسه‌های ماه را یک‌جا ببینید؛ روی هر روز بزنید تا ساعت، وضعیت و
            شاگردان همان روز باز شود.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateSessionDate(selectedDate ?? todayStr)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            جلسه جدید
          </Button>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Clock3}
          label="جمع ساعت ماه"
          value={
            sessionsInView === undefined ? "…" : formatDuration(monthMinutes)
          }
          hint={monthTitle}
        />
        <SummaryCard
          icon={Timer}
          label="جمع ساعت هفته"
          value={
            weekSessions === undefined ? "…" : formatDuration(weekMinutes)
          }
          hint="شنبه تا جمعه جاری"
        />
        <SummaryCard
          icon={ListChecks}
          label="جلسات ماه"
          value={
            sessionsInView === undefined
              ? "…"
              : `${toPersianDigits(countedMonthSessions.length)} جلسه`
          }
          hint={`${toPersianDigits(heldMonthCount)} جلسه برگزارشده`}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-2.5 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              تقویم شمسی · هفته از شنبه
            </span>
            <span className="text-[11px] text-muted-foreground">
              روی روز کلیک کنید
            </span>
          </div>

          <div className="klasyar-calendar">
            <FullCalendar
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
                onAttendance={setAttendanceSession}
              />
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        رنگ تگ‌ها از رنگ هر کلاس می‌آید؛ جلسه‌های هم‌زمان کنار هم نمایش داده
        می‌شوند.
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
      <SessionAttendanceDialog
        session={attendanceSession}
        definition={
          attendanceSession
            ? definitionById.get(attendanceSession.definitionId)
            : undefined
        }
        onClose={() => setAttendanceSession(null)}
      />
      <DeleteSessionDialog
        session={deleteTarget}
        definition={deleteDefinition}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

