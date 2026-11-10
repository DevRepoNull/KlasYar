import { useEffect, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarX2,
  ClipboardCheck,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ClassDefinition, Session, SessionStatus } from "@/db/schema"
import { SESSION_STATUS_LABELS } from "@/db/schema"
import {
  formatClock,
  formatJalaliFullDate,
  getOfficialHoliday,
  parseJalaliDate,
  toPersianDigits,
} from "@/lib/jalali"
import { cn } from "@/lib/utils"

interface SessionDayPanelProps {
  /** تاریخ شمسی YYYY-MM-DD */
  date: string
  sessions: Session[] | undefined
  definitions: Map<string, ClassDefinition>
  onClose: () => void
  onEdit: (session: Session) => void
  onDelete: (session: Session) => void
  onAddSession: () => void
  onAttendance: (session: Session) => void
}

const STATUS_STYLES: Record<SessionStatus, string> = {
  scheduled: "border-primary/25 bg-primary/10 text-primary",
  held: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  canceled: "border-destructive/25 bg-destructive/10 text-destructive line-through",
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

/** پنل جلسه‌های یک روز؛ با انتخاب روز از تقویم باز می‌شود. */
export function SessionDayPanel({
  date,
  sessions,
  definitions,
  onClose,
  onEdit,
  onDelete,
  onAddSession,
  onAttendance,
}: SessionDayPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion() ?? false
  const jalaliDate = parseJalaliDate(date)
  const holiday = getOfficialHoliday(jalaliDate)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    panel.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    })
  }, [date, prefersReducedMotion])

  return (
    <motion.section
      ref={panelRef}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="day-panel-title"
      className="mt-3 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h2
            id="day-panel-title"
            className="text-base font-black tracking-tight sm:text-lg"
          >
            {formatJalaliFullDate(jalaliDate)}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {sessions === undefined
                ? "در حال خواندن جلسه‌ها…"
                : sessions.length === 0
                  ? "بدون جلسه"
                  : `${toPersianDigits(sessions.length)} جلسه`}
            </span>
            {holiday ? <Badge variant="destructive">{holiday}</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={onAddSession}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            افزودن جلسه
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن پنل روز"
            className="shrink-0 text-muted-foreground"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>

      {sessions === undefined ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
          <CalendarX2
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold">برای این روز جلسه‌ای ثبت نشده است</p>
          <p className="text-xs text-muted-foreground">
            می‌توانید برای این تاریخ جلسه جدیدی تعریف کنید.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onAddSession}
            className="mt-2 gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            افزودن جلسه به این روز
          </Button>
        </div>
      ) : (
        <motion.ul
          variants={listVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          animate="show"
          className="mt-4 space-y-2"
        >
          {sessions.map((session) => {
            const definition = definitions.get(session.definitionId)
            const color = definition?.color ?? "#94a3b8"
            const studentCount = definition?.students.length ?? 0

            return (
              <motion.li
                key={session.id}
                variants={prefersReducedMotion ? undefined : rowVariants}
                className="flex items-start gap-3 rounded-xl border bg-background/70 p-3 transition-colors hover:bg-accent/30"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">
                      {definition?.title ?? "جلسه"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLES[session.status],
                      )}
                    >
                      {SESSION_STATUS_LABELS[session.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="tabular-nums">
                        {formatClock(session.start)} تا {formatClock(session.end)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {toPersianDigits(studentCount)} شاگرد
                    </span>
                  </div>
                  {session.note ? (
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {session.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    aria-label={`حضور و غیاب ${definition?.title ?? "جلسه"}`}
                    title="حضور و غیاب"
                    onClick={() => onAttendance(session)}
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label={`ویرایش ${definition?.title ?? "جلسه"}`}
                    onClick={() => onEdit(session)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`حذف ${definition?.title ?? "جلسه"}`}
                    onClick={() => onDelete(session)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </motion.section>
  )
}
