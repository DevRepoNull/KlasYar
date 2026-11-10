import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  Clock3,
  Loader2,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  type ClassDefinition,
  type Session,
  type SessionStatus,
} from "@/db/schema"
import { useClassSessionCount } from "@/db/hooks"
import {
  createSession,
  findOverlappingSession,
  updateSession,
} from "@/db/sessions"
import { getDatabaseErrorMessage } from "@/db/errors"
import { notifySessionCreated } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import {
  formatJalaliFullDate,
  jalaliDateToString,
  parseJalaliDate,
  todayJalali,
  toPersianDigits,
} from "@/lib/jalali"

interface SessionFormDialogProps {
  open: boolean
  session: Session | null
  initialDate?: string | null
  initialDefinitionId?: string | null
  definitions: readonly ClassDefinition[]
  onClose: () => void
}

export function SessionFormDialog({
  open,
  session,
  initialDate,
  initialDefinitionId,
  definitions,
  onClose,
}: SessionFormDialogProps) {
  const { toast } = useToast()
  const isEditing = session !== null
  const todayStr = useMemo(() => jalaliDateToString(todayJalali()), [])

  const [definitionId, setDefinitionId] = useState<string>(
    () => session?.definitionId ?? initialDefinitionId ?? definitions[0]?.id ?? "",
  )
  const [date, setDate] = useState(() => session?.date ?? initialDate ?? todayStr)
  const [start, setStart] = useState(() => session?.start ?? "16:00")
  const [end, setEnd] = useState(() => session?.end ?? "17:30")
  const [status, setStatus] = useState<SessionStatus>(() => session?.status ?? "scheduled")
  const [note, setNote] = useState(() => session?.note ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overlapping, setOverlapping] = useState<Session | null>(null)

  // شمارنده و بررسی سقف جلسات کلاس انتخابی؛ در حالت ویرایش جلسه فعلی از شمارش کسر می‌شود
  const limitInfo = useClassSessionCount(definitionId, session?.id)
  const isLimitReached = Boolean(limitInfo?.isFull)

  const selectedClass = useMemo(
    () => definitions.find((d) => d.id === definitionId),
    [definitions, definitionId],
  )

  useEffect(() => {
    if (session) {
      setDefinitionId(session.definitionId)
      setDate(session.date)
      setStart(session.start)
      setEnd(session.end)
      setStatus(session.status)
      setNote(session.note)
      setError(null)
    } else {
      const initialId = initialDefinitionId ?? definitions[0]?.id ?? ""
      setDefinitionId(initialId)
      setDate(initialDate ?? todayStr)
      const def = definitions.find((d) => d.id === initialId)
      setStart(def?.defaultStart ?? "16:00")
      setEnd(def?.defaultEnd ?? "17:30")
      setStatus("scheduled")
      setNote("")
      setError(null)
    }
  }, [session, initialDate, initialDefinitionId, definitions, todayStr])

  // هنگام تغییر کلاس، ساعت پیش‌فرض تغییر می‌کند
  const handleClassChange = (newId: string) => {
    setDefinitionId(newId)
    const def = definitions.find((d) => d.id === newId)
    if (def && !isEditing) {
      setStart(def.defaultStart)
      setEnd(def.defaultEnd)
    }
  }

  // اعتبارسنجی همپوشانی زمانی به صورت بلادرنگ
  useEffect(() => {
    if (!date || !start || !end || start >= end) {
      setOverlapping(null)
      return
    }

    let active = true
    findOverlappingSession(date, start, end, session?.id)
      .then((res) => {
        if (active) setOverlapping(res ?? null)
      })
      .catch(() => {
        if (active) setOverlapping(null)
      })

    return () => {
      active = false
    }
  }, [date, start, end, session?.id])

  const isTimeInvalid = Boolean(start && end && start >= end)

  const conflictingClass = useMemo(() => {
    if (!overlapping) return null
    return definitions.find((d) => d.id === overlapping.definitionId)
  }, [definitions, overlapping])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!definitionId) {
      setError("لطفاً کلاس را انتخاب کنید.")
      return
    }

    if (isTimeInvalid) {
      setError("ساعت پایان باید بعد از ساعت شروع باشد.")
      return
    }

    if (isLimitReached) {
      setError("سقف جلسات این کلاس تکمیل شده است.")
      return
    }

    if (overlapping) {
      setError("این بازه زمانی با جلسه دیگری تداخل دارد.")
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await updateSession(session.id, {
          definitionId,
          date,
          start,
          end,
          status,
          note,
        })
        toast({
          title: "جلسه به‌روزرسانی شد",
          description: `تغییرهای جلسه در تاریخ ${date} با موفقیت ذخیره شد.`,
        })
      } else {
        await createSession({
          definitionId,
          date,
          start,
          end,
          status,
          note,
        })
        const classTitle = selectedClass?.title ?? "کلاس"
        notifySessionCreated(classTitle, date, `${start} تا ${end}`)
        toast({
          title: "جلسه ساخته شد",
          description: `جلسه برای «${classTitle}» در تاریخ ${date} ثبت شد.`,
        })
      }
      onClose()
    } catch (submitError) {
      setError(getDatabaseErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen && !saving) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ویرایش جلسه" : "ثبت جلسه جدید"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `ویرایش ساعت، وضعیت و یادداشت جلسه «${selectedClass?.title ?? "کلاس"}»`
              : "کلاس، تاریخ و ساعت جلسه را انتخاب کنید؛ پس از ساخت روی تقویم نمایش داده می‌شود."}
          </DialogDescription>
        </DialogHeader>

        {definitions.length === 0 ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              ابتدا باید حداقل یک کلاس تعریف کنید تا بتوانید برای آن جلسه ثبت کنید.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                بستن
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="session-form-class"
                  className="text-xs font-medium"
                >
                  کلاس
                </label>
                {limitInfo ? (
                  <Badge
                    variant={limitInfo.isFull ? "destructive" : "secondary"}
                    className="gap-1 text-[11px] tabular-nums"
                  >
                    جلسه {toPersianDigits(limitInfo.count)} از {toPersianDigits(limitInfo.total)}
                  </Badge>
                ) : null}
              </div>
              <Select
                value={definitionId}
                onValueChange={handleClassChange}
                disabled={isEditing}
              >
                <SelectTrigger id="session-form-class" aria-label="انتخاب کلاس">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {definitions.map((def) => (
                    <SelectItem key={def.id} value={def.id}>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: def.color }}
                        />
                        <span>{def.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* هشدار سقف جلسات */}
            {isLimitReached ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-5 text-destructive"
              >
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  سقف جلسات این کلاس تکمیل شده است ({toPersianDigits(limitInfo?.count ?? 0)} از{" "}
                  {toPersianDigits(limitInfo?.total ?? 0)} جلسه ثبت شده). برای ثبت جلسه تازه، ابتدا باید یکی از جلسات گذشته را حذف کنید یا سقف جلسات کلاس را افزایش دهید.
                </span>
              </p>
            ) : null}

            <div className="space-y-1.5">
              <label
                htmlFor="session-form-date"
                className="flex items-center justify-between text-xs font-medium"
              >
                <span>تاریخ جلسه (شمسی YYYY-MM-DD)</span>
                {date ? (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {(() => {
                      try {
                        return formatJalaliFullDate(parseJalaliDate(date))
                      } catch {
                        return null
                      }
                    })()}
                  </span>
                ) : null}
              </label>
              <div className="relative">
                <Input
                  id="session-form-date"
                  dir="ltr"
                  placeholder="1405-08-17"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className="text-center tabular-nums"
                />
                <CalendarDays
                  className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="session-form-start"
                  className="text-xs font-medium"
                >
                  ساعت شروع
                </label>
                <div className="relative">
                  <Input
                    id="session-form-start"
                    type="time"
                    required
                    dir="ltr"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    className="text-center tabular-nums"
                  />
                  <Clock3
                    className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="session-form-end"
                  className="text-xs font-medium"
                >
                  ساعت پایان
                </label>
                <div className="relative">
                  <Input
                    id="session-form-end"
                    type="time"
                    required
                    dir="ltr"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    className="text-center tabular-nums"
                  />
                  <Clock3
                    className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* هشدار نامعتبر بودن زمان */}
            {isTimeInvalid ? (
              <p
                role="status"
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                ساعت پایان باید بعد از ساعت شروع باشد.
              </p>
            ) : null}

            {/* هشدار همپوشانی زمانی */}
            {overlapping ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs leading-5 text-destructive"
              >
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  تداخل زمانی: این بازه با جلسه{" "}
                  {conflictingClass
                    ? `کلاس «${conflictingClass.title}»`
                    : "دیگری"}{" "}
                  در ساعت {overlapping.start} تا {overlapping.end} تداخل دارد.
                </span>
              </p>
            ) : null}

            <div className="space-y-1.5">
              <label
                htmlFor="session-form-status"
                className="text-xs font-medium"
              >
                وضعیت جلسه
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as SessionStatus)}
              >
                <SelectTrigger id="session-form-status" aria-label="وضعیت جلسه">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATUSES.map((val) => (
                    <SelectItem key={val} value={val}>
                      {SESSION_STATUS_LABELS[val]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="session-form-note"
                className="text-xs font-medium"
              >
                یادداشت (اختیاری)
              </label>
              <Input
                id="session-form-note"
                value={note}
                placeholder="مثلاً فصل دوم ریاضی، تمرین‌های صفحه ۳۰"
                maxLength={1000}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
              >
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  isLimitReached ||
                  isTimeInvalid ||
                  overlapping !== null
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    در حال ذخیره…
                  </>
                ) : isEditing ? (
                  "ذخیره تغییرات"
                ) : (
                  "ثبت جلسه"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
