import { exportDB, importInto } from "dexie-export-import"
import { db } from "@/db/schema"
import { jalaliDateToString, todayJalali } from "@/lib/jalali"

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

/** دریافت فایل خروجی پشتیبان JSON از کل دیتابیس Dexie */
export async function exportDatabaseBackup(): Promise<void> {
  const blob = await exportDB(db, {
    prettyJson: true,
  })
  const todayStr = jalaliDateToString(todayJalali())
  downloadBlob(blob, `پشتیبان-کلاس‌یار-${todayStr}.json`)
}

/** بازگردانی دیتابیس از فایل پشتیبان JSON */
export async function importDatabaseBackup(file: File): Promise<void> {
  await importInto(db, file, {
    clearTablesBeforeImport: true,
  })
}
