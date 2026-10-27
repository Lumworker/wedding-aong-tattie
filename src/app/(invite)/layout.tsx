import type { ReactNode } from "react"
import { Suspense } from "react"
import { WeddingShell } from "@/components/wedding-shell"

export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-5xl text-rose italic motion-safe:animate-pulse">C & P</p>
          <p className="mt-4 text-sm text-muted-foreground">กำลังเปิดคำเชิญ</p>
        </div>
      }
    >
      <WeddingShell>{children}</WeddingShell>
    </Suspense>
  )
}
