"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { CoupleHero } from "@/components/couple-hero"
import { EventTitle, Ornament } from "@/components/event-title"
import { ScreenShell } from "@/components/screen-shell"
import { buttonVariants } from "@/components/ui/button"
import { COUPLE, COUPLE_STORY } from "@/lib/event"
import { cn } from "@/lib/utils"

export default function StoryPage() {
  const reduced = useReducedMotion() === true

  return (
    <ScreenShell width="max-w-2xl">
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "h-10 rounded-full px-3")}>
        กลับงาน
      </Link>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <CoupleHero hint={false} className="mt-4" />
        <div className="mt-4">
          <EventTitle variant="hero" />
        </div>
        <p className="mt-6 text-base leading-7 text-muted-foreground">{COUPLE_STORY.lead}</p>
        <Ornament className="my-8" />
        <article className="rounded-[1.6rem] border border-border bg-card/90 p-5">
          <h2 className="font-serif text-2xl text-ink">{COUPLE.groomNickname}</h2>
          <p className="mt-1 text-sm text-rose">{COUPLE.groom}</p>
          <p className="mt-3 text-sm leading-7">{COUPLE_STORY.groom}</p>
        </article>
        <article className="mt-4 rounded-[1.6rem] border border-border bg-card/90 p-5">
          <h2 className="font-serif text-2xl text-ink">{COUPLE.brideNickname}</h2>
          <p className="mt-1 text-sm text-rose">{COUPLE.bride}</p>
          <p className="mt-3 text-sm leading-7">{COUPLE_STORY.bride}</p>
        </article>
        <p className="mt-6 font-serif text-lg leading-8 text-ink">{COUPLE_STORY.together}</p>
      </motion.div>
    </ScreenShell>
  )
}
