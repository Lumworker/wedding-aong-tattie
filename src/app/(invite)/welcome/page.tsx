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
      onContinue={async (phone) => {
        const next = await guestStore.setPhone(phone)
        const path = next.party ? ROUTES.dashboard : ROUTES.register
        router.push(withQuery(path, `?${searchParams.toString()}`))
      }}
    />
  )
}
