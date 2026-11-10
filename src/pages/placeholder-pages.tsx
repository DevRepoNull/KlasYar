import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react"

import { AppLink } from "@/components/app-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SectionPlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

/** جای‌نگهدار بخش‌هایی که در گام‌های بعدی ساخته می‌شوند. */
export function SectionPlaceholder({
  title,
  description,
  icon: Icon,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          به‌زودی
        </Badge>
      </div>

      <Card className="border-dashed bg-muted/20 shadow-none">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-background text-muted-foreground ring-1 ring-border">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold">این بخش هنوز آماده نیست</p>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground">
            قالب اصلی و ناوبری کلاس‌یار آماده است؛ محتوای «{title}» در گام بعدی
            جایگزین این صفحه می‌شود.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl font-black tracking-tight text-primary">
        ۴۰۴
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-bold">صفحه پیدا نشد</h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          نشانی واردشده وجود ندارد؛ از منو یکی از بخش‌های کلاس‌یار را انتخاب
          کنید.
        </p>
      </div>
      <Button asChild className="gap-2">
        <AppLink href="/">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          بازگشت به تقویم
        </AppLink>
      </Button>
    </div>
  )
}
