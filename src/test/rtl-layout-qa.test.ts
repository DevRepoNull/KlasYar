import { describe, expect, it } from "vitest"
import fs from "fs"
import path from "path"

describe("RTL, Layout, and Senior QA Verification", () => {
  it("verifies index.html specifies lang=fa and dir=rtl on both html and body", () => {
    const indexHtml = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf-8")
    expect(indexHtml).toMatch(/<html[^>]*lang=["']fa["'][^>]*dir=["']rtl["']/)
    expect(indexHtml).toMatch(/<body[^>]*dir=["']rtl["']/)
  })

  it("verifies main.tsx wraps the app with DirectionProvider dir=rtl", () => {
    const mainTsx = fs.readFileSync(path.resolve(__dirname, "../main.tsx"), "utf-8")
    expect(mainTsx).toContain("DirectionProvider")
    expect(mainTsx).toContain('dir="rtl"')
  })

  it("verifies index.css and globals.css enforce direction: rtl and avoid global scroll-behavior smooth", () => {
    const indexCss = fs.readFileSync(path.resolve(__dirname, "../index.css"), "utf-8")
    const globalsCss = fs.readFileSync(path.resolve(__dirname, "../globals.css"), "utf-8")

    expect(indexCss).toContain("direction: rtl")
    expect(indexCss).toContain("text-align: right")
    expect(indexCss).not.toContain("scroll-behavior: smooth")
    expect(globalsCss).not.toContain("scroll-behavior: smooth")
  })

  it("verifies Radix Tabs and Select primitives default to dir=rtl", () => {
    const tabsTsx = fs.readFileSync(path.resolve(__dirname, "../components/ui/tabs.tsx"), "utf-8")
    const selectTsx = fs.readFileSync(path.resolve(__dirname, "../components/ui/select.tsx"), "utf-8")

    expect(tabsTsx).toContain('dir = "rtl"')
    expect(selectTsx).toContain('dir = "rtl"')
  })

  it("verifies sidebar active indicator tick is positioned at start-0 (right side in RTL)", () => {
    const appLayoutTsx = fs.readFileSync(path.resolve(__dirname, "../components/layout/AppLayout.tsx"), "utf-8")
    // Should NOT have end-0 for the indicator bar
    expect(appLayoutTsx).toMatch(/start-0[^"]*bg-primary/)
    expect(appLayoutTsx).not.toMatch(/inset-y-2 end-0 w-1 rounded-full bg-primary/)
  })

  it("verifies AppLayout does not have overflow-x-hidden breaking sticky sidebar", () => {
    const appLayoutTsx = fs.readFileSync(path.resolve(__dirname, "../components/layout/AppLayout.tsx"), "utf-8")
    expect(appLayoutTsx).not.toContain("bg-background overflow-x-hidden")
    expect(appLayoutTsx).toContain('dir="rtl"')
    expect(appLayoutTsx).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"instant\" })")
  })

  it("verifies auth-page does not reveal algorithm names like SHA-256 in user-facing UI", () => {
    const authPageTsx = fs.readFileSync(path.resolve(__dirname, "../pages/auth-page.tsx"), "utf-8")
    expect(authPageTsx).not.toContain("الگوریتم")
    expect(authPageTsx).not.toContain("SHA-256")
    expect(authPageTsx).toContain("Local-First")
  })

  it("verifies help-page uses forward arrows (ArrowLeft) for RTL button navigation", () => {
    const helpPageTsx = fs.readFileSync(path.resolve(__dirname, "../pages/help-page.tsx"), "utf-8")
    expect(helpPageTsx).not.toContain("<ArrowRight")
    expect(helpPageTsx).toContain("<ArrowLeft")
  })
})
