import { cn } from "@/lib/utils"

export type StepperItem = {
  key: string
  label: string
  /** 24×24 pixel icon, drawn with nearest-neighbour scaling. */
  icon: string
}

/**
 * Stepper line: done = solid Chocolate + ✓ badge (tap to go back), current = Sage
 * ring with a one-time hop, upcoming = faded icon on a dashed line.
 */
export function FormStepper({
  steps,
  current,
  onJump,
  className,
}: {
  steps: StepperItem[]
  current: string
  onJump?: (key: string) => void
  className?: string
}) {
  const index = Math.max(0, steps.findIndex((step) => step.key === current))
  const progress = steps.length > 1 ? index / (steps.length - 1) : 0
  const label = steps.at(index)?.label ?? ""

  return (
    <nav aria-label="ขั้นตอนการลงทะเบียน" className={className}>
      <ol className="relative flex items-start justify-between">
        <span
          aria-hidden="true"
          className="absolute top-[21px] right-7 left-7 border-t-2 border-dashed border-[#D8C8AC]"
        />
        <span
          aria-hidden="true"
          className="absolute top-5 left-7 h-[3px] bg-[#5C3A26] transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `calc((100% - 3.5rem) * ${progress})` }}
        />
        {steps.map((step, position) => {
          const state = position < index ? "done" : position === index ? "now" : "todo"
          const dot = (
            <span
              className={cn(
                "relative grid place-items-center rounded-full bg-[#FFFCF8]",
                state === "now"
                  ? "size-11 border-[3px] border-[#A3B18A]"
                  : "mt-[5px] size-[34px] border-2",
                state === "done" && "border-[#5C3A26] bg-[#F1E7D3]",
                state === "todo" && "border-[#D8C8AC] bg-[#F1E7D3]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny pixel sprite, scaled with CSS */}
              <img
                src={step.icon}
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                className={cn(
                  "size-6 [image-rendering:pixelated]",
                  state === "todo" && "opacity-40 grayscale",
                  state === "now" && "motion-safe:animate-[step-hop_420ms_ease-out_1]"
                )}
              />
              {state === "done" ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-[#5C3A26] text-[10px] leading-none text-[#F1E7D3]"
                >
                  ✓
                </span>
              ) : null}
            </span>
          )
          const name = (
            <span
              className={cn(
                "text-[12.5px] leading-tight text-[#5C3A26]",
                state === "now" ? "font-semibold" : "max-[359px]:sr-only"
              )}
            >
              {step.label}
            </span>
          )
          const spoken =
            state === "done" ? `${step.label} เสร็จแล้ว แตะเพื่อแก้ไข` : state === "now" ? `${step.label} กำลังทำ` : `${step.label} ยังไม่ถึง`
          return (
            <li
              key={step.key}
              className="relative z-10 flex w-[4.5rem] flex-col items-center gap-1.5 text-center"
              aria-current={state === "now" ? "step" : undefined}
            >
              {state === "done" && onJump ? (
                <button
                  type="button"
                  className="flex flex-col items-center gap-1.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#A3B18A] focus-visible:outline-none"
                  aria-label={`ขั้นที่ ${position + 1} ${spoken}`}
                  onClick={() => onJump(step.key)}
                >
                  {dot}
                  {name}
                </button>
              ) : (
                <span className="flex flex-col items-center gap-1.5" aria-label={`ขั้นที่ ${position + 1} ${spoken}`}>
                  {dot}
                  {name}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-[13px] leading-normal text-[#5C3A26]">
        ขั้น {index + 1} จาก {steps.length} · {label}
      </p>
    </nav>
  )
}
