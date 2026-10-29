import type { ReactNode } from "react"
import { PetalField } from "@/components/petal-field"
import { cn } from "@/lib/utils"

export function ScreenShell({
  children,
  className,
  width = "max-w-lg",
}: {
  children: ReactNode
  className?: string
  width?: string
}) {
  return (
    <div className={cn("relative mx-auto flex min-h-dvh w-full flex-col px-5 py-10", width, className)}>
      <PetalField />
      <div className="relative z-10 flex min-h-full w-full flex-1 flex-col">{children}</div>
    </div>
  )
}
