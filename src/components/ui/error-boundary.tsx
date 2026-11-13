import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertCircle, ChevronDown, Home, RefreshCw, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export interface ErrorBoundaryProps {
  children: ReactNode
  /** نام بخشی که این مرز خطا از آن محافظت می‌کند (مثلاً «حضور و غیاب») */
  sectionName?: string
  /** کامپوننت جایگزین سفارشی در صورت تمایل */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** تابع فراخوانی هنگام تلاش مجدد */
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

/**
 * مرز خطای React (ErrorBoundary)
 * مانع از سفید شدن کل صفحه در هنگام بروز خطاهای جاوااسکریپت در کامپوننت‌ها می‌شود.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error("[KlasYar ErrorBoundary caught an error]:", error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
    this.props.onReset?.()
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state
    const { children, fallback, sectionName } = this.props

    if (!hasError) {
      return children
    }

    if (fallback) {
      if (typeof fallback === "function") {
        return fallback(error ?? new Error("خطای ناشناخته"), this.resetError)
      }
      return fallback
    }

    const title = sectionName
      ? `خطایی در بخش «${sectionName}» رخ داده است`
      : "خطایی در پردازش اطلاعات رخ داده است"

    return (
      <div className="flex w-full items-center justify-center p-4 sm:p-6" dir="rtl">
        <Card className="w-full max-w-xl border-destructive/30 bg-card shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
              <AlertCircle className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                {title}
              </h2>
              <p className="max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">
                متأسفانه در اجرای این بخش مشکلی پیش آمد. داده‌های دیتابیس شما محفوظ هستند و با تلاش مجدد یا بازگشت به صفحه دیگر می‌توانید به کار خود ادامه دهید.
              </p>
            </div>

            {/* دکمه‌های اقدام */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Button
                type="button"
                onClick={this.resetError}
                className="gap-2 text-xs sm:text-sm"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                تلاش مجدد
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = "/"
                }}
                className="gap-2 text-xs sm:text-sm"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                صفحه تقویم
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => window.location.reload()}
                className="gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                تازه‌سازی صفحه
              </Button>
            </div>

            {/* جزئیات فنی خطا (قابل باز و بسته شدن) */}
            {error && (
              <div className="mt-4 w-full border-t border-border/70 pt-4 text-start">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>جزئیات فنی خطا</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showDetails ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDetails && (
                  <div className="mt-2.5 max-h-48 overflow-y-auto rounded-lg bg-muted/60 p-3 text-[11px] font-mono text-destructive/90 leading-5" dir="ltr">
                    <p className="font-bold">{error.toString()}</p>
                    {errorInfo?.componentStack && (
                      <pre className="mt-2 whitespace-pre-wrap text-[10px] text-muted-foreground">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
}
