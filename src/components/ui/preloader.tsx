import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { usePathname } from "@/lib/router"

/**
 * آیکون اختصاصی و انیمیشن‌دار کلاس‌یار بر پایه حرف «ک»
 */
export function KlasYarAnimatedLogo({ size = 72 }: { size?: number }) {
  const prefersReducedMotion = useReducedMotion() ?? false

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* هاله نور درخشان پشت آیکون */}
      {!prefersReducedMotion && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-3xl bg-primary/30 blur-xl"
        />
      )}

      {/* کادر اصلی آیکون با گرادیان فیروزه‌ای */}
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [0.98, 1.02, 0.98],
                y: [0, -2, 0],
              }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-primary to-teal-700 p-2.5 shadow-xl shadow-primary/25 border border-white/20"
      >
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* کادر داخلی با درخشش ملایم */}
          <rect
            x="6"
            y="6"
            width="108"
            height="108"
            rx="24"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />

          {/* سرکش کاف */}
          <motion.path
            d="M40 34 L80 23"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            initial={prefersReducedMotion ? false : { pathLength: 0.3 }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    pathLength: [0.4, 1, 0.4],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* ساقه و پایه کاف */}
          <motion.path
            d="M74 30 L52 68 C46 76, 52 86, 62 86 L82 86"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReducedMotion ? false : { pathLength: 0.6 }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    pathLength: [0.6, 1, 0.6],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />

          {/* ستاره / نقطه هوشمند آموزشی */}
          <motion.circle
            cx="80"
            cy="52"
            r="4"
            fill="currentColor"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [0.8, 1.3, 0.8],
                    opacity: [0.7, 1, 0.7],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>
    </div>
  )
}

/**
 * کامپوننت نوار پیشرفت نرم بالای صفحه هنگام تغییر مسیرها (Top Route Progress Bar)
 * بدون هیچ‌گونه بلاک تمام‌صفحه یا تاخیر در تنظیمات
 */
export function Preloader() {
  const pathname = usePathname()
  const [routeTransitioning, setRouteTransitioning] = useState(false)
  const [routeProgress, setRouteProgress] = useState(0)

  useEffect(() => {
    setRouteTransitioning(true)
    setRouteProgress(35)

    const timer1 = setTimeout(() => setRouteProgress(80), 80)
    const timer2 = setTimeout(() => setRouteProgress(100), 200)
    const timer3 = setTimeout(() => {
      setRouteTransitioning(false)
      setRouteProgress(0)
    }, 320)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {routeTransitioning && (
        <div
          className="fixed inset-x-0 top-0 z-[100] h-0.5 pointer-events-none"
          dir="ltr"
        >
          <motion.div
            initial={{ width: "0%", opacity: 1 }}
            animate={{ width: `${routeProgress}%`, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              ease: "easeOut",
              duration: 0.2,
            }}
            className="h-full bg-gradient-to-r from-teal-400 via-primary to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]"
          />
        </div>
      )}
    </AnimatePresence>
  )
}
