import { useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Database,
  FileCheck2,
  GraduationCap,
  Loader2,
  RefreshCw,
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
import { formatLastBackupDate, type KlasYarBackupPayload } from "@/lib/backup"
import { toPersianDigits } from "@/lib/jalali"
import { cn } from "@/lib/utils"

interface RestoreBackupDialogProps {
  open: boolean
  payload: KlasYarBackupPayload | null
  onClose: () => void
  onConfirm: (mode: "replace" | "merge") => Promise<void>
}

export function RestoreBackupDialog({
  open,
  payload,
  onClose,
  onConfirm,
}: RestoreBackupDialogProps) {
  const [mode, setMode] = useState<"replace" | "merge">("replace")
  const [restoring, setRestoring] = useState(false)

  if (!payload) return null

  const handleConfirm = async () => {
    setRestoring(true)
    try {
      await onConfirm(mode)
      onClose()
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !restoring) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-5 w-5 text-primary" aria-hidden="true" />
            بازیابی اطلاعات از فایل پشتیبان
          </DialogTitle>
          <DialogDescription>
            مشخصات فایل پشتیبان را بررسی کنید و حالت بازیابی را انتخاب نمایید.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* کارت مشخصات فایل پشتیبان */}
          <div className="space-y-2.5 rounded-2xl border bg-muted/30 p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">تاریخ ایجاد پشتیبان:</span>
              <span className="font-bold">
                {formatLastBackupDate(payload.exportedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">نسخه اسکیما:</span>
              <span className="font-bold tabular-nums">
                نسخه {toPersianDigits(payload.schemaVersion)}
              </span>
            </div>

            {/* آمار اقلام موجود در فایل */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-xl border bg-background/80 p-2">
                <GraduationCap className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground">کلاس‌ها</p>
                <p className="font-bold tabular-nums">
                  {toPersianDigits(payload.stats.classesCount)}
                </p>
              </div>
              <div className="rounded-xl border bg-background/80 p-2">
                <CalendarDays className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
                <p className="text-[10px] text-muted-foreground">جلسات</p>
                <p className="font-bold tabular-nums">
                  {toPersianDigits(payload.stats.sessionsCount)}
                </p>
              </div>
              <div className="rounded-xl border bg-background/80 p-2">
                <FileCheck2 className="mx-auto mb-1 h-4 w-4 text-sky-600" />
                <p className="text-[10px] text-muted-foreground">حضور و غیاب</p>
                <p className="font-bold tabular-nums">
                  {toPersianDigits(payload.stats.attendanceCount)}
                </p>
              </div>
            </div>
          </div>

          {/* انتخاب حالت بازیابی */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-foreground">
              انتخاب شیوه بازیابی:
            </label>

            <div className="grid gap-2">
              {/* حالت ۱: جایگزینی کامل */}
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-start transition-all",
                  mode === "replace"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/70 hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    mode === "replace"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {mode === "replace" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold">
                    جایگزینی کامل (Replace) — پیشنهادی
                  </p>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    داده‌های فعلی دیتابیس پاک شده و دقیقاً اطلاعات موجود در فایل پشتیبان مستقر می‌شود.
                  </p>
                </div>
              </button>

              {/* حالت ۲: ادغام هوشمند */}
              <button
                type="button"
                onClick={() => setMode("merge")}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-start transition-all",
                  mode === "merge"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/70 hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    mode === "merge"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
                  )}
                >
                  {mode === "merge" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold">
                    ادغام با داده‌های فعلی (Merge)
                  </p>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    داده‌های موجود حفظ می‌شوند؛ کلاس‌ها و جلسات فایل پشتیبان به داده‌های برنامه اضافه یا به‌روزرسانی می‌شوند.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* پیام هشدار برای جایگزینی کامل */}
          {mode === "replace" ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                هشدار: در حالت جایگزینی، تمام کلاس‌ها، جلسات و رکوردهای حضور فعلی حذف شده و با فایل پشتیبان جایگزین خواهند شد.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                در حالت ادغام، اطلاعات فعلی شما پاک نمی‌شود و تنها رکوردهای هم‌شناسه به‌روز خواهند شد.
              </span>
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={restoring}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant={mode === "replace" ? "destructive" : "default"}
            disabled={restoring}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            {restoring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال بازیابی…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                تأیید و شروع بازیابی
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
