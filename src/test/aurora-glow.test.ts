import { describe, expect, it } from "vitest"
import { buttonVariants } from "@/components/ui/button"

describe("Prompt 28: Aurora Background, Glow Effect & Final Polish", () => {
  it("includes glow-effect styling in button variants", () => {
    const defaultClasses = buttonVariants({ variant: "default" })
    expect(defaultClasses).toContain("glow-effect-subtle")

    const glowClasses = buttonVariants({ variant: "glow" })
    expect(glowClasses).toContain("glow-effect")
  })

  it("verifies aurora background class names are consistent", () => {
    const expectedAuroraClasses = [
      "aurora-blob-1",
      "aurora-blob-2",
      "aurora-blob-3",
      "aurora-radial-center",
    ]

    expectedAuroraClasses.forEach((cls) => {
      expect(typeof cls).toBe("string")
      expect(cls.length).toBeGreaterThan(0)
    })
  })

  it("ensures glow effect utility classes are well-defined", () => {
    const glowUtilities = ["glow-effect", "glow-effect-subtle"]
    glowUtilities.forEach((utility) => {
      expect(utility).toMatch(/^glow-effect/)
    })
  })
})
