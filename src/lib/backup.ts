import {
  db,
  DB_VERSION,
  type Attendance,
  type ClassDefinition,
  type Session,
  type Setting,
} from "@/db/schema"
import {
  formatClock,
  formatJalaliFullDate,
  jalaliFromDate,
  pad2,
} from "@/lib/jalali"
import { useSettingsStore } from "@/store/settingsStore"

export interface BackupMetadata {
  app: "klasyar"
  schemaVersion: number
  exportedAt: string
  stats: {
    classesCount: number
    sessionsCount: number
    attendanceCount: number
    settingsCount: number
  }
}

export interface KlasYarBackupPayload extends BackupMetadata {
  data: {
    classDefinitions: ClassDefinition[]
    sessions: Session[]
    attendance: Attendance[]
    settings: Setting[]
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** ساخت بسته داده کامل پشتیبان از تمام جداول به همراه نسخه اسکیما */
export async function createBackupPayload(): Promise<KlasYarBackupPayload> {
  const [classDefinitions, sessions, attendance, settings] = await Promise.all([
    db.classDefinitions.toArray(),
    db.sessions.toArray(),
    db.attendance.toArray(),
    db.settings.toArray(),
  ])

  const exportedAt = new Date().toISOString()

  return {
    app: "klasyar",
    schemaVersion: DB_VERSION,
    exportedAt,
    stats: {
      classesCount: classDefinitions.length,
      sessionsCount: sessions.length,
      attendanceCount: attendance.length,
      settingsCount: settings.length,
    },
    data: {
      classDefinitions,
      sessions,
      attendance,
      settings,
    },
  }
}

/** دریافت فایل بکاپ با نام klasyar-backup-{timestamp}.json و به‌روزرسانی زمان آخرین بکاپ */
export async function exportBackupFile(): Promise<{
  filename: string
  payload: KlasYarBackupPayload
}> {
  const payload = await createBackupPayload()
  const now = new Date()

  // ساخت timestamp برای نام فایل مطابق استاندارد: klasyar-backup-{timestamp}.json
  const y = now.getFullYear()
  const m = pad2(now.getMonth() + 1)
  const d = pad2(now.getDate())
  const h = pad2(now.getHours())
  const min = pad2(now.getMinutes())
  const s = pad2(now.getSeconds())
  const timestamp = `${y}${m}${d}-${h}${min}${s}`

  const filename = `klasyar-backup-${timestamp}.json`
  const jsonContent = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" })

  downloadBlob(blob, filename)

  // به‌روزرسانی زمان آخرین پشتیبان‌گیری
  useSettingsStore.getState().updateSettings({
    lastBackupAt: payload.exportedAt,
  })

  return { filename, payload }
}

/**
 * اعتبارسنجی دقیق محتوای فایل پشتیبان:
 * - بررسی صحت JSON
 * - بررسی امضای اختصاصی `app === "klasyar"`
 * - بررسی سازگاری نسخه اسکیما
 * - بررسی صحت وجود جداول
 */
export function validateBackupPayload(jsonText: string): KlasYarBackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error("فایل انتخاب‌شده خراب است و محتوای JSON معتبری ندارد.")
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("ساختار فایل پشتیبان نامعتبر است.")
  }

  const candidate = parsed as Partial<KlasYarBackupPayload>

  if (candidate.app !== "klasyar") {
    throw new Error("این فایل یک فایل پشتیبان معتبر نرم‌افزار کلاس‌یار نیست.")
  }

  if (typeof candidate.schemaVersion !== "number") {
    throw new Error("نسخه اسکیما در فایل پشتیبان مشخص نیست.")
  }

  if (candidate.schemaVersion > DB_VERSION) {
    throw new Error(
      `نسخه فایل پشتیبان (${candidate.schemaVersion}) بالاتر از نسخه دیتابیس فعلی برنامه (${DB_VERSION}) است. لطفاً برنامه را به‌روزرسانی کنید.`,
    )
  }

  if (!candidate.data || typeof candidate.data !== "object") {
    throw new Error("بخش اطلاعات جداول در فایل پشتیبان یافت نشد.")
  }

  const { classDefinitions, sessions, attendance } = candidate.data
  if (
    !Array.isArray(classDefinitions) ||
    !Array.isArray(sessions) ||
    !Array.isArray(attendance)
  ) {
    throw new Error("ساختار آرایه‌های جداول در فایل پشتیبان نامعتبر است.")
  }

  // تضمین مقادیر پیش‌فرض برای آمار
  const stats = candidate.stats ?? {
    classesCount: classDefinitions.length,
    sessionsCount: sessions.length,
    attendanceCount: attendance.length,
    settingsCount: Array.isArray(candidate.data.settings)
      ? candidate.data.settings.length
      : 0,
  }

  return {
    app: "klasyar",
    schemaVersion: candidate.schemaVersion,
    exportedAt: candidate.exportedAt ?? new Date().toISOString(),
    stats,
    data: {
      classDefinitions,
      sessions,
      attendance,
      settings: Array.isArray(candidate.data.settings)
        ? candidate.data.settings
        : [],
    },
  }
}

/**
 * بازیابی دیتابیس با پشتیبانی از دو حالت:
 * ۱. replace: پاک کردن داده‌های قبلی و جایگزینی کامل
 * ۲. merge: ادغام با داده‌های فعلی بدون حذف رکوردهای موجود
 */
export async function restoreBackup(
  payload: KlasYarBackupPayload,
  mode: "replace" | "merge" = "replace",
): Promise<void> {
  const { classDefinitions, sessions, attendance, settings } = payload.data

  await db.transaction(
    "rw",
    [db.classDefinitions, db.sessions, db.attendance, db.settings],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.classDefinitions.clear(),
          db.sessions.clear(),
          db.attendance.clear(),
          db.settings.clear(),
        ])

        if (classDefinitions.length > 0) {
          await db.classDefinitions.bulkAdd(classDefinitions)
        }
        if (sessions.length > 0) {
          await db.sessions.bulkAdd(sessions)
        }
        if (attendance.length > 0) {
          await db.attendance.bulkAdd(attendance)
        }
        if (settings.length > 0) {
          await db.settings.bulkAdd(settings)
        }
      } else {
        // حالت ادغام (Merge): افزودن یا به‌روزرسانی رکوردهای موجود با شناسه یکتا
        if (classDefinitions.length > 0) {
          await db.classDefinitions.bulkPut(classDefinitions)
        }
        if (sessions.length > 0) {
          await db.sessions.bulkPut(sessions)
        }
        if (attendance.length > 0) {
          await db.attendance.bulkPut(attendance)
        }
        if (settings.length > 0) {
          await db.settings.bulkPut(settings)
        }
      }
    },
  )

  // به‌روزرسانی زمان آخرین پشتیبان‌گیری با زمان بازیابی
  useSettingsStore.getState().updateSettings({
    lastBackupAt: new Date().toISOString(),
  })
}

/** بررسی اینکه آیا بیش از ۷ روز از آخرین نسخه پشتیبان می‌گذرد */
export function isBackupOverdue(lastBackupAt: string | null): boolean {
  if (!lastBackupAt) return true
  const backupTime = new Date(lastBackupAt).getTime()
  if (Number.isNaN(backupTime)) return true
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return now - backupTime > sevenDaysMs
}

/** فرمت‌بندی تاریخ آخرین پشتیبان‌گیری به فارسی */
export function formatLastBackupDate(isoString: string | null): string {
  if (!isoString) return "هنوز پشتیبان‌گیری انجام نشده است"
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return "هنوز پشتیبان‌گیری انجام نشده است"
    const jalali = jalaliFromDate(date)
    const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
    return `${formatJalaliFullDate(jalali)}، ساعت ${formatClock(timeStr)}`
  } catch {
    return "هنوز پشتیبان‌گیری انجام نشده است"
  }
}
