import { COUPLE } from "@/lib/event"
import { cn } from "@/lib/utils"

export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-gold", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gold/60" />
      <span className="text-xs">✦</span>
      <span className="h-px flex-1 bg-gold/60" />
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
        <h1 className="font-display text-[1.65rem] leading-none text-ink">
          {COUPLE.groomShort}
          <span className="px-1.5 text-rose">&</span>
          {COUPLE.brideShort}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{COUPLE.dateThai}</p>
      </div>
    )
  }

  return (
    <div className={variant === "hero" ? "text-center" : "text-left"}>
      <p className="text-[11px] font-medium tracking-[0.28em] text-rose uppercase">งานมงคลสมรส</p>
      <h1
        className={cn(
          "font-display leading-[0.92] text-ink",
          variant === "hero" ? "mt-3 text-5xl sm:text-6xl" : "mt-3 text-[2.7rem]"
        )}
      >
        <span className="block">{COUPLE.groomShort}</span>
        <span className="my-1 block font-serif text-3xl text-rose italic">&</span>
        <span className="block">{COUPLE.brideShort}</span>
      </h1>
      {variant === "hero" ? (
        <p className="mt-2 font-serif text-lg text-rose">{COUPLE.brideNickname}</p>
      ) : (
        <p className="mt-2 font-serif text-base text-rose">
          {COUPLE.bride} · {COUPLE.brideNickname}
        </p>
      )}
      <Ornament className="my-4" />
      <p className="font-serif text-xl text-ink">{COUPLE.dateThai}</p>
      {variant === "panel" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {COUPLE.groom} และ {COUPLE.bride}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {COUPLE.groom}
          <br />
          {COUPLE.bride}
        </p>
      )}
    </div>
  )
}
