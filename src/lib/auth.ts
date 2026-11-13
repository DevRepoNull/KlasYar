import { db, type User } from "@/db/schema"

export const AUTH_TOKEN_KEY = "klasyar_auth_session"
export const AUTH_REMEMBER_KEY = "klasyar_remember_me"

/**
 * هش کردن رمز عبور با استفاده از الگوریتم استاندارد SHA-256 و مرورگر Web Cryptography API
 * تضمین می‌کند که رمز عبور خام هرگز در پایگاه‌داده ذخیره نشود.
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim()
  const subtle = globalThis.crypto?.subtle

  if (subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  throw new Error("سرویس رمزنگاری Web Crypto API در دسترس نیست.")
}

/** بررسی اینکه آیا کاربری در جدول users ثبت شده است یا خیر */
export async function hasRegisteredUsers(): Promise<boolean> {
  try {
    const count = await db.users.count()
    return count > 0
  } catch (err) {
    console.error("خطا در بررسی کاربران:", err)
    return false
  }
}

/** دریافت کاربر اصلی (مدیر) */
export async function getAdminUser(): Promise<User | undefined> {
  try {
    return await db.users.toCollection().first()
  } catch (err) {
    console.error("خطا در واکشی کاربر:", err)
    return undefined
  }
}

/** ثبت‌نام کاربر مدیر برای اولین بار */
export async function registerAdmin(
  username: string,
  password: string,
): Promise<User> {
  const trimmedUser = username.trim()
  if (!trimmedUser) {
    throw new Error("نام کاربری نمی‌تواند خالی باشد.")
  }
  if (!password || password.length < 4) {
    throw new Error("رمز عبور باید حداقل ۴ کاراکتر باشد.")
  }

  const existingCount = await db.users.count()
  if (existingCount > 0) {
    throw new Error("حساب کاربری از پیش تعریف شده است؛ لطفاً وارد شوید.")
  }

  const passwordHash = await hashPassword(password)
  const newUser: User = {
    id: 1,
    username: trimmedUser,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  await db.users.put(newUser)
  return newUser
}

/** اعتبارسنجی نام کاربری و کلمه عبور */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const trimmedUser = username.trim()
  if (!trimmedUser || !password) {
    return { success: false, error: "لطفاً نام کاربری و رمز عبور را وارد کنید." }
  }

  const user = await db.users
    .where("username")
    .equalsIgnoreCase(trimmedUser)
    .first()

  if (!user) {
    return { success: false, error: "کاربری با این مشخصات یافت نشد." }
  }

  const inputHash = await hashPassword(password)
  if (inputHash !== user.passwordHash) {
    return { success: false, error: "رمز عبور وارد شده نادرست است." }
  }

  return { success: true, user }
}

/** ایجاد یک توکن سشن سبک برای نگهداری وضعیت نشست */
export function createSessionToken(user: { id: number; username: string }): string {
  const payload = {
    uid: user.id,
    un: user.username,
    t: Date.now(),
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

/** اعتبارسنجی و رمزگشایی توکن نشست */
export function verifySessionToken(token: string): { uid: number; un: string } | null {
  try {
    const json = decodeURIComponent(escape(atob(token)))
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed.uid === "number" && typeof parsed.un === "string") {
      return { uid: parsed.uid, un: parsed.un }
    }
    return null
  } catch {
    return null
  }
}

/**
 * به‌روزرسانی مشخصات و رمز عبور کاربر مدیر
 */
export async function updateAdminProfile(params: {
  username?: string
  currentPassword?: string
  newPassword?: string
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await getAdminUser()
  if (!user) {
    return { success: false, error: "حساب کاربری یافت نشد." }
  }

  // اعتبارسنجی رمز عبور فعلی
  if (!params.currentPassword) {
    return { success: false, error: "لطفاً رمز عبور فعلی خود را وارد کنید." }
  }

  const currentHash = await hashPassword(params.currentPassword)
  if (currentHash !== user.passwordHash) {
    return { success: false, error: "رمز عبور فعلی وارد شده نادرست است." }
  }

  const updated: User = { ...user }

  if (params.username && params.username.trim() !== "") {
    updated.username = params.username.trim()
  }

  if (params.newPassword && params.newPassword.trim() !== "") {
    if (params.newPassword.length < 4) {
      return { success: false, error: "رمز عبور جدید باید حداقل ۴ کاراکتر باشد." }
    }
    updated.passwordHash = await hashPassword(params.newPassword)
  }

  await db.users.put(updated)
  return { success: true, user: updated }
}

/**
 * پاک‌سازی کامل تمام اطلاعات دیتابیس (Factory Reset)
 */
export async function clearAllDatabaseData(): Promise<void> {
  await Promise.all([
    db.classDefinitions.clear(),
    db.sessions.clear(),
    db.attendance.clear(),
    db.settings.clear(),
    db.users.clear(),
  ])
}
