import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { BookOpen, Plus, Users } from "lucide-react"

import {
  ClassCard,
  classListVariants,
} from "@/components/classes/class-card"
import { ClassFormDialog } from "@/components/classes/class-form-dialog"
import { DeleteClassDialog } from "@/components/classes/delete-class-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useClassDefinitions } from "@/db/hooks"
import type { ClassDefinition } from "@/db/schema"
import { toPersianDigits } from "@/lib/jalali"

interface FormState {
  open: boolean
  definition: ClassDefinition | null
}

const CLOSED_FORM: FormState = { open: false, definition: null }

export default function ClassesPage() {
  const definitions = useClassDefinitions()
  const prefersReducedMotion = useReducedMotion() ?? false
  const [formState, setFormState] = useState<FormState>(CLOSED_FORM)
  const [deleteTarget, setDeleteTarget] =
    useState<ClassDefinition | null>(null)

  const studentTotal = useMemo(
    () =>
      (definitions ?? []).reduce(
        (total, definition) => total + definition.students.length,
        0,
      ),
    [definitions],
  )

  const openCreate = () => setFormState({ open: true, definition: null })
  const openEdit = (definition: ClassDefinition) =>
    setFormState({ open: true, definition })
  const closeForm = () => setFormState(CLOSED_FORM)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            کلاس‌ها
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            کلاس‌ها را با رنگ اختصاصی، روزهای هفته و فهرست شاگردها تعریف کنید؛
            جلسه‌ها و حضور و غیاب از همین تعریف‌ها ساخته می‌شوند.
          </p>
        </div>

        <Button type="button" onClick={openCreate} className="gap-2 glow-effect">
          <Plus aria-hidden="true" />
          کلاس جدید
        </Button>
      </div>

      {definitions === undefined ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-hidden="true"
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border bg-muted/30"
            />
          ))}
        </div>
      ) : definitions.length === 0 ? (
        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background text-muted-foreground ring-1 ring-border">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold">هنوز کلاسی تعریف نشده است</p>
            <p className="max-w-sm text-xs leading-6 text-muted-foreground">
              اولین کلاس را با عنوان، رنگ و روزهای هفته بسازید تا در تقویم و
              بخش جلسات دیده شود.
            </p>
            <Button type="button" onClick={openCreate} className="mt-1 gap-2 glow-effect">
              <Plus aria-hidden="true" />
              ساخت اولین کلاس
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="secondary" className="gap-1 tabular-nums">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {toPersianDigits(definitions.length)} کلاس
            </Badge>
            <Badge variant="secondary" className="gap-1 tabular-nums">
              <Users className="h-3 w-3" aria-hidden="true" />
              {toPersianDigits(studentTotal)} شاگرد
            </Badge>
            <span>برای ویرایش یا حذف، از دکمه‌های هر کارت استفاده کنید.</span>
          </div>

          <motion.div
            variants={prefersReducedMotion ? undefined : classListVariants}
            initial={prefersReducedMotion ? false : "hidden"}
            animate="show"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {definitions.map((definition) => (
              <ClassCard
                key={definition.id}
                definition={definition}
                onEdit={() => openEdit(definition)}
                onDelete={() => setDeleteTarget(definition)}
              />
            ))}
          </motion.div>
        </>
      )}

      {formState.open ? (
        <ClassFormDialog
          key={formState.definition?.id ?? "new"}
          definition={formState.definition}
          definitions={definitions ?? []}
          onClose={closeForm}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteClassDialog
          key={deleteTarget.id}
          definition={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  )
}
