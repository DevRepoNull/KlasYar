import { memo } from "react"
import { cn } from "@/lib/utils"

export interface AuroraBackgroundProps {
  className?: string
}

/**
 * پس‌زمینه شفق قطبی (Aurora Background) با انیمیشن‌های ارگانیک، حباب‌های متحرک و گرادیانت‌های عمیق
 * کاملاً هماهنگ با متغیرهای رنگی تم انتخابی کاربر (--color-primary)
 * دارای z-index منفی و pointer-events-none برای عدم ایجاد تداخل با تعاملات کاربر
 */
export const AuroraBackground = memo(function AuroraBackground({
  className,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* حباب شفق اول: متحرک در بالا راست */}
      <div className="aurora-blob-1" />

      {/* حباب شفق دوم: متحرک در میانه چپ */}
      <div className="aurora-blob-2" />

      {/* حباب شفق سوم: متحرک در پایین راست */}
      <div className="aurora-blob-3" />

      {/* گرادیانت شعاعی متمرکز مرکزی با تنفس ملایم */}
      <div className="aurora-radial-center" />
    </div>
  )
})
