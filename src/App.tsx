import { useEffect } from "react"

import { AppLayout } from "@/components/layout/AppLayout"
import { NAV_ITEMS } from "@/components/layout/nav-items"
import { usePathname } from "@/lib/router"
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
  const activeItem = NAV_ITEMS.find(
    (item) =>
      item.href === pathname ||
      (item.href === "/help" && pathname === "/onboarding"),
  )

  useEffect(() => {
    document.title = activeItem
      ? `${activeItem.label} · کلاس‌یار`
      : "کلاس‌یار"
  }, [activeItem])

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

  return <AppLayout>{renderPage()}</AppLayout>
}
