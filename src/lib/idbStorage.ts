import type { StateStorage } from "zustand/middleware"

/**
 * ذخیره‌سازی کلید/مقدار روی IndexedDB برای persist در Zustand.
 * localStorage استفاده نمی‌شود؛ تنها یک cookie کوچک برای جلوگیری از FOUC در
 * اسکریپت پیش از رندر نگه داشته می‌شود (src/lib/theme.ts).
 */

const DB_NAME = "klasyar-prefs"
const STORE_NAME = "kv"
const DB_VERSION = 1

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB در این مرورگر در دسترس نیست."))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("باز کردن IndexedDB ناموفق بود."))
  }).catch((error) => {
    databasePromise = null
    throw error
  })

  return databasePromise
}

async function runRequest<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = run(transaction.objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () =>
      reject(request.error ?? new Error("عملیات IndexedDB ناموفق بود."))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("تراکنش IndexedDB لغو شد."))
  })
}

const indexedDbStorage: StateStorage = {
  async getItem(name) {
    const value = await runRequest<string | undefined>("readonly", (store) =>
      store.get(name),
    )
    return value ?? null
  },
  async setItem(name, value) {
    await runRequest<IDBValidKey>("readwrite", (store) => store.put(value, name))
  },
  async removeItem(name) {
    await runRequest<undefined>("readwrite", (store) => store.delete(name))
  },
}

/** اگر IndexedDB در دسترس نباشد، تنظیمات فقط تا پایان همین نشست می‌مانند. */
function createMemoryStorage(): StateStorage {
  const values = new Map<string, string>()
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => {
      values.set(name, value)
    },
    removeItem: (name) => {
      values.delete(name)
    },
  }
}

export const settingsStorage: StateStorage =
  typeof indexedDB === "undefined" ? createMemoryStorage() : indexedDbStorage
