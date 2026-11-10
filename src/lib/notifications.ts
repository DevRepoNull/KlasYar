import { createElement, useEffect } from "react"
import toast, { type ToastOptions } from "react-hot-toast"

import { db } from "@/db/schema"
import { jalaliDateToString, todayJalali, toPersianDigits } from "@/lib/jalali"
import { useSettingsStore } from "@/store/settingsStore"

/** حافظه کلیدهای نوتیفیکیشن‌های ارسال‌شده برای جلوگیری از ارسال مکرر (Deduplication) */
const notifiedKeys = new Set<string>()

export function hasNotified(key: string): boolean {
  return notifiedKeys.has(key)
}

export function markNotified(key: string): void {
  notifiedKeys.add(key)
}

export function clearNotificationHistory(): void {
  notifiedKeys.clear()
}

/** بررسی پشتیبانی مرورگر از Browser Notification API */
export function isBrowserNotificationSupported(): boolean {
  if (typeof window !== "undefined" && "Notification" in window) return true
  if (typeof globalThis !== "undefined" && "Notification" in globalThis) return true
  return false
}

/** دریافت وضعیت فعلی اجازه مرورگر */
export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return "denied"
  return Notification.permission
}

/** درخواست اجازه از کاربر برای نمایش اعلان‌های دسکتاپ مرورگر */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return "denied"
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch {
    return Notification.permission
  }
}

/** استایل مشترک فارسی و راست‌چین برای Toastها */
const BASE_TOAST_OPTIONS: ToastOptions = {
  duration: 4000,
  style: {
    fontFamily: "var(--font-vazirmatn, 'Vazirmatn', sans-serif)",
    direction: "rtl",
    textAlign: "start",
    borderRadius: "14px",
    padding: "10px 16px",
    fontSize: "0.875rem",
    lineHeight: "1.5",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  },
}

interface SendNotificationParams {
  key?: string
  title: string
  body: string
  type:
    | "session_created"
    | "session_deleted"
    | "session_starting_soon"
    | "session_started"
    | "session_ended"
    | "settings_saved"
  icon?: string
}

function renderToastBody(title: string, body: string, titleClass?: string) {
  return createElement(
    "div",
    { className: "space-y-0.5" },
    createElement("p", { className: `font-bold text-xs ${titleClass ?? ""}` }, title),
    createElement("p", { className: "text-[11px] text-muted-foreground leading-4" }, body),
  )
}

/**
 * ارسال متمرکز نوتیفیکیشن:
 * ۱. بررسی فعال بودن در تنظیمات کاربر
 * ۲. جلوگیری از ارسال تکراری بر اساس `key`
 * ۳. ارسال Browser Notification در صورت اجازه و فعال بودن
 * ۴. نمایش Toast در داخل برنامه با `react-hot-toast`
 */
export function dispatchNotification({
  key,
  title,
  body,
  type,
  icon,
}: SendNotificationParams): boolean {
  const settings = useSettingsStore.getState()

  // اگر اعلان‌ها کلاً غیرفعال باشند، هیچ عملیاتی انجام نشود
  if (!settings.notificationsEnabled) return false

  // بررسی دسته اعلان‌های ثبت و حذف جلسه
  if (
    (type === "session_created" || type === "session_deleted") &&
    !settings.sessionChangeNotifications
  ) {
    return false
  }

  // بررسی دسته یادآوری جلسه‌ها (شروع، پایان و ۵ دقیقه قبل)
  if (
    (type === "session_starting_soon" ||
      type === "session_started" ||
      type === "session_ended") &&
    !settings.classReminders
  ) {
    return false
  }

  // جلوگیری از ارسال تکراری با کلید اختصاصی
  if (key) {
    if (notifiedKeys.has(key)) return false
    notifiedKeys.add(key)
  }

  // ۱. ارسال Browser Notification API (در صورت پشتیبانی، اجازه مرورگر و فعال بودن در تنظیمات)
  if (
    settings.browserNotifications &&
    isBrowserNotificationSupported() &&
    Notification.permission === "granted"
  ) {
    try {
      const browserNotif = new Notification(title, {
        body,
        icon: icon ?? "/favicon.ico",
        tag: key,
      })
      browserNotif.onclick = () => {
        window.focus()
        browserNotif.close()
      }
    } catch (e) {
      console.warn("[notifications] ارسال اعلان مرورگر با خطا روبه‌رو شد:", e)
    }
  }

  // ۲. نمایش Toast در داخل برنامه (react-hot-toast)
  switch (type) {
    case "session_created":
      toast.success(renderToastBody(title, body), {
        ...BASE_TOAST_OPTIONS,
        icon: "📅",
        className:
          "border border-emerald-500/30 bg-background text-foreground",
      })
      break

    case "session_deleted":
      toast.error(renderToastBody(title, body), {
        ...BASE_TOAST_OPTIONS,
        icon: "🗑️",
        className:
          "border border-rose-500/30 bg-background text-foreground",
      })
      break

    case "session_starting_soon":
      toast(renderToastBody(title, body, "text-amber-700 dark:text-amber-300"), {
        ...BASE_TOAST_OPTIONS,
        icon: "⏳",
        duration: 6000,
        className:
          "border border-amber-500/40 bg-background text-foreground",
      })
      break

    case "session_started":
      toast(renderToastBody(title, body, "text-emerald-700 dark:text-emerald-300"), {
        ...BASE_TOAST_OPTIONS,
        icon: "🔔",
        duration: 6000,
        className:
          "border border-emerald-500/40 bg-background text-foreground",
      })
      break

    case "session_ended":
      toast(renderToastBody(title, body, "text-sky-700 dark:text-sky-300"), {
        ...BASE_TOAST_OPTIONS,
        icon: "🏁",
        duration: 5000,
        className:
          "border border-sky-500/40 bg-background text-foreground",
      })
      break

    case "settings_saved":
      toast.success(renderToastBody(title, body), {
        ...BASE_TOAST_OPTIONS,
        icon: "⚙️",
        className:
          "border border-primary/30 bg-background text-foreground",
      })
      break
  }

  return true
}

/* -------------------------------------------------------------------------- */
/*                        متدهای آماده برای ۴ رویداد اصلی                      */
/* -------------------------------------------------------------------------- */

/** رویداد ۱: ثبت جلسه جدید */
export function notifySessionCreated(
  classTitle: string,
  date: string,
  timeRange: string,
): void {
  dispatchNotification({
    type: "session_created",
    title: "جلسه جدید ثبت شد",
    body: `کلاس «${classTitle}» در تاریخ ${date} (ساعت ${toPersianDigits(timeRange)})`,
  })
}

/** رویداد ۲: حذف جلسه */
export function notifySessionDeleted(
  classTitle: string,
  date: string,
  timeRange: string,
): void {
  dispatchNotification({
    type: "session_deleted",
    title: "جلسه حذف شد",
    body: `جلسه کلاس «${classTitle}» در تاریخ ${date} (ساعت ${toPersianDigits(timeRange)}) حذف شد.`,
  })
}

/** رویداد ذخیره تنظیمات */
export function notifySettingsSaved(message: string = "تغییرات با موفقیت ذخیره شد."): void {
  dispatchNotification({
    type: "settings_saved",
    title: "تنظیمات ذخیره شد",
    body: message,
  })
}

/** رویداد ۳: شروع جلسه (و ۵ دقیقه قبل از شروع) */
export function notifySessionStartingSoon(
  sessionId: string,
  classTitle: string,
  startTime: string,
  dateStr: string,
): void {
  dispatchNotification({
    key: `reminder_5min_${sessionId}_${dateStr}`,
    type: "session_starting_soon",
    title: `یادآوری: کلاس «${classTitle}»`,
    body: `کلاس تا ۵ دقیقه دیگر در ساعت ${toPersianDigits(startTime)} شروع می‌شود.`,
  })
}

export function notifySessionStarted(
  sessionId: string,
  classTitle: string,
  startTime: string,
  dateStr: string,
): void {
  dispatchNotification({
    key: `started_${sessionId}_${dateStr}`,
    type: "session_started",
    title: `کلاس شروع شد: «${classTitle}»`,
    body: `جلسه هم‌اکنون در ساعت ${toPersianDigits(startTime)} آغاز شده است.`,
  })
}

/** رویداد ۴: پایان جلسه */
export function notifySessionEnded(
  sessionId: string,
  classTitle: string,
  endTime: string,
  dateStr: string,
): void {
  dispatchNotification({
    key: `ended_${sessionId}_${dateStr}`,
    type: "session_ended",
    title: `پایان کلاس: «${classTitle}»`,
    body: `جلسه کلاس در ساعت ${toPersianDigits(endTime)} به پایان رسید.`,
  })
}

/* -------------------------------------------------------------------------- */
/*          سرویس زمان‌دار: بررسی جلسات امروز هر ۳۰ ثانیه برای یادآوری         */
/* -------------------------------------------------------------------------- */

/**
 * بررسی و تطبیق ساعت جاری با جلسات امروز.
 * این تابع به صورت مستقل نیز قابل تست است.
 */
export async function checkTodaySessionsTiming(nowDate: Date = new Date()): Promise<void> {
  const settings = useSettingsStore.getState()
  if (!settings.notificationsEnabled || !settings.classReminders) return

  const today = todayJalali()
  const todayStr = jalaliDateToString(today)

  // واکشی جلسات فعال امروز از IndexedDB
  const todaySessions = await db.sessions
    .where("date")
    .equals(todayStr)
    .toArray()

  const activeSessions = todaySessions.filter((s) => s.status !== "canceled")
  if (activeSessions.length === 0) return

  // واکشی تعریف‌های کلاس‌ها برای نام کلاس
  const classDefs = await db.classDefinitions.toArray()
  const classMap = new Map(classDefs.map((c) => [c.id, c.title]))

  const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()

  for (const session of activeSessions) {
    const classTitle = classMap.get(session.definitionId) ?? "کلاس"

    const [startH, startM] = session.start.split(":").map(Number)
    const [endH, endM] = session.end.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    // ۱. بررسی ۵ دقیقه قبل از شروع (بازه ۳ تا ۵ دقیقه قبل)
    const diffToStart = startMinutes - currentMinutes
    if (diffToStart >= 3 && diffToStart <= 5) {
      notifySessionStartingSoon(session.id, classTitle, session.start, todayStr)
    }

    // ۲. بررسی زمان دقیق شروع (بازه ۰ تا ۲ دقیقه پس از شروع)
    const diffFromStart = currentMinutes - startMinutes
    if (diffFromStart >= 0 && diffFromStart <= 2) {
      notifySessionStarted(session.id, classTitle, session.start, todayStr)
    }

    // ۳. بررسی زمان پایان (بازه ۰ تا ۲ دقیقه پس از پایان)
    const diffFromEnd = currentMinutes - endMinutes
    if (diffFromEnd >= 0 && diffFromEnd <= 2) {
      notifySessionEnded(session.id, classTitle, session.end, todayStr)
    }
  }
}

/**
 * هوک React برای اجرای دوره‌ای بررسی جلسات هر ۳۰ ثانیه
 */
export function useScheduledNotifications(intervalMs: number = 30_000) {
  useEffect(() => {
    // اجرای بار نخست هنگام بارگذاری
    checkTodaySessionsTiming().catch((err) => {
      console.warn("[notifications] خطا در بررسی جلسات زمان‌دار:", err)
    })

    const timer = setInterval(() => {
      checkTodaySessionsTiming().catch((err) => {
        console.warn("[notifications] خطا در بررسی جلسات زمان‌دار:", err)
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])
}
