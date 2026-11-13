import { useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react"

import { AuroraBackground } from "@/components/ui/aurora-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

export default function AuthPage() {
  const { hasRegisteredUsers, login, register, error, clearError } = useAuthStore()

  // فیلدهای فرم
  const [username, setUsername] = useState(hasRegisteredUsers ? "" : "مدیر")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const isRegisterMode = !hasRegisteredUsers

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!username.trim()) {
      setLocalError("لطفاً نام کاربری را وارد کنید.")
      return
    }

    if (!password) {
      setLocalError("لطفاً رمز عبور را وارد کنید.")
      return
    }

    if (isRegisterMode) {
      if (password.length < 4) {
        setLocalError("رمز عبور باید حداقل ۴ کاراکتر باشد.")
        return
      }

      if (password !== confirmPassword) {
        setLocalError("رمز عبور و تکرار آن یکسان نیستند.")
        return
      }

      setSubmitting(true)
      try {
        await register(username.trim(), password, rememberMe)
      } finally {
        setSubmitting(false)
      }
    } else {
      setSubmitting(true)
      try {
        await login(username.trim(), password, rememberMe)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const activeError = localError || error

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-background select-none">
      {/* پس‌زمینه شفق قطبی زنده و ارگانیک */}
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/85 border border-border/80 shadow-2xl space-y-6">
          {/* نشان برند و لوگوی کلاس‌یار با هاله نئونی */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 w-full">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 glow-effect"
            >
              <GraduationCap className="h-9 w-9" aria-hidden="true" />
            </motion.div>

            <div
              className="flex flex-col items-center justify-center text-center w-full space-y-1"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                width: "100%",
              }}
            >
              <h1
                className="text-2xl font-black tracking-tight text-foreground sm:text-3xl text-center"
                style={{
                  textAlign: "center",
                  alignSelf: "center",
                  margin: "0 auto",
                  display: "block",
                }}
              >
                کلاس‌یار
              </h1>
              <p
                className="text-xs text-muted-foreground font-medium text-center"
                style={{
                  textAlign: "center",
                  alignSelf: "center",
                  margin: "0 auto",
                  display: "block",
                }}
              >
                سامانه هوشمند و خصوصی مدیریت آموزشی
              </p>
            </div>
          </div>

          {/* سربرگ فرم لاگین / راه‌اندازی حساب مدیر */}
          <div className="border-t border-border/60 pt-4 space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-1">
              {isRegisterMode ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>راه‌اندازی اولیه امنیت (Setup Admin)</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>ورود امن به پنل</span>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-5">
              {isRegisterMode
                ? "برای محافظت از اطلاعات در این رایانه، نام کاربری و رمز عبور اصلی برنامه را تنظیم نمایید."
                : "برای دسترسی به تقویم، کلاس‌ها و کارنامه حضور و غیاب رمز عبور خود را وارد کنید."}
            </p>
          </div>

          {/* نمایش خطای ورود یا اعتبارسنجی */}
          <AnimatePresence mode="wait">
            {activeError && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{activeError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* فرم ورود / ثبت‌نام */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* فیلد نام کاربری */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-username"
                className="block text-xs font-bold text-foreground"
              >
                نام کاربری
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثلاً مدیر"
                  className="ps-9 text-xs h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* فیلد رمز عبور */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-foreground"
              >
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  className="ps-9 pe-10 text-xs h-10 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute end-2.5 top-2.5 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* فیلد تکرار رمز عبور در حالت ثبت‌نام اولیه */}
            {isRegisterMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-bold text-foreground"
                >
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="auth-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="رمز عبور را دوباره تایپ کنید"
                    className="ps-9 text-xs h-10 rounded-xl"
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* گزینه «مرا به خاطر بسپار» در حالت ورود */}
            {!isRegisterMode && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <span>مرا به خاطر بسپار (Remember Me)</span>
                </label>
              </div>
            )}

            {/* دکمه ارسال فرم با افکت Glow */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 text-xs font-bold gap-2 glow-effect active:scale-95 rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>در حال اعتبارسنجی…</span>
                  </>
                ) : isRegisterMode ? (
                  <>
                    <span>ایجاد حساب مدیر و ورود</span>
                    <ArrowLeft className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>ورود به برنامه</span>
                    <ArrowLeft className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* پیام امنیت و عدم ارسال به سرور */}
          <div className="border-t border-border/60 pt-3 text-center">
            <p className="text-[11px] text-muted-foreground leading-5">
              🔒 کلاس‌یار کاملاً محلی (Local-First) و خصوصی است؛ تمام اطلاعات و رمز عبور شما با بالاترین ضریب امنیت فقط روی همین دستگاه ذخیره شده و هیچ داده‌ای به سرور خارجی یا اینترنت ارسال نمی‌شود.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
