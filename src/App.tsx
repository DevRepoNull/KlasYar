import { useEffect } from "react"
import { GraduationCap } from "lucide-react"

import { AppLayout } from "@/components/layout/AppLayout"
import { NAV_ITEMS } from "@/components/layout/nav-items"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { usePathname } from "@/lib/router"
import { useAuthStore } from "@/store/authStore"
import AuthPage from "@/pages/auth-page"
import CalendarPage from "@/pages/calendar-page"
import ClassesPage from "@/pages/classes-page"
import AttendancePage from "@/pages/attendance-page"
import ReportsPage from "@/pages/reports-page"
import { NotFoundPage } from "@/pages/placeholder-pages"
import SessionsPage from "@/pages/sessions-page"
import SettingsPage from "@/pages/settings-page"
import HelpPage from "@/pages/help-page"

export default function App() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const activeItem = NAV_ITEMS.find(
    (item) =>
      item.href === pathname ||
      (item.href === "/help" && pathname === "/onboarding"),
  )

  useEffect(() => {
    if (!isAuthenticated) {
      document.title = "ورود · کلاس‌یار"
      return
    }

    document.title = activeItem
      ? `${activeItem.label} · کلاس‌یار`
      : "کلاس‌یار"
  }, [activeItem, isAuthenticated])

  // ۱. هنگام بررسی اولیه وضعیت نشست محلی، نمایش لودینگ شیشه‌ای لوکس
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-background">
        <AuroraBackground />
        <div className="flex flex-col items-center gap-3.5 glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/80 border border-border/70 shadow-2xl">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 glow-effect animate-pulse">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
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
            <p
              className="text-base font-black text-foreground text-center"
              style={{
                textAlign: "center",
                alignSelf: "center",
                margin: "0 auto",
              }}
            >
              کلاس‌یار
            </p>
            <p
              className="text-xs text-muted-foreground text-center"
              style={{
                textAlign: "center",
                alignSelf: "center",
                margin: "0 auto",
              }}
            >
              در حال بررسی امنیت نشست محلی…
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ۲. محافظت از مسیرها (Route Protection): اگر کاربر لاگین نبود، مستقیماً به صفحه ورود هدایت می‌شود
  if (!isAuthenticated) {
    return <AuthPage />
  }

  const renderPage = () => {
    if (pathname === "/") return <CalendarPage />
    if (pathname === "/classes") return <ClassesPage />
    if (pathname === "/sessions") return <SessionsPage />
    if (pathname === "/attendance") return <AttendancePage />
    if (pathname === "/reports") return <ReportsPage />
    if (pathname === "/settings") return <SettingsPage />
    if (pathname === "/help" || pathname === "/onboarding") return <HelpPage />

    return <NotFoundPage />
  }

  return (
    <AppLayout>
      <ErrorBoundary
        key={pathname}
        sectionName={activeItem?.label ?? "صفحه جاری"}
      >
        {renderPage()}
      </ErrorBoundary>
    </AppLayout>
  )
}
