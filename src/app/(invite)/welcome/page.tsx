"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { WelcomeRegister } from "@/components/welcome-register"
import { ROUTES, withQuery } from "@/lib/routes"

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toStart = () => {
    const base = withQuery(ROUTES.register, `?${searchParams.toString()}`)
    router.push(`${base}${base.includes("?") ? "&" : "?"}step=start`)
  }

  return <WelcomeRegister onRegister={toStart} onReturning={toStart} />
}
