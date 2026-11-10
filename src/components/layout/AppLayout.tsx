import { useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Toaster } from "react-hot-toast"
import {
  CalendarDays,
  GraduationCap,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Sun,
} from "lucide-react"

import { AppLink } from "@/components/app-link"
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

const SIDEBAR_ID = "app-sidebar"

interface AppLayoutProps {
  children: ReactNode
}

/**
 * قالب اصلی اپ: هدر + سایدبار جمع‌شونده (دسکتاپ) / نوار پایین (موبایل)
 * و جابه‌جایی صفحه‌ها با AnimatePresence.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const prefersReducedMotion = useReducedMotion() ?? false

  // بررسی زمان‌دار جلسات هر ۳۰ ثانیه برای یادآوری شروع، پایان و ۵ دقیقه قبل
  useScheduledNotifications()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex min-h-screen flex-col bg-background">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent)]" />

        <AppHeader />

        <div className="flex flex-1 items-start">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
            pathname={pathname}
          />

          <main
            id="main-content"
            className="relative min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={pathname}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto w-full max-w-6xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
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

function AppHeader() {
  const { resolved } = useTheme()
  const setTheme = useSettingsStore((state) => state.setTheme)
  const monthLabel = formatJalaliMonth()

  const isDark = resolved === "dark"
  const nextTheme = isDark ? "light" : "dark"
  const nextThemeLabel = isDark ? "روشن" : "تاریک"

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <AppLink
          href="/"
          aria-label="کلاس‌یار — صفحه تقویم"
          className="flex shrink-0 items-center gap-2 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-black tracking-tight">کلاس‌یار</span>
        </AppLink>

        <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="flex min-w-0 items-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">{monthLabel}</span>
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTheme(nextTheme)}
                aria-label={`تغییر به حالت ${nextThemeLabel}`}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {isDark ? (
                  <Sun aria-hidden="true" />
                ) : (
                  <Moon aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">حالت {nextThemeLabel}</TooltipContent>
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
        "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-e border-border/70 bg-card/30 px-2 py-4 backdrop-blur-md transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.75rem]" : "w-56",
      )}
    >
      <nav aria-label="ناوبری اصلی" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActivePath(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="mt-4 border-t border-border/70 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-controls={SIDEBAR_ID}
              aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                collapsed && "justify-center px-0",
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
              <span className={cn("truncate", collapsed && "sr-only")}>
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
        "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-2 end-0 w-1 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className={cn("truncate", collapsed && "sr-only")}>
        {item.label}
      </span>
    </AppLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="ناوبری موبایل"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-7">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)

          return (
            <li key={item.href} className="min-w-0">
              <AppLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-2 h-8 w-10 rounded-full bg-primary/10 transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="relative h-5 w-5" aria-hidden="true" />
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
