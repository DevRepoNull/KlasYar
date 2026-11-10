import { motion, useReducedMotion } from "framer-motion"

import type { ClassDefinition, Session } from "@/db/schema"
import { formatClock } from "@/lib/jalali"
import { cn } from "@/lib/utils"

interface SessionChipProps {
  session: Session
  definition: ClassDefinition
}

/** رنگ هگز را با شفافیت می‌آمیزد؛ رنگ‌های غیرهگز بدون پس‌زمینه می‌مانند. */
function tint(color: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "transparent"
  const hex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
  return `${color}${hex}`
}

/**
 * تگ رنگی یک جلسه روی روز تقویم.
 * چند جلسه هم‌زمان کنار هم می‌نشینند و در صورت نیاز به سطر بعد می‌روند.
 */
export function SessionChip({ session, definition }: SessionChipProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const canceled = session.status === "canceled"

  return (
    <motion.span
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "kl-session-chip inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        canceled && "opacity-60",
      )}
      style={{
        backgroundColor: tint(definition.color, 0.12),
        borderColor: tint(definition.color, 0.4),
      }}
      title={`${definition.title} · ${formatClock(session.start)} تا ${formatClock(
        session.end,
      )}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: definition.color }}
        aria-hidden="true"
      />
      <span
        className={cn("kl-chip-title truncate", canceled && "line-through")}
        aria-hidden="true"
      >
        {definition.title}
      </span>
      <span className="sr-only">
        {definition.title}، ساعت {formatClock(session.start)} تا{" "}
        {formatClock(session.end)}
      </span>
    </motion.span>
  )
}
