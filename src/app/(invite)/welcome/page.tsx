"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { PhoneForm } from "@/components/phone-form"
import { ROUTES, withQuery } from "@/lib/routes"
import { guestStore } from "@/lib/guest-store"

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <PhoneForm
      onContinue={(phone) => {
        guestStore.setPhone(phone)
        router.push(withQuery(ROUTES.register, `?${searchParams.toString()}`))
      }}
    />
  )
}
