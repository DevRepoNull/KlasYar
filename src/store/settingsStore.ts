import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { settingsStorage } from "@/lib/idbStorage"
import { applyFontFamily, type AppFont } from "@/lib/font"
import { applyColorTheme, type ColorTheme } from "@/lib/color-theme"

export type ThemeMode = "light" | "dark" | "system"
export type Language = "fa" | "en"
/** شنبه = اولین روز هفته در تقویم ایران */
export type WeekStart = "saturday" | "sunday" | "monday"
export type { AppFont, ColorTheme }

/** preferenceهایی که در IndexedDB ذخیره می‌شوند. */
export interface SettingsValues {
  theme: ThemeMode
  colorTheme: ColorTheme
  language: Language
  weekStart: WeekStart
  /** مدت پیش‌فرض هر جلسه به دقیقه */
  defaultSessionDuration: number
  /** فعال‌سازی کل سیستم اعلان‌ها */
  notificationsEnabled: boolean
  /** یادآوری شروع و پایان کلاس‌ها (شامل ۵ دقیقه قبل) */
  classReminders: boolean
  /** اعلان‌های ثبت و حذف جلسه */
  sessionChangeNotifications: boolean
  /** استفاده از Browser Notification API */
  browserNotifications: boolean
  dailySummary: boolean
  /** زمان آخرین پشتیبان‌گیری کامل به صورت ISO */
  lastBackupAt: string | null
  /** فونت پیش‌فرض رابط کاربری برنامه */
  fontFamily: AppFont
  /** آیا کاربر ویزارد راهنمای اولیه را مشاهده یا رد کرده است؟ */
  hasCompletedOnboarding: boolean
}

export const DEFAULT_SETTINGS: SettingsValues = {
  theme: "system",
  colorTheme: "emerald",
  language: "fa",
  weekStart: "saturday",
  defaultSessionDuration: 60,
  notificationsEnabled: true,
  classReminders: true,
  sessionChangeNotifications: true,
  browserNotifications: true,
  dailySummary: false,
  lastBackupAt: null,
  fontFamily: "vazirmatn",
  hasCompletedOnboarding: false,
}

interface SettingsActions {
  /** چند preference را هم‌زمان به‌روز می‌کند. */
  updateSettings: (partial: Partial<SettingsValues>) => void
  setTheme: (theme: ThemeMode) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  setFontFamily: (fontFamily: AppFont) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  openOnboarding: () => void
  closeOnboarding: () => void
  resetSettings: () => void
}

export interface SettingsUIState {
  /** وضعیت باز بودن دیالوگ ویزارد راهنمای شروع سریع */
  isOnboardingOpen: boolean
}

export type SettingsStore = SettingsValues & SettingsActions & SettingsUIState

/** فقط مقدارهای preference را از store جدا می‌کند (برای persist و خروجی JSON). */
export function pickSettingsValues(source: SettingsValues): SettingsValues {
  return {
    theme: source.theme,
    colorTheme: source.colorTheme ?? "emerald",
    language: source.language,
    weekStart: source.weekStart,
    defaultSessionDuration: source.defaultSessionDuration,
    notificationsEnabled: source.notificationsEnabled,
    classReminders: source.classReminders,
    sessionChangeNotifications: source.sessionChangeNotifications,
    browserNotifications: source.browserNotifications,
    dailySummary: source.dailySummary,
    lastBackupAt: source.lastBackupAt ?? null,
    fontFamily: source.fontFamily ?? "vazirmatn",
    hasCompletedOnboarding: Boolean(source.hasCompletedOnboarding),
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isOnboardingOpen: false,
      updateSettings: (partial) => {
        if (partial.fontFamily) {
          applyFontFamily(partial.fontFamily)
        }
        if (partial.colorTheme) {
          applyColorTheme(partial.colorTheme)
        }
        set(partial)
      },
      setTheme: (theme) => set({ theme }),
      setColorTheme: (colorTheme) => {
        applyColorTheme(colorTheme)
        set({ colorTheme })
      },
      setFontFamily: (fontFamily) => {
        applyFontFamily(fontFamily)
        set({ fontFamily })
      },
      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true, isOnboardingOpen: false }),
      resetOnboarding: () =>
        set({ hasCompletedOnboarding: false, isOnboardingOpen: true }),
      openOnboarding: () => set({ isOnboardingOpen: true }),
      closeOnboarding: () => set({ isOnboardingOpen: false }),
      resetSettings: () => {
        applyFontFamily(DEFAULT_SETTINGS.fontFamily)
        applyColorTheme(DEFAULT_SETTINGS.colorTheme)
        set({ ...DEFAULT_SETTINGS, isOnboardingOpen: false })
      },
    }),
    {
      name: "klasyar:settings",
      version: 2,
      storage: createJSONStorage(() => settingsStorage),
      partialize: (state) => pickSettingsValues(state),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn(
            "[settings] خواندن تنظیمات از IndexedDB ناموفق بود؛ مقادیر پیش‌فرض استفاده می‌شود.",
            error,
          )
        } else {
          if (state?.fontFamily) {
            applyFontFamily(state.fontFamily)
          }
          if (state?.colorTheme) {
            applyColorTheme(state.colorTheme)
          }
        }
      },
    },
  ),
)
