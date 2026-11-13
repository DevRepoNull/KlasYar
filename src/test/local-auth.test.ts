import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  AUTH_REMEMBER_KEY,
  AUTH_TOKEN_KEY,
  clearAllDatabaseData,
  createSessionToken,
  hashPassword,
  registerAdmin,
  updateAdminProfile,
  verifySessionToken,
} from "@/lib/auth"
import { db } from "@/db/schema"
import { useAuthStore } from "@/store/authStore"

// Mock localStorage & sessionStorage for Node.js test environment if needed
if (typeof localStorage === "undefined") {
  const localMap = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (k: string) => localMap.get(k) ?? null,
    setItem: (k: string, v: string) => localMap.set(k, String(v)),
    removeItem: (k: string) => localMap.delete(k),
    clear: () => localMap.clear(),
  } as unknown as Storage
}

if (typeof sessionStorage === "undefined") {
  const sessionMap = new Map<string, string>()
  globalThis.sessionStorage = {
    getItem: (k: string) => sessionMap.get(k) ?? null,
    setItem: (k: string, v: string) => sessionMap.set(k, String(v)),
    removeItem: (k: string) => sessionMap.delete(k),
    clear: () => sessionMap.clear(),
  } as unknown as Storage
}

describe("Local Authentication System (SHA-256 & Client-Side Auth)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      error: null,
      isLoading: false,
      hasRegisteredUsers: true,
    })
  })

  describe("Password Hashing (SHA-256)", () => {
    it("hashes passwords into a 64-character hexadecimal SHA-256 string", async () => {
      const hash1 = await hashPassword("admin123")
      expect(typeof hash1).toBe("string")
      expect(hash1).toHaveLength(64)
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true)

      // تضمین قطعی: پسورد یکسان هش یکسان تولید می‌کند
      const hash2 = await hashPassword("admin123")
      expect(hash1).toBe(hash2)
    })

    it("generates distinct hashes for different passwords", async () => {
      const hashA = await hashPassword("password123")
      const hashB = await hashPassword("password456")
      expect(hashA).not.toBe(hashB)
    })
  })

  describe("Session Tokens", () => {
    it("creates and verifies valid base64 session tokens", () => {
      const user = { id: 1, username: "مدیر" }
      const token = createSessionToken(user)
      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(10)

      const payload = verifySessionToken(token)
      expect(payload).not.toBeNull()
      expect(payload?.uid).toBe(1)
      expect(payload?.un).toBe("مدیر")
    })

    it("returns null for corrupted or tampered session tokens", () => {
      expect(verifySessionToken("invalid_token")).toBeNull()
      expect(verifySessionToken("")).toBeNull()
    })
  })

  describe("Auth Store State & Session Management", () => {
    it("starts with clean default unauthenticated state", () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })

    it("clears auth tokens and resets state on logout", () => {
      localStorage.setItem(AUTH_TOKEN_KEY, "test_token")
      localStorage.setItem(AUTH_REMEMBER_KEY, "true")

      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: 1, username: "مدیر" },
      })

      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_REMEMBER_KEY)).toBeNull()
    })

    it("handles error clearing", () => {
      useAuthStore.setState({ error: "رمز عبور نادرست است." })
      expect(useAuthStore.getState().error).toBe("رمز عبور نادرست است.")

      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe("Admin Profile Update & Validation", () => {
    beforeEach(async () => {
      await db.users.clear()
      await registerAdmin("استاد احمدی", "admin1234")
    })

    it("rejects profile update without current password", async () => {
      const res = await updateAdminProfile({
        username: "استاد حسینی",
        currentPassword: "",
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("رمز عبور فعلی")
    })

    it("rejects profile update when current password is wrong", async () => {
      const res = await updateAdminProfile({
        username: "استاد حسینی",
        currentPassword: "wrongpassword",
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("نادرست")
    })

    it("rejects new password shorter than 4 characters", async () => {
      const res = await updateAdminProfile({
        currentPassword: "admin1234",
        newPassword: "123",
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("حداقل ۴ کاراکتر")
    })

    it("successfully updates username and password with valid credentials", async () => {
      const res = await updateAdminProfile({
        username: "استاد رضایی",
        currentPassword: "admin1234",
        newPassword: "newsecretpassword",
      })
      expect(res.success).toBe(true)
      expect(res.user?.username).toBe("استاد رضایی")

      // بررسی بروزرسانی مستقیم در Dexie
      const savedUser = await db.users.get(1)
      expect(savedUser?.username).toBe("استاد رضایی")
      const expectedNewHash = await hashPassword("newsecretpassword")
      expect(savedUser?.passwordHash).toBe(expectedNewHash)
    })
  })

  describe("Danger Zone - Factory Reset", () => {
    it("completely wipes all tables on factory reset", async () => {
      await clearAllDatabaseData()
      await registerAdmin("مدیر تست", "pass1234")
      await db.classDefinitions.put({
        id: "class-1",
        title: "کلاس ریاضی",
        daysOfWeek: [0],
        totalSessions: 10,
        defaultStart: "08:00",
        defaultEnd: "09:30",
        color: "#10b981",
        students: [{ id: "s-1", name: "علی رضایی" }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      expect(await db.users.count()).toBe(1)
      expect(await db.classDefinitions.count()).toBe(1)

      await clearAllDatabaseData()

      expect(await db.users.count()).toBe(0)
      expect(await db.classDefinitions.count()).toBe(0)
      expect(await db.sessions.count()).toBe(0)
      expect(await db.attendance.count()).toBe(0)
      expect(await db.settings.count()).toBe(0)
    })
  })
})
