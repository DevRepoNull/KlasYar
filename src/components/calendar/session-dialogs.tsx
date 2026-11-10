import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  Loader2,
  TriangleAlert,
} from "lucide-react"

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
import {
  createSession,
  deleteSession,
  updateSession,
} from "@/db/sessions"
import { getDatabaseErrorMessage } from "@/db/errors"
import { notifySessionDeleted } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import {
  formatClock,
  formatJalaliFullDate,
  jalaliDateToString,
  parseJalaliDate,
  todayJalali,
} from "@/lib/jalali"

interface EditSessionDialogProps {
  session: Session | null
  definition: ClassDefinition | undefined
  onClose: () => void
}

/** ویرایش سریع ساعت، وضعیت و یادداشت یک جلسه از پنل روز. */
export function EditSessionDialog({
  session,
  definition,
  onClose,
}: EditSessionDialogProps) {
  const { toast } = useToast()
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [status, setStatus] = useState<SessionStatus>("scheduled")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    setStart(session.start)
    setEnd(session.end)
    setStatus(session.status)
    setNote(session.note)
    setError(null)
    setSaving(false)
  }, [session])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return

    setSaving(true)
    setError(null)
    try {
      await updateSession(session.id, { start, end, status, note })
      toast({
        title: "جلسه ذخیره شد",
        description: `${definition?.title ?? "جلسه"} در ${formatJalaliFullDate(
          parseJalaliDate(session.date),
        )} به‌روزرسانی شد.`,
      })
      onClose()
    } catch (submitError) {
      setError(getDatabaseErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  // وقتی جلسه پاک می‌شود، دیالوگ کاملاً از DOM خارج می‌شود تا لایه‌ی مودال
  // نیمه‌کاره (با محتوای خالی) روی صفحه گیر نکند.
  if (!session) return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویرایش جلسه</DialogTitle>
              <DialogDescription>
                {definition?.title ?? "جلسه"} ·{" "}
                {formatJalaliFullDate(parseJalaliDate(session.date))}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  htmlFor="edit-session-start"
                  className="space-y-1.5 text-xs font-medium"
                >
                  <span>ساعت شروع</span>
                  <Input
                    id="edit-session-start"
                    type="time"
                    required
                    dir="ltr"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    className="text-center tabular-nums"
                  />
                </label>
                <label
                  htmlFor="edit-session-end"
                  className="space-y-1.5 text-xs font-medium"
                >
                  <span>ساعت پایان</span>
                  <Input
                    id="edit-session-end"
                    type="time"
                    required
                    dir="ltr"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    className="text-center tabular-nums"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-session-status"
                  className="text-xs font-medium"
                >
                  وضعیت جلسه
                </label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as SessionStatus)}
                >
                  <SelectTrigger id="edit-session-status" aria-label="وضعیت جلسه">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {SESSION_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-session-note"
                  className="text-xs font-medium"
                >
                  یادداشت
                </label>
                <Input
                  id="edit-session-note"
                  value={note}
                  placeholder="یادداشت کوتاه برای این جلسه"
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                جلسه در بازه {formatClock(session.start)} تا{" "}
                {formatClock(session.end)} ثبت شده است؛ تغییر ساعت پس از ذخیره
                روی تقویم هم اعمال می‌شود.
              </p>

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
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      در حال ذخیره…
                    </>
                  ) : (
                    "ذخیره تغییرات"
                  )}
                </Button>
              </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteSessionDialogProps {
  session: Session | null
  definition: ClassDefinition | undefined
  onClose: () => void
}

/** تأیید حذف جلسه؛ رکوردهای حضور همان جلسه هم حذف می‌شوند. */
export function DeleteSessionDialog({
  session,
  definition,
  onClose,
}: DeleteSessionDialogProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDeleting(false)
    setError(null)
  }, [session])

  const handleDelete = async () => {
    if (!session) return

    setDeleting(true)
    setError(null)
    try {
      await deleteSession(session.id)
      const classTitle = definition?.title ?? "جلسه"
      notifySessionDeleted(
        classTitle,
        session.date,
        `${session.start} تا ${session.end}`,
      )
      toast({
        title: "جلسه حذف شد",
        description: `${classTitle} از تقویم حذف شد.`,
      })
      onClose()
    } catch (deleteError) {
      setError(getDatabaseErrorMessage(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  if (!session) return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف جلسه</DialogTitle>
              <DialogDescription>
                {definition?.title ?? "جلسه"} ·{" "}
                {formatJalaliFullDate(parseJalaliDate(session.date))} ·{" "}
                {formatClock(session.start)} تا {formatClock(session.end)}
              </DialogDescription>
            </DialogHeader>

            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-6 text-destructive">
              این جلسه و رکوردهای حضور ثبت‌شده برای آن حذف می‌شوند. این کار
              برگشت‌پذیر نیست.
            </p>

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
                disabled={deleting}
              >
                انصراف
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    در حال حذف…
                  </>
                ) : (
                  "حذف جلسه"
                )}
              </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ساخت جلسه جدید                               */
/* -------------------------------------------------------------------------- */

interface CreateSessionDialogProps {
  open: boolean
  initialDate?: string | null
  definitions: readonly ClassDefinition[]
  onClose: () => void
}

export function CreateSessionDialog({
  open,
  initialDate,
  definitions,
  onClose,
}: CreateSessionDialogProps) {
  const { toast } = useToast()
  const todayStr = useMemo(() => jalaliDateToString(todayJalali()), [])
  const [definitionId, setDefinitionId] = useState<string>(
    () => definitions[0]?.id ?? "",
  )
  const [date, setDate] = useState(() => initialDate ?? todayStr)
  const [start, setStart] = useState("16:00")
  const [end, setEnd] = useState("17:30")
  const [status, setStatus] = useState<SessionStatus>("scheduled")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialDate) setDate(initialDate)
  }, [initialDate])

  useEffect(() => {
    if (!definitionId && definitions.length > 0) {
      setDefinitionId(definitions[0].id)
    }
  }, [definitions, definitionId])

  // هنگام تغییر کلاس، ساعت پیش‌فرض آن تنظیم می‌شود
  const handleClassChange = (selectedId: string) => {
    setDefinitionId(selectedId)
    const def = definitions.find((d) => d.id === selectedId)
    if (def) {
      setStart(def.defaultStart)
      setEnd(def.defaultEnd)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!definitionId) {
      setError("لطفاً کلاس را انتخاب کنید.")
      return
    }

    if (start >= end) {
      setError("ساعت پایان باید بعد از ساعت شروع باشد.")
      return
    }

    setSaving(true)
    try {
      await createSession({
        definitionId,
        date,
        start,
        end,
        status,
        note,
      })
      const selectedClass = definitions.find((d) => d.id === definitionId)
      toast({
        title: "جلسه ساخته شد",
        description: `جلسه برای «${selectedClass?.title ?? "کلاس"}» در ${date} ثبت شد.`,
      })
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>افزودن جلسه جدید</DialogTitle>
          <DialogDescription>
            کلاس، تاریخ و ساعت جلسه را انتخاب کنید؛ پس از ساخت، روی تقویم نمایش داده می‌شود.
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
              <label htmlFor="create-session-class" className="text-xs font-medium">
                کلاس
              </label>
              <Select value={definitionId} onValueChange={handleClassChange}>
                <SelectTrigger id="create-session-class" aria-label="انتخاب کلاس">
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
                        {def.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-session-date" className="text-xs font-medium">
                تاریخ جلسه (شمسی YYYY-MM-DD)
              </label>
              <Input
                id="create-session-date"
                dir="ltr"
                placeholder="1405-08-17"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="text-center tabular-nums"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label
                htmlFor="create-session-start"
                className="space-y-1.5 text-xs font-medium"
              >
                <span>ساعت شروع</span>
                <Input
                  id="create-session-start"
                  type="time"
                  required
                  dir="ltr"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="text-center tabular-nums"
                />
              </label>
              <label
                htmlFor="create-session-end"
                className="space-y-1.5 text-xs font-medium"
              >
                <span>ساعت پایان</span>
                <Input
                  id="create-session-end"
                  type="time"
                  required
                  dir="ltr"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="text-center tabular-nums"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="create-session-status"
                className="text-xs font-medium"
              >
                وضعیت جلسه
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as SessionStatus)}
              >
                <SelectTrigger id="create-session-status" aria-label="وضعیت جلسه">
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
              <label htmlFor="create-session-note" className="text-xs font-medium">
                یادداشت (اختیاری)
              </label>
              <Input
                id="create-session-note"
                value={note}
                placeholder="یادداشت برای این جلسه"
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
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    در حال ثبت…
                  </>
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

/* -------------------------------------------------------------------------- */
/*                               حضور و غیاب جلسه                              */
/* -------------------------------------------------------------------------- */

export { SessionAttendanceDialog } from "@/components/attendance/session-attendance-dialog"
