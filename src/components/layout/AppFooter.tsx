import { Github } from "lucide-react"
import packageJson from "../../../package.json"

export function AppFooter() {
  const version = packageJson.version || "0.3.0"

  return (
    <footer className="w-full border-t border-border/50 dark:border-white/10 bg-card/40 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 pb-20 md:pb-4 transition-colors">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-start text-xs text-muted-foreground">
        {/* سمت راست: متن سازنده */}
        <div className="flex items-center gap-1.5 font-medium">
          <span>ساخته شده با</span>
          <span
            className="text-red-500 animate-pulse inline-block select-none transform hover:scale-125 transition-transform"
            aria-label="عشق"
          >
            ❤️
          </span>
          <span>توسط</span>
          <a
            href="https://github.com/DevRepoNull"
            target="_blank"
            rel="noreferrer noopener"
            className="font-bold text-foreground transition-all duration-200 hover:text-primary hover:scale-105 active:scale-95 inline-flex items-center gap-1"
          >
            DevRepoNull
          </a>
        </div>

        {/* سمت چپ: نسخه برنامه و لینک گیتهاب */}
        <div className="flex items-center gap-3">
          <span
            className="rounded-full border border-border/70 dark:border-white/10 bg-muted/60 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider text-muted-foreground shadow-xs"
            title={`نسخه فعلی کلاس‌یار: v${version}`}
          >
            v{version}
          </span>

          <a
            href="https://github.com/DevRepoNull"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="پروفایل گیت‌هاب DevRepoNull"
            className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-muted-foreground transition-all duration-200 hover:text-primary hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Github className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6 text-foreground group-hover:text-primary" />
            <span className="text-xs font-bold tracking-tight">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
