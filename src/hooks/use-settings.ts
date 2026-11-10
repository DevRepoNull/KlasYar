import { useEffect, useState } from "react"

import { useSettingsStore } from "@/store/settingsStore"

/** true وقتی تنظیمات ذخیره‌شده از IndexedDB خوانده و در store ادغام شده است. */
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  )

  useEffect(() => {
    const unsubscribe = useSettingsStore.persist.onFinishHydration(() =>
      setHydrated(true),
    )
    setHydrated(useSettingsStore.persist.hasHydrated())
    return unsubscribe
  }, [])

  return hydrated
}
