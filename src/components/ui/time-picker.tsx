import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, ChevronUp, Clock3, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { pad2, toPersianDigits } from "@/lib/jalali"
import { cn } from "@/lib/utils"

export interface TimePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
  placeholder?: string
  "aria-label"?: string
}

/** پریست‌های پرکاربرد جلسات */
const QUICK_PRESETS = [
  { label: "۰۸:۰۰", value: "08:00" },
  { label: "۱۰:۰۰", value: "10:00" },
  { label: "۱۴:۰۰", value: "14:00" },
  { label: "۱۶:۰۰", value: "16:00" },
  { label: "۱۷:۳۰", value: "17:30" },
  { label: "۱۹:۰۰", value: "19:00" },
]

/** ۲۴ ساعت کامل */
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => pad2(i))

/** دقایق ۵ دقیقه‌ای */
const ALL_MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
]

function getTimePeriodLabel(hourNum: number): string {
  if (hourNum >= 5 && hourNum < 12) return "صبح"
  if (hourNum >= 12 && hourNum < 15) return "ظهر"
  if (hourNum >= 15 && hourNum < 20) return "عصر"
  return "شب"
}

/**
 * تایم‌پیکر مدرن ۲۴ ساعته با قابلیت تایپ مستقیم کیبورد و انتخابگر گرافیکی بدون اسکرول
 */
export function TimePicker({
  id,
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "۱۶:۰۰",
  "aria-label": ariaLabel,
}: TimePickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // تجزیه ساعت و دقیقه
  const [hour, minute] = useMemo(() => {
    if (!value || !value.includes(":")) return ["16", "00"]
    const parts = value.split(":")
    const h = pad2(Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0)))
    const m = pad2(Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0)))
    return [h, m]
  }, [value])

  const [selectedHour, setSelectedHour] = useState(hour)
  const [selectedMinute, setSelectedMinute] = useState(minute)
  const [activeTab, setActiveTab] = useState<"hours" | "minutes">("hours")
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
  }, [hour, minute])

  // محاسبه موقعیت دقیق بدون بریدگی از لبه‌های صفحه
  const updateCoords = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverWidth = 310
    const popoverHeight = 360

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

  const handleOpen = () => {
    if (disabled) return
    updateCoords()
    setIsOpen(true)
  }

  // بستن پاپ‌اور هنگام کلیک بیرون
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

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    const handleResize = () => updateCoords()

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleResize, true)

    return () => {
      if (pop) {
        pop.removeEventListener("pointerdown", stopNativeCapture, true)
        pop.removeEventListener("mousedown", stopNativeCapture, true)
      }
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleResize, true)
    }
  }, [isOpen])

  // تایپ دستی مستقیم با کیبورد و تبدیل خودکار اعداد فارسی به انگلیسی
  const handleDirectInputChange = (rawVal: string) => {
    const latin = rawVal.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    onChange(latin)
  }

  const handleHourSelect = (h: string) => {
    setSelectedHour(h)
    onChange(`${h}:${selectedMinute}`)
    setActiveTab("minutes") // جهش خودکار به دقیقه برای تجربه روان کاربری
  }

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m)
    onChange(`${selectedHour}:${m}`)
  }

  const handlePresetSelect = (val: string) => {
    const [h, m] = val.split(":")
    setSelectedHour(h)
    setSelectedMinute(m)
    onChange(val)
  }

  const stepHour = (delta: number) => {
    const current = parseInt(selectedHour, 10) || 0
    const next = pad2((current + delta + 24) % 24)
    setSelectedHour(next)
    onChange(`${next}:${selectedMinute}`)
  }

  const stepMinute = (delta: number) => {
    const current = parseInt(selectedMinute, 10) || 0
    const next = pad2((current + delta + 60) % 60)
    setSelectedMinute(next)
    onChange(`${selectedHour}:${next}`)
  }

  const handleSetCurrentTime = () => {
    const now = new Date()
    const currentH = pad2(now.getHours())
    const currentM = pad2(Math.round(now.getMinutes() / 5) * 5 % 60)
    setSelectedHour(currentH)
    setSelectedMinute(currentM)
    onChange(`${currentH}:${currentM}`)
  }

  const hourNum = parseInt(selectedHour, 10)
  const periodLabel = getTimePeriodLabel(hourNum)

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* فیلد ورودی با قابلیت تایپ مستقیم + دکمه باز کردن پاپ‌اور گرافیکی */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={cn(
          "relative flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm shadow-xs transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] focus-within:ring-2 focus-within:ring-ring focus-within:border-primary",
          isOpen && "ring-2 ring-ring border-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock3
            className="h-4 w-4 shrink-0 text-primary cursor-pointer hover:scale-110 transition-transform"
            aria-hidden="true"
          />
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0">
            {periodLabel}
          </span>
        </div>

        {/* فیلد ورودی مستقیم دستی بدون تکرار یا بیرون‌زدگی متن */}
        <input
          id={inputId}
          type="text"
          dir="ltr"
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel ?? "ساعت ۲۴ ساعته"}
          value={value}
          onChange={(e) => handleDirectInputChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-20 min-w-0 bg-transparent text-end font-bold tabular-nums text-sm outline-none focus:outline-none"
        />
      </div>

      {/* پنجره شناور پورتال‌شده بدون اسکرول و با دسترسی فوری */}
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
                e.stopPropagation()
                e.preventDefault()
                setIsOpen(false)
              }}
            />
            <motion.div
              ref={popoverRef}
              data-klasyar-portal="true"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: "310px",
                zIndex: 140,
                pointerEvents: "auto",
              }}
              dir="rtl"
              className="klasyar-popover pointer-events-auto rounded-2xl border border-border/80 bg-popover p-3.5 text-popover-foreground shadow-2xl backdrop-blur-2xl"
              role="dialog"
              aria-label="انتخاب ساعت و دقیقه"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* بخش نمایش بزرگ با استپرهای بالا/پایین ساعت و دقیقه */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-1.5">
                  {/* استپر ساعت */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        stepHour(1)
                      }}
                      className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground active:scale-90"
                      aria-label="افزایش یک ساعت"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveTab("hours")
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-0.5 text-lg font-black tabular-nums transition-colors",
                        activeTab === "hours"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      {toPersianDigits(selectedHour)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        stepHour(-1)
                      }}
                      className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground active:scale-90"
                      aria-label="کاهش یک ساعت"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="text-xl font-bold text-muted-foreground">:</span>

                  {/* استپر دقیقه */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        stepMinute(5)
                      }}
                      className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground active:scale-90"
                      aria-label="افزایش ۵ دقیقه"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveTab("minutes")
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-0.5 text-lg font-black tabular-nums transition-colors",
                        activeTab === "minutes"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      {toPersianDigits(selectedMinute)}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        stepMinute(-5)
                      }}
                      className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground active:scale-90"
                      aria-label="کاهش ۵ دقیقه"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {periodLabel}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* تب‌های انتخاب ساعت یا دقیقه */}
              <div className="flex gap-1 mb-2 bg-muted/40 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveTab("hours")
                  }}
                  className={cn(
                    "flex-1 rounded-lg py-1 text-xs font-bold transition-all",
                    activeTab === "hours"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  انتخاب ساعت (۲۴h)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveTab("minutes")
                  }}
                  className={cn(
                    "flex-1 rounded-lg py-1 text-xs font-bold transition-all",
                    activeTab === "minutes"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  انتخاب دقیقه
                </button>
              </div>

              {/* شبکه گرافیکی بدون نیاز به اسکرول */}
              {activeTab === "hours" ? (
                <div className="grid grid-cols-6 gap-1 p-1 bg-muted/20 rounded-xl border border-border/40">
                  {ALL_HOURS.map((h) => {
                    const isSelected = selectedHour === h
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleHourSelect(h)
                        }}
                        className={cn(
                          "h-7 rounded-md text-xs font-bold tabular-nums transition-all active:scale-90",
                          isSelected
                            ? "bg-primary text-primary-foreground font-black shadow-sm"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {toPersianDigits(h)}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1 p-1 bg-muted/20 rounded-xl border border-border/40">
                  {ALL_MINUTES.map((m) => {
                    const isSelected = selectedMinute === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMinuteSelect(m)
                        }}
                        className={cn(
                          "h-8 rounded-md text-xs font-bold tabular-nums transition-all active:scale-90",
                          isSelected
                            ? "bg-primary text-primary-foreground font-black shadow-sm"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {toPersianDigits(m)}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* تراشه‌های سریع */}
              <div className="mt-2.5 pt-2 border-t border-border/60">
                <span className="block text-[10px] font-medium text-muted-foreground mb-1">
                  زمان‌های متداول کلاس‌ها:
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePresetSelect(p.value)
                      }}
                      className="rounded-md border border-border/70 bg-card/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums hover:border-primary/40 hover:text-foreground active:scale-95"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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
                    handleSetCurrentTime()
                  }}
                  className="h-7 text-xs text-primary gap-1 active:scale-95 px-2"
                >
                  <Sparkles className="h-3 w-3" />
                  زمان فعلی
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  className="h-7 text-xs px-3 font-bold glow-effect"
                >
                  <Check className="h-3.5 w-3.5 me-1" />
                  تأیید
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
