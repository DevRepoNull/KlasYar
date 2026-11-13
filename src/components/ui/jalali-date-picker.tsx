import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  daysInJalaliMonth,
  formatJalaliFullDate,
  formatJalaliMonthTitle,
  jalaliDateToString,
  jalaliToDate,
  pad2,
  parseJalaliDate,
  shiftJalaliMonth,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"
import { dayOfWeekFromDate } from "@/db/schema"
import { cn } from "@/lib/utils"

export interface DateRangeValue {
  from: string
  to: string
}

export interface JalaliDateRangePickerProps {
  value?: DateRangeValue
  onChange: (range: DateRangeValue) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  defaultYear?: number
  defaultMonth?: number
}

const SHORT_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

/**
 * انتخاب‌گر پیشرفته بازه تاریخ شمسی (Jalali Date Range Picker)
 */
export function JalaliDateRangePicker({
  value = { from: "", to: "" },
  onChange,
  onClear,
  placeholder = "انتخاب بازه تاریخ (از / تا)",
  className,
  defaultYear,
  defaultMonth,
}: JalaliDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const today = useMemo(() => todayJalali(), [])
  const todayStr = useMemo(() => jalaliDateToString(today), [today])

  const [viewMonth, setViewMonth] = useState(() => {
    if (value.from) {
      try {
        const p = parseJalaliDate(value.from)
        return { year: p.year, month: p.month }
      } catch {}
    }
    return {
      year: defaultYear ?? today.year,
      month: defaultMonth ?? today.month,
    }
  })

  const [tempFrom, setTempFrom] = useState(value.from)
  const [tempTo, setTempTo] = useState(value.to)
  const [hoverDate, setHoverDate] = useState<string | null>(null)

  useEffect(() => {
    setTempFrom(value.from)
    setTempTo(value.to)
  }, [value.from, value.to])

  useEffect(() => {
    if (!value.from && defaultYear && defaultMonth) {
      setViewMonth({ year: defaultYear, month: defaultMonth })
    }
  }, [defaultYear, defaultMonth, value.from])

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverWidth = 320
    const popoverHeight = 390

    let top = rect.bottom + 6
    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 6)
    }

    let left = rect.left + rect.width / 2 - popoverWidth / 2
    if (left < 10) left = 10
    if (left + popoverWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popoverWidth - 10)
    }

    setCoords({ top, left })
  }

  const handleToggle = () => {
    if (!isOpen) updatePosition()
    setIsOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!isOpen) return

    const pop = popoverRef.current
    const stopNativeCapture = (e: Event) => {
      e.stopPropagation()
    }
    if (pop) {
      pop.addEventListener("pointerdown", stopNativeCapture, true)
      pop.addEventListener("mousedown", stopNativeCapture, true)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    const handleScrollOrResize = () => updatePosition()

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleScrollOrResize)
    window.addEventListener("scroll", handleScrollOrResize, true)

    return () => {
      if (pop) {
        pop.removeEventListener("pointerdown", stopNativeCapture, true)
        pop.removeEventListener("mousedown", stopNativeCapture, true)
      }
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleScrollOrResize)
      window.removeEventListener("scroll", handleScrollOrResize, true)
    }
  }, [isOpen])

  const monthDaysCount = useMemo(
    () => daysInJalaliMonth(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  const firstDayOffset = useMemo(() => {
    const firstDate = jalaliToDate({
      year: viewMonth.year,
      month: viewMonth.month,
      day: 1,
    })
    return dayOfWeekFromDate(firstDate)
  }, [viewMonth.year, viewMonth.month])

  const viewMonthTitle = useMemo(
    () => formatJalaliMonthTitle(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  const handleDayClick = (day: number) => {
    const dateStr = `${viewMonth.year}-${pad2(viewMonth.month)}-${pad2(day)}`
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(dateStr)
      setTempTo("")
    } else if (tempFrom && !tempTo) {
      if (dateStr < tempFrom) {
        setTempTo(tempFrom)
        setTempFrom(dateStr)
      } else {
        setTempTo(dateStr)
      }
    }
  }

  const applyPreset = (preset: "this-month" | "first-half" | "second-half" | "today") => {
    const y = viewMonth.year
    const m = viewMonth.month
    const daysInM = daysInJalaliMonth(y, m)

    if (preset === "this-month") {
      setTempFrom(`${y}-${pad2(m)}-01`)
      setTempTo(`${y}-${pad2(m)}-${pad2(daysInM)}`)
    } else if (preset === "first-half") {
      setTempFrom(`${y}-${pad2(m)}-01`)
      setTempTo(`${y}-${pad2(m)}-15`)
    } else if (preset === "second-half") {
      setTempFrom(`${y}-${pad2(m)}-16`)
      setTempTo(`${y}-${pad2(m)}-${pad2(daysInM)}`)
    } else if (preset === "today") {
      setTempFrom(todayStr)
      setTempTo(todayStr)
    }
  }

  const handleApply = () => {
    onChange({ from: tempFrom, to: tempTo || tempFrom })
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempFrom("")
    setTempTo("")
    onChange({ from: "", to: "" })
    onClear?.()
    setIsOpen(false)
  }

  const labelText = useMemo(() => {
    if (!value.from && !value.to) return placeholder
    if (value.from && !value.to) return `از ${toPersianDigits(value.from)}`
    if (!value.from && value.to) return `تا ${toPersianDigits(value.to)}`
    return `${toPersianDigits(value.from)} تا ${toPersianDigits(value.to)}`
  }, [value.from, value.to, placeholder])

  const hasValue = Boolean(value.from || value.to)

  return (
    <div ref={containerRef} className={cn("relative block w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        dir="rtl"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-1.5 text-xs font-medium text-start shadow-xs transition-all duration-150 active:scale-[0.99] hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hasValue
            ? "border-primary/50 text-foreground bg-primary/5"
            : "border-input text-muted-foreground",
        )}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          <CalendarRange
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              hasValue ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="truncate">{labelText}</span>
        </span>

        {hasValue ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleClear()
            }}
            aria-label="پاک کردن بازه تاریخ"
            className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/60 shrink-0 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {typeof document !== "undefined" &&
        isOpen &&
        coords &&
        createPortal(
          <AnimatePresence>
            <div
              data-klasyar-portal="true"
              className="fixed inset-0 z-[130] bg-black/15 backdrop-blur-[0.5px] pointer-events-auto"
              style={{ pointerEvents: "auto" }}
              aria-hidden="true"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
            <motion.div
              ref={popoverRef}
              data-klasyar-portal="true"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: "320px",
                zIndex: 140,
                pointerEvents: "auto",
              }}
              className="klasyar-popover pointer-events-auto rounded-2xl border border-border/80 bg-popover p-3 text-popover-foreground shadow-2xl backdrop-blur-2xl max-h-[calc(100vh-20px)] overflow-y-auto"
              dir="rtl"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="ماه قبل"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((m) => shiftJalaliMonth(m.year, m.month, -1))
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-xs font-bold text-foreground">
                  {viewMonthTitle}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="ماه بعد"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((m) => shiftJalaliMonth(m.year, m.month, 1))
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* گزینه‌های بازه سریع */}
              <div className="flex flex-wrap items-center gap-1 border-b border-border/60 py-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyPreset("this-month")
                  }}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  کل ماه
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyPreset("first-half")
                  }}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  نیمه اول
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyPreset("second-half")
                  }}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  نیمه دوم
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    applyPreset("today")
                  }}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  امروز
                </button>
              </div>

              {/* سربرگ روزهای هفته */}
              <div className="mt-1.5 grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground">
                {SHORT_WEEKDAYS.map((w, idx) => (
                  <div key={idx} className="py-0.5">
                    {w}
                  </div>
                ))}
              </div>

              {/* ماتریس روزهای ماه شمسی */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {Array.from({ length: firstDayOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-6" />
                ))}

                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const day = idx + 1
                  const dateStr = `${viewMonth.year}-${pad2(viewMonth.month)}-${pad2(day)}`
                  const isToday = dateStr === todayStr

                  const isStart = tempFrom === dateStr
                  const isEnd = tempTo === dateStr

                  const effectiveEnd = tempTo || (tempFrom && hoverDate ? hoverDate : "")
                  const rangeStart = tempFrom && effectiveEnd ? (tempFrom <= effectiveEnd ? tempFrom : effectiveEnd) : ""
                  const rangeEnd = tempFrom && effectiveEnd ? (tempFrom <= effectiveEnd ? effectiveEnd : tempFrom) : ""
                  const isInRange = rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDayClick(day)
                      }}
                      onMouseEnter={() => setHoverDate(dateStr)}
                      onMouseLeave={() => setHoverDate(null)}
                      className={cn(
                        "relative h-6 w-full text-xs font-medium transition-colors focus-visible:outline-none",
                        isStart && isEnd
                          ? "rounded-md bg-primary text-primary-foreground font-bold shadow-xs"
                          : isStart
                          ? "rounded-s-md bg-primary text-primary-foreground font-bold"
                          : isEnd
                          ? "rounded-e-md bg-primary text-primary-foreground font-bold"
                          : isInRange
                          ? "bg-primary/15 text-primary rounded-none"
                          : "hover:bg-muted/60 text-foreground",
                        isToday && !isInRange && !isStart && !isEnd && "border border-primary/40 font-bold text-primary",
                      )}
                    >
                      {toPersianDigits(day)}
                    </button>
                  )
                })}
              </div>

              {/* دکمه‌های اقدام پایین */}
              <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
                >
                  <RotateCcw className="h-3 w-3 me-1" />
                  پاک کردن
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleApply()
                  }}
                  className="h-7 text-xs px-3 gap-1 font-bold glow-effect"
                >
                  <Check className="h-3.5 w-3.5" />
                  اعمال فیلتر
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

/* ==================================================================================
   انتخاب‌گر تکی تاریخ شمسی (Single Jalali Date Picker)
   مناسب برای افزودن جلسه، تعریف کلاس، ویرایش جلسه
   ================================================================================== */

export interface JalaliDatePickerProps {
  id?: string
  value: string // تاریخ به صورت YYYY-MM-DD
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  "aria-label"?: string
}

export function JalaliDatePicker({
  id,
  value,
  onChange,
  placeholder = "۱۴۰۵-۰۸-۲۲",
  className,
  disabled = false,
  "aria-label": ariaLabel,
}: JalaliDatePickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const today = useMemo(() => todayJalali(), [])
  const todayStr = useMemo(() => jalaliDateToString(today), [today])

  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      try {
        const p = parseJalaliDate(value)
        return { year: p.year, month: p.month }
      } catch {}
    }
    return { year: today.year, month: today.month }
  })

  // همگام‌سازی ماه با تغییر مقدار
  useEffect(() => {
    if (value) {
      try {
        const p = parseJalaliDate(value)
        setViewMonth({ year: p.year, month: p.month })
      } catch {}
    }
  }, [value])

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverWidth = 300
    const popoverHeight = 330

    let top = rect.bottom + 6
    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 6)
    }

    let left = rect.left + rect.width / 2 - popoverWidth / 2
    if (left < 10) left = 10
    if (left + popoverWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popoverWidth - 10)
    }

    setCoords({ top, left })
  }

  const handleToggle = () => {
    if (disabled) return
    if (!isOpen) updatePosition()
    setIsOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!isOpen) return

    const pop = popoverRef.current
    const stopNativeCapture = (e: Event) => {
      e.stopPropagation()
    }
    if (pop) {
      pop.addEventListener("pointerdown", stopNativeCapture, true)
      pop.addEventListener("mousedown", stopNativeCapture, true)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    const handleScrollOrResize = () => updatePosition()

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleScrollOrResize)
    window.addEventListener("scroll", handleScrollOrResize, true)

    return () => {
      if (pop) {
        pop.removeEventListener("pointerdown", stopNativeCapture, true)
        pop.removeEventListener("mousedown", stopNativeCapture, true)
      }
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleScrollOrResize)
      window.removeEventListener("scroll", handleScrollOrResize, true)
    }
  }, [isOpen])

  const monthDaysCount = useMemo(
    () => daysInJalaliMonth(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  const firstDayOffset = useMemo(() => {
    const firstDate = jalaliToDate({
      year: viewMonth.year,
      month: viewMonth.month,
      day: 1,
    })
    return dayOfWeekFromDate(firstDate)
  }, [viewMonth.year, viewMonth.month])

  const viewMonthTitle = useMemo(
    () => formatJalaliMonthTitle(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  const handleDaySelect = (day: number) => {
    const dateStr = `${viewMonth.year}-${pad2(viewMonth.month)}-${pad2(day)}`
    onChange(dateStr)
    setIsOpen(false)
  }

  const handleTodayClick = () => {
    onChange(todayStr)
    setViewMonth({ year: today.year, month: today.month })
    setIsOpen(false)
  }

  // برچسب فارسی خوانا
  const fullDateLabel = useMemo(() => {
    if (!value) return null
    try {
      return formatJalaliFullDate(parseJalaliDate(value))
    } catch {
      return null
    }
  }, [value])

  return (
    <div className={cn("relative w-full space-y-1", className)}>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          "relative flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background/80 px-3.5 py-2 text-sm shadow-xs transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] focus-within:ring-2 focus-within:ring-ring focus-within:border-primary",
          isOpen && "ring-2 ring-ring border-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <input
            id={inputId}
            type="text"
            dir="ltr"
            disabled={disabled}
            placeholder={placeholder}
            aria-label={ariaLabel ?? "انتخاب تاریخ"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-28 bg-transparent text-center font-bold tabular-nums text-sm outline-none focus:outline-none"
          />
        </div>

        {fullDateLabel ? (
          <span className="truncate text-xs font-normal text-muted-foreground">
            {fullDateLabel}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">انتخاب از تقویم</span>
        )}
      </div>

      {typeof document !== "undefined" &&
        isOpen &&
        coords &&
        createPortal(
          <AnimatePresence>
            <div
              data-klasyar-portal="true"
              className="fixed inset-0 z-[130] bg-black/15 backdrop-blur-[0.5px] pointer-events-auto"
              style={{ pointerEvents: "auto" }}
              aria-hidden="true"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
            <motion.div
              ref={popoverRef}
              data-klasyar-portal="true"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: "300px",
                zIndex: 140,
                pointerEvents: "auto",
              }}
              className="klasyar-popover pointer-events-auto rounded-2xl border border-border/80 bg-popover p-3 text-popover-foreground shadow-2xl backdrop-blur-2xl"
              dir="rtl"
              role="dialog"
              aria-label="تقویم شمسی انتخاب تاریخ"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ناوبری ماه */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="ماه قبل"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((m) => shiftJalaliMonth(m.year, m.month, -1))
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-xs font-black text-foreground">
                  {viewMonthTitle}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="ماه بعد"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((m) => shiftJalaliMonth(m.year, m.month, 1))
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* سربرگ روزهای هفته */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground mb-1">
                {SHORT_WEEKDAYS.map((w, idx) => (
                  <div key={idx} className="py-0.5">
                    {w}
                  </div>
                ))}
              </div>

              {/* شبکه روزها */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: firstDayOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-7" />
                ))}

                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const day = idx + 1
                  const dateStr = `${viewMonth.year}-${pad2(viewMonth.month)}-${pad2(day)}`
                  const isSelected = value === dateStr
                  const isToday = dateStr === todayStr

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDaySelect(day)
                      }}
                      className={cn(
                        "h-7 w-full rounded-lg text-xs font-semibold tabular-nums transition-all active:scale-90",
                        isSelected
                          ? "bg-primary text-primary-foreground font-black shadow-sm"
                          : isToday
                          ? "border border-primary/50 bg-primary/10 text-primary font-bold"
                          : "hover:bg-accent text-foreground/85",
                      )}
                    >
                      {toPersianDigits(day)}
                    </button>
                  )
                })}
              </div>

              {/* فوتر: امروز و بستن */}
              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleTodayClick()
                  }}
                  className="h-7 text-xs text-primary font-bold px-2 active:scale-95 gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  امروز ({toPersianDigits(today.day)} {viewMonthTitle.split(" ")[0]})
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
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
