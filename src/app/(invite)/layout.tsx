import type { ReactNode } from "react"
import { Suspense } from "react"
import { CoupleRunSplash } from "@/components/couple-run"
import { WeddingShell } from "@/components/wedding-shell"

export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<CoupleRunSplash />}
    >
      <WeddingShell>{children}</WeddingShell>
    </Suspense>
  )
}
