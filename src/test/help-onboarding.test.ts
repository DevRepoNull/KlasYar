import { describe, expect, it } from "vitest"
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items"
import { DEFAULT_SETTINGS, pickSettingsValues, type SettingsValues } from "@/store/settingsStore"
import { FONT_OPTIONS } from "@/lib/font"

describe("Help & Onboarding: Nav Items & Routing", () => {
  it("includes /help in NAV_ITEMS with correct label and icon", () => {
    const helpItem = NAV_ITEMS.find((item) => item.href === "/help")
    expect(helpItem).toBeDefined()
    expect(helpItem?.label).toBe("راهنما")
    expect(helpItem?.mobileLabel).toBe("راهنما")
    expect(helpItem?.icon).toBeDefined()
  })

  it("isActivePath recognizes /help and /onboarding as active for /help", () => {
    expect(isActivePath("/help", "/help")).toBe(true)
    expect(isActivePath("/onboarding", "/help")).toBe(true)
    expect(isActivePath("/help/faq", "/help")).toBe(true)
    expect(isActivePath("/classes", "/help")).toBe(false)
    expect(isActivePath("/", "/help")).toBe(false)
  })

  it("maintains consistent active path behavior for standard routes", () => {
    expect(isActivePath("/", "/")).toBe(true)
    expect(isActivePath("/classes", "/")).toBe(false)
    expect(isActivePath("/classes", "/classes")).toBe(true)
    expect(isActivePath("/settings", "/settings")).toBe(true)
  })
})

describe("Help & Onboarding: Settings Store Persistence & Defaults", () => {
  it("has initial default settings configured for first-run onboarding", () => {
    expect(DEFAULT_SETTINGS.hasCompletedOnboarding).toBe(false)
    expect(DEFAULT_SETTINGS.fontFamily).toBe("vazirmatn")
  })

  it("pickSettingsValues correctly serializes fontFamily and hasCompletedOnboarding", () => {
    const mockSettings: SettingsValues = {
      ...DEFAULT_SETTINGS,
      fontFamily: "system",
      hasCompletedOnboarding: true,
    }

    const picked = pickSettingsValues(mockSettings)
    expect(picked.fontFamily).toBe("system")
    expect(picked.hasCompletedOnboarding).toBe(true)
  })

  it("pickSettingsValues falls back to defaults when values are missing or falsy", () => {
    const mockPartial = {
      ...DEFAULT_SETTINGS,
      fontFamily: undefined as unknown as "vazirmatn",
      hasCompletedOnboarding: undefined as unknown as boolean,
    }

    const picked = pickSettingsValues(mockPartial)
    expect(picked.fontFamily).toBe("vazirmatn")
    expect(picked.hasCompletedOnboarding).toBe(false)
  })
})

describe("Help & Onboarding: Font Configuration", () => {
  it("contains Vazirmatn as the recommended font", () => {
    const vazir = FONT_OPTIONS.find((f) => f.id === "vazirmatn")
    expect(vazir).toBeDefined()
    expect(vazir?.isRecommended).toBe(true)
    expect(vazir?.name).toContain("وزیرمتن")
  })

  it("provides system font as a fallback alternative", () => {
    const sys = FONT_OPTIONS.find((f) => f.id === "system")
    expect(sys).toBeDefined()
    expect(sys?.name).toContain("سیستم")
  })
})
