import { useEffect, useState } from "react"
import { Loader2, Trash2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteClassDefinition,
  getClassDefinitionDeleteImpact,
  type ClassDefinitionDeleteImpact,
} from "@/db/classDefinitions"
import { getDatabaseErrorMessage } from "@/db/errors"
import type { ClassDefinition } from "@/db/schema"
import { useToast } from "@/hooks/use-toast"
import { toPersianDigits } from "@/lib/jalali"

interface DeleteClassDialogProps {
  definition: ClassDefinition
  onClose: () => void
}

/** تأیید حذف کلاس؛ جلسه‌ها و رکوردهای حضور آن هم پاک می‌شوند. */
export function DeleteClassDialog({
  definition,
  onClose,
}: DeleteClassDialogProps) {
  const { toast } = useToast()
  const [impact, setImpact] = useState<ClassDefinitionDeleteImpact | undefined>(
    undefined,
  )
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getClassDefinitionDeleteImpact(definition.id)
      .then((result) => {
        if (active) setImpact(result)
      })
      .catch((impactError) => {
        if (active) setError(getDatabaseErrorMessage(impactError))
      })
    return () => {
      active = false
    }
  }, [definition.id])

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const result = await deleteClassDefinition(definition.id, {
        cascade: true,
      })
      toast({
        title: "کلاس حذف شد",
        description:
          result.deletedSessions > 0
            ? `«${definition.title}» و ${toPersianDigits(
                result.deletedSessions,
              )} جلسه آن حذف شد.`
            : `«${definition.title}» از فهرست کلاس‌ها حذف شد.`,
      })
      onClose()
    } catch (deleteError) {
      setError(getDatabaseErrorMessage(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !deleting) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف کلاس</DialogTitle>
          <DialogDescription>
            «{definition.title}» برای همیشه از فهرست کلاس‌ها حذف می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div
          role="alert"
          className="space-y-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-6 text-destructive"
        >
          <p className="flex items-start gap-2 font-bold">
            <TriangleAlert
              className="mt-1 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            جلسات این کلاس هم حذف می‌شوند
          </p>
          <p className="text-destructive/90">
            {impact === undefined ? (
              "در حال شمارش جلسه‌های این کلاس…"
            ) : impact.sessions > 0 ? (
              <>
                با تأیید حذف، {toPersianDigits(impact.sessions)} جلسه
                {impact.attendance > 0
                  ? ` و ${toPersianDigits(impact.attendance)} رکورد حضور`
                  : ""}{" "}
                مربوط به این کلاس هم پاک می‌شود. این کار برگشت‌پذیر نیست.
              </>
            ) : (
              "این کلاس هنوز جلسه‌ای ندارد؛ فقط تعریف کلاس حذف می‌شود. این کار برگشت‌پذیر نیست."
            )}
          </p>
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
              <>
                <Trash2 aria-hidden="true" />
                حذف کلاس و جلسه‌ها
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
