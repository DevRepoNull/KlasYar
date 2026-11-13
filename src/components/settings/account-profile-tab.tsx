import { useEffect, useState, type FormEvent } from "react"
import { toast } from "react-hot-toast"
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

export function AccountProfileTab() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const factoryReset = useAuthStore((state) => state.factoryReset)
  const logout = useAuthStore((state) => state.logout)

  // وضعیت فیلدهای فرم ویرایش پروفایل
  const [username, setUsername] = useState(user?.username ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  // نمایش یا عدم نمایش کلمات عبور
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const [saving, setSaving] = useState(false)

  // وضعیت مودال هشدار بازنشانی داده‌ها (Factory Reset)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username)
    }
  }, [user?.username])

  // هندلر ذخیره مشخصات
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error("نام کاربری نمی‌تواند خالی باشد.")
      return
    }

    if (!currentPassword) {
      toast.error("لطفاً برای ذخیره تغییرات، رمز عبور فعلی خود را وارد کنید.")
      return
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        toast.error("رمز عبور جدید باید حداقل ۴ کاراکتر باشد.")
        return
      }

      if (newPassword !== confirmNewPassword) {
        toast.error("رمز عبور جدید و تکرار آن یکسان نیستند.")
        return
      }
    }

    setSaving(true)
    try {
      const res = await updateProfile({
        username: username.trim(),
        currentPassword,
        newPassword: newPassword ? newPassword : undefined,
      })

      if (res.success) {
        toast.success("اطلاعات با موفقیت بروزرسانی شد")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmNewPassword("")
      } else {
        toast.error(res.error || "خطا در به‌روزرسانی مشخصات.")
      }
    } catch {
      toast.error("خطایی در ذخیره تغییرات رخ داد.")
    } finally {
      setSaving(false)
    }
  }

  // هندلر بازنشانی به تنظیمات کارخانه (Factory Reset)
  const handleConfirmFactoryReset = async () => {
    setResetting(true)
    try {
      await factoryReset()
      setResetDialogOpen(false)
      toast.success("تمام داده‌ها پاک شدند و برنامه به حالت اولیه بازگشت.")
    } catch {
      toast.error("خطا در پاک‌سازی داده‌ها.")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* کارت فرم مدیریت مشخصات و کلمه عبور */}
      <div className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-5 sm:p-7 shadow-sm transition-all duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                مشخصات حساب کاربری
              </h2>
              <p className="text-xs text-muted-foreground">
                نام کاربری و کلمه عبور ورود به سامانه کلاس‌یار را تغییر دهید.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>خروج از حساب</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* فیلد نام کاربری */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-username"
              className="block text-xs font-bold text-foreground"
            >
              نام کاربری
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری"
                className="ps-9 text-xs h-10 rounded-xl"
                required
              />
            </div>
          </div>

          {/* فیلد رمز عبور فعلی */}
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label
                htmlFor="profile-current-pass"
                className="block text-xs font-bold text-foreground"
              >
                رمز عبور فعلی <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                جهت تایید هویت الزامی است
              </span>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="profile-current-pass"
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی خود را وارد نمایید"
                className="ps-9 pe-10 text-xs h-10 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass((prev) => !prev)}
                className="absolute end-2.5 top-2.5 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                aria-label={showCurrentPass ? "مخفی کردن" : "نمایش"}
              >
                {showCurrentPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* فیلد رمز عبور جدید و تکرار آن */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-new-pass"
                className="block text-xs font-bold text-foreground"
              >
                رمز عبور جدید (اختیاری)
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-new-pass"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  className="ps-9 pe-10 text-xs h-10 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((prev) => !prev)}
                  className="absolute end-2.5 top-2.5 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showNewPass ? "مخفی کردن" : "نمایش"}
                >
                  {showNewPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-confirm-pass"
                className="block text-xs font-bold text-foreground"
              >
                تکرار رمز عبور جدید
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile-confirm-pass"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="تکرار رمز جدید"
                  className="ps-9 pe-10 text-xs h-10 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((prev) => !prev)}
                  className="absolute end-2.5 top-2.5 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPass ? "مخفی کردن" : "نمایش"}
                >
                  {showConfirmPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 h-10 px-5 text-xs font-bold glow-effect active:scale-95 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال ذخیره…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>ذخیره تغییرات مشخصات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* بخش خطر (Danger Zone) با کادر قرمز برجسته */}
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 backdrop-blur-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive border border-destructive/30">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-destructive">
              ناحیه خطر (Danger Zone)
            </h3>
            <p className="text-xs text-muted-foreground leading-5">
              اقدامات این بخش غیرقابل بازگشت هستند و تمامی داده‌های محلی، کلاس‌ها، جلسات، حضور و غیاب و حساب‌های کاربری را برای همیشه حذف می‌کنند.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-destructive/20">
          <div>
            <p className="text-xs font-bold text-foreground">
              بازنشانی کامل به تنظیمات کارخانه
            </p>
            <p className="text-[11px] text-muted-foreground">
              پاک‌سازی کامل دیتابیس IndexedDB و بازگشت به صفحه ثبت‌نام اولیه
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="gap-2 text-xs font-bold shrink-0 active:scale-95 shadow-sm shadow-destructive/25"
          >
            <Trash2 className="h-4 w-4" />
            <span>پاک کردن تمام داده‌ها (Factory Reset)</span>
          </Button>
        </div>
      </div>

      {/* مودال هشدار بازنشانی داده‌ها */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>هشدار بازنشانی به تنظیمات کارخانه</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-6 pt-2 text-foreground font-medium">
              تمام کلاس‌ها، جلسات و اطلاعات شما برای همیشه پاک خواهند شد. آیا مطمئن هستید؟
            </DialogDescription>
          </DialogHeader>

          <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
            ⚠️ این عملیات بلافاصله پایگاه داده مرورگر شما را کاملاً تخلیه می‌کند و هیچ راهی برای بازیابی اطلاعات حذف‌شده بدون فایل پشتیبان قبلی وجود ندارد.
          </p>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={resetting}>
                انصراف
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={resetting}
              onClick={handleConfirmFactoryReset}
              className="gap-2 font-bold active:scale-95"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>در حال پاک‌سازی…</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>بله، تمام داده‌ها پاک شوند</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
