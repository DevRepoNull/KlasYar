import { beforeEach, describe, expect, it } from "vitest"
import {
  applyColorTheme,
  COLOR_THEMES,
  COLOR_THEME_COOKIE,
  getSavedColorTheme,
} from "@/lib/color-theme"
import { DEFAULT_SETTINGS, pickSettingsValues, useSettingsStore, type SettingsValues } from "@/store/settingsStore"

// شبیه‌سازی سبک document و localStorage برای محیط تست Node/Vitest
if (typeof document === "undefined") {
  const classNames = new Set<string>()
  const root = {
    attributes: {} as Record<string, string>,
    style: {} as Record<string, string>,
    classList: {
      add: (c: string) => classNames.add(c),
      remove: (c: string) => classNames.delete(c),
      contains: (c: string) => classNames.has(c),
    },
    setAttribute(name: string, val: string) {
      this.attributes[name] = val
    },
    getAttribute(name: string) {
      return this.attributes[name] || null
    },
    removeAttribute(name: string) {
      delete this.attributes[name]
    },
  }
  globalThis.document = {
    documentElement: root as unknown as HTMLElement,
    cookie: "",
  } as unknown as Document
}

if (typeof localStorage === "undefined") {
  const storage = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, String(v)),
    removeItem: (k: string) => storage.delete(k),
    clear: () => storage.clear(),
  } as unknown as Storage
}

describe("Dynamic Color Theme Engine", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-color-theme")
    document.cookie = `${COLOR_THEME_COOKIE}=; path=/; max-age=0`
    localStorage.clear()
    useSettingsStore.setState({ colorTheme: "emerald" })
  })

  it("contains all 4 predefined color palettes (Emerald, Midnight, Sunset, Monochrome)", () => {
    const themeIds = COLOR_THEMES.map((t) => t.id)
    expect(themeIds).toEqual(["emerald", "midnight", "sunset", "monochrome"])

    COLOR_THEMES.forEach((theme) => {
      expect(theme.label).toBeTruthy()
      expect(theme.englishLabel).toBeTruthy()
      expect(theme.description).toBeTruthy()
      expect(theme.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(theme.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(theme.previewSwatches.length).toBe(4)
    })
  })

  it("applies color theme attribute on document root and saves in storage", () => {
    applyColorTheme("midnight")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("midnight")
    expect(getSavedColorTheme()).toBe("midnight")

    applyColorTheme("sunset")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("sunset")
    expect(getSavedColorTheme()).toBe("sunset")

    applyColorTheme("monochrome")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("monochrome")
    expect(getSavedColorTheme()).toBe("monochrome")

    applyColorTheme("emerald")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("emerald")
    expect(getSavedColorTheme()).toBe("emerald")
  })

  it("updates store state and triggers DOM update via setColorTheme", () => {
    const store = useSettingsStore.getState()
    expect(store.colorTheme).toBe("emerald")

    store.setColorTheme("midnight")
    expect(useSettingsStore.getState().colorTheme).toBe("midnight")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("midnight")

    store.updateSettings({ colorTheme: "sunset" })
    expect(useSettingsStore.getState().colorTheme).toBe("sunset")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("sunset")
  })

  it("pickSettingsValues correctly preserves or defaults colorTheme", () => {
    expect(DEFAULT_SETTINGS.colorTheme).toBe("emerald")

    const mockSettings: SettingsValues = {
      ...DEFAULT_SETTINGS,
      colorTheme: "sunset",
    }
    const picked = pickSettingsValues(mockSettings)
    expect(picked.colorTheme).toBe("sunset")

    // @ts-expect-error Testing fallback
    const fallbackPicked = pickSettingsValues({ ...DEFAULT_SETTINGS, colorTheme: undefined })
    expect(fallbackPicked.colorTheme).toBe("emerald")
  })

  it("resets to default emerald palette on store resetSettings", () => {
    const store = useSettingsStore.getState()
    store.setColorTheme("monochrome")
    expect(useSettingsStore.getState().colorTheme).toBe("monochrome")

    store.resetSettings()
    expect(useSettingsStore.getState().colorTheme).toBe("emerald")
    expect(document.documentElement.getAttribute("data-color-theme")).toBe("emerald")
  })
})
