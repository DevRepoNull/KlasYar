import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  HelpCircle,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  /** برچسب کوتاه برای نوار پایین موبایل؛ اگر نباشد از label استفاده می‌شود. */
  mobileLabel?: string
  icon: LucideIcon
}

/** آیتم‌های ناوبری اصلی؛ ترتیب در سایدبار و نوار موبایل یکسان است. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "تقویم", icon: CalendarDays },
  { href: "/classes", label: "کلاس‌ها", icon: BookOpen },
  { href: "/sessions", label: "جلسات", icon: CalendarClock },
  {
    href: "/attendance",
    label: "حضور و غیاب",
    mobileLabel: "حضور",
    icon: ClipboardCheck,
  },
  { href: "/reports", label: "گزارش‌ها", icon: BarChart3 },
  { href: "/settings", label: "تنظیمات", icon: Settings },
  { href: "/help", label: "راهنما", mobileLabel: "راهنما", icon: HelpCircle },
]

/** مسیر فعال، زیرمسیرها را هم پوشش می‌دهد؛ ریشه فقط دقیقاً «/» است. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  if (href === "/help" && (pathname === "/help" || pathname === "/onboarding")) {
    return true
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
