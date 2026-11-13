import { useEffect, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Toaster } from "react-hot-toast"
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  LogOut,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Sun,
} from "lucide-react"

import { AppLink } from "@/components/app-link"
import { AppFooter } from "@/components/layout/AppFooter"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Preloader } from "@/components/ui/preloader"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import {
  NAV_ITEMS,
  isActivePath,
  type NavItem,
} from "@/components/layout/nav-items"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/use-theme"
import { formatJalaliMonth } from "@/lib/date"
import { usePathname } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useScheduledNotifications } from "@/lib/notifications"
import { useSettingsStore } from "@/store/settingsStore"
import { useAuthStore } from "@/store/authStore"

const SIDEBAR_ID = "app-sidebar"

interface AppLayoutProps {
  children: ReactNode
}

/**
 * آیتم‌های اصلی نوار پایین موبایل: ۵ آیتم با دسترسی مستقیم و فضای کافی برای لمس
 */
const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "تقویم", icon: CalendarDays },
  { href: "/classes", label: "کلاس‌ها", icon: BookOpen },
  { href: "/sessions", label: "جلسات", icon: CalendarClock },
  { href: "/attendance", label: "حضور و غیاب", mobileLabel: "حضور", icon: ClipboardCheck },
  { href: "/reports", label: "گزارش‌ها", icon: BarChart3 },
]

/**
 * قالب اصلی اپ: هدر + سایدبار جمع‌شونده (دسکتاپ و آیکون‌محور در تبلت) / نوار پایین مدرن (موبایل)
 * و جابه‌جایی صفحه‌ها با AnimatePresence.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  // در سایز تبلت (768px تا 1024px)، سایدبار به صورت خودکار به حالت آیکون‌محور درمی‌آید
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 && window.innerWidth < 1024
    }
    return false
  })
  const prefersReducedMotion = useReducedMotion() ?? false

  // بررسی زمان‌دار جلسات هر ۳۰ ثانیه برای یادآوری شروع، پایان و ۵ دقیقه قبل
  useScheduledNotifications()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])

  // تنظیم خودکار وضعیت سایدبار در تغییر سایز به تبلت یا دسکتاپ
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true)
      } else if (window.innerWidth >= 1024) {
        // بازگشت به حالت باز در نمایشگر بزرگ مگر اینکه کاربر خودش بسته باشد
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex min-h-screen flex-col bg-background" dir="rtl">
        {/* پس‌زمینه زنده و شفق قطبی (Aurora Animated Background) با انیمیشن‌های ارگانیک */}
        <AuroraBackground />

        {/* پریلودر لود اولیه و ترنزیشن مسیرها */}
        <Preloader />

        <AppHeader pathname={pathname} />

        <div className="relative z-10 flex flex-1 items-stretch w-full min-h-[calc(100vh-4rem)]">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
            pathname={pathname}
          />

          <div className="relative flex min-w-0 flex-1 flex-col justify-between">
            <main
              id="main-content"
              className="relative flex min-w-0 flex-1 flex-col px-3 pb-20 pt-4 sm:px-6 md:pb-10 lg:px-8"
            >
              <motion.div
                key={pathname}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="mx-auto flex w-full max-w-6xl flex-1 flex-col"
              >
                {children}
              </motion.div>
            </main>

            <AppFooter />
          </div>
        </div>

        <MobileNav pathname={pathname} />

        {/* ویزارد راهنمای اولیه و شروع سریع */}
        <OnboardingWizard />

        {/* سرویس متمرکز نمایش اعلان‌های شناور */}
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              fontFamily: "var(--font-vazirmatn, 'Vazirmatn', sans-serif)",
            },
          }}
        />
      </div>
    </TooltipProvider>
  )
}

function AppHeader({ pathname }: { pathname: string }) {
  const { resolved } = useTheme()
  const setTheme = useSettingsStore((state) => state.setTheme)
  const monthLabel = formatJalaliMonth()

  const isDark = resolved === "dark"
  const nextTheme = isDark ? "light" : "dark"
  const nextThemeLabel = isDark ? "روشن" : "تاریک"

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <AppLink
          href="/"
          aria-label="کلاس‌یار — صفحه تقویم"
          className="flex shrink-0 items-center gap-2 rounded-xl p-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-black tracking-tight">کلاس‌یار</span>
        </AppLink>

        <div className="ms-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <span className="hidden xs:flex min-w-0 items-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">{monthLabel}</span>
          </span>

          {/* دسترسی سریع به راهنما و تنظیمات در موبایل و دسکتاپ */}
          <Tooltip>
            <TooltipTrigger asChild>
              <AppLink
                href="/help"
                aria-label="راهنما و آموزش"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-150 active:scale-95 hover:bg-accent hover:text-foreground",
                  isActivePath(pathname, "/help") && "bg-primary/10 text-primary",
                )}
              >
                <HelpCircle className="h-4.5 w-4.5" aria-hidden="true" />
              </AppLink>
            </TooltipTrigger>
            <TooltipContent side="bottom">راهنما و آموزش</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <AppLink
                href="/settings"
                aria-label="تنظیمات برنامه"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-150 active:scale-95 hover:bg-accent hover:text-foreground",
                  isActivePath(pathname, "/settings") && "bg-primary/10 text-primary",
                )}
              >
                <Settings className="h-4.5 w-4.5" aria-hidden="true" />
              </AppLink>
            </TooltipTrigger>
            <TooltipContent side="bottom">تنظیمات</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTheme(nextTheme)}
                aria-label={`تغییر به حالت ${nextThemeLabel}`}
                className="shrink-0 text-muted-foreground hover:text-foreground active:scale-95"
              >
                {isDark ? (
                  <Sun className="h-4.5 w-4.5" aria-hidden="true" />
                ) : (
                  <Moon className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">حالت {nextThemeLabel}</TooltipContent>
          </Tooltip>

          {/* دکمه خروج از حساب در هدر (مخصوص موبایل و دسترسی سریع) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => useAuthStore.getState().logout()}
                aria-label="خروج از حساب کاربری"
                className="shrink-0 text-muted-foreground hover:text-destructive active:scale-95"
              >
                <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">خروج از حساب</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  pathname: string
}

function Sidebar({ collapsed, onToggle, pathname }: SidebarProps) {
  return (
    <aside
      id={SIDEBAR_ID}
      className={cn(
        "sticky top-16 z-20 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-e border-border/70 bg-card/40 px-2 py-4 backdrop-blur-md transition-[width] duration-200 ease-out md:flex",
        // در تبلت به صورت پیش‌فرض آیکون‌محور (w-[4.75rem]) و در دسکتاپ باز (w-56)
        collapsed ? "w-[4.75rem]" : "w-[4.75rem] lg:w-56",
      )}
    >
      <nav aria-label="ناوبری اصلی" className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pe-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActivePath(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border/70 pt-3 shrink-0">
        {/* دکمه خروج از حساب در سایدبار */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => useAuthStore.getState().logout()}
              aria-label="خروج از حساب"
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-destructive/80 transition-all duration-150 active:scale-95 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "justify-center px-0" : "justify-center lg:justify-start px-0 lg:px-2.5",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className={cn("truncate", collapsed ? "sr-only" : "hidden lg:inline")}>
                خروج از حساب
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">خروج از حساب</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-controls={SIDEBAR_ID}
              aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 active:scale-95 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "justify-center px-0" : "justify-center lg:justify-start px-0 lg:px-2.5",
              )}
            >
              {collapsed ? (
                <PanelRightOpen
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <PanelRightClose
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className={cn("truncate", collapsed ? "sr-only" : "hidden lg:inline")}>
                {collapsed ? "باز کردن منو" : "جمع کردن منو"}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {collapsed ? "باز کردن منو" : "جمع کردن منو"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}

interface SidebarLinkProps {
  item: NavItem
  collapsed: boolean
  active: boolean
}

function SidebarLink({ item, collapsed, active }: SidebarLinkProps) {
  const Icon = item.icon

  const link = (
    <AppLink
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary font-bold shadow-xs"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed ? "justify-center px-0" : "justify-center lg:justify-start px-0 lg:px-3",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-2 start-0 w-1.5 rounded-e-full bg-primary transition-all duration-200",
          active ? "opacity-100 scale-100" : "opacity-0 scale-75",
        )}
      />
      <Icon className={cn("h-5 w-5 shrink-0 transition-transform", active && "scale-105")} aria-hidden="true" />
      <span className={cn("truncate", collapsed ? "sr-only" : "hidden lg:inline")}>
        {item.label}
      </span>
    </AppLink>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="left" sideOffset={8} className={collapsed ? "" : "lg:hidden"}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * نوار ناوبری پایین صفحه برای موبایل (Bottom Navigation)
 * طراحی مدرن شیشه‌ای، چیدمان ۵تایی بهینه با لمس آسان و نشانگر فعال فعال
 */
function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="ناوبری موبایل"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5 h-16 items-center px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)

          return (
            <li key={item.href} className="min-w-0 flex items-center justify-center">
              <AppLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-full py-1.5 px-0.5 text-[10px] font-bold transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring rounded-xl",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1 h-7 w-12 rounded-full bg-primary/15 transition-all duration-200",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-75",
                  )}
                />
                <Icon className={cn("relative h-5 w-5 transition-transform duration-200", active && "scale-110")} aria-hidden="true" />
                <span className="relative max-w-full truncate">
                  {item.mobileLabel ?? item.label}
                </span>
              </AppLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
