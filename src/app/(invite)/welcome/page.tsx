"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { WelcomeRegister } from "@/components/welcome-register"
import { ROUTES, withQuery } from "@/lib/routes"

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <WelcomeRegister
      onRegister={() => {
        const base = withQuery(ROUTES.register, `?${searchParams.toString()}`)
        const join = base.includes("?") ? "&" : "?"
        router.push(`${base}${join}step=phone`)
      }}
    />
  )
}
