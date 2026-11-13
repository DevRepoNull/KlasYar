import { memo } from "react"
import { cn } from "@/lib/utils"

export interface AuroraBackgroundProps {
  className?: string
  showGrid?: boolean
}

/**
 * پس‌زمینه شفق قطبی (Aurora Background) با انیمیشن‌های ارگانیک، گوی‌های نورانی دوار و گرادیانت‌های عمیق
 * کاملاً هماهنگ با متغیرهای رنگی تم انتخابی کاربر (--primary)
 * دارای pointer-events-none برای عدم ایجاد تداخل با تعاملات کاربر
 */
export const AuroraBackground = memo(function AuroraBackground({
  className,
  showGrid = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* پترن ماتریسی نقطه‌ای با ماسک نرم برای بافت‌دهی مدرن */}
      {showGrid && <div className="ambient-dots-overlay" />}

      {/* حباب شفق اول: متحرک در بالا راست */}
      <div className="aurora-blob-1" />

      {/* گوی نوری دوار با انیمیشن مدار گردان ۳۲ ثانیه‌ای */}
      <div className="aurora-floating-orb" />

      {/* حباب شفق دوم: متحرک در میانه چپ */}
      <div className="aurora-blob-2" />

      {/* حباب شفق سوم: متحرک در پایین راست */}
      <div className="aurora-blob-3" />

      {/* گرادیانت شعاعی متمرکز مرکزی با تنفس ملایم */}
      <div className="aurora-radial-center" />
    </div>
  )
})
