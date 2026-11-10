import { useEffect, useState } from "react"

/** مسیر جاری بدون اسلش انتهایی؛ «/» برای ریشه. */
export function getPathname(): string {
  const path = window.location.pathname.replace(/\/+$/, "")
  return path === "" ? "/" : path
}

/** ناوبری داخلی بدون بارگذاری دوباره صفحه. */
export function navigate(to: string): void {
  const target = to.startsWith("/") ? to : `/${to}`
  if (target === getPathname()) return

  window.history.pushState({}, "", target)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(getPathname)

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname())
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return pathname
}
