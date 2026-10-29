import { COUPLE } from "@/lib/event"
import { cn } from "@/lib/utils"

export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-rose/70", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-rose/40" />
      <span className="text-xs">✦</span>
      <span className="h-px flex-1 bg-rose/40" />
    </div>
  )
}

export function EventTitle({
  variant,
}: {
  variant: "hero" | "panel" | "compact"
}) {
  if (variant === "compact") {
    return (
      <div>
        <h1 className="font-display text-[1.65rem] leading-snug text-ink">
          {COUPLE.groomNickname}
          <span className="px-1.5 text-rose">&</span>
          {COUPLE.brideNickname}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{COUPLE.dateThai}</p>
      </div>
    )
  }

  return (
    <div className={variant === "hero" ? "text-center" : "text-left"}>
      <p className="text-[13px] font-medium tracking-[0.22em] text-rose uppercase">งานมงคลสมรส</p>
      <h1
        className={cn(
          "font-display leading-tight text-ink",
          variant === "hero" ? "mt-3 text-4xl sm:text-5xl lg:text-6xl" : "mt-3 text-[2.7rem]"
        )}
      >
        <span className="block">{COUPLE.groomShort}</span>
        <span className="my-1 block font-serif text-3xl text-rose italic">&</span>
        <span className="block">{COUPLE.brideShort}</span>
      </h1>
      {variant === "hero" ? (
        <p className="mt-2 font-serif text-lg text-rose">
          {COUPLE.groomNickname} · {COUPLE.brideNickname}
        </p>
      ) : (
        <p className="mt-2 font-serif text-base text-rose">
          {COUPLE.groom} ({COUPLE.groomNickname}) · {COUPLE.bride} ({COUPLE.brideNickname})
        </p>
      )}
      <Ornament className="my-4" />
      <p className="font-serif text-xl text-ink">{COUPLE.dateThai}</p>
      {variant === "panel" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {COUPLE.groom} ({COUPLE.groomNickname}) และ {COUPLE.bride} ({COUPLE.brideNickname})
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {COUPLE.groom} ({COUPLE.groomNickname})
          <br />
          {COUPLE.bride} ({COUPLE.brideNickname})
        </p>
      )}
    </div>
  )
}
