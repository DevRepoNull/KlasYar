/**
 * یکسان‌سازی خطاهای لایه دیتابیس (Dexie + IndexedDB).
 *
 * همه‌ی توابع CRUD خطاهای خود را به‌صورت `DatabaseError` پرتاب می‌کنند تا لایه رابط
 * کاربری بتواند بر اساس `code` تصمیم بگیرد و پیام فارسی آماده نمایش داشته باشد.
 */

export type DatabaseErrorCode =
  | "validation"
  | "not-found"
  | "duplicate"
  | "conflict"
  | "storage-full"
  | "storage-unavailable"
  | "version-mismatch"
  | "unknown"

const DEFAULT_MESSAGES: Record<DatabaseErrorCode, string> = {
  validation: "اطلاعات وارد‌شده معتبر نیست.",
  "not-found": "موردی با این شناسه یافت نشد.",
  duplicate: "این مورد از قبل ثبت شده است.",
  conflict: "این عملیات با داده‌های موجود تداخل دارد.",
  "storage-full": "فضای ذخیره‌سازی دستگاه پر شده است. چند مورد را حذف کنید و دوباره تلاش کنید.",
  "storage-unavailable":
    "دسترسی به حافظه مرورگر ممکن نیست. اگر در حالت ناشناس هستید، از پنجره معمولی استفاده کنید.",
  "version-mismatch":
    "نسخه دیتابیس با نسخه برنامه هم‌خوان نیست. صفحه را دوباره بارگذاری کنید.",
  unknown: "خطای نامشخصی در ذخیره‌سازی رخ داد.",
}

export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode
  readonly originalError?: unknown

  constructor(
    code: DatabaseErrorCode,
    message?: string,
    originalError?: unknown,
  ) {
    super(message ?? DEFAULT_MESSAGES[code])
    this.name = "DatabaseError"
    this.code = code
    this.originalError = originalError
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

function readName(error: unknown): string {
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = (error as { name?: unknown }).name
    if (typeof name === "string") return name
  }
  return ""
}

/** خطای خام Dexie/DOMException را به `DatabaseError` قابل نمایش تبدیل می‌کند. */
export function normalizeDatabaseError(error: unknown): DatabaseError {
  if (isDatabaseError(error)) return error

  switch (readName(error)) {
    case "ConstraintError":
    case "BulkError":
      return new DatabaseError("duplicate", DEFAULT_MESSAGES.duplicate, error)
    case "QuotaExceededError":
      return new DatabaseError("storage-full", DEFAULT_MESSAGES["storage-full"], error)
    case "VersionError":
    case "UpgradeError":
    case "SchemaError":
      return new DatabaseError(
        "version-mismatch",
        DEFAULT_MESSAGES["version-mismatch"],
        error,
      )
    case "InvalidStateError":
    case "UnknownError":
    case "OpenFailedError":
    case "DatabaseClosedError":
    case "MissingAPIError":
    case "NoSuchDatabaseError":
      return new DatabaseError(
        "storage-unavailable",
        DEFAULT_MESSAGES["storage-unavailable"],
        error,
      )
    case "AbortError":
      return new DatabaseError("conflict", DEFAULT_MESSAGES.conflict, error)
    case "DataCloneError":
      return new DatabaseError("validation", "این مقدار قابل ذخیره‌سازی نیست.", error)
    default:
      return new DatabaseError("unknown", DEFAULT_MESSAGES.unknown, error)
  }
}

/** اجرای یک عملیات دیتابیس با تبدیل خطاها به `DatabaseError`. */
export async function runDb<T>(operation: () => Promise<T> | T): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw normalizeDatabaseError(error)
  }
}

/** پیام فارسی آماده نمایش برای هر خطا (برای توست‌ها و فرم‌ها). */
export function getDatabaseErrorMessage(error: unknown): string {
  if (isDatabaseError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return DEFAULT_MESSAGES.unknown
}
