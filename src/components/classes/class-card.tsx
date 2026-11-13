import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  BookOpen,
  CalendarCheck2,
  Clock3,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSessionsByDefinition } from "@/db/hooks"
import { DAY_OF_WEEK_LABELS, type ClassDefinition } from "@/db/schema"
import { formatClock, toPersianDigits } from "@/lib/jalali"

import { tintColor } from "./class-palette"

/** استگر کارت‌ها هنگام ورود به صفحه. */
export const classListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export const classCardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
}

interface ClassCardProps {
  definition: ClassDefinition
  onEdit: () => void
  onDelete: () => void
}

/** کارت رنگی یک کلاس با برنامه هفتگی و شمارش شاگردها. */
export function ClassCard({ definition, onEdit, onDelete }: ClassCardProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const sessions = useSessionsByDefinition(definition.id)
  const sessionCount = sessions?.length

  return (
    <motion.article
      variants={prefersReducedMotion ? undefined : classCardVariants}
      whileHover={prefersReducedMotion ? undefined : { y: -4, transition: { duration: 0.18, ease: "easeOut" } }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/75 backdrop-blur-xl shadow-sm transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-primary/5 dark:bg-card/45 dark:border-white/10 dark:hover:border-white/25"
      aria-labelledby={`class-title-${definition.id}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: definition.color }}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: tintColor(definition.color, 0.14),
              color: definition.color,
            }}
          >
            <BookOpen className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id={`class-title-${definition.id}`}
              className="truncate text-base font-bold leading-6"
              title={definition.title}
            >
              {definition.title}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {toPersianDigits(definition.daysOfWeek.length)} روز در هفته
            </p>
          </div>

          <div className="flex shrink-0 gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={`ویرایش ${definition.title}`}
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              aria-label={`حذف ${definition.title}`}
              onClick={onDelete}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1 tabular-nums">
            <CalendarCheck2 className="h-3 w-3" aria-hidden="true" />
            {toPersianDigits(definition.totalSessions)} جلسه
          </Badge>
          <Badge variant="secondary" className="gap-1 tabular-nums">
            <Users className="h-3 w-3" aria-hidden="true" />
            {toPersianDigits(definition.students.length)} شاگرد
          </Badge>
          <Badge variant="outline" className="tabular-nums">
            {sessionCount === undefined
              ? "…"
              : `${toPersianDigits(sessionCount)} جلسه ثبت‌شده`}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {definition.daysOfWeek.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">
              روزی انتخاب نشده است
            </span>
          ) : (
            definition.daysOfWeek.map((day) => (
              <span
                key={day}
                className="rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {DAY_OF_WEEK_LABELS[day]}
              </span>
            ))
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatClock(definition.defaultStart)} تا{" "}
            {formatClock(definition.defaultEnd)}
          </span>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: definition.color }}
          />
        </div>
      </div>
    </motion.article>
  )
}
