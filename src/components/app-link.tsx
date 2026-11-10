import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react"

import { navigate } from "@/lib/router"

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

/**
 * لینک داخلی: کلیک معمولی بدون reload انجام می‌شود؛ Ctrl/Cmd+کلیک باز می‌ماند.
 * ref را عبور می‌دهد تا به‌عنوان trigger در Tooltip هم قابل استفاده باشد.
 */
export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink({ href, onClick, ...props }, ref) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event)

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      event.preventDefault()
      navigate(href)
    }

    return <a {...props} ref={ref} href={href} onClick={handleClick} />
  },
)
