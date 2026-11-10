import { useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Database,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react"

import { RestoreBackupDialog } from "@/components/settings/restore-backup-dialog"
import {
  SettingRow,
  SettingsSection,
  settingsListVariants,
} from "@/components/settings/settings-section"
import { ThemeModeSwitch } from "@/components/settings/theme-mode-switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/use-theme"
import {
  exportBackupFile,
  formatLastBackupDate,
  isBackupOverdue,
  restoreBackup,
  validateBackupPayload,
  type KlasYarBackupPayload,
} from "@/lib/backup"
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  notifySettingsSaved,
  requestBrowserNotificationPermission,
} from "@/lib/notifications"
import { navigate } from "@/lib/router"
import {
  pickSettingsValues,
  useSettingsStore,
  type AppFont,
  type WeekStart,
} from "@/store/settingsStore"

const THEME_LABELS = { light: "روشن", dark: "تاریک", system: "سیستم" } as const

const WEEK_START_OPTIONS: { value: WeekStart; label: string }[] = [
  { value: "saturday", label: "شنبه" },
  { value: "sunday", label: "یکشنبه" },
  { value: "monday", label: "دوشنبه" },
]

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120]

export default function SettingsPage() {
  const theme = useSettingsStore((state) => state.theme)
  const weekStart = useSettingsStore((state) => state.weekStart)
  const defaultSessionDuration = useSettingsStore(
    (state) => state.defaultSessionDuration,
  )
  const notificationsEnabled = useSettingsStore(
    (state) => state.notificationsEnabled,
  )
  const classReminders = useSettingsStore((state) => state.classReminders)
  const sessionChangeNotifications = useSettingsStore(
    (state) => state.sessionChangeNotifications,
  )
  const browserNotifications = useSettingsStore(
    (state) => state.browserNotifications,
  )
  const dailySummary = useSettingsStore((state) => state.dailySummary)
  const lastBackupAt = useSettingsStore((state) => state.lastBackupAt)
  const fontFamily = useSettingsStore((state) => state.fontFamily)
  const openOnboarding = useSettingsStore((state) => state.openOnboarding)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExportingBackup, setIsExportingBackup] = useState(false)
  const [pendingPayload, setPendingPayload] =
    useState<KlasYarBackupPayload | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>(() => getBrowserNotificationPermission())

  const { resolved } = useTheme()
  const { toast } = useToast()

  const handleUpdate = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial)
    notifySettingsSaved("تغییرات با موفقیت ذخیره شد.")
  }

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission()
    setBrowserPermission(perm)
    if (perm === "granted") {
      notifySettingsSaved("اجازه اعلان‌های مرورگر با موفقیت ثبت شد.")
    } else {
      toast({
        title: "اجازه اعلان داده نشد",
        description: "می‌توانید از تنظیمات مرورگر اجازه اعلان را صادر کنید.",
      })
    }
  }

  const handleDownloadBackup = async () => {
    try {
      setIsExportingBackup(true)
      const { filename } = await exportBackupFile()
      notifySettingsSaved(`نسخه پشتیبان در فایل ${filename} ذخیره شد.`)
    } catch (err) {
      toast({
        title: "خطا در پشتیبان‌گیری",
        description:
          err instanceof Error ? err.message : "خطای ناشناخته رخ داد.",
        variant: "destructive",
      })
    } finally {
      setIsExportingBackup(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    try {
      const text = await file.text()
      const payload = validateBackupPayload(text)
      setPendingPayload(payload)
      setRestoreDialogOpen(true)
    } catch (err) {
      toast({
        title: "فایل پشتیبان نامعتبر است",
        description:
          err instanceof Error ? err.message : "بررسی فایل با خطا مواجه شد.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmRestore = async (mode: "replace" | "merge") => {
    if (!pendingPayload) return
    try {
      await restoreBackup(pendingPayload, mode)
      setRestoreDialogOpen(false)
      setPendingPayload(null)
      toast({
        title: "بازیابی اطلاعات با موفقیت انجام شد",
        description:
          mode === "replace"
            ? "داده‌های برنامه با موفقیت از فایل پشتیبان جایگزین شدند."
            : "داده‌های فایل پشتیبان با اطلاعات موجود ادغام شدند.",
      })
    } catch (err) {
      toast({
        title: "خطا در بازیابی اطلاعات",
        description:
          err instanceof Error ? err.message : "عملیات بازیابی ناموفق بود.",
        variant: "destructive",
      })
      throw err
    }
  }

  const themeDescription =
    theme === "system"
      ? `هماهنگ با سیستمعامل — اکنون ${resolved === "dark" ? "تاریک" : "روشن"}`
      : "بی‌درنگ روی همه صفحه‌ها اعمال می‌شود."

  const handleExport = () => {
    const payload = {
      app: "klasyar",
      exportedAt: new Date().toISOString(),
      settings: pickSettingsValues(useSettingsStore.getState()),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "klasyar-settings.json"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    notifySettingsSaved("فایل خروجی تنظیمات klasyar-settings.json آماده شد.")
  }

  const handleReset = () => {
    resetSettings()
    notifySettingsSaved("همه ترجیحات به حالت پیش‌فرض بازگشت.")
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          تنظیمات
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          ترجیحات کلاس‌یار فقط روی همین دستگاه ذخیره می‌شود و تغییرها فوری اعمال
          می‌شوند.
        </p>
      </div>

        <motion.div
          variants={settingsListVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <SettingsSection
            icon={Palette}
            title="ظاهر"
            description="تم و قلم برنامه را انتخاب کنید؛ در حالت سیستم با تنظیمات دستگاه هماهنگ می‌ماند."
          >
            <SettingRow
              label="حالت نمایش"
              description={themeDescription}
              control={<ThemeModeSwitch />}
            />
            <SettingRow
              label="فونت برنامه"
              description={
                fontFamily === "vazirmatn"
                  ? "فونت وزیرمتن (پیشنهادی) — بهینه‌شده برای خوانایی ارقام و متون فارسی."
                  : "فونت سیستم‌عامل — قلم استاندارد سیستم شما."
              }
              htmlFor="font-family"
              control={
                <Select
                  value={fontFamily}
                  onValueChange={(value) =>
                    handleUpdate({ fontFamily: value as AppFont })
                  }
                >
                  <SelectTrigger
                    id="font-family"
                    className="w-44"
                    aria-label="انتخاب قلم برنامه"
                  >
                    <SelectValue placeholder="انتخاب قلم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vazirmatn">وزیرمتن (پیشنهادی)</SelectItem>
                    <SelectItem value="system">فونت سیستم‌عامل</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </SettingsSection>

          <SettingsSection
            icon={CalendarDays}
            title="تقویم"
            description="نمای هفته و مدت جلسه‌های پیش‌فرض."
          >
            <SettingRow
              label="شروع هفته"
              description="اولین روز هفته در نمای تقویم."
              htmlFor="week-start"
              control={
                <Select
                  value={weekStart}
                  onValueChange={(value) =>
                    handleUpdate({ weekStart: value as WeekStart })
                  }
                >
                  <SelectTrigger
                    id="week-start"
                    className="w-40"
                    aria-label="شروع هفته"
                  >
                    <SelectValue placeholder="انتخاب روز" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_START_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <SettingRow
              label="مدت پیش‌فرض جلسه"
              description="هنگام ساخت جلسه جدید استفاده می‌شود."
              htmlFor="default-session-duration"
              control={
                <Select
                  value={String(defaultSessionDuration)}
                  onValueChange={(value) =>
                    handleUpdate({ defaultSessionDuration: Number(value) })
                  }
                >
                  <SelectTrigger
                    id="default-session-duration"
                    className="w-40"
                    aria-label="مدت پیش‌فرض جلسه"
                  >
                    <SelectValue placeholder="انتخاب مدت" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} دقیقه
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
          </SettingsSection>

          <SettingsSection
            icon={Bell}
            title="اعلان‌ها"
            description="تنظیمات یادآوری و نوتیفیکیشن‌های رویدادهای برنامه."
          >
            <SettingRow
              label="اعلان‌های کلی"
              description="فعال یا غیرفعال کردن تمام نوتیفیکیشن‌ها و یادآوری‌های برنامه."
              htmlFor="notifications-enabled"
              control={
                <Switch
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleUpdate({ notificationsEnabled: checked })
                  }
                  aria-label="فعال‌سازی کلی اعلان‌ها"
                />
              }
            />
            <SettingRow
              label="یادآوری کلاس‌ها"
              description="نوتیفیکیشن ۵ دقیقه قبل از شروع، زمان دقیق شروع و پایان هر کلاس."
              htmlFor="class-reminders"
              disabled={!notificationsEnabled}
              control={
                <Switch
                  id="class-reminders"
                  checked={classReminders}
                  disabled={!notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleUpdate({ classReminders: checked })
                  }
                  aria-label="یادآوری شروع و پایان کلاس‌ها"
                />
              }
            />
            <SettingRow
              label="اعلان‌های ثبت و حذف جلسه"
              description="نمایش اعلان شناور هنگام ثبت یا حذف یک جلسه در تقویم."
              htmlFor="session-change-notifications"
              disabled={!notificationsEnabled}
              control={
                <Switch
                  id="session-change-notifications"
                  checked={sessionChangeNotifications}
                  disabled={!notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleUpdate({ sessionChangeNotifications: checked })
                  }
                  aria-label="اعلان‌های ثبت و حذف جلسه"
                />
              }
            />
            <SettingRow
              label="اعلان‌های دسکتاپ مرورگر"
              description={
                !isBrowserNotificationSupported()
                  ? "مرورگر شما از Notification API پشتیبانی نمی‌کند."
                  : browserPermission === "granted"
                  ? "اجازه مرورگر فعال است؛ حتی در پس‌زمینه اعلان دسکتاپ دریافت می‌کنید."
                  : browserPermission === "denied"
                  ? "اجازه در مرورگر مسدود شده است؛ از تنظیمات سایت مرورگر فعال کنید."
                  : "برای دریافت اعلان هنگام مینیمایز بودن تب، اجازه مرورگر را فعال کنید."
              }
              htmlFor="browser-notifications"
              disabled={!notificationsEnabled || !isBrowserNotificationSupported()}
              control={
                <div className="flex items-center gap-2">
                  {isBrowserNotificationSupported() &&
                  browserPermission !== "granted" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleRequestPermission}
                    >
                      <ExternalLink className="h-3 w-3" />
                      درخواست اجازه
                    </Button>
                  ) : null}
                  <Switch
                    id="browser-notifications"
                    checked={
                      browserNotifications && browserPermission === "granted"
                    }
                    disabled={
                      !notificationsEnabled ||
                      !isBrowserNotificationSupported() ||
                      browserPermission !== "granted"
                    }
                    onCheckedChange={(checked) =>
                      handleUpdate({ browserNotifications: checked })
                    }
                    aria-label="اعلان‌های دسکتاپ مرورگر"
                  />
                </div>
              }
            />
            <SettingRow
              label="خلاصه روزانه"
              description="یک خلاصه کوتاه از فعالیت‌ها و جلسات روز."
              htmlFor="daily-summary"
              disabled={!notificationsEnabled}
              control={
                <Switch
                  id="daily-summary"
                  checked={dailySummary}
                  disabled={!notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleUpdate({ dailySummary: checked })
                  }
                  aria-label="خلاصه روزانه"
                />
              }
            />
          </SettingsSection>

          <SettingsSection
            icon={Database}
            title="داده‌ها"
            description="پشتیبان‌گیری کامل دیتابیس (JSON)، بازیابی، و مدیریت ترجیحات."
          >
            {isBackupOverdue(lastBackupAt) && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-6 text-amber-900 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold">یادآوری پشتیبان‌گیری: </span>
                  {lastBackupAt
                    ? "بیش از ۷ روز از آخرین نسخه پشتیبان شما می‌گذرد. برای جلوگیری از هدر رفت اطلاعات، توصیه می‌شود نسخه پشتیبان جدید تهیه فرمایید."
                    : "تاکنون نسخه پشتیبان از داده‌های خود تهیه نکرده‌اید. توصیه می‌شود جهت جلوگیری از دست رفتن اطلاعات، همین حالا یک بکاپ کامل بگیرید."}
                </div>
              </div>
            )}

            <SettingRow
              label="پشتیبان‌گیری کامل دیتابیس (JSON)"
              description={`شامل تمام کلاس‌ها، جلسات، حضور و غیاب و تنظیمات. آخرین نسخه: ${formatLastBackupDate(
                lastBackupAt,
              )}`}
              control={
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleDownloadBackup}
                    disabled={isExportingBackup}
                  >
                    {isExportingBackup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    دریافت بکاپ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    بازیابی از فایل
                  </Button>
                </div>
              }
            />

            <SettingRow
              label="خروجی فقط تنظیمات"
              description="یک فایل JSON تنها از ترجیحات ظاهری و اعلان‌ها بگیرید."
              control={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                  دریافت فایل
                </Button>
              }
            />

            <SettingRow
              label="بازنشانی تنظیمات"
              description="داده‌های کلاس‌ها و حضور و غیاب حذف نمی‌شوند."
              control={
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <RotateCcw className="h-4 w-4" />
                      بازنشانی
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>بازنشانی تنظیمات</DialogTitle>
                      <DialogDescription>
                        همه ترجیحات (تم، تقویم و اعلان‌ها) به حالت پیش‌فرض
                        برمی‌گردند. داده‌های کلاس‌ها دست‌نخورده می‌مانند.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">انصراف</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="destructive" onClick={handleReset}>
                          بازنشانی تنظیمات
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            />
          </SettingsSection>

          <SettingsSection
            icon={HelpCircle}
            title="راهنما و آموزش"
            description="مستندات شروع سریع و اجرای دوباره تور آموزشی خوش‌آمدگویی."
          >
            <SettingRow
              label="آشنایی اولیه با کلاس‌یار"
              description="اجرای مجدد ویزارد ۳ مرحله‌ای شروع کار با کلاس‌یار."
              control={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => openOnboarding()}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  نمایش دوباره Onboarding
                </Button>
              }
            />
            <SettingRow
              label="صفحه راهنما و شروع سریع"
              description="توضیحات قدم‌به‌قدم کلاس‌ها، ساعات کاری، حضور و غیاب، خروجی‌ها و سوالات متداول."
              control={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/help")}
                >
                  <HelpCircle className="h-4 w-4" />
                  مشاهده راهنما
                </Button>
              }
            />
          </SettingsSection>
        </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        تم فعلی: {THEME_LABELS[theme]} · قلم: {fontFamily === "vazirmatn" ? "وزیرمتن" : "سیستم"} · ذخیره‌سازی: IndexedDB
      </p>

      <RestoreBackupDialog
        open={restoreDialogOpen}
        payload={pendingPayload}
        onClose={() => {
          setRestoreDialogOpen(false)
          setPendingPayload(null)
        }}
        onConfirm={handleConfirmRestore}
      />
    </div>
  )
}
