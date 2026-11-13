import { create } from "zustand"
import {
  AUTH_REMEMBER_KEY,
  AUTH_TOKEN_KEY,
  clearAllDatabaseData,
  createSessionToken,
  hasRegisteredUsers,
  registerAdmin,
  updateAdminProfile,
  verifyCredentials,
  verifySessionToken,
} from "@/lib/auth"

export interface AuthUser {
  id: number
  username: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  hasRegisteredUsers: boolean
  error: string | null

  // متدها
  checkAuth: () => Promise<void>
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  clearError: () => void
  updateProfile: (params: {
    username: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<{ success: boolean; error?: string }>
  factoryReset: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  hasRegisteredUsers: true,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ isLoading: true, error: null })
    try {
      const usersExist = await hasRegisteredUsers()
      if (!usersExist) {
        // هیچ کاربری وجود ندارد، باید صفحه ثبت‌نام اولیه باز شود
        set({
          isAuthenticated: false,
          user: null,
          hasRegisteredUsers: false,
          isLoading: false,
        })
        return
      }

      // کاربری وجود دارد؛ اکنون بررسی توکن ذخیره‌شده در localStorage یا sessionStorage
      let token = ""
      const isRemembered = localStorage.getItem(AUTH_REMEMBER_KEY) === "true"

      if (isRemembered) {
        token = localStorage.getItem(AUTH_TOKEN_KEY) || ""
      } else {
        token = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY) || ""
      }

      if (token) {
        const payload = verifySessionToken(token)
        if (payload) {
          set({
            isAuthenticated: true,
            user: { id: payload.uid, username: payload.un },
            hasRegisteredUsers: true,
            isLoading: false,
          })
          return
        }
      }

      // توکن معتبری پیدا نشد
      set({
        isAuthenticated: false,
        user: null,
        hasRegisteredUsers: true,
        isLoading: false,
      })
    } catch (err) {
      console.error("خطا در بررسی وضعیت احراز هویت:", err)
      set({
        isAuthenticated: false,
        user: null,
        hasRegisteredUsers: true,
        isLoading: false,
      })
    }
  },

  login: async (username: string, password: string, rememberMe = true) => {
    set({ error: null })
    try {
      const res = await verifyCredentials(username, password)
      if (!res.success || !res.user) {
        set({ error: res.error || "نام کاربری یا رمز عبور اشتباه است." })
        return false
      }

      const authUser: AuthUser = { id: res.user.id, username: res.user.username }
      const token = createSessionToken(authUser)

      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_REMEMBER_KEY, "true")
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.setItem(AUTH_REMEMBER_KEY, "false")
      }

      set({
        isAuthenticated: true,
        user: authUser,
        hasRegisteredUsers: true,
        error: null,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در برقراری ارتباط با سیستم ورود."
      set({ error: msg })
      return false
    }
  },

  register: async (username: string, password: string, rememberMe = true) => {
    set({ error: null })
    try {
      const user = await registerAdmin(username, password)
      const authUser: AuthUser = { id: user.id, username: user.username }
      const token = createSessionToken(authUser)

      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(AUTH_REMEMBER_KEY, "true")
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.setItem(AUTH_REMEMBER_KEY, "false")
      }

      set({
        isAuthenticated: true,
        user: authUser,
        hasRegisteredUsers: true,
        error: null,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ساخت حساب کاربری."
      set({ error: msg })
      return false
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_REMEMBER_KEY)
      sessionStorage.removeItem(AUTH_TOKEN_KEY)
    } catch (e) {
      console.warn("خطا در پاک‌سازی نشست:", e)
    }

    set({
      isAuthenticated: false,
      user: null,
      error: null,
    })
  },

  updateProfile: async (params) => {
    set({ error: null })
    try {
      const res = await updateAdminProfile(params)
      if (!res.success || !res.user) {
        return { success: false, error: res.error || "خطا در به‌روزرسانی مشخصات." }
      }

      const authUser: AuthUser = { id: res.user.id, username: res.user.username }
      const token = createSessionToken(authUser)

      const isRemembered = localStorage.getItem(AUTH_REMEMBER_KEY) === "true"
      if (isRemembered) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token)
      }

      set({ user: authUser })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ذخیره‌سازی اطلاعات."
      return { success: false, error: msg }
    }
  },

  factoryReset: async () => {
    try {
      await clearAllDatabaseData()
      localStorage.clear()
      sessionStorage.clear()
    } catch (err) {
      console.warn("خطا در بازنشانی کامل داده‌ها:", err)
    }

    set({
      isAuthenticated: false,
      user: null,
      hasRegisteredUsers: false,
      error: null,
    })
  },
}))
