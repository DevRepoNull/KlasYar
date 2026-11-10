import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  HardDriveDownload,
  Laptop,
  Moon,
  Palette,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  X,
} from "lucide-react"

import { ClassFormDialog } from "@/components/classes/class-form-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClassDefinitions } from "@/db/hooks"
import { useSettingsHydrated } from "@/hooks/use-settings"
import { useToast } from "@/hooks/use-toast"
import { FONT_OPTIONS, type AppFont } from "@/lib/font"
import {
  useSettingsStore,
  type ThemeMode,
} from "@/store/settingsStore"
import { cn } from "@/lib/utils"

export function OnboardingWizard() {
  const hydrated = useSettingsHydrated()
  const hasCompletedOnboarding = useSettingsStore(
    (state) => state.hasCompletedOnboarding,
  )
  const isOnboardingOpen = useSettingsStore((state) => state.isOnboardingOpen)
  const completeOnboarding = useSettingsStore(
    (state) => state.completeOnboarding,
  )
  const closeOnboarding = useSettingsStore((state) => state.closeOnboarding)
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const fontFamily = useSettingsStore((state) => state.fontFamily)
  const setFontFamily = useSettingsStore((state) => state.setFontFamily)

  const definitions = useClassDefinitions() ?? []
  const { toast } = useToast()
  const prefersReducedMotion = useReducedMotion() ?? false

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isClassFormOpen, setIsClassFormOpen] = useState(false)

  // دیالوگ فقط در صورت تمایل کاربر یا در اولین اجرای اپ پس از بارگذاری باز می‌شود
  const isOpen = isOnboardingOpen || (hydrated && !hasCompletedOnboarding)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
    }
  }, [isOpen])

  const handleSkipPermanently = () => {
    completeOnboarding()
    toast({
      title: "راهنمای شروع سریع رد شد",
      description: "هر زمان نیاز داشتید، می‌توانید از بخش «تنظیمات» یا «راهنما» دوباره آن را اجرا کنید.",
    })
  }

  const handleFinish = () => {
    completeOnboarding()
    toast({
      title: "به کلاس‌یار خوش آمدید! 🎉",
      description: "تنظیمات شما ذخیره شد. اکنون می‌توانید اولین جلسه خود را در تقویم ثبت کنید.",
    })
  }

  const handleClassFormClose = () => {
    setIsClassFormOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleSkipPermanently()
          }
        }}
      >
        <DialogContent
          className="max-h-[92vh] max-w-2xl overflow-y-auto p-0 sm:rounded-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* نوار هدر ویزارد */}
          <div className="relative border-b border-border/60 bg-muted/30 px-6 py-5">
            <button
              type="button"
              onClick={handleSkipPermanently}
              aria-label="بستن و رد کردن راهنما"
              className="absolute start-4 top-4 rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                آشنایی با کلاس‌یار · گام {step} از ۳
              </span>
              <DialogHeader className="mt-2">
                <DialogTitle className="text-center text-xl font-black tracking-tight sm:text-2xl">
                  {step === 1 && "به کلاسیار خوش آمدید"}
                  {step === 2 && "یک کلاس تعریف کنید"}
                  {step === 3 && "فونت و ظاهر برنامه را تنظیم کنید"}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* نشانگر گام‌ها */}
            <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    s === step
                      ? "bg-primary"
                      : s < step
                      ? "bg-primary/50"
                      : "bg-muted-foreground/20",
                  )}
                />
              ))}
            </div>
          </div>

          {/* بدنه متحرک گام‌ها */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                      <GraduationCap className="h-8 w-8" />
                    </div>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                      کلاس‌یار، دستیار هوشمند و آفلاین معلمان و مدرسان است. با
                      کلاس‌یار می‌توانید کلاس‌ها، ساعات تدریس، حضور و غیاب و
                      گزارش‌های کارکرد را بدون نیاز به اینترنت مدیریت کنید.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex flex-col items-center rounded-xl border border-border/70 bg-card p-4 text-center shadow-xs">
                      <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="mt-2 text-xs font-bold">۱۰۰٪ آفلاین و محلی</h4>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        اطلاعات فقط روی دستگاه شما ذخیره شده و هیچ داده‌ای به سرور فرستاده نمی‌شود.
                      </p>
                    </div>

                    <div className="flex flex-col items-center rounded-xl border border-border/70 bg-card p-4 text-center shadow-xs">
                      <CalendarDays className="h-6 w-6 text-primary" />
                      <h4 className="mt-2 text-xs font-bold">تقویم جلالی</h4>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        برنامه‌ریزی دقیق جلسات هفتگی و نمایش ساعات تدریس ماهانه.
                      </p>
                    </div>

                    <div className="flex flex-col items-center rounded-xl border border-border/70 bg-card p-4 text-center shadow-xs">
                      <HardDriveDownload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <h4 className="mt-2 text-xs font-bold">خروجی‌های آماده</h4>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        دریافت فوری فایل‌های استاندارد PDF سربرگ‌دار، اکسل و ورد برای آموزشگاه.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkipPermanently}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      رد کردن آموزش
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="gap-2 text-xs sm:text-sm"
                    >
                      گام بعدی: تعریف کلاس
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                      کلاس، پایه و اساس همه جلسات شماست. با ایجاد یک کلاس،
                      جلسه‌های تقویم و فهرست حضور و غیاب به سادگی و بر اساس آن شکل می‌گیرند.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-start">
                    <h4 className="text-xs font-bold text-primary sm:text-sm">
                      چرا باید کلاس تعریف کنیم؟
                    </h4>
                    <ul className="mt-2 space-y-2 text-xs leading-6 text-foreground/80">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>رنگ و نام مجزا برای تفکیک سریع در تقویم هفتگی و ماهانه</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>تعیین روزها و ساعت پیش‌فرض برای ساخت سریع و خودکار جلسات</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>ثبت اسامی هنرجویان و دانش‌آموزان برای حضور و غیاب آسان</span>
                      </li>
                    </ul>
                  </div>

                  {definitions.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                      شما هم‌اکنون <strong>{definitions.length}</strong> کلاس فعال در سیستم دارید. می‌توانید کلاس جدیدی بسازید یا به گام بعد بروید.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="gap-1.5 text-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                      مرحله قبل
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(3)}
                        className="text-xs text-muted-foreground"
                      >
                        رد کردن این گام
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsClassFormOpen(true)}
                        className="gap-2 text-xs sm:text-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        شروع تعریف کلاس
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <Palette className="h-8 w-8" />
                    </div>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                      ظاهر برنامه را باب میل خود شخصی‌سازی کنید. پیشنهاد ما برای بهترین
                      تجربه خوانایی خط فارسی، فونت بهینه‌شده <strong>«وزیرمتن»</strong> است.
                    </p>
                  </div>

                  {/* تنظیم فونت */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <Type className="h-4 w-4 text-primary" />
                      انتخاب قلم و فونت متن:
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FONT_OPTIONS.map((f) => {
                        const isSelected = fontFamily === f.id
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFontFamily(f.id as AppFont)}
                            className={cn(
                              "relative flex flex-col items-start rounded-xl border p-3.5 text-start transition",
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:border-border/80 hover:bg-muted/40",
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-bold">{f.name}</span>
                              {f.isRecommended && (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  پیشنهادی
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                              {f.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* تنظیم تم */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <Sun className="h-4 w-4 text-primary" />
                      حالت رنگ و تم برنامه:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light" as ThemeMode)}
                        className="gap-1.5 text-xs"
                      >
                        <Sun className="h-3.5 w-3.5" />
                        روشن
                      </Button>
                      <Button
                        type="button"
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark" as ThemeMode)}
                        className="gap-1.5 text-xs"
                      >
                        <Moon className="h-3.5 w-3.5" />
                        تاریک
                      </Button>
                      <Button
                        type="button"
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system" as ThemeMode)}
                        className="gap-1.5 text-xs"
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        سیستم
                      </Button>
                    </div>
                  </div>

                  {/* کادر پیش‌نمایش زنده */}
                  <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        پیش‌نمایش زنده کارت جلسه و متون فارسی
                      </span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        برگزار شد
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <h4 className="text-sm font-black">کلاس ریاضی پایه نهم — جلسه هفتم</h4>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        ۱۶:۰۰ تا ۱۷:۳۰ (۹۰ دقیقه)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      مبحث توان و ریشه · حضور ۵ نفر از ۶ نفر (۸۳٪ حضور)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="gap-1.5 text-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                      مرحله قبل
                    </Button>

                    <Button
                      type="button"
                      onClick={handleFinish}
                      className="gap-2 text-xs sm:text-sm font-bold"
                    >
                      <Check className="h-4 w-4" />
                      اتمام و شروع به کار با کلاس‌یار
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* دیالوگ تعریف کلاس بازشده از ویزارد */}
      {isClassFormOpen && (
        <ClassFormDialog
          definition={null}
          definitions={definitions}
          onClose={() => {
            handleClassFormClose()
            setStep(3)
          }}
        />
      )}
    </>
  )
}
