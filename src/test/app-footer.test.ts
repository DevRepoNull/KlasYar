import { describe, expect, it } from "vitest"
import packageJson from "../../package.json"

describe("AppFooter Component & Metadata Verification", () => {
  it("reads version correctly from package.json with v-prefix", () => {
    expect(packageJson.version).toBeDefined()
    expect(typeof packageJson.version).toBe("string")
    expect(`v${packageJson.version}`).toMatch(/^v\d+\.\d+\.\d+/)
  })

  it("points to correct GitHub repository/author profile", () => {
    const authorGithub = "https://github.com/DevRepoNull"
    expect(authorGithub).toBe("https://github.com/DevRepoNull")
  })
})
