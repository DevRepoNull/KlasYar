import { DatabaseError, runDb } from "./errors"
import { db, type Setting } from "./schema"

/**
 * کلیدهای شناخته‌شده تنظیمات.
 * برای افزودن تنظیم جدید، یک کلید با فضای نام مشخص (`group:name`) اضافه کنید.
 */
export const SETTING_KEYS = {
  seedDemoData: "seed:demo",
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

export async function getSetting<T = unknown>(
  key: string,
): Promise<T | undefined> {
  return runDb(async () => {
    const row = await db.settings.get(key)
    return row ? (row.value as T) : undefined
  })
}

export async function getSettingOrDefault<T>(
  key: string,
  fallback: T,
): Promise<T> {
  const value = await getSetting<T>(key)
  return value === undefined ? fallback : value
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  return runDb(async () => {
    const rows = await db.settings.toArray()
    return Object.fromEntries(rows.map((row) => [row.key, row.value]))
  })
}

export async function setSetting<T>(key: string, value: T): Promise<Setting> {
  return runDb(async () => {
    const normalizedKey = key.trim()
    if (!normalizedKey) {
      throw new DatabaseError("validation", "کلید تنظیمات نمی‌تواند خالی باشد.")
    }
    const row: Setting = { key: normalizedKey, value }
    await db.settings.put(row)
    return row
  })
}

/** ذخیره چند تنظیم در یک تراکنش. */
export async function setSettings(
  values: Record<string, unknown>,
): Promise<void> {
  return runDb(() =>
    db.transaction("rw", db.settings, async () => {
      const rows: Setting[] = Object.entries(values)
        .filter(([key]) => key.trim().length > 0)
        .map(([key, value]) => ({ key: key.trim(), value }))
      if (rows.length) {
        await db.settings.bulkPut(rows)
      }
    }),
  )
}

export async function deleteSetting(key: string): Promise<void> {
  return runDb(async () => {
    const deleted = await db.settings.where("key").equals(key).delete()
    if (deleted === 0) {
      throw new DatabaseError("not-found", "این تنظیم وجود ندارد.")
    }
  })
}

/* -------------------------------------------------------------------------- */
/*                               نام‌های مستعار                                */
/* -------------------------------------------------------------------------- */

export {
  setSetting as create,
  getSetting as getById,
  getSetting as get,
  getAllSettings as getAll,
  setSetting as update,
  setSetting as set,
  deleteSetting as delete,
}
