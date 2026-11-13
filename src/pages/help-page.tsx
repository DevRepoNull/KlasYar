import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Laptop,
  Layers,
  Palette,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Type,
  UserCheck,
  UserMinus,
  UserX,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { navigate } from "@/lib/router"
import { toPersianDigits } from "@/lib/jalali"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/settingsStore"

// انیمیشن‌های لیست
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

interface FaqItem {
  question: string
  answer: string
  tags: string[]
}

const FAQ_LIST: FaqItem[] = [
  {
    question: "آیا برای استفاده از کلاس‌یار به اینترنت نیاز است؟",
    answer:
      "خیر، کلاس‌یار کاملاً آفلاین (Offline-first) است. تمام اطلاعات در حافظه داخلی مرورگر شما (IndexedDB) ذخیره می‌شود و برای استفاده روزمره یا تهیه گزارش‌ها به هیچ اینترنتی احتیاج ندارید.",
    tags: ["اینترنت", "آفلاین", "شبکه"],
  },
  {
    question: "داده‌های من کجا ذخیره می‌شوند؟ آیا اطلاعات من امن است؟",
    answer:
      "امنیت و حریم خصوصی در کلاس‌یار تضمین شده است. داده‌ها ۱۰۰٪ روی سیستم خودتان ذخیره می‌شوند و هیچ اطلاعاتی به هیچ سرور خارجی، ابری یا شرکت ثالثی ارسال نمی‌گردد.",
    tags: ["امنیت", "حریم خصوصی", "سرور", "ذخیره"],
  },
  {
    question: "چگونه اطلاعاتم را به یک کامپیوتر یا لپ‌تاپ دیگر منتقل کنم؟",
    answer:
      "کافی است به صفحه «تنظیمات» بروید، در بخش داده‌ها روی دکمه «دریافت بکاپ» کلیک کنید تا یک فایل JSON دانلود شود. سپس در کامپیوتر جدید، همان صفحه را باز کرده و با کلیک روی «بازیابی از فایل»، اطلاعات خود را بازگردانید.",
    tags: ["انتقال", "بکاپ", "بازیابی", "دستگاه"],
  },
  {
    question: "اگر کش مرورگر را پاک کنم یا سیستم‌عامل عوض شود چه می‌شود؟",
    answer:
      "اگر داده‌های وب‌سایت‌ها یا دیتابیس مرورگر به طور کامل پاک شود، اطلاعات نیز حذف خواهند شد. به همین دلیل کلاس‌یار هر ۷ روز به شما یادآوری می‌کند که با یک کلیک نسخه پشتیبان دریافت کنید.",
    tags: ["کش", "پاک شدن", "بکاپ", "حذف"],
  },
  {
    question: "ساعت‌های کاری تدریس چگونه محاسبه می‌شوند؟",
    answer:
      "برای هر جلسه، زمان پایان منهای زمان شروع شده و دقیقه به ساعت تبدیل می‌شود. جلساتی که با وضعیت «برگزار شد» ثبت شده‌اند در تجمیع گزارش‌ها لحاظ می‌گردند.",
    tags: ["ساعت کاری", "محاسبه", "دقیقه", "حق‌التدریس"],
  },
  {
    question: "آیا می‌توانم برای یک کلاس دانش‌آموزان جداگانه تعریف کنم؟",
    answer:
      "بله! هنگام تعریف یا ویرایش کلاس، می‌توانید نام و نام خانوادگی، شماره تماس و اطلاعات هر دانش‌آموز را ثبت کنید. این فهرست به طور خودکار در برگه حضور و غیاب هر جلسه در دسترس خواهد بود.",
    tags: ["دانش آموز", "شاگرد", "کلاس", "حضور و غیاب"],
  },
  {
    question: "چگونه می‌توانم جلسات لغو شده یا جبرانی را ثبت کنم؟",
    answer:
      "در تقویم روی هر جلسه کلیک کنید، می‌توانید وضعیت آن را به «لغو شده» تغییر دهید یا یک جلسه تازه با برچسب «جبرانی» یا «فوق‌العاده» بسازید.",
    tags: ["لغو", "جبرانی", "فوق العاده", "جلسه"],
  },
]

interface HelpSearchItem {
  id: string
  tab: string
  title: string
  category: string
  description: string
  tags: string[]
  actionRoute?: string
  actionLabel?: string
}

const HELP_SEARCH_INDEX: HelpSearchItem[] = [
  {
    id: "step-1",
    tab: "quick-start",
    title: "گام اول: تعریف کلاس",
    category: "شروع سریع",
    description: "پایه‌ریزی برنامه‌ریزی هفتگی، تعیین رنگ متمایز، روزهای برگزاری و فهرست اسامی شاگردان.",
    tags: ["گام", "کلاس", "شروع", "رنگ", "شاگردان", "تعریف کلاس", "پایه"],
    actionRoute: "/classes",
    actionLabel: "ورود به مدیریت کلاس‌ها",
  },
  {
    id: "step-2",
    tab: "quick-start",
    title: "گام دوم: ثبت جلسه",
    category: "شروع سریع",
    description: "برنامه‌ریزی و ثبت جلسات تقویم، ساعت شروع و پایان، مبحث تدریس و محاسبه خودکار زمان.",
    tags: ["گام", "جلسه", "تقویم", "ثبت", "ساعت", "شروع", "پایان", "زمان"],
    actionRoute: "/",
    actionLabel: "مشاهده تقویم و ثبت جلسه",
  },
  {
    id: "step-3",
    tab: "quick-start",
    title: "گام سوم: دریافت خروجی",
    category: "شروع سریع",
    description: "گزارش رسمی برای تسویه‌حساب و آرشیو، دریافت نسخه چاپی PDF، فایل اکسل فرمول‌دار یا ورد.",
    tags: ["گام", "خروجی", "اکسل", "pdf", "پی دی اف", "ورد", "گزارش", "تسویه"],
    actionRoute: "/reports",
    actionLabel: "ورود به صفحه گزارش‌ها",
  },
  {
    id: "work-calc",
    tab: "work-hours",
    title: "محاسبه دقیق مدت و ساعات کاری تدریس",
    category: "ثبت ساعت کاری",
    description: "فرمول محاسبه سیستمی کارکرد: دقیقه پایان منهای دقیقه شروع و تبدیل خودکار به ساعت.",
    tags: ["ساعت", "محاسبه", "کارکرد", "فرمول", "مدت", "دقیقه", "حق‌التدریس", "ثبت ساعت"],
  },
  {
    id: "session-status",
    tab: "work-hours",
    title: "وضعیت‌های جلسات تدریس (برگزار شد، برنامه‌ریزی، لغو)",
    category: "ثبت ساعت کاری",
    description: "تعیین وضعیت جلسات و تأثیر در کارکرد (تنها جلسات برگزارشده در تسویه حساب لحاظ می‌گردند).",
    tags: ["وضعیت", "برگزار شد", "لغو", "برنامه‌ریزی", "جلسه"],
  },
  {
    id: "attendance-statuses",
    tab: "attendance",
    title: "وضعیت‌های چهارگانه حضور و غیاب (حاضر، غایب، تأخیر، مرخصی)",
    category: "حضور و غیاب",
    description: "ثبت وضعیت حضور، ثبت دقیق دقایق تأخیر شاگردان و محاسبه درصد حضور کلاسی.",
    tags: ["حضور و غیاب", "حاضر", "غایب", "تاخیر", "مرخصی", "شاگرد", "غیبت"],
  },
  {
    id: "attendance-grading",
    tab: "attendance",
    title: "ارزشیابی کلاسی، نمرات و یادداشت‌ها",
    category: "حضور و غیاب",
    description: "ثبت نمره درسی از ۲۰ یا ۱۰۰ و یادداشت‌های ارزیابی عملکرد برای هر دانش‌آموز در هر جلسه.",
    tags: ["نمره", "ارزشیابی", "یادداشت", "دانش‌آموز", "شاگرد"],
  },
  {
    id: "export-pdf",
    tab: "exports",
    title: "خروجی PDF (گزارش رسمی و سربرگ‌دار)",
    category: "خروجی‌ها",
    description: "گزارش چاپی استاندارد و رسمی با سربرگ، تاریخ شمسی، جدول جلسات و محل امضا جهت تسویه حساب.",
    tags: ["pdf", "پی دی اف", "خروجی", "چاپ", "سربرگ", "امضا", "رسمی"],
    actionRoute: "/reports",
    actionLabel: "دریافت خروجی PDF در گزارش‌ها",
  },
  {
    id: "export-excel",
    tab: "exports",
    title: "خروجی اکسل فرمول‌دار (Excel .xlsx)",
    category: "خروجی‌ها",
    description: "فایل اکسل با فرمول‌های SUM و تجمیع ساعات تدریس و نرخ حق‌التدریس جهت محاسبات مالی.",
    tags: ["اکسل", "excel", "xlsx", "فرمول", "محاسبه", "حق التدریس", "خروجی"],
    actionRoute: "/reports",
    actionLabel: "دریافت خروجی اکسل در گزارش‌ها",
  },
  {
    id: "export-word",
    tab: "exports",
    title: "خروجی فایل ورد قابل ویرایش (Word .docx)",
    category: "خروجی‌ها",
    description: "فایل تایپ‌شده ورد با جدول‌بندی تمیز جهت تغییرات دلخواه متنی در نرم‌افزار Word.",
    tags: ["ورد", "word", "docx", "ویرایش", "خروجی"],
    actionRoute: "/reports",
    actionLabel: "دریافت خروجی ورد در گزارش‌ها",
  },
  {
    id: "backup-create",
    tab: "backup",
    title: "پشتیبان‌گیری کامل از داده‌ها (JSON)",
    category: "بکاپ و بازیابی",
    description: "دانلود تمام داده‌های کلاس‌ها، جلسات و تنظیمات در یک فایل بدون نیاز به اینترنت.",
    tags: ["بکاپ", "پشتیبان", "دانلود", "json", "ذخیره", "امنیت"],
    actionRoute: "/settings",
    actionLabel: "رفتن به صفحه بکاپ در تنظیمات",
  },
  {
    id: "backup-restore",
    tab: "backup",
    title: "بازیابی اطلاعات و انتقال به دستگاه دیگر",
    category: "بکاپ و بازیابی",
    description: "امکان جایگزینی یا ادغام اطلاعات با آپلود فایل پشتیبان در دستگاه جدید.",
    tags: ["بازیابی", "انتقال", "ریستور", "فایل", "دستگاه"],
    actionRoute: "/settings",
    actionLabel: "بازیابی فایل در تنظیمات",
  },
  {
    id: "settings-theme",
    tab: "settings",
    title: "تنظیمات ظاهر و پالت‌های رنگی",
    category: "راهنمای تنظیمات",
    description: "تغییر تم تیره و روشن و انتخاب پالت‌های رنگی متنوع زمرد، نیمه‌شب، غروب و تک‌رنگ.",
    tags: ["تم", "رنگ", "پالت", "تاریک", "روشن", "ظاهر", "زمرد", "غروب"],
    actionRoute: "/settings",
    actionLabel: "تنظیمات تم و پالت رنگی",
  },
  {
    id: "settings-font",
    tab: "settings",
    title: "انتخاب قلم و فونت فارسی (وزیرمتن)",
    category: "راهنمای تنظیمات",
    description: "بهینه‌سازی خوانایی حروف و ارقام فارسی با فونت استاندارد وزیرمتن.",
    tags: ["فونت", "قلم", "وزیرمتن", "خوانایی", "ارقام"],
    actionRoute: "/settings",
    actionLabel: "تنظیم فونت برنامه",
  },
  ...FAQ_LIST.map((faq, idx) => ({
    id: `faq-${idx}`,
    tab: "faq",
    title: faq.question,
    category: "سوالات متداول",
    description: faq.answer,
    tags: ["سوال", "faq", ...faq.tags],
  })),
]

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("quick-start")
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const openOnboarding = useSettingsStore((state) => state.openOnboarding)

  // جستجوی جامع در تمامی مباحث راهنما
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return HELP_SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [searchQuery])

  // فیلتر کردن سوالات متداول در تب FAQ
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_LIST
    const q = searchQuery.trim().toLowerCase()
    return FAQ_LIST.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [searchQuery])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* هدر صفحه راهنما */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
              <HelpCircle className="h-4 w-4" />
              مرکز آموزش و مستندات درون‌برنامه‌ای
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              راهنما و شروع سریع کلاس‌یار
            </h1>
            <p className="max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm">
              همه آنچه برای ثبت کلاس‌ها، ساعات کاری، حضور و غیاب و صدور گزارش‌های استاندارد نیاز دارید، بدون نیاز به مستندات خارجی.
            </p>
          </div>

          <Button
            type="button"
            onClick={openOnboarding}
            className="gap-2 shadow-sm shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            نمایش دوباره تور آموزشی (Onboarding)
          </Button>
        </div>

        {/* فیلد جستجوی سریع در مستندات */}
        <div className="relative mt-6 max-w-md">
          <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در تمام بخش‌های راهنما (گام‌ها، اکسل، بکاپ...)"
            className="ps-10 pe-24 h-11 text-xs sm:text-sm bg-background/90 backdrop-blur-xs border-border/80 focus-visible:ring-primary"
            aria-label="جستجو در راهنما"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-all duration-150 active:scale-95 hover:bg-muted/80 hover:text-foreground"
            >
              پاک کردن
            </button>
          ) : null}
        </div>
      </div>

      {/* نمایش نتایج جستجو در صورت تایپ کاربر، یا نمایش تب‌ها در حالت عادی */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span>نتایج جستجو برای: «{searchQuery}»</span>
              <span className="text-xs font-semibold text-primary rounded-full bg-primary/10 px-2.5 py-0.5">
                {toPersianDigits(searchResults.length)} نتیجه
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              پاک کردن و بازگشت به راهنما
            </Button>
          </div>

          {searchResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center space-y-3 bg-muted/15">
              <p className="text-sm font-bold text-foreground">
                هیچ موردی مطابق با «{searchQuery}» پیدا نشد
              </p>
              <p className="text-xs text-muted-foreground leading-6 max-w-md mx-auto">
                می‌توانید واژه‌های متداولی مانند «گام»، «اکسل»، «بکاپ»، «ساعت کاری»، «حضور و غیاب»، «کلاس» یا «پی‌دی‌اف» را امتحان فرمایید.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs"
              >
                مشاهده همه راهنما
              </Button>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {searchResults.map((item) => (
                <Card
                  key={item.id}
                  className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        {item.category}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold mt-2">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-6 text-muted-foreground flex-1 flex flex-col justify-between">
                    <p>{item.description}</p>
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveTab(item.tab)
                          setSearchQuery("")
                        }}
                        className="text-xs text-primary font-bold hover:bg-primary/10 gap-1 h-8"
                      >
                        مشاهده در بخش {item.category}
                        <ArrowLeft className="h-3 w-3" />
                      </Button>
                      {item.actionRoute ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(item.actionRoute!)}
                          className="text-xs gap-1 h-8 ms-auto"
                        >
                          {item.actionLabel || "رفتن به بخش"}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto w-auto gap-1 bg-muted/60 p-1.5 rounded-2xl">
            <TabsTrigger value="quick-start" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Play className="h-4 w-4 text-primary shrink-0" />
              شروع سریع
            </TabsTrigger>
            <TabsTrigger value="work-hours" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              ثبت ساعت کاری
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Users className="h-4 w-4 text-primary shrink-0" />
              حضور و غیاب
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Download className="h-4 w-4 text-primary shrink-0" />
              خروجی‌ها
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Database className="h-4 w-4 text-primary shrink-0" />
              بکاپ و بازیابی
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <Palette className="h-4 w-4 text-primary shrink-0" />
              راهنمای تنظیمات
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2 rounded-xl py-2 text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4 text-primary shrink-0" />
              سوالات متداول
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ۱. شروع سریع (۳ گام) */}
        <TabsContent value="quick-start" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">شروع سریع با کلاس‌یار در ۳ گام ساده</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              این مسیر ۳ مرحله‌ای شما را از صفر به اولین گزارش کارکرد رسمی می‌رساند.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-3"
          >
            {/* گام ۱ */}
            <motion.div variants={itemVariants}>
              <Card className="relative flex h-full flex-col justify-between overflow-hidden border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                <div className="absolute end-4 top-4 text-4xl font-black text-muted/30">۱</div>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold">گام اول: تعریف کلاس</CardTitle>
                  <CardDescription className="text-xs leading-5">
                    پایه‌ریزی برنامه‌ریزی هفتگی شما
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-6 text-foreground/80">
                  <p>
                    به بخش کلاس‌ها بروید و یک کلاس جدید با عنوان مشخص، رنگ متمایز، روزهای برگزاری (مثلاً شنبه و چهارشنبه) و اسامی شاگردان ثبت نمایید.
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• تعیین رنگ برای تمایز در تقویم</li>
                    <li>• ثبت اسامی برای حضور و غیاب</li>
                    <li>• مشخص کردن ساعت پیش‌فرض تدریس</li>
                  </ul>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/classes")}
                      className="w-full gap-1.5 text-xs font-semibold"
                    >
                      ورود به مدیریت کلاس‌ها
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* گام ۲ */}
            <motion.div variants={itemVariants}>
              <Card className="relative flex h-full flex-col justify-between overflow-hidden border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                <div className="absolute end-4 top-4 text-4xl font-black text-muted/30">۲</div>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold">گام دوم: ثبت جلسه</CardTitle>
                  <CardDescription className="text-xs leading-5">
                    برنامه‌ریزی و ثبت جلسات تقویم
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-6 text-foreground/80">
                  <p>
                    در تقویم شمسی روی هر روز کلیک کنید یا از صفحه جلسات، جلسه تدریس را با مشخص کردن ساعت شروع، ساعت پایان و عنوان مبحث ایجاد نمایید.
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• محاسبه خودکار مدت تدریس به دقیقه</li>
                    <li>• تعیین وضعیت: برگزار شد / برنامه‌ریزی / لغو</li>
                    <li>• ثبت سریع حضور و غیاب دانش‌آموزان</li>
                  </ul>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/")}
                      className="w-full gap-1.5 text-xs font-semibold"
                    >
                      مشاهده تقویم و ثبت جلسه
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* گام ۳ */}
            <motion.div variants={itemVariants}>
              <Card className="relative flex h-full flex-col justify-between overflow-hidden border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                <div className="absolute end-4 top-4 text-4xl font-black text-muted/30">۳</div>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold">گام سوم: دریافت خروجی</CardTitle>
                  <CardDescription className="text-xs leading-5">
                    گزارش رسمی برای تسویه‌حساب و آرشیو
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-6 text-foreground/80">
                  <p>
                    به صفحه گزارش‌ها مراجعه کنید. کارکرد ماهانه خود را بررسی کرده و نسخه چاپی PDF با سربرگ استاندارد، فایل اکسل فرمول‌دار یا فایل ورد را دانلود کنید.
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• فایل PDF آماده برای چاپ و امضا</li>
                    <li>• فایل Excel برای محاسبات حق‌التدریس</li>
                    <li>• گزارش کامل تفکیکی هر کلاس و دانش‌آموز</li>
                  </ul>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/reports")}
                      className="w-full gap-1.5 text-xs font-semibold"
                    >
                      ورود به صفحه گزارش‌ها
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* کارت راهنمایی سریع */}
          <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">نکته حرفه‌ای: همه چیز محلی و بدون دغدغه است!</h4>
                <p className="text-xs leading-6 text-muted-foreground">
                  شما نیازی به اتصال به اینترنت، وارد کردن رمز عبور یا ثبت‌نام ندارید. تمام تغییرات شما در همان لحظه ذخیره می‌شوند و حتی در صورت قطع برق یا بستن مرورگر محفوظ خواهند ماند.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ۲. نحوه ثبت ساعت کاری با تصویر placeholder */}
        <TabsContent value="work-hours" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">نحوه محاسبه و ثبت دقیق ساعت کاری</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              فرمول‌ها، قدم‌به‌قدم ثبت و دیاگرام بصری نحوه کارکرد سیستم زمانی کلاس‌یار.
            </p>
          </div>

          {/* دیاگرام بصری و placeholder تصویری */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              دیاگرام تصویری محاسبه جلسه و ساعت کاری
            </h3>

            {/* Mockup تصویر تعاملی و SVG Placeholder */}
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-6">
              <div className="mx-auto max-w-xl space-y-4">
                {/* کارت نمونه جلسه */}
                <div className="rounded-xl border border-primary/30 bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold sm:text-sm">کلاس فیزیک پایه یازدهم (کد ۱۰۴)</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      برگزار شد
                    </span>
                  </div>

                  {/* نوار زمان‌بندی بصری */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground">ساعت شروع</span>
                      <div className="mt-1 text-sm font-black font-mono">۱۶:۰۰</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2.5 border border-primary/20">
                      <span className="text-[10px] text-primary font-bold">مدت محاسبه‌شده</span>
                      <div className="mt-1 text-sm font-black font-mono text-primary">۹۰ دقیقه (۱.۵ ساعت)</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <span className="text-[10px] text-muted-foreground">ساعت پایان</span>
                      <div className="mt-1 text-sm font-black font-mono">۱۷:۳۰</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>مبحث: قوانین نیوتن و اصطکاک</span>
                    <span className="font-semibold text-foreground">حضور: ۶ از ۶ هنرجو (۱۰۰٪)</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  فرمول محاسبه سیستمی: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground font-bold">مدت کارکرد = دقیقه پایان - دقیقه شروع</code>
                </div>
              </div>
            </div>
          </div>

          {/* توضیح قدم‌به‌قدم */}
          <div className="space-y-4">
            <h3 className="text-base font-bold">مراحل قدم‌به‌قدم ثبت ساعت تدریس:</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  ۱
                </span>
                <h4 className="text-xs font-bold sm:text-sm">انتخاب روز و ایجاد جلسه</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  در تقویم جلالی روی روز مورد نظر کلیک کنید. پنجره ثبت جلسه باز می‌شود و کلاس مورد نظرتان را انتخاب کنید.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  ۲
                </span>
                <h4 className="text-xs font-bold sm:text-sm">وارد کردن بازه زمانی دقیق</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  ساعت شروع و پایان را مشخص کنید. کلاس‌یار مدت زمان را به دقیقه و ساعت اعشاری بلافاصله محاسبه می‌کند.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  ۳
                </span>
                <h4 className="text-xs font-bold sm:text-sm">تعیین وضعیت جلسه</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  اگر کلاس با موفقیت برگزار شده، وضعیت را روی «برگزار شد» قرار دهید. جلسات لغو شده در جمع کارکرد مالی وارد نمی‌شوند.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                  ۴
                </span>
                <h4 className="text-xs font-bold sm:text-sm">مشاهده گزارش ساعات تدریس</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  در بخش گزارش‌ها، جمع کل ساعات کارکرد بر اساس ماه، کلاس و فیلترهای دلخواه به صورت آنی جمع‌بندی می‌گردد.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ۳. حضور و غیاب */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">راهنمای جامع ثبت حضور و غیاب</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              نحوه ثبت وضعیت‌ها، دقایق تأخیر، نمرات و یادداشت‌های ارزیابی برای هر دانش‌آموز.
            </p>
          </div>

          {/* کارت وضعیت‌های ۴گانه */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <h4 className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">حاضر (Present)</h4>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                حضور به موقع و کامل در تمام زمان جلسه کلاسی.
              </p>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-destructive/15 text-destructive">
                <UserX className="h-5 w-5" />
              </div>
              <h4 className="mt-2 text-xs font-bold text-destructive">غایب (Absent)</h4>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                عدم حضور دانش‌آموز بدون عذر یا اطلاع قبلی.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300">تأخیر (Late)</h4>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                ورود با تأخیر همراه با امکان ثبت دقیق دقایق دیرکرد.
              </p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <UserMinus className="h-5 w-5" />
              </div>
              <h4 className="mt-2 text-xs font-bold text-blue-700 dark:text-blue-300">مرخصی (Excused)</h4>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                غیبت موجه با هماهنگی و عذر موجه و اطلاع به مدرس.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold">چگونه برای یک جلسه حضور و غیاب ثبت کنیم؟</h3>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-6 text-foreground/80">
              <li>به صفحه <strong>«حضور و غیاب»</strong> یا روی جلسه مورد نظر در تقویم بروید.</li>
              <li>فهرست کامل شاگردان تعریف‌شده برای آن کلاس نمایش داده می‌شود.</li>
              <li>برای هر شاگرد با یک کلیک وضعیت حاضر، غایب، تأخیر یا مرخصی را انتخاب کنید.</li>
              <li>در صورت نیاز، نمره (از ۲۰ یا ۱۰۰) و یادداشت ارزشیابی کلاسی را ثبت نمایید.</li>
              <li>درصد حضور کلاسی در بالای پنجره به صورت خودکار محاسبه و به روزرسانی می‌شود.</li>
            </ol>
          </div>
        </TabsContent>

        {/* ۴. خروجی‌ها */}
        <TabsContent value="exports" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">انواع فرمت‌های خروجی و کاربرد هر کدام</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              کلاس‌یار ۴ قالب خروجی استاندارد برای انواع مصارف اداری، مالی و پشتیبان تولید می‌کند.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* PDF */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">خروجی PDF (گزارش رسمی)</CardTitle>
                    <span className="text-[11px] text-muted-foreground">فرمت استاندارد قابل چاپ و اشتراک‌گذاری</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-6 text-foreground/80">
                <p>
                  <strong>کاربرد:</strong> مناسب جهت تحویل برگه کارکرد ماهیانه به مدیر مدرسه یا آموزشگاه، ارسال برای اولیا، امضای طرفین و بایگانی فیزیکی.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>سربرگ رسمی با تاریخ شمسی و نام مدرس</li>
                  <li>جدول‌بندی زیبا با فونت بهینه‌شده وزیرمتن</li>
                  <li>تنظیم ابعاد استاندارد برگه A4</li>
                </ul>
              </CardContent>
            </Card>

            {/* Excel */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">خروجی اکسل (Excel / XLSX)</CardTitle>
                    <span className="text-[11px] text-muted-foreground">مناسب محاسبات مالی و اداری</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-6 text-foreground/80">
                <p>
                  <strong>کاربرد:</strong> محاسبه خودکار حق‌التدریس ساعتی، اعمال فرمول‌های مالیاتی و بیمه، رسم نمودار و ادغام در سیستم حسابداری.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>ستون‌های مجزا برای تاریخ جلالی، ساعت و دقایق</li>
                  <li>قابلیت فیلتر و سورت در اکسل و Google Sheets</li>
                  <li>کاملاً سازگار با نسخه‌های اکسل ۲۰۰۷ تا ۲۰۲۶</li>
                </ul>
              </CardContent>
            </Card>

            {/* Word */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">خروجی ورد (Word / DOCX)</CardTitle>
                    <span className="text-[11px] text-muted-foreground">گزارش متنی کاملاً قابل ویرایش</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-6 text-foreground/80">
                <p>
                  <strong>کاربرد:</strong> ویرایش متن و افزودن توضیحات متنی، قراردادن لوگو یا سربرگ اختصاصی آموزشگاه و تدوین مستندات اداری.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>جداول مرتب و متون راست‌چین RTL</li>
                  <li>امکان ویرایش تمامی بخش‌ها در نرم‌افزار Word</li>
                </ul>
              </CardContent>
            </Card>

            {/* JSON Backup */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">خروجی JSON (پشتیبان دیتابیس)</CardTitle>
                    <span className="text-[11px] text-muted-foreground">نسخه پشتیبان و انتقال داده‌ها</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-6 text-foreground/80">
                <p>
                  <strong>کاربرد:</strong> نگهداری امن، مهاجرت به دستگاه جدید و بازیابی کامل تمامی کلاس‌ها، جلسات، هنرجویان و حضور و غیاب.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>شامل صفر تا صد دیتابیس برنامه</li>
                  <li>امکان بازیابی به شیوه ادغام یا جایگزینی کامل</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ۵. بکاپ و بازیابی */}
        <TabsContent value="backup" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">اهمیت حیاتی نسخه پشتیبان (Backup & Restore)</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              چرا و چگونه از اطلاعات خود نسخه پشتیبان تهیه کنیم؟
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  چرا بکاپ‌گیری در کلاس‌یار اهمیت ویژه دارد؟
                </h4>
                <p className="mt-1 text-xs leading-6 text-amber-900/90 dark:text-amber-200/90">
                  کلاس‌یار با رویکرد <strong>محلی و حفظ حریم خصوصی (Local-first)</strong> ساخته شده است. این یعنی اطلاعات شما هرگز روی سرورهای آنلاین ما ذخیره نمی‌شوند و همگی در دیتابیس محلی مرورگرتان قرار دارند. در صورتی که دیسک سیستم دچار مشکل شود یا دیتابیس مرورگر خود را پاک نمایید، بدون نسخه پشتیبان راهی برای بازگردانی اطلاعات نخواهد بود.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  چگونه نسخه پشتیبان بگیریم؟
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-6 text-foreground/80">
                <ol className="list-decimal list-inside space-y-2">
                  <li>به صفحه <strong>«تنظیمات»</strong> بروید.</li>
                  <li>بخش <strong>«داده‌ها»</strong> را پیدا کنید.</li>
                  <li>روی دکمه <strong>«دریافت بکاپ»</strong> کلیک کنید.</li>
                  <li>یک فایل متنی با پسوند <code className="font-mono bg-muted px-1 rounded">.json</code> حاوی تمام اطلاعات دانلود می‌شود.</li>
                </ol>
                <p className="text-muted-foreground pt-1">
                  پیشنهاد: فایل بکاپ را در فضای ابری شخصی خود (مثل Google Drive، بله، ایتا یا تلگرام) نگهداری کنید.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  چگونه اطلاعات را بازیابی کنیم؟
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-6 text-foreground/80">
                <ol className="list-decimal list-inside space-y-2">
                  <li>در صفحه تنظیمات روی <strong>«بازیابی از فایل»</strong> کلیک کنید.</li>
                  <li>فایل <code className="font-mono bg-muted px-1 rounded">.json</code> قبلی خود را انتخاب کنید.</li>
                  <li>پنجره پیش‌نمایش به شما تعداد کلاس‌ها و جلسات فایل را نشان می‌دهد.</li>
                  <li>بین دو گزینه <strong>«جایگزینی کامل»</strong> یا <strong>«ادغام با اطلاعات موجود»</strong> یکی را انتخاب و تایید کنید.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ۶. تنظیمات */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black">راهنمای گزینه‌های تنظیمات</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              توضیح کامل هر گزینه و نقشی که در برنامه ایفا می‌کند.
            </p>
          </div>

          <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <Palette className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">حالت نمایش (تم)</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  امکان سوییچ بین سه حالت: <strong>روشن (Light)</strong> برای محیط‌های پرنور، <strong>تاریک (Dark)</strong> برای کاهش خستگی چشم در شب، و <strong>سیستم (System)</strong> که به شکل خودکار با تنظیمات ویندوز یا موبایل هماهنگ می‌شود.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4">
              <Type className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">فونت برنامه</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  پیشنهاد ویژه کلاس‌یار فونت <strong>«وزیرمتن»</strong> است که یکی از خواناترین و مدرن‌ترین قلم‌های فارسی برای ارقام و حروف به شمار می‌رود. در صورت تمایل می‌توانید فونت سیستم‌عامل را نیز انتخاب کنید.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">روز شروع هفته</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  ستون اول نمای تقویم را مشخص می‌کند. برای تقویم هجری شمسی ایران، مقدار پیش‌فرض <strong>«شنبه»</strong> است؛ همچنین امکان انتخاب یکشنبه یا دوشنبه برای مدرسان زبان و بین‌المللی وجود دارد.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">مدت پیش‌فرض هر جلسه</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  هنگام باز کردن دیالوگ جلسه جدید، این عدد (مثلاً ۶۰، ۷۵ یا ۹۰ دقیقه) به شکل پیش‌فرض برای ساعت پایان در نظر گرفته می‌شود تا در زمان شما صرفه‌جویی گردد.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4">
              <Laptop className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">اعلان‌ها و یادآوری کلاس‌ها</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  سیستم اعلان هوشمند کلاس‌یار، ۵ دقیقه قبل از شروع کلاس و زمان شروع و پایان جلسه، اعلان صادر می‌کند. در صورت فعال‌سازی اجازه مرورگر (Browser Notifications)، حتی در زمان مینیمایز بودن تب نیز پیام هشدار را دریافت می‌کنید.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-start gap-4">
              <RotateCcw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold sm:text-sm">بازنشانی تنظیمات</h4>
                <p className="text-xs leading-5 text-muted-foreground">
                  تنظیمات ظاهری، اعلان‌ها و تم را به حالت اولیه کارخانه بازمی‌گرداند. این گزینه هیچ آسیبی به داده‌های کلاس‌ها و جلسات شما نمی‌زند.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ۷. سوالات متداول */}
        <TabsContent value="faq" className="mt-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black">سوالات متداول (FAQ)</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              پاسخ به پرتکرارترین پرسش‌های مدرسان و کاربران کلاس‌یار.
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-xs text-muted-foreground">
              موردی مطابق با عبارت «{searchQuery}» پیدا نشد. لطفاً عبارت دیگری جستجو کنید.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between p-4 text-start font-bold text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180 text-primary",
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="border-t border-border/50 px-4 pb-4 pt-3 text-xs leading-6 text-muted-foreground">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}
