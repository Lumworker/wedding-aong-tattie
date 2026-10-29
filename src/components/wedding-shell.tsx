"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { CoupleRunSplash } from "@/components/couple-run"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"
import { cn } from "@/lib/utils"

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

export function WeddingShell({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(guestStore.subscribe, guestStore.getSnapshot, guestStore.getServerSnapshot)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    if (!snapshot.ready) return
    if (!searchParams.has("mock")) return
    if (sessionStorage.getItem("webding-mock-seeded") === "1") return
    sessionStorage.setItem("webding-mock-seeded", "1")
    void guestStore.seedMocks().catch((error) => {
      console.error(error)
      sessionStorage.removeItem("webding-mock-seeded")
    })
  }, [snapshot.ready, searchParams])

  useEffect(() => {
    if (!snapshot.ready) return

    const go = (path: string) => {
      const target = withQuery(path, search ? `?${search}` : "")
      if (pathname === path) return
      router.replace(target)
    }

    if (pathname === ROUTES.home) {
      if (snapshot.party) go(ROUTES.dashboard)
      else if (snapshot.phone) go(ROUTES.register)
      else go(ROUTES.welcome)
      return
    }

    if (pathname === ROUTES.register && !snapshot.phone) {
      go(ROUTES.welcome)
      return
    }

    if (pathname === ROUTES.dashboard) {
      if (!snapshot.phone) go(ROUTES.welcome)
      else if (!snapshot.party) go(ROUTES.register)
    }
  }, [snapshot.ready, snapshot.phone, snapshot.party, pathname, router, search])

  if (!snapshot.ready) {
    return <CoupleRunSplash />
  }

  return (
    <div
      className={cn(
        "relative min-h-dvh",
        pathname === ROUTES.welcome
          ? "bg-[linear-gradient(180deg,#F8EDE1_0%,#F4E6D6_48%,#E6D5C3_100%)]"
          : "bg-background"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={pathname} {...fade}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
