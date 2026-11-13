import type { ReactNode } from "react"
import { motion, type Variants } from "framer-motion"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** ورود پله‌ای کارت‌های تنظیمات */
export const settingsListVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
}

export const settingsItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
}

interface SettingsSectionProps {
  title: string
  description?: string
  icon: LucideIcon
  children: ReactNode
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: SettingsSectionProps) {
  return (
    <motion.section variants={settingsItemVariants}>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b bg-muted/40 py-4 text-start">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="space-y-0.5 min-w-0 flex-1">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs leading-5">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">{children}</CardContent>
      </Card>
    </motion.section>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  control: ReactNode
  htmlFor?: string
  disabled?: boolean
}

/** یک ردیف تنظیم: عنوان و توضیح در یک سمت، کنترل در سمت دیگر. */
export function SettingRow({
  label,
  description,
  control,
  htmlFor,
  disabled = false,
}: SettingRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between text-start",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 space-y-1 flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground cursor-pointer">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 self-start sm:self-auto">{control}</div>
    </div>
  )
}
