"use client"

import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"

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
    return (
      <div className="relative min-h-dvh bg-background">
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-5xl text-rose italic motion-safe:animate-pulse">C & P</p>
          <p className="mt-4 text-sm text-muted-foreground">กำลังเปิดคำเชิญ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={pathname} {...fade}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
