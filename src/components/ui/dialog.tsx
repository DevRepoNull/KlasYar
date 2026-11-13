import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onPointerDownOutside, onInteractOutside, onFocusOutside, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      dir="rtl"
      onPointerDownOutside={(e) => {
        const target = e.target as HTMLElement | null
        if (
          target?.closest(
            '[data-klasyar-portal], .klasyar-popover, [data-radix-popper-content-wrapper], [role="dialog"][aria-label*="تقویم"], [role="dialog"][aria-label*="ساعت"], [role="dialog"][aria-label*="زمان"], [role="dialog"][aria-label*="تاریخ"]',
          )
        ) {
          e.preventDefault()
          return
        }
        onPointerDownOutside?.(e)
      }}
      onInteractOutside={(e) => {
        const target = e.target as HTMLElement | null
        if (
          target?.closest(
            '[data-klasyar-portal], .klasyar-popover, [data-radix-popper-content-wrapper], [role="dialog"][aria-label*="تقویم"], [role="dialog"][aria-label*="ساعت"], [role="dialog"][aria-label*="زمان"], [role="dialog"][aria-label*="تاریخ"]',
          )
        ) {
          e.preventDefault()
          return
        }
        onInteractOutside?.(e)
      }}
      onFocusOutside={(e) => {
        const target = e.target as HTMLElement | null
        if (
          target?.closest(
            '[data-klasyar-portal], .klasyar-popover, [data-radix-popper-content-wrapper], [role="dialog"][aria-label*="تقویم"], [role="dialog"][aria-label*="ساعت"], [role="dialog"][aria-label*="زمان"], [role="dialog"][aria-label*="تاریخ"]',
          )
        ) {
          e.preventDefault()
          return
        }
        onFocusOutside?.(e)
      }}
      className={cn(
        "fixed z-[55] grid w-full gap-4 border border-border bg-background p-5 shadow-2xl duration-200 text-start dark:border-border dark:bg-card",
        // حالت موبایل: باتم‌شیت با لبه‌های گرد بالا و انیمیشن اسلاید از پایین
        "inset-x-0 bottom-0 top-auto max-h-[90dvh] overflow-y-auto rounded-b-none rounded-t-3xl border-b-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        // حالت تبلت و دسکتاپ: مودال وسط صفحه با زوم و گوشه‌های استاندارد
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-b sm:p-6 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {/* نشانگر درگ برای حس مدرن باتم‌شیت موبایل */}
      <div
        className="mx-auto -mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden"
        aria-hidden="true"
      />
      {children}
      <DialogPrimitive.Close className="absolute end-4 top-4 rounded-lg p-1 text-muted-foreground opacity-70 ring-offset-background transition-all hover:bg-muted hover:text-foreground hover:opacity-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">بستن</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-start", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-start",
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
