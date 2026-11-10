import {
  CalendarCheck2,
  Check,
  Clock3,
  Minus,
  X,
  type LucideIcon,
} from "lucide-react"

import type { AttendanceStatus } from "@/db/schema"

export type ExtendedAttendanceStatus = AttendanceStatus | "unrecorded"

export interface AttendanceStatusConfig {
  value: ExtendedAttendanceStatus
  label: string
  shortLabel: string
  icon: LucideIcon
  badgeClasses: string
  activeButtonClasses: string
  cellClasses: string
}

export const ATTENDANCE_CONFIGS: Record<ExtendedAttendanceStatus, AttendanceStatusConfig> = {
  present: {
    value: "present",
    label: "حاضر",
    shortLabel: "حاضر",
    icon: Check,
    badgeClasses:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    activeButtonClasses:
      "border-emerald-500/50 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/40",
    cellClasses:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25",
  },
  late: {
    value: "late",
    label: "با تأخیر",
    shortLabel: "تأخیر",
    icon: Clock3,
    badgeClasses:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    activeButtonClasses:
      "border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/40",
    cellClasses:
      "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25",
  },
  excused: {
    value: "excused",
    label: "مرخصی (موجه)",
    shortLabel: "مرخصی",
    icon: CalendarCheck2,
    badgeClasses:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    activeButtonClasses:
      "border-sky-500/50 bg-sky-500/20 text-sky-700 dark:text-sky-300 shadow-sm ring-1 ring-sky-500/40",
    cellClasses:
      "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200 hover:bg-sky-500/25",
  },
  absent: {
    value: "absent",
    label: "غایب",
    shortLabel: "غایب",
    icon: X,
    badgeClasses:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    activeButtonClasses:
      "border-rose-500/50 bg-rose-500/20 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-500/40",
    cellClasses:
      "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25",
  },
  unrecorded: {
    value: "unrecorded",
    label: "ثبت‌نشده",
    shortLabel: "—",
    icon: Minus,
    badgeClasses:
      "border-border/60 border-dashed bg-muted/40 text-muted-foreground",
    activeButtonClasses:
      "border-border bg-muted text-muted-foreground shadow-sm",
    cellClasses:
      "border-border/40 border-dashed bg-muted/20 text-muted-foreground hover:bg-muted/50",
  },
}

/** چرخش وضعیت هنگام کلیک در ماتریس ماهانه */
export const STATUS_CYCLE_ORDER: ExtendedAttendanceStatus[] = [
  "unrecorded",
  "present",
  "late",
  "excused",
  "absent",
]

export function getNextAttendanceStatus(
  current: ExtendedAttendanceStatus,
): ExtendedAttendanceStatus {
  const currentIndex = STATUS_CYCLE_ORDER.indexOf(current)
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE_ORDER.length
  return STATUS_CYCLE_ORDER[nextIndex]
}
