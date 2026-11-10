import { useMemo, useState, type FormEvent } from "react"
import {
  Check,
  Loader2,
  Plus,
  TriangleAlert,
  UserRound,
  X,
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
import { Switch } from "@/components/ui/switch"
import {
  createClassDefinition,
  updateClassDefinition,
  type StudentInput,
} from "@/db/classDefinitions"
import { generateClassSessions } from "@/db/sessions"
import { getDatabaseErrorMessage } from "@/db/errors"
import {
  DAYS_OF_WEEK,
  DAY_OF_WEEK_LABELS,
  type ClassDefinition,
  type DayOfWeek,
} from "@/db/schema"
import { useToast } from "@/hooks/use-toast"
import { toPersianDigits } from "@/lib/jalali"
import { cn } from "@/lib/utils"

import {
  CLASS_COLORS,
  randomClassColor,
  tintColor,
  toColorInputValue,
} from "./class-palette"

const MAX_TOTAL_SESSIONS = 200

interface ClassFormDialogProps {
  /** کلاس در حال ویرایش؛ `null` یعنی ساخت کلاس تازه. */
  definition: ClassDefinition | null
  /** فهرست کلاس‌های موجود برای هشدار عنوان تکراری. */
  definitions: readonly ClassDefinition[]
  onClose: () => void
}

/** فرم کامل افزودن/ویرایش تعریف کلاس. */
export function ClassFormDialog({
  definition,
  definitions,
  onClose,
}: ClassFormDialogProps) {
  const { toast } = useToast()
  const isEditing = definition !== null

  const [title, setTitle] = useState(definition?.title ?? "")
  const [color, setColor] = useState(
    () => definition?.color ?? randomClassColor(),
  )
  const [days, setDays] = useState<DayOfWeek[]>(
    () => definition?.daysOfWeek ?? [],
  )
  const [totalSessions, setTotalSessions] = useState(
    () => String(definition?.totalSessions ?? 12),
  )
  const [start, setStart] = useState(definition?.defaultStart ?? "16:00")
  const [end, setEnd] = useState(definition?.defaultEnd ?? "17:30")
  const [students, setStudents] = useState<StudentInput[]>(() =>
    definition && definition.students.length > 0
      ? definition.students.map((student) => ({
          id: student.id,
          name: student.name,
        }))
      : [{ name: "" }],
  )
  const [autoGenerateSessions, setAutoGenerateSessions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedTitle = title.trim()
  const duplicateTitle = useMemo(() => {
    if (!trimmedTitle) return false
    const target = trimmedTitle.toLocaleLowerCase("fa")
    return definitions.some(
      (item) =>
        item.id !== definition?.id &&
        item.title.trim().toLocaleLowerCase("fa") === target,
    )
  }, [definitions, definition?.id, trimmedTitle])

  const studentCount = students.filter(
    (student) => student.name.trim().length > 0,
  ).length

  const toggleDay = (day: DayOfWeek) => {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    )
  }

  const addStudent = () =>
    setStudents((current) => [...current, { name: "" }])

  const updateStudent = (index: number, name: string) => {
    setStudents((current) =>
      current.map((student, position) =>
        position === index ? { ...student, name } : student,
      ),
    )
  }

  const removeStudent = (index: number) => {
    setStudents((current) =>
      current.filter((_, position) => position !== index),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsedSessions = Number(totalSessions)

    if (!trimmedTitle) {
      setError("عنوان کلاس الزامی است.")
      return
    }
    if (days.length === 0) {
      setError("حداقل یک روز هفته را انتخاب کنید.")
      return
    }
    if (
      !Number.isInteger(parsedSessions) ||
      parsedSessions < 1 ||
      parsedSessions > MAX_TOTAL_SESSIONS
    ) {
      setError(
        `تعداد جلسات باید عددی صحیح بین ۱ تا ${MAX_TOTAL_SESSIONS} باشد.`,
      )
      return
    }
    if (start >= end) {
      setError("ساعت پایان باید بعد از ساعت شروع باشد.")
      return
    }

    const payload = {
      title: trimmedTitle,
      color,
      daysOfWeek: days,
      totalSessions: parsedSessions,
      defaultStart: start,
      defaultEnd: end,
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
      })),
    }

    setSaving(true)
    try {
      if (definition) {
        await updateClassDefinition(definition.id, payload)
        toast({
          title: "کلاس ذخیره شد",
          description: `تغییرهای «${trimmedTitle}» اعمال شد.`,
        })
      } else {
        const created = await createClassDefinition(payload)
        let generatedCount = 0
        if (
          autoGenerateSessions &&
          created.daysOfWeek.length > 0 &&
          created.totalSessions > 0
        ) {
          const sessions = await generateClassSessions(created.id, {
            count: created.totalSessions,
          })
          generatedCount = sessions.length
        }
        toast({
          title: "کلاس ساخته شد",
          description:
            generatedCount > 0
              ? `«${trimmedTitle}» و ${toPersianDigits(
                  generatedCount,
                )} جلسه آن در تقویم ساخته شد.`
              : `«${trimmedTitle}» به فهرست کلاس‌ها اضافه شد.`,
        })
      }
      onClose()
    } catch (submitError) {
      setError(getDatabaseErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ویرایش کلاس" : "کلاس جدید"}
          </DialogTitle>
          <DialogDescription>
            عنوان، رنگ و برنامه هفتگی کلاس را مشخص کنید؛ جلسه‌ها با همین رنگ در
            تقویم دیده می‌شوند.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="class-title" className="text-xs font-medium">
              عنوان کلاس
            </label>
            <Input
              id="class-title"
              value={title}
              maxLength={120}
              autoFocus
              placeholder="مثلاً ریاضی پایه دهم"
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={!trimmedTitle}
            />
            {duplicateTitle ? (
              <p
                role="status"
                className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-5 text-amber-700 dark:text-amber-400"
              >
                <TriangleAlert
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                کلاسی با همین عنوان از قبل وجود دارد؛ ذخیره مجاز است اما
                ممکن است در تقویم اشتباه گرفته شود.
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium">رنگ کلاس</legend>
            <div className="flex flex-wrap items-center gap-2">
              {CLASS_COLORS.map((item) => {
                const selected = color.toLowerCase() === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-label={item.label}
                    aria-pressed={selected}
                    title={item.label}
                    onClick={() => setColor(item.value)}
                    className={cn(
                      "h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "scale-110 ring-2 ring-ring"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: item.value }}
                  />
                )
              })}
              <label className="ms-1 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                رنگ دلخواه
                <input
                  type="color"
                  value={toColorInputValue(color)}
                  onChange={(event) => setColor(event.target.value)}
                  aria-label="انتخاب رنگ دلخواه"
                  className="h-8 w-12 cursor-pointer rounded-md border border-input bg-background p-0.5"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-2">
              <span
                aria-hidden="true"
                className="h-6 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="truncate rounded-md border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: tintColor(color, 0.12),
                  borderColor: tintColor(color, 0.4),
                }}
              >
                {trimmedTitle || "پیش‌نمایش عنوان کلاس"}
              </span>
              <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">
                پیش‌نمایش
              </span>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">
              روزهای هفته{" "}
              <span className="font-normal text-muted-foreground">
                (حداقل یک روز)
              </span>
            </legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DAYS_OF_WEEK.map((day) => {
                const active = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "flex h-10 items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {active ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                    {DAY_OF_WEEK_LABELS[day]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="class-total-sessions"
                className="text-xs font-medium"
              >
                تعداد کل جلسات
              </label>
              <Input
                id="class-total-sessions"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_TOTAL_SESSIONS}
                step={1}
                dir="ltr"
                value={totalSessions}
                onChange={(event) => setTotalSessions(event.target.value)}
                className="text-center tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="class-start" className="text-xs font-medium">
                ساعت شروع
              </label>
              <Input
                id="class-start"
                type="time"
                required
                dir="ltr"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="text-center tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="class-end" className="text-xs font-medium">
                ساعت پایان
              </label>
              <Input
                id="class-end"
                type="time"
                required
                dir="ltr"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="text-center tabular-nums"
              />
            </div>
          </div>

          {!isEditing ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium">
                  ایجاد خودکار جلسات در تقویم
                </span>
                <p className="text-[11px] text-muted-foreground">
                  جلسه‌ها بر اساس روزهای هفته و تعداد کل جلسات در تقویم ثبت شوند.
                </p>
              </div>
              <Switch
                checked={autoGenerateSessions}
                onCheckedChange={setAutoGenerateSessions}
                aria-label="ایجاد خودکار جلسات در تقویم"
              />
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="mb-2 w-full text-xs font-medium">
              لیست شاگردها{" "}
              <span className="font-normal text-muted-foreground">
                · تعداد شاگرد: {toPersianDigits(studentCount)}
              </span>
            </legend>

            {students.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
                هنوز شاگردی اضافه نشده است.
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto pe-1">
                {students.map((student, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-bold tabular-nums text-muted-foreground"
                    >
                      {toPersianDigits(index + 1)}
                    </span>
                    <Input
                      value={student.name}
                      placeholder="نام و نام خانوادگی شاگرد"
                      aria-label={`نام شاگرد ${toPersianDigits(index + 1)}`}
                      onChange={(event) =>
                        updateStudent(index, event.target.value)
                      }
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`حذف ${
                        student.name.trim() || "این شاگرد"
                      } از فهرست`}
                      onClick={() => removeStudent(index)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStudent}
              className="w-full border-dashed"
            >
              <Plus aria-hidden="true" />
              افزودن شاگرد
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              ردیف‌های بی‌نام ذخیره نمی‌شوند.
            </p>
          </fieldset>

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
              ) : isEditing ? (
                "ذخیره تغییرات"
              ) : (
                "ساخت کلاس"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
